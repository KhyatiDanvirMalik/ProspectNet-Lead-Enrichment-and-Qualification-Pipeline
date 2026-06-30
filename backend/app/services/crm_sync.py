import requests
import json
from sqlalchemy.orm import Session
from app.models.lead import Lead
from app.core.config import settings

def sync_lead_to_crm(lead: Lead, db: Session):
    """
    Syncs the enriched lead to the configured CRM (Notion or Airtable).
    Handles deduplication by domain or company name by updating existing records.
    """
    crm_type = settings.active_crm

    if crm_type == "none":
        lead.crm_sync_status = "failed"
        db.commit()
        return False

    try:
        success = False
        if crm_type == "notion":
            success = sync_to_notion(lead)
        elif crm_type == "airtable":
            success = sync_to_airtable(lead)
        
        if success:
            lead.crm_sync_status = "synced"
        else:
            lead.crm_sync_status = "failed"
            
    except Exception as e:
        print(f"CRM Sync Error for Lead {lead.id}: {e}")
        lead.crm_sync_status = "failed"

    db.commit()
    return lead.crm_sync_status == "synced"

def get_lead_payload(lead: Lead) -> dict:
    """Extract and format data to send to CRM."""
    return {
        "Name": lead.name or "",
        "Company": lead.company_name or "",
        "Domain": lead.domain or "",
        "ICP Score": lead.icp_score,
        "Top Buying Signal": lead.top_buying_signal or "None",
        "Company Size": lead.company_size or "Unknown",
        "Industry": lead.industry or "Unknown",
        "Tech Stack": ", ".join(lead.tech_stack) if lead.tech_stack else "",
        "Buying Signals": json.dumps([s.get("signal") for s in lead.buying_signals]) if lead.buying_signals else "None",
        "Outreach Draft (Direct)": lead.outreach_drafts.get("direct", ""),
        "Confidence Scores": json.dumps(lead.confidence_scores)
    }

# --- NOTION INTEGRATION ---

def sync_to_notion(lead: Lead) -> bool:
    headers = {
        "Authorization": f"Bearer {settings.NOTION_API_KEY}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    
    # 1. Search for existing record (Deduplication)
    search_url = f"https://api.notion.com/v1/databases/{settings.NOTION_DATABASE_ID}/query"
    search_payload = {
        "filter": {
            "or": [
                {
                    "property": "Domain",
                    "rich_text": {"equals": lead.domain}
                } if lead.domain else None,
                {
                    "property": "Company",
                    "title": {"equals": lead.company_name}
                } if lead.company_name else None
            ]
        }
    }
    
    search_payload["filter"]["or"] = [f for f in search_payload["filter"]["or"] if f is not None]
    
    if not search_payload["filter"]["or"]:
        return False
        
    response = requests.post(search_url, headers=headers, json=search_payload)
    response.raise_for_status()
    results = response.json().get("results", [])
    
    page_id = results[0]["id"] if results else None
    
    # 2. Prepare properties payload
    data = get_lead_payload(lead)
    properties = {
        "Company": {"title": [{"text": {"content": data["Company"]}}]},
        "Name": {"rich_text": [{"text": {"content": data["Name"]}}]},
        "Domain": {"rich_text": [{"text": {"content": data["Domain"]}}]},
        "ICP Score": {"number": data["ICP Score"]},
        "Top Buying Signal": {"rich_text": [{"text": {"content": data["Top Buying Signal"]}}]},
        "Company Size": {"rich_text": [{"text": {"content": data["Company Size"]}}]},
        "Industry": {"rich_text": [{"text": {"content": data["Industry"]}}]},
        "Tech Stack": {"rich_text": [{"text": {"content": data["Tech Stack"][:2000]}}]},
        "Buying Signals": {"rich_text": [{"text": {"content": data["Buying Signals"][:2000]}}]},
        "Outreach Draft (Direct)": {"rich_text": [{"text": {"content": data["Outreach Draft (Direct)"][:2000]}}]},
    }
    
    # 3. Create or Update
    if page_id:
        update_url = f"https://api.notion.com/v1/pages/{page_id}"
        resp = requests.patch(update_url, headers=headers, json={"properties": properties})
    else:
        create_url = "https://api.notion.com/v1/pages"
        payload = {
            "parent": {"database_id": settings.NOTION_DATABASE_ID},
            "properties": properties
        }
        resp = requests.post(create_url, headers=headers, json=payload)
        
    resp.raise_for_status()
    return True

# --- AIRTABLE INTEGRATION ---

def sync_to_airtable(lead: Lead) -> bool:
    headers = {
        "Authorization": f"Bearer {settings.AIRTABLE_API_KEY}",
        "Content-Type": "application/json"
    }
    base_url = f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID}/{settings.AIRTABLE_TABLE_NAME}"
    
    # 1. Search for existing record (Deduplication)
    domain_query = f"{{Domain}}='{lead.domain}'" if lead.domain else ""
    company_query = f"{{Company}}='{lead.company_name}'" if lead.company_name else ""
    
    if domain_query and company_query:
        formula = f"OR({domain_query}, {company_query})"
    else:
        formula = domain_query or company_query
        
    search_url = f"{base_url}?filterByFormula={requests.utils.quote(formula)}"
    response = requests.get(search_url, headers=headers)
    response.raise_for_status()
    
    records = response.json().get("records", [])
    record_id = records[0]["id"] if records else None
    
    # 2. Prepare payload
    fields = get_lead_payload(lead)
    
    # 3. Create or Update
    if record_id:
        update_url = f"{base_url}/{record_id}"
        resp = requests.patch(update_url, headers=headers, json={"fields": fields})
    else:
        resp = requests.post(base_url, headers=headers, json={"fields": fields})
        
    resp.raise_for_status()
    return True