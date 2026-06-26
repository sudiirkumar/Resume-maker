import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

import backend.models as models

# Load environment variables from the .env file into the system
load_dotenv()

# Securely fetch the Atlas connection string
MONGODB_URL = os.getenv("MONGODB_URI")

async def init_db():
    """Initializes the MongoDB connection and registers Beanie models."""
    
    # A quick safety check to ensure the .env file is being read properly
    if not MONGODB_URL:
        raise ValueError("FATAL ERROR: MONGODB_URI is not set in the .env file!")

    # Connect to the MongoDB Atlas cluster
    client = AsyncIOMotorClient(MONGODB_URL)
    
    # "resume_app" is the name of the database that will be created/used in Atlas
    await init_beanie(
        database=client.resume_app,
        document_models=[
            models.User,
            models.ResumeData
        ]
    )