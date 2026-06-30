from sqlalchemy import Column, Integer, String, JSON, Text
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.db.session import Base

# SQLAlchemy Database Model
class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    
    # Raw Input Data
    name = Column(String, index=True, nullable=True)
    company_name = Column(String, index=True, nullable=True)
    domain = Column(String, index=True, nullable=True)
    
    # Enriched Data
    company_size = Column(String, nullable=True)
    tech_stack = Column(JSON, default=list)
    funding_status = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    sub_industry = Column(String, nullable=True)
    role = Column(String, nullable=True)
    seniority = Column(String, nullable=True)
    recent_news = Column(Text, nullable=True)
    
    # Each field carries a confidence indicator (high, medium, low) stored here
    confidence_scores = Column(JSON, default=dict)
    
    # ICP Scoring & Signals
    icp_score = Column(Integer, default=0)
    score_breakdown = Column(JSON, default=dict)
    buying_signals = Column(JSON, default=list)  # List of dicts: {"signal": "...", "source": "..."}
    top_buying_signal = Column(String, nullable=True)
    
    # Outreach Generation
    # Stores 2-3 variants {"direct": "...", "consultative": "...", "social_proof": "..."}
    outreach_drafts = Column(JSON, default=dict)
    
    # Status Tracking
    enrichment_status = Column(String, default="pending")  # pending, processing, completed, failed, partially_failed
    current_processing_source = Column(String, default="queued") # queued, website, linkedin, news
    crm_sync_status = Column(String, default="pending")    # pending, synced, failed, skipped


# Pydantic Schemas for API Validation
class LeadBase(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    domain: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    company_size: Optional[str]
    tech_stack: List[str]
    funding_status: Optional[str]
    industry: Optional[str]
    sub_industry: Optional[str]
    role: Optional[str]
    seniority: Optional[str]
    recent_news: Optional[str]
    confidence_scores: Dict[str, str]
    
    icp_score: int
    score_breakdown: Dict[str, Any]
    buying_signals: List[Dict[str, str]]
    top_buying_signal: Optional[str]
    
    outreach_drafts: Dict[str, str]
    
    enrichment_status: str
    current_processing_source: str
    crm_sync_status: str

    class Config:
        from_attributes = True