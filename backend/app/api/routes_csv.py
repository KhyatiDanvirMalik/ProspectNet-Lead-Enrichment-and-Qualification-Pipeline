from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
import csv
import io

from app.db.session import get_db
from app.models.lead import Lead

router = APIRouter(prefix="/csv", tags=["CSV Upload"])

def process_enrichment_pipeline(lead_ids: list[int], db: Session):
    pass

@router.post("/upload", response_model=dict)
async def upload_leads_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .csv file.")

    try:
        content = await file.read()
        text = content.decode('utf-8-sig') 
        reader = csv.DictReader(io.StringIO(text))
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File encoding error. Please ensure the CSV is UTF-8 encoded.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty or missing headers.")

    headers = [h.strip().lower() for h in reader.fieldnames]
    
    if 'company' not in headers and 'domain' not in headers:
        raise HTTPException(status_code=400, detail="CSV must contain at least a 'company' or 'domain' column.")

    created_leads = []
    reader.fieldnames = headers

    for row_num, row in enumerate(reader, start=1):
        name = row.get('name', '').strip()
        company = row.get('company', '').strip()
        domain = row.get('domain', '').strip()

        if not name and not company and not domain:
            continue
            
        if not company and not domain:
            raise HTTPException(
                status_code=400, 
                detail=f"Row {row_num} is missing both 'company' and 'domain'. At least one is required."
            )

        new_lead = Lead(
            name=name,
            company_name=company,
            domain=domain,
            enrichment_status="pending",
            crm_sync_status="pending"
        )
        db.add(new_lead)
        created_leads.append(new_lead)

    try:
        db.commit()
        for lead in created_leads:
            db.refresh(lead)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error while saving leads: {str(e)}")

    lead_ids = [lead.id for lead in created_leads]
    
    if lead_ids:
        background_tasks.add_task(process_enrichment_pipeline, lead_ids, db)

    return {
        "message": "CSV processed successfully.",
        "leads_imported": len(created_leads),
        "lead_ids": lead_ids
    }