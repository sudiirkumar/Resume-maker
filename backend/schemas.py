from pydantic import BaseModel, EmailStr, Field
from beanie import PydanticObjectId
from typing import Dict, Any, Literal, Optional

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


RewriteAction = Literal["proofread", "professional", "summary"]
ResumeReviewType = Literal["ats_review", "keyword_scan", "impact_review", "conciseness_check"]


class RewriteRequest(BaseModel):
    action: RewriteAction
    field_label: str = Field(..., min_length=1)
    target_text: str = Field(default="")
    section_context: Dict[str, Any] = Field(default_factory=dict)
    summary_word_count: Optional[int] = Field(default=None, ge=1, le=500)


class RewriteResponse(BaseModel):
    rewritten_text: str
    provider: str
    model: str


class ResumeReviewRequest(BaseModel):
    review_type: ResumeReviewType
    resume_context: Dict[str, Any] = Field(default_factory=dict)


class ResumeReviewResponse(BaseModel):
    review_text: str
    provider: str
    model: str
    review_type: ResumeReviewType