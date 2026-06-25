from beanie import Document, Indexed
from pydantic import EmailStr
from typing import Dict, Any

class User(Document):
    # Indexed(EmailStr) tells MongoDB to enforce unique emails and make searching fast
    email: Indexed(EmailStr, unique=True) # type: ignore
    hashed_password: str

    class Settings:
        name = "users"  # The name of the collection in MongoDB
        
class ResumeData(Document):
    # We index the user_id so MongoDB can fetch it instantly
    user_id: Indexed(str, unique=True) # type: ignore
    # Dict[str, Any] tells MongoDB to accept any valid JSON object
    content: Dict[str, Any]

    class Settings:
        name = "resumes" # The new collection in Atlas