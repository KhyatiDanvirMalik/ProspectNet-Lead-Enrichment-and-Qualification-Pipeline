from fastapi import APIRouter, Request, HTTPException

router = APIRouter()

@router.get("/")
async def get_icp_config(request: Request):
    """Fetch the active ICP configuration parameters."""
    db = request.app.mongodb_client.ProspectNet
    config = await db.config.find_one({"type": "icp_rules"})
    
    if not config:
        return {
            "target_industries": ["SaaS", "Fintech", "AI"],
            "disqualifying_signals": ["Crypto", "Agency"],
            "weights": {"firmographics": 40, "tech_stack": 30, "buying_signals": 30}
        }
        
    config["id"] = str(config["_id"])
    del config["_id"]  # <-- This prevents the frontend parsing error
    return config

@router.post("/")
async def update_icp_config(request: Request, config_data: dict):
    """Update or initialize the ICP configuration parameters."""
    db = request.app.mongodb_client.ProspectNet
    result = await db.config.update_one(
        {"type": "icp_rules"},
        {"$set": config_data},
        upsert=True
    )
    return {"status": "success", "message": "ICP configuration updated successfully"}