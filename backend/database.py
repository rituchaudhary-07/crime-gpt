from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from backend.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Needed for SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="officer")  # officer, admin
    badge_number = Column(String, nullable=True)
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
    evidence = Column(Text, nullable=True)  # JSON-encoded array
    witness_details = Column(Text, nullable=True)  # JSON-encoded text
    analysis_output = Column(Text, nullable=True)  # AI generation markdown
    status = Column(String, default="open")  # open, under_investigation, closed, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    creator = relationship("User", back_populates="cases")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    chunk_count = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
