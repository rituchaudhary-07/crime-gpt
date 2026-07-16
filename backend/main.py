import json
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import google.generativeai as genai

from backend.config import GEMINI_API_KEY
from backend.database import engine, Base, get_db, User, Case, Log, Document
from backend.auth import get_password_hash, verify_password, create_access_token, get_current_user, get_current_admin
from backend.rag import generate_analysis
from backend.exporter import generate_pdf_report, generate_docx_report

# Initialize database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CrimeGPT API", version="1.0.0")

# CORS setup for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend port/domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed database with default admin & officer if not exists
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
                badge_number="B1001"
            )
            db.add(new_admin)
            
        # Check officer
        officer = db.query(User).filter(User.username == "officer_test").first()
        if not officer:
            hashed_pw = get_password_hash("officer123")
            new_officer = User(
                username="officer_test",
                password_hash=hashed_pw,
                role="officer",
                badge_number="B1002"
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

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    badge_number: Optional[str]
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
    evidence: Optional[str] = ""  # String or JSON list
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
    created_at: datetime
    created_by: int
    
    class Config:
        from_attributes = True

class KeyValidateRequest(BaseModel):
    api_key: str

# Helper to log actions
def log_audit(db: Session, username: str, action: str, details: str):
    audit_log = Log(user=username, action=action, details=details)
    db.add(audit_log)
    db.commit()

# --- ROUTES ---

@app.post("/api/auth/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if exists
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_pw = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        password_hash=hashed_pw,
        role=user_data.role,
        badge_number=user_data.badge_number
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    log_audit(db, "SYSTEM", "REGISTER", f"User {user.username} registered with role {user.role}")
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
    log_audit(db, user.username, "LOGIN", "Logged into system successfully")
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "username": user.username}

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# --- CASES ---

@app.get("/api/cases", response_model=List[CaseResponse])
def get_cases(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Officer sees their own cases, admin sees all
    if current_user.role == "admin":
        cases = db.query(Case).all()
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
        created_by=current_user.id
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    
    log_audit(db, current_user.username, "CREATE_CASE", f"Created case ID {case.id} - '{case.title}'")
    return case

@app.get("/api/cases/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    # Check access permission
    if current_user.role != "admin" and case.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this case")
        
    return case

@app.put("/api/cases/{case_id}", response_model=CaseResponse)
def update_case(case_id: int, case_data: CaseUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if current_user.role != "admin" and case.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this case")
        
    for key, value in case_data.dict(exclude_unset=True).items():
        setattr(case, key, value)
        
    db.commit()
    db.refresh(case)
    
    log_audit(db, current_user.username, "UPDATE_CASE", f"Updated case ID {case.id}")
    return case

@app.delete("/api/cases/{case_id}")
def delete_case(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if current_user.role != "admin" and case.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this case")
        
    title = case.title
    db.delete(case)
    db.commit()
    
    log_audit(db, current_user.username, "DELETE_CASE", f"Deleted case ID {case_id} - '{title}'")
    return {"message": "Case deleted successfully"}

# --- RAG & AI ---

@app.post("/api/cases/{case_id}/analyze")
def analyze_case(
    case_id: int, 
    custom_key: Optional[str] = None, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if current_user.role != "admin" and case.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to analyze this case")
        
    # Dynamic key fallback
    api_key = custom_key or GEMINI_API_KEY
    
    # Run analysis
    result = generate_analysis(
        case_title=case.title,
        description=case.description,
        location=case.location,
        date=case.date,
        evidence=case.evidence or "",
        witness=case.witness_details or "",
        api_key=api_key
    )
    
    case.analysis_output = result["analysis"]
    db.commit()
    
    log_audit(db, current_user.username, "ANALYZE_CASE", f"Triggered AI RAG Analysis for case ID {case_id}")
    
    return {"analysis": result["analysis"], "citations": result["citations"]}

# --- REPORTS EXPORTS ---

@app.get("/api/cases/{case_id}/export/pdf")
def export_pdf(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if current_user.role != "admin" and case.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not case.analysis_output:
        raise HTTPException(status_code=400, detail="Case must be analyzed before exporting")
        
    # Read officer details
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
    
    log_audit(db, current_user.username, "EXPORT_PDF", f"Downloaded Case ID {case_id} report as PDF")
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=CrimeGPT_Report_{case_id}.pdf"}
    )

@app.get("/api/cases/{case_id}/export/docx")
def export_docx(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if current_user.role != "admin" and case.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not case.analysis_output:
        raise HTTPException(status_code=400, detail="Case must be analyzed before exporting")
        
    # Read officer details
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
    
    log_audit(db, current_user.username, "EXPORT_DOCX", f"Downloaded Case ID {case_id} report as Word DOCX")
    
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=CrimeGPT_Report_{case_id}.docx"}
    )

# --- ADMIN ENDPOINTS ---

@app.get("/api/admin/logs")
def get_logs(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    logs = db.query(Log).order_by(Log.timestamp.desc()).limit(100).all()
    return logs

@app.get("/api/admin/users", response_model=List[UserResponse])
def get_users(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@app.get("/api/admin/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Counts
    total_cases = db.query(Case).count()
    open_cases = db.query(Case).filter(Case.status == "open").count()
    active_cases = db.query(Case).filter(Case.status == "under_investigation").count()
    closed_cases = db.query(Case).filter(Case.status == "closed").count()
    resolved_cases = db.query(Case).filter(Case.status == "resolved").count()
    total_users = db.query(User).count()
    total_logs = db.query(Log).count()
    
    # Recent logs
    recent_logs = db.query(Log).order_by(Log.timestamp.desc()).limit(5).all()
    recent_logs_serialized = [
        {"id": l.id, "timestamp": l.timestamp, "user": l.user, "action": l.action, "details": l.details} 
        for l in recent_logs
    ]
    
    # Recent cases
    recent_cases = db.query(Case).order_by(Case.created_at.desc()).limit(5).all()
    recent_cases_serialized = [
        {"id": c.id, "title": c.title, "status": c.status, "created_at": c.created_at} 
        for c in recent_cases
    ]

    return {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "active_cases": active_cases,
        "closed_cases": closed_cases,
        "resolved_cases": resolved_cases,
        "total_users": total_users,
        "total_logs": total_logs,
        "recent_logs": recent_logs_serialized,
        "recent_cases": recent_cases_serialized
    }

# --- SETTINGS / UTILITIES ---

@app.post("/api/settings/validate-key")
def validate_gemini_key(request: KeyValidateRequest):
    try:
        genai.configure(api_key=request.api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Ping. Respond with one word 'Admissible'.")
        text = response.text.strip()
        if "Admissible" in text or len(text) > 0:
            return {"status": "success", "message": "API key validated successfully"}
        else:
            raise HTTPException(status_code=400, detail="Unexpected response from Gemini API")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"API Key validation failed: {str(e)}")
