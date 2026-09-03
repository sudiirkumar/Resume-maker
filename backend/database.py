import os
import logging
from dotenv import load_dotenv
from beanie import init_beanie
from pymongo import AsyncMongoClient

import backend.models as models

logger = logging.getLogger(__name__)

# Load environment variables from the .env file into the system
load_dotenv()

# Securely fetch the Atlas connection string
MONGODB_URL = os.getenv("MONGODB_URI")
DB_READY = False


def is_db_ready() -> bool:
    return DB_READY

async def init_db():
    """Initializes the MongoDB connection and registers Beanie models."""
    global DB_READY
    
    # A quick safety check to ensure the .env file is being read properly
    if not MONGODB_URL:
        DB_READY = False
        logger.warning("database_unavailable reason=MONGODB_URI_not_set")
        return False

    try:
        # Connect to the MongoDB Atlas cluster
        client = AsyncMongoClient(MONGODB_URL)
        
        # "resume_app" is the name of the database that will be created/used in Atlas
        await init_beanie(
            database=client.resume_app,
            document_models=[
                models.User,
                models.ResumeData
            ]
        )
        DB_READY = True
        return True
    except Exception as exc:
        DB_READY = False
        logger.exception("database_unavailable reason=initialization_failed error=%s", type(exc).__name__)
        return False