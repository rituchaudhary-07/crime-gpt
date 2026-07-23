from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from backend.config import DATABASE_URL

if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}  # Needed for SQLite
    )
else:
    # Fix for Render/Heroku postgresql:// vs postgres:// connection string issue
    connection_url = DATABASE_URL
    if connection_url.startswith("postgres://"):
        connection_url = connection_url.replace("postgres://", "postgresql://", 1)
    engine = create_engine(connection_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="officer")  # officer, sho, admin
    badge_number = Column(String, nullable=True)
    station = Column(String, default="Central Cyber Police Station")
    status = Column(String, default="pending")  # pending, approved, rejected, disabled
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    last_login_ip = Column(String, nullable=True)
    require_password_change = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cases = relationship("Case", back_populates="creator")

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=True)
    date = Column(String, nullable=True)
    evidence = Column(Text, nullable=True)  # JSON-encoded array or plain string
    witness_details = Column(Text, nullable=True)  # JSON-encoded text or plain string
    analysis_output = Column(Text, nullable=True)  # AI generation markdown
    status = Column(String, default="draft")  # draft, pending_approval, assigned, accepted, rejected_by_officer, under_investigation, evidence_collection, fir_generated, submitted, closed
    station = Column(String, default="Central Cyber Police Station")
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    assignment_status = Column(String, default="accepted")  # pending, accepted, declined
    decline_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    creator = relationship("User", back_populates="cases")
    fir_drafts = relationship("FIRDraft", back_populates="case", cascade="all, delete-orphan")
    evidence_items = relationship("EvidenceItem", back_populates="case", cascade="all, delete-orphan")

class FIRDraft(Base):
    __tablename__ = "fir_drafts"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), unique=True)
    incident_summary = Column(Text, nullable=True)
    fir_draft_text = Column(Text, nullable=True)
    evidence_checklist = Column(Text, nullable=True)  # JSON-encoded string list
    clarifying_questions = Column(Text, nullable=True)  # JSON-encoded list of Q/A
    ai_approved_flags = Column(Text, nullable=True)  # JSON-encoded dict of field approval flags
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="fir_drafts")
    citations = relationship("LegalSectionCited", back_populates="fir_draft", cascade="all, delete-orphan")

class LegalSectionCited(Base):
    __tablename__ = "legal_sections_cited"

    id = Column(Integer, primary_key=True, index=True)
    fir_draft_id = Column(Integer, ForeignKey("fir_drafts.id"))
    section_reference = Column(String, nullable=False)  # e.g. "BNS Section 303"
    act = Column(String, nullable=False)  # e.g. "BNS"
    title = Column(String, nullable=False)  # e.g. "Theft"
    citation_text = Column(Text, nullable=False)
    justification = Column(Text, nullable=True)
    confidence_score = Column(Integer, default=100)
    approved_by_officer = Column(Integer, default=0)  # 0 = suggested, 1 = approved

    # Relationships
    fir_draft = relationship("FIRDraft", back_populates="citations")

class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, default="Other")  # CCTV, Document, ID Proof, Chat Log, Other
    custody_notes = Column(Text, nullable=True)
    uploaded_by = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="evidence_items")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    message_type = Column(String, default="general_assistant")  # general_assistant, sop_guidance
    role = Column(String, nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    citations = Column(Text, nullable=True)  # JSON-encoded array of citations
    timestamp = Column(DateTime, default=datetime.utcnow)

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    case_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
