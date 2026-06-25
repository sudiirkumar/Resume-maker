from pydantic import BaseModel, EmailStr, Field
from beanie import PydanticObjectId
from typing import Dict, Any

# What the frontend sends when registering/logging in
class UserCreate(BaseModel):
    email: EmailStr
    # We add Field validation to strictly enforce password lengths
    password: str = Field(..., min_length=6, max_length=72)

# What we send back to the frontend
class UserResponse(BaseModel):
    id: PydanticObjectId
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    
class ResumeSaveRequest(BaseModel):
    # The frontend will send a massive JSON object containing all the form fields
    content: Dict[str, Any]

class ResumeResponse(BaseModel):
    content: Dict[str, Any]