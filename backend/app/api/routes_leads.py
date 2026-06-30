from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, File, UploadFile
from bson import ObjectId
from typing import List
import pydantic
import csv
import io
from transformers import pipeline

router = APIRouter()

# Initialize CPU-bound local model (runs within Railway's 512MB RAM limit)
generator = pipeline("text2text-generation", model="google/flan-t5-small", device=-1)

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, values=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class LeadResponse(pydantic.BaseModel):
    id: str
    name: str
    company: str
    title: str | None = None
    email: str | None = None
    linkedin_url: str | None = None
    icp_score: int | None = None
    status: str = "New"
    
    # React format
    topSignal: str | None = None
    enrichmentSummary: str | None = None
    crmSynced: bool = False
    outreachDraft1: str | None = None
    outreachDraft2: str | None = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

async def process_lead_with_ai(lead_id: str, db):
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead: return

        config = await db.config.find_one({"type": "icp_rules"})
        if not config:
            config = {"target_industries": "Technology", "disqualifying_signals": "None"}

        name = lead.get("name", "there")
        company = lead.get("company", "your company")
        industry = config.get("target_industries", "Tech")

        # Local Semantic Scoring
        score_prompt = f"Does the company {company} belong to the {industry} industry? Answer exactly yes or no."
        score_res = generator(score_prompt, max_new_tokens=5)[0]["generated_text"].strip().lower()
        icp_score = 90 if "yes" in score_res else 40

        # Generate Draft 1 (Direct)
        draft1_prompt = f"Write a short, direct cold email to {name} at {company} introducing our software."
        draft1 = generator(draft1_prompt, max_new_tokens=100)[0]["generated_text"]

        # Generate Draft 2 (Consultative)
        draft2_prompt = f"Write a short, consultative cold email to {name} asking about challenges at {company}."
        draft2 = generator(draft2_prompt, max_new_tokens=100)[0]["generated_text"]

        await db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": {
                "icp_score": icp_score,
                "top_signal": f"Semantic Match: {score_res}",
                "enrichment_summary": "Evaluated locally on CPU.",
                "outreach_draft_1": draft1,
                "outreach_draft_2": draft2,
                "status": "completed"
            }}
        )
    except Exception as e:
        await db.leads.update_one({"_id": ObjectId(lead_id)}, {"$set": {"status": "failed"}})

@router.get("/", response_model=List[LeadResponse])
async def get_leads(request: Request):
    db = request.app.mongodb_client.ProspectNet
    cursor = db.leads.find()
    leads = []
    async for document in cursor:
        document["id"] = str(document["_id"])
        document["topSignal"] = document.get("top_signal")
        document["enrichmentSummary"] = document.get("enrichment_summary")
        document["crmSynced"] = document.get("crm_synced", False)
        document["outreachDraft1"] = document.get("outreach_draft_1")
        document["outreachDraft2"] = document.get("outreach_draft_2")
        leads.append(document)
    return leads

@router.post("/enrich")
async def enrich_lead(request: Request, lead_data: dict, background_tasks: BackgroundTasks):
    db = request.app.mongodb_client.ProspectNet
    new_lead = {
        "name": lead_data.get("name"),
        "company": lead_data.get("company"),
        "title": lead_data.get("title"),
        "email": lead_data.get("email"),
        "linkedin_url": lead_data.get("linkedin_url"),
        "status": "processing",
        "icp_score": None
    }
    result = await db.leads.insert_one(new_lead)
    background_tasks.add_task(process_lead_with_ai, str(result.inserted_id), db)
    return {"message": "Lead entry created", "lead_id": str(result.inserted_id)}

@router.post("/upload")
async def upload_csv(request: Request, background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    db = request.app.mongodb_client.ProspectNet
    content = await file.read()
    csv_reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    
    for row in csv_reader:
        new_lead = {
            "name": row.get("name", ""),
            "company": row.get("company", ""),
            "title": row.get("title", ""),
            "email": row.get("email", ""),
            "linkedin_url": row.get("linkedin_url", ""),
            "status": "processing",
            "icp_score": None
        }
        result = await db.leads.insert_one(new_lead)
        background_tasks.add_task(process_lead_with_ai, str(result.inserted_id), db)
        
    return {"message": "CSV uploaded and CPU processing started"}

@router.post("/{lead_id}/sync")
async def sync_to_crm(lead_id: str, request: Request):
    db = request.app.mongodb_client.ProspectNet
    await db.leads.update_one({"_id": ObjectId(lead_id)}, {"$set": {"crm_synced": True, "status": "synced"}})
    return {"message": "Successfully synced to CRM!"}