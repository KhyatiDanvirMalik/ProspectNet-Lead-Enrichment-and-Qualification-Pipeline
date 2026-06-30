import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ProspectNet"
    VERSION: str = "1.0.0"
    
    # Database setup (Defaults to SQLite for local/Railway volume, can be overridden by Railway Postgres URL)
    DATABASE_URL: str = "sqlite:///./prospectnet.db"
    
    # CRM Integrations (Free tiers for Notion or Airtable)
    NOTION_API_KEY: Optional[str] = None
    NOTION_DATABASE_ID: Optional[str] = None
    
    AIRTABLE_API_KEY: Optional[str] = None
    AIRTABLE_BASE_ID: Optional[str] = None
    AIRTABLE_TABLE_NAME: str = "Leads"
    
    # Model configuration for CPU-bound LLM on Railway
    # Using a compact model that fits within Railway free tier RAM limits
    LLM_MODEL_NAME: str = "Qwen/Qwen2.5-0.5B-Instruct"
    
    # App Settings
    DEBUG: bool = False
    ALLOWED_HOSTS: list[str] = ["*"]
    
    @property
    def active_crm(self) -> str:
        """Dynamically determine which CRM is configured."""
        if self.NOTION_API_KEY and self.NOTION_DATABASE_ID:
            return "notion"
        elif self.AIRTABLE_API_KEY and self.AIRTABLE_BASE_ID:
            return "airtable"
        return "none"

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()