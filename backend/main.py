from fastapi import FastAPI, BackgroundTasks, HTTPException, status, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
from contextlib import asynccontextmanager

from backend.pdf_service import generate_pdf_from_html
from backend.database import init_db
import backend.models as models
import backend.schemas as schemas
from backend.auth import get_password_hash, verify_password, create_access_token
from backend.auth import get_current_user
from fastapi.security import OAuth2PasswordRequestForm

# --- LIFESPAN MANAGER ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⏳ Connecting to MongoDB Atlas...")
    await init_db()
    print("✅ Connected to MongoDB Atlas!")
    yield

app = FastAPI(title="Resume Generator API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PDFRequest(BaseModel):
    html: str

def remove_file(path: str):
    if os.path.exists(path):
        os.remove(path)

@app.post("/api/generate-pdf")
async def generate_pdf(request: PDFRequest, background_tasks: BackgroundTasks):
    pdf_path = await generate_pdf_from_html(request.html)
    background_tasks.add_task(remove_file, pdf_path)
    return FileResponse(path=pdf_path, media_type="application/pdf", filename="resume.pdf")


# ==========================================
# 🔐 AUTHENTICATION ROUTES
# ==========================================

@app.post("/api/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: schemas.UserCreate):
    # 1. Check if the email is already registered
    existing_user = await models.User.find_one(models.User.email == user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # 2. Hash the password securely
    hashed_pw = get_password_hash(user_data.password)

    # 3. Create the new user document in MongoDB
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_pw
    )
    await new_user.insert()

    # FastAPI will automatically filter out the password using the UserResponse schema
    return new_user

@app.post("/api/login", response_model=schemas.Token)
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    # Swagger sends the email inside the 'username' field of the form
    user = await models.User.find_one(models.User.email == form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate the JWT session token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}

# ==========================================
# 💾 SECURE DATA ROUTES
# ==========================================

@app.post("/api/resume")
async def save_resume(
    resume_data: schemas.ResumeSaveRequest, 
    current_user: models.User = Depends(get_current_user)
):
    """Saves or updates the logged-in user's resume data."""
    
    # 1. Check if the user already has a saved resume
    existing_resume = await models.ResumeData.find_one(
        models.ResumeData.user_id == str(current_user.id)
    )
    
    # 2. If it exists, update it. If not, create a new one.
    if existing_resume:
        existing_resume.content = resume_data.content
        await existing_resume.save()
        return {"message": "Resume updated successfully"}
    else:
        new_resume = models.ResumeData(
            user_id=str(current_user.id), 
            content=resume_data.content
        )
        await new_resume.insert()
        return {"message": "Resume saved successfully"}

@app.get("/api/resume", response_model=schemas.ResumeResponse)
async def load_resume(current_user: models.User = Depends(get_current_user)):
    """Fetches the logged-in user's resume data."""
    
    resume = await models.ResumeData.find_one(
        models.ResumeData.user_id == str(current_user.id)
    )
    
    # If they haven't saved anything yet, return an empty dictionary
    if not resume:
        return {"content": {}}
        
    return {"content": resume.content}

# Serve the static files (Must remain at the bottom!)
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")