from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

app = FastAPI(title="ProspectNet API")

# Configure CORS so the React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fetch the MongoDB connection string from .env
DATABASE_URL = os.getenv("DATABASE_URL")

@app.on_event("startup")
async def startup_db_client():
    if not DATABASE_URL:
        print("❌ DATABASE_URL is not set in the .env file!")
        return
        
    try:
        app.mongodb_client = AsyncIOMotorClient(DATABASE_URL)
        # Ping the database to verify the connection
        await app.mongodb_client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    if hasattr(app, "mongodb_client"):
        app.mongodb_client.close()

@app.get("/")
async def root():
    return {"message": "ProspectNet Backend is running and DB is connected!"}

# Enable the API routes
from app.api.routes_leads import router as leads_router
from app.api.routes_config import router as config_router

app.include_router(leads_router, prefix="/leads", tags=["Leads"])
app.include_router(config_router, prefix="/icp", tags=["ICP Config"])