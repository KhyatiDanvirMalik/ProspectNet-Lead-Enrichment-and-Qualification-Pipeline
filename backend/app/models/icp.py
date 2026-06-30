from sqlalchemy import Column, Integer, String, JSON
from pydantic import BaseModel, Field
from typing import List, Dict, Any

from app.db.session import Base

# SQLAlchemy Database Model
class ICPConfig(Base):
    __tablename__ = "icp_configurations"

    id = Column(Integer, primary_key=True, index=True)
    target_company_size_range = Column(String, default="")
    target_industries = Column(JSON, default=list)
    required_tech_stack = Column(JSON, default=list)
    minimum_seniority_level = Column(String, default="")
    disqualifying_signals = Column(JSON, default=list)
    scoring_formula_weights = Column(JSON, default={"icp_fit": 0.5, "buying_signals": 0.5})
    product_description = Column(String, default="")
    value_proposition = Column(String, default="")

# Pydantic Schemas for API Validation
class ICPConfigBase(BaseModel):
    target_company_size_range: str = Field(default="", description="E.g., 20 to 100 employees")
    target_industries: List[str] = Field(default_factory=list)
    required_tech_stack: List[str] = Field(default_factory=list)
    minimum_seniority_level: str = Field(default="")
    disqualifying_signals: List[str] = Field(default_factory=list)
    scoring_formula_weights: Dict[str, float] = Field(default={"icp_fit": 0.5, "buying_signals": 0.5})
    product_description: str = Field(default="")
    value_proposition: str = Field(default="")

class ICPConfigCreate(ICPConfigBase):
    pass

class ICPConfigResponse(ICPConfigBase):
    class Config:
        from_attributes = True

class LeadPreviewRequest(BaseModel):
    icp_config: ICPConfigBase
    sample_lead: Dict[str, Any] = Field(..., description="Sample lead data for semantic scoring preview")

class LeadPreviewResponse(BaseModel):
    icp_score: int
    score_breakdown: Dict[str, Any]
    detected_buying_signals: List[Dict[str, str]]
    reasoning: str