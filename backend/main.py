import os
import json
import re
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, Response, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.ai_service import AIService
from pathlib import Path

from backend.config import GEMINI_API_KEY
from backend.database import (
    engine, Base, get_db, User, Case, Log, 
    FIRDraft, LegalSectionCited, EvidenceItem, ChatMessage
)
from backend.auth import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, get_current_admin
)
from backend.rag import (
    generate_analysis, analyze_intake, search_laws, 
    OLD_TO_NEW_MAPPING, LEGAL_DATABASE
)
from backend.exporter import generate_pdf_report, generate_docx_report

# Initialize database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CrimeGPT API", version="1.0.0")

# CORS setup for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory setup
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "db" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Helper to log actions
def log_audit(db: Session, username: str, action: str, details: str, case_id: Optional[int] = None):
    audit_log = Log(user=username, action=action, details=details, case_id=case_id)
    db.add(audit_log)
    db.commit()

# Seed database with default accounts if not exists
@app.on_event("startup")
def seed_data():
    db = next(get_db())
    try:
        # Check admin
        admin = db.query(User).filter(User.username == "officer_admin").first()
        if not admin:
            hashed_pw = get_password_hash("crimegpt2026")
            new_admin = User(
                username="officer_admin",
                password_hash=hashed_pw,
                role="admin",
                badge_number="B1001",
                station="HQ Command Centre"
            )
            db.add(new_admin)
            
        # Check SHO
        sho = db.query(User).filter(User.username == "sho_test").first()
        if not sho:
            hashed_pw = get_password_hash("sho123")
            new_sho = User(
                username="sho_test",
                password_hash=hashed_pw,
                role="sho",
                badge_number="B1003",
                station="Central Cyber Police Station"
            )
            db.add(new_sho)

        # Check officer
        officer = db.query(User).filter(User.username == "officer_test").first()
        if not officer:
            hashed_pw = get_password_hash("officer123")
            new_officer = User(
                username="officer_test",
                password_hash=hashed_pw,
                role="officer",
                badge_number="B1002",
                station="Central Cyber Police Station"
            )
            db.add(new_officer)
            
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

# Pydantic schemas
class UserCreate(BaseModel):
    username: str
    password: str
    badge_number: Optional[str] = ""
    role: Optional[str] = "officer"
    station: Optional[str] = "Central Cyber Police Station"

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    badge_number: Optional[str]
    station: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class CaseCreate(BaseModel):
    title: str
    description: str
    location: Optional[str] = ""
    date: Optional[str] = ""
    evidence: Optional[str] = ""
    witness_details: Optional[str] = ""

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    date: Optional[str] = None
    evidence: Optional[str] = None
    witness_details: Optional[str] = None
    status: Optional[str] = None

class CaseResponse(BaseModel):
    id: int
    title: str
    description: str
    location: Optional[str]
    date: Optional[str]
    evidence: Optional[str]
    witness_details: Optional[str]
    analysis_output: Optional[str]
    status: str
    station: Optional[str]
    created_at: datetime
    created_by: int
    
    class Config:
        from_attributes = True

class IntakeRequest(BaseModel):
    description: str
    title: Optional[str] = ""
    location: Optional[str] = ""
    date: Optional[str] = ""
    custom_key: Optional[str] = None

class FIRDraftUpdate(BaseModel):
    fir_draft_text: Optional[str] = None
    incident_summary: Optional[str] = None
    ai_approved_flags: Optional[str] = None # JSON string representing dict of field approvals
    approved_sections: Optional[List[str]] = None # List of section_references to approve

class EvidenceResponse(BaseModel):
    id: int
    case_id: int
    filename: str
    file_path: str
    file_type: str
    custody_notes: Optional[str]
    uploaded_by: Optional[int]
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class SOPChatRequest(BaseModel):
    message: str
    custom_key: Optional[str] = None

class GeneralChatRequest(BaseModel):
    message: str
    custom_key: Optional[str] = None

class KeyValidateRequest(BaseModel):
    api_key: str

# Helper to verify case access (RBAC enforcement)
def verify_case_access(case_id: int, current_user: User, db: Session) -> Case:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # RBAC Server-side checks:
    # 1. Admin sees everything
    # 2. SHO sees everything in their own station
    # 3. Officer sees only their own cases
    if current_user.role == "admin":
        return case
    elif current_user.role == "sho":
        if case.station != current_user.station:
            raise HTTPException(status_code=403, detail="Unauthorized: Case belongs to another station")
        return case
    else: # officer
        if case.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized: You did not register this case file")
        return case

# --- ROUTES ---

@app.post("/api/auth/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_pw = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        password_hash=hashed_pw,
        role=user_data.role,
        badge_number=user_data.badge_number,
        station=user_data.station
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    log_audit(db, "SYSTEM", "REGISTER", f"User {user.username} registered with role {user.role} in station {user.station}")
    return user

@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.username})
    log_audit(db, user.username, "LOGIN", f"Logged into terminal session from station {user.station}")
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "username": user.username}

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# --- CASES CRUD ---

@app.get("/api/cases", response_model=List[CaseResponse])
def get_cases(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Admin sees all, SHO sees station cases, Officer sees own cases
    if current_user.role == "admin":
        cases = db.query(Case).all()
    elif current_user.role == "sho":
        cases = db.query(Case).filter(Case.station == current_user.station).all()
    else:
        cases = db.query(Case).filter(Case.created_by == current_user.id).all()
    return cases

@app.post("/api/cases", response_model=CaseResponse)
def create_case(case_data: CaseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = Case(
        title=case_data.title,
        description=case_data.description,
        location=case_data.location,
        date=case_data.date,
        evidence=case_data.evidence,
        witness_details=case_data.witness_details,
        station=current_user.station,
        created_by=current_user.id
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    
    log_audit(db, current_user.username, "CREATE_CASE", f"Created Case ID {case.id} - '{case.title}'", case_id=case.id)
    return case

@app.get("/api/cases/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = verify_case_access(case_id, current_user, db)
    log_audit(db, current_user.username, "VIEW_CASE", f"Viewed case details for ID {case_id}", case_id=case_id)
    return case

@app.put("/api/cases/{case_id}", response_model=CaseResponse)
def update_case(case_id: int, case_data: CaseUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = verify_case_access(case_id, current_user, db)
    
    for key, value in case_data.dict(exclude_unset=True).items():
        setattr(case, key, value)
        
    db.commit()
    db.refresh(case)
    
    log_audit(db, current_user.username, "UPDATE_CASE", f"Modified case metadata for ID {case_id}", case_id=case_id)
    return case

@app.delete("/api/cases/{case_id}")
def delete_case(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = verify_case_access(case_id, current_user, db)
    
    title = case.title
    db.delete(case)
    db.commit()
    
    log_audit(db, current_user.username, "DELETE_CASE", f"Permanently deleted case ID {case_id} ('{title}')", case_id=case_id)
    return {"message": "Case deleted successfully"}

# --- FIR GENERATOR FLOWS ---

@app.post("/api/cases/intake")
def intake_analyze(request: IntakeRequest):
    """
    Validates if key fields are present in description and proposes clarifying questions.
    """
    result = analyze_intake(
        description=request.description,
        title=request.title or "",
        location=request.location or "",
        date=request.date or "",
        api_key=request.custom_key or ""
    )
    return result

@app.post("/api/cases/{case_id}/analyze")
def analyze_case(
    case_id: int, 
    custom_key: Optional[str] = None, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    case = verify_case_access(case_id, current_user, db)
    
    api_key = custom_key or GEMINI_API_KEY
    
    # Run structured legal analysis
    result = generate_analysis(
        case_title=case.title,
        description=case.description,
        location=case.location or "",
        date=case.date or "",
        evidence=case.evidence or "",
        witness=case.witness_details or "",
        api_key=api_key
    )
    
    # Store or update FIRDraft
    draft = db.query(FIRDraft).filter(FIRDraft.case_id == case_id).first()
    if not draft:
        draft = FIRDraft(case_id=case_id)
        db.add(draft)
        db.commit()
        db.refresh(draft)
        
    draft.incident_summary = result["summary"]
    draft.fir_draft_text = result["fir_draft_text"]
    draft.evidence_checklist = json.dumps(result["evidence_checklist"])
    draft.clarifying_questions = json.dumps([]) # Reset as details are verified
    draft.ai_approved_flags = json.dumps({
        "summary": False,
        "fir_draft_text": False,
        "evidence_checklist": False
    })
    
    # Clear existing suggested sections
    db.query(LegalSectionCited).filter(LegalSectionCited.fir_draft_id == draft.id).delete()
    
    # Add new cited sections
    for cite in result["citations"]:
        new_cite = LegalSectionCited(
            fir_draft_id=draft.id,
            section_reference=cite["section_reference"],
            act=cite["act"],
            title=cite["title"],
            citation_text=cite["citation_text"],
            justification=cite["justification"],
            confidence_score=int(cite["confidence_score"]),
            approved_by_officer=0
        )
        db.add(new_cite)
        
    db.commit()
    
    # Save the general output to Case database for backward compatibility
    case.analysis_output = result["fir_draft_text"]
    db.commit()
    
    log_audit(
        db, current_user.username, "ANALYZE_CASE", 
        f"Executed RAG Pipeline: matched {len(result['citations'])} sections, validation warnings: {len(result['validation_warnings'])}", 
        case_id=case_id
    )
    
    return {
        "summary": result["summary"],
        "citations": result["citations"],
        "fir_draft_text": result["fir_draft_text"],
        "evidence_checklist": result["evidence_checklist"],
        "validation_warnings": result["validation_warnings"]
    }

@app.get("/api/cases/{case_id}/fir-draft")
def get_fir_draft(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = verify_case_access(case_id, current_user, db)
    
    draft = db.query(FIRDraft).filter(FIRDraft.case_id == case_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="No FIR draft exists for this case. Run AI Analysis first.")
        
    citations = db.query(LegalSectionCited).filter(LegalSectionCited.fir_draft_id == draft.id).all()
    citations_list = [
        {
            "id": c.id,
            "section_reference": c.section_reference,
            "act": c.act,
            "title": c.title,
            "citation_text": c.citation_text,
            "justification": c.justification,
            "confidence_score": c.confidence_score,
            "approved_by_officer": c.approved_by_officer
        }
        for c in citations
    ]
    
    # Check validation warnings
    warnings = run_cross_reference_validation(case.description, citations_list)
    
    return {
        "id": draft.id,
        "case_id": draft.case_id,
        "incident_summary": draft.incident_summary,
        "fir_draft_text": draft.fir_draft_text,
        "evidence_checklist": json.loads(draft.evidence_checklist or "[]"),
        "ai_approved_flags": json.loads(draft.ai_approved_flags or '{"summary":false,"fir_draft_text":false,"evidence_checklist":false}'),
        "citations": citations_list,
        "validation_warnings": warnings
    }

@app.put("/api/cases/{case_id}/fir-draft")
def update_fir_draft(
    case_id: int, 
    update_data: FIRDraftUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    case = verify_case_access(case_id, current_user, db)
    
    draft = db.query(FIRDraft).filter(FIRDraft.case_id == case_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="No FIR draft found. Run analysis first.")
        
    if update_data.fir_draft_text is not None:
        draft.fir_draft_text = update_data.fir_draft_text
        case.analysis_output = update_data.fir_draft_text # Update backup
    if update_data.incident_summary is not None:
        draft.incident_summary = update_data.incident_summary
    if update_data.ai_approved_flags is not None:
        draft.ai_approved_flags = update_data.ai_approved_flags
        
    if update_data.approved_sections is not None:
        # Mark selected sections as approved, others as Suggested (0)
        citations = db.query(LegalSectionCited).filter(LegalSectionCited.fir_draft_id == draft.id).all()
        for c in citations:
            if c.section_reference in update_data.approved_sections:
                c.approved_by_officer = 1
            else:
                c.approved_by_officer = 0
                
    db.commit()
    log_audit(db, current_user.username, "EDIT_FIR", f"Saved manual updates / approvals for case FIR draft", case_id=case_id)
    return {"status": "success", "message": "FIR draft successfully updated."}

# --- EVIDENCE MANAGEMENT ---

@app.get("/api/cases/{case_id}/evidence", response_model=List[EvidenceResponse])
def get_evidence_list(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_case_access(case_id, current_user, db)
    items = db.query(EvidenceItem).filter(EvidenceItem.case_id == case_id).all()
    return items

@app.post("/api/cases/{case_id}/evidence/upload", response_model=EvidenceResponse)
async def upload_evidence_file(
    case_id: int,
    file: UploadFile = File(...),
    custody_notes: Optional[str] = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = verify_case_access(case_id, current_user, db)
    
    # Save file locally
    filename = file.filename
    clean_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
    file_path = str(UPLOAD_DIR / clean_filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    # Auto document classification
    suffix = filename.split(".")[-1].lower() if "." in filename else ""
    if suffix in ["mp4", "avi", "mkv", "mov"]:
        file_type = "CCTV"
    elif suffix in ["pdf", "docx", "txt", "doc"]:
        file_type = "Document"
    elif suffix in ["jpg", "jpeg", "png", "webp"]:
        file_type = "ID Proof"
    elif suffix in ["json", "csv", "log"]:
        file_type = "Chat Log"
    else:
        file_type = "Other"
        
    item = EvidenceItem(
        case_id=case_id,
        filename=filename,
        file_path=file_path,
        file_type=file_type,
        custody_notes=custody_notes or f"Uploaded by Officer {current_user.username} on {datetime.now().strftime('%Y-%m-%d')}.",
        uploaded_by=current_user.id
    )
    db.add(item)
    
    # Append to Case physical evidence summary
    existing_ev = case.evidence or ""
    if existing_ev:
        case.evidence = existing_ev + f", {filename} [{file_type}]"
    else:
        case.evidence = f"{filename} [{file_type}]"
        
    db.commit()
    db.refresh(item)
    
    log_audit(db, current_user.username, "UPLOAD_EVIDENCE", f"Uploaded evidence file '{filename}' classified as {file_type}", case_id=case_id)
    return item

@app.put("/api/cases/{case_id}/evidence/{item_id}", response_model=EvidenceResponse)
def update_evidence_item(
    case_id: int,
    item_id: int,
    file_type: str,
    custody_notes: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_case_access(case_id, current_user, db)
    item = db.query(EvidenceItem).filter(EvidenceItem.id == item_id, EvidenceItem.case_id == case_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found")
        
    item.file_type = file_type
    item.custody_notes = custody_notes
    db.commit()
    db.refresh(item)
    
    log_audit(db, current_user.username, "UPDATE_EVIDENCE", f"Updated custody details for file ID {item_id}", case_id=case_id)
    return item

@app.delete("/api/cases/{case_id}/evidence/{item_id}")
def delete_evidence_item(
    case_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_case_access(case_id, current_user, db)
    item = db.query(EvidenceItem).filter(EvidenceItem.id == item_id, EvidenceItem.case_id == case_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found")
        
    # Delete local file if exists
    try:
        if os.path.exists(item.file_path):
            os.remove(item.file_path)
    except Exception as e:
        print(f"Error removing file: {e}")
        
    filename = item.filename
    db.delete(item)
    db.commit()
    
    log_audit(db, current_user.username, "DELETE_EVIDENCE", f"Removed evidence item '{filename}'", case_id=case_id)
    return {"message": "Evidence item deleted successfully"}

# --- CONTEXTUAL SOP CHAT & ASSISTANT ---

@app.post("/api/cases/{case_id}/sop-chat")
def get_case_sop_chat(
    case_id: int,
    request: SOPChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = verify_case_access(case_id, current_user, db)
    api_key = request.custom_key or GEMINI_API_KEY
    
    # Compile case facts
    facts = f"Case Subject: {case.title}\nDescription: {case.description}\nEvidence: {case.evidence}\nStatus: {case.status}"
    
    # Retrieve citations if exists
    draft = db.query(FIRDraft).filter(FIRDraft.case_id == case_id).first()
    citations_str = ""
    if draft:
        cites = db.query(LegalSectionCited).filter(LegalSectionCited.fir_draft_id == draft.id).all()
        citations_str = ", ".join([f"{c.section_reference} ({c.title})" for c in cites])
        
    # Offline fallback response
    offline_response = f"This is SOP Guidance compiled in Offline mode. The case involves charges related to {citations_str if citations_str else case.title}. Recommended Standard Operating Procedures (SOPs):\n1. Secure any digital devices or scene prints immediately.\n2. Ensure all seizure actions are video recorded per BNSS Section 105.\n3. Digital files must be hash certified with a BSA Section 63 certificate signed by the officer in charge.\n4. Complete and log witness details immediately under BNSS Section 180."
    
    # Embed user message
    user_msg = ChatMessage(
        user_id=current_user.id,
        case_id=case_id,
        message_type="sop_guidance",
        role="user",
        content=request.message
    )
    db.add(user_msg)
    db.commit()
    
    provider, active_key, _ = AIService.get_provider_details(api_key)
    
    if provider == "offline":
        assistant_msg = ChatMessage(
            user_id=current_user.id,
            case_id=case_id,
            message_type="sop_guidance",
            role="assistant",
            content=offline_response
        )
        db.add(assistant_msg)
        db.commit()
        return {"response": offline_response, "citations": []}
        
    try:
        prompt = f"""
        You are CrimeGPT, a secure SOP and Investigation Guidance assistant for Indian police officers.
        You are guiding an officer on the following case:
        {facts}
        
        Cited laws under review: {citations_str}
        
        The officer asks: "{request.message}"
        
        Provide a practical, step-by-step guidance conforming strictly to BNSS mandates (e.g. Section 105 videography) and BSA evidence handling (e.g. Section 63 digital hash audits). Cite specific sections from BNS, BNSS, and BSA for your recommendations. Keep your answer professional and legally sound.
        """
        messages = [
            {"role": "system", "content": "You are CrimeGPT, a secure SOP and Investigation Guidance assistant for Indian police officers."},
            {"role": "user", "content": prompt}
        ]
        
        text = AIService.generate_chat_completion(messages, custom_key=api_key)
        
        assistant_msg = ChatMessage(
            user_id=current_user.id,
            case_id=case_id,
            message_type="sop_guidance",
            role="assistant",
            content=text
        )
        db.add(assistant_msg)
        db.commit()
        return {"response": text, "citations": []}
    except Exception as e:
        db.rollback()
        return {"response": f"AI Error: {e}. Fallback checklist:\n{offline_response}", "citations": []}

@app.post("/api/assistant/chat")
def general_ai_chat(
    request: GeneralChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    api_key = request.custom_key or GEMINI_API_KEY
    
    # Retrieve relevant sections matching query
    matched = search_laws(request.message, api_key, top_k=3)
    matched_text = ""
    citations_data = []
    for l in matched:
        matched_text += f"- **{l['act']} {l['section']} ({l['title']})**: {l['description']}\n"
        citations_data.append({
            "section_reference": f"{l['act']} {l['section']}",
            "act": l["act"],
            "title": l["title"],
            "citation_text": l["description"]
        })
        
    user_msg = ChatMessage(
        user_id=current_user.id,
        case_id=None,
        message_type="general_assistant",
        role="user",
        content=request.message
    )
    db.add(user_msg)
    db.commit()
    
    offline_response = f"General Criminal Law Q&A (OFFLINE MODE). Here are the closest matched legal provisions from BNS, BNSS, BSA:\n\n{matched_text}\nFor deeper explanations and context-aware responses, configure a valid AI API Key in the settings portal."
    
    provider, active_key, _ = AIService.get_provider_details(api_key)
    
    if provider == "offline":
        assistant_msg = ChatMessage(
            user_id=current_user.id,
            case_id=None,
            message_type="general_assistant",
            role="assistant",
            content=offline_response,
            citations=json.dumps(citations_data)
        )
        db.add(assistant_msg)
        db.commit()
        return {"response": offline_response, "citations": citations_data}
        
    try:
        prompt = f"""
        You are CrimeGPT, a legal Q&A assistant for Indian law enforcement officers.
        Answer the officer's query using the following retrieved criminal code passages:
        {matched_text}
        
        Query: "{request.message}"
        
        Synthesize a clean, professional answer. You MUST cite the sections (e.g. BNS Section 303) inline when referring to their provisions.
        """
        messages = [
            {"role": "system", "content": "You are CrimeGPT, a legal Q&A assistant for Indian law enforcement officers."},
            {"role": "user", "content": prompt}
        ]
        
        text = AIService.generate_chat_completion(messages, custom_key=api_key)
        
        assistant_msg = ChatMessage(
            user_id=current_user.id,
            case_id=None,
            message_type="general_assistant",
            role="assistant",
            content=text,
            citations=json.dumps(citations_data)
        )
        db.add(assistant_msg)
        db.commit()
        return {"response": text, "citations": citations_data}
    except Exception as e:
        return {"response": f"AI Error: {e}. Matching references:\n{offline_response}", "citations": citations_data}

@app.get("/api/chat/history")
def get_chat_history(
    case_id: Optional[int] = None,
    message_type: Optional[str] = "general_assistant",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if case_id is not None:
        query = query.filter(ChatMessage.case_id == case_id)
    if message_type is not None:
        query = query.filter(ChatMessage.message_type == message_type)
        
    messages = query.order_by(ChatMessage.timestamp.ascii()).all()
    
    serialized = []
    for m in messages:
        cites = []
        if m.citations:
            try:
                cites = json.loads(m.citations)
            except:
                pass
        serialized.append({
            "id": m.id,
            "case_id": m.case_id,
            "role": m.role,
            "content": m.content,
            "timestamp": m.timestamp,
            "citations": cites
        })
    return serialized

# --- LEGAL SEARCH & SECTION MAPS ---

@app.get("/api/legal/search")
def get_legal_search(query: str, api_key: Optional[str] = ""):
    matched = search_laws(query, api_key, top_k=6)
    return matched

@app.get("/api/legal/mapping")
def get_legal_mapping(query: Optional[str] = None):
    if not query:
        return OLD_TO_NEW_MAPPING
    
    query_lower = query.lower()
    filtered = []
    for m in OLD_TO_NEW_MAPPING:
        if (
            query_lower in m["old_section"].lower() or 
            query_lower in m["new_section"].lower() or
            query_lower in m["old_title"].lower() or
            query_lower in m["new_title"].lower()
        ):
            filtered.append(m)
    return filtered

# --- REPORTS EXPORTS ---

@app.get("/api/cases/{case_id}/export/pdf")
def export_pdf(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = verify_case_access(case_id, current_user, db)
        
    if not case.analysis_output:
        raise HTTPException(status_code=400, detail="Case must be analyzed before exporting")
        
    officer_user = db.query(User).filter(User.id == case.created_by).first()
    officer_name = officer_user.username if officer_user else "N/A"
    if officer_user and officer_user.badge_number:
        officer_name += f" (Badge: {officer_user.badge_number})"
        
    case_data = {
        "title": case.title,
        "description": case.description,
        "location": case.location or "N/A",
        "date": case.date or "N/A",
        "evidence": case.evidence or "None",
        "witness_details": case.witness_details or "None",
        "officer": officer_name,
        "status": case.status
    }
    
    pdf_bytes = generate_pdf_report(case_data, case.analysis_output)
    log_audit(db, current_user.username, "EXPORT_PDF", f"Downloaded case report PDF", case_id=case_id)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=CrimeGPT_Report_{case_id}.pdf"}
    )

@app.get("/api/cases/{case_id}/export/docx")
def export_docx(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = verify_case_access(case_id, current_user, db)
        
    if not case.analysis_output:
        raise HTTPException(status_code=400, detail="Case must be analyzed before exporting")
        
    officer_user = db.query(User).filter(User.id == case.created_by).first()
    officer_name = officer_user.username if officer_user else "N/A"
    if officer_user and officer_user.badge_number:
        officer_name += f" (Badge: {officer_user.badge_number})"
        
    case_data = {
        "title": case.title,
        "description": case.description,
        "location": case.location or "N/A",
        "date": case.date or "N/A",
        "evidence": case.evidence or "None",
        "witness_details": case.witness_details or "None",
        "officer": officer_name,
        "status": case.status
    }
    
    docx_bytes = generate_docx_report(case_data, case.analysis_output)
    log_audit(db, current_user.username, "EXPORT_DOCX", f"Downloaded case report Word document", case_id=case_id)
    
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=CrimeGPT_Report_{case_id}.docx"}
    )

# --- SECURITY / AUDIT LOGS ---

@app.get("/api/admin/logs")
def get_logs(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    logs = db.query(Log).order_by(Log.timestamp.desc()).limit(150).all()
    return logs

@app.get("/api/admin/users", response_model=List[UserResponse])
def get_users(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

# --- ANALYTICS AND DASHBOARD METRICS ---

@app.get("/api/admin/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Filter statistics based on roles
    if current_user.role == "admin":
        total_cases = db.query(Case).count()
        draft_cases = db.query(Case).filter(Case.status == "draft").count()
        under_review = db.query(Case).filter(Case.status == "under_review").count()
        filed_cases = db.query(Case).filter(Case.status == "filed").count()
        investigating = db.query(Case).filter(Case.status == "investigating").count()
        closed_cases = db.query(Case).filter(Case.status == "closed").count()
        recent_cases = db.query(Case).order_by(Case.created_at.desc()).limit(8).all()
        recent_logs = db.query(Log).order_by(Log.timestamp.desc()).limit(10).all()
    elif current_user.role == "sho":
        # SHO stats are scoped to their station
        total_cases = db.query(Case).filter(Case.station == current_user.station).count()
        draft_cases = db.query(Case).filter(Case.status == "draft", Case.station == current_user.station).count()
        under_review = db.query(Case).filter(Case.status == "under_review", Case.station == current_user.station).count()
        filed_cases = db.query(Case).filter(Case.status == "filed", Case.station == current_user.station).count()
        investigating = db.query(Case).filter(Case.status == "investigating", Case.station == current_user.station).count()
        closed_cases = db.query(Case).filter(Case.status == "closed", Case.station == current_user.station).count()
        recent_cases = db.query(Case).filter(Case.station == current_user.station).order_by(Case.created_at.desc()).limit(8).all()
        recent_logs = db.query(Log).filter(Log.user == current_user.username).order_by(Log.timestamp.desc()).limit(10).all()
    else:
        # Officer stats are scoped to their own registered cases
        total_cases = db.query(Case).filter(Case.created_by == current_user.id).count()
        draft_cases = db.query(Case).filter(Case.status == "draft", Case.created_by == current_user.id).count()
        under_review = db.query(Case).filter(Case.status == "under_review", Case.created_by == current_user.id).count()
        filed_cases = db.query(Case).filter(Case.status == "filed", Case.created_by == current_user.id).count()
        investigating = db.query(Case).filter(Case.status == "investigating", Case.created_by == current_user.id).count()
        closed_cases = db.query(Case).filter(Case.status == "closed", Case.created_by == current_user.id).count()
        recent_cases = db.query(Case).filter(Case.created_by == current_user.id).order_by(Case.created_at.desc()).limit(8).all()
        recent_logs = db.query(Log).filter(Log.user == current_user.username).order_by(Log.timestamp.desc()).limit(10).all()
        
    total_users = db.query(User).count()
    total_logs = db.query(Log).count()
    
    # Calculate some aggregated stats for the charts
    # 1. Most-cited legal sections
    all_cites = db.query(LegalSectionCited.section_reference).all()
    cites_counts = {}
    for c in all_cites:
        ref = c[0]
        cites_counts[ref] = cites_counts.get(ref, 0) + 1
    most_cited = [{"section": k, "count": v} for k, v in sorted(cites_counts.items(), key=lambda x: x[1], reverse=True)[:5]]
    
    # 2. Case Categories
    category_counts = {"Cyber Fraud": 0, "Theft": 0, "Assault": 0, "Intimidation": 0, "Other": 0}
    all_case_descs = db.query(Case.description).all()
    for d in all_case_descs:
        desc = d[0].lower()
        if "fraud" in desc or "scam" in desc or "phishing" in desc or "bank" in desc:
            category_counts["Cyber Fraud"] += 1
        elif "theft" in desc or "stole" in desc or "stolen" in desc:
            category_counts["Theft"] += 1
        elif "assault" in desc or "hurt" in desc or "beat" in desc:
            category_counts["Assault"] += 1
        elif "threat" in desc or "intimidat" in desc:
            category_counts["Intimidation"] += 1
        else:
            category_counts["Other"] += 1
    categories = [{"name": k, "value": v} for k, v in category_counts.items()]
    
    # 3. Aggregated monthly counts (for volume lines)
    monthly_data = [{"month": "May", "cases": int(total_cases * 0.2)}, {"month": "Jun", "cases": int(total_cases * 0.5)}, {"month": "Jul", "cases": total_cases}]

    recent_logs_serialized = [
        {"id": l.id, "timestamp": l.timestamp, "user": l.user, "action": l.action, "details": l.details} 
        for l in recent_logs
    ]
    
    recent_cases_serialized = [
        {"id": c.id, "title": c.title, "status": c.status, "created_at": c.created_at} 
        for c in recent_cases
    ]

    return {
        "total_cases": total_cases,
        "open_cases": draft_cases + under_review + investigating,
        "active_cases": investigating,
        "closed_cases": closed_cases,
        "resolved_cases": filed_cases, # Filed / finalized counts as resolved
        "total_users": total_users,
        "total_logs": total_logs,
        "recent_logs": recent_logs_serialized,
        "recent_cases": recent_cases_serialized,
        "most_cited_sections": most_cited,
        "case_categories": categories,
        "monthly_volume": monthly_data,
        "avg_drafting_time_minutes": 4.5 # Aggregated mock time
    }

# --- SETTINGS / UTILITIES ---

@app.post("/api/settings/validate-key")
def validate_gemini_key(request: KeyValidateRequest):
    try:
        is_valid = AIService.validate_key(request.api_key)
        if is_valid:
            return {"status": "success", "message": "API key validated successfully"}
        else:
            raise HTTPException(status_code=400, detail="Unexpected response or key rejected by provider")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"API Key validation failed: {str(e)}")
