import os
from contextlib import asynccontextmanager

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import backend.models as models
import backend.schemas as schemas
from backend.auth import create_access_token, get_current_user, get_password_hash, verify_password
from backend.database import init_db, is_db_ready
from backend.llm import ai_rewrite_ready, rewrite_resume_text, review_resume_text

# --- LIFESPAN MANAGER ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⏳ Connecting to MongoDB Atlas...")
    db_ready = await init_db()
    if db_ready:
        print("✅ Connected to MongoDB Atlas!")
    else:
        print("⚠️ MongoDB unavailable; starting backend without cloud features.")
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


@app.get("/api/health")
async def health_check():
    """A simple ping to check if the backend is online."""
    return {
        "status": "online",
        "db_ready": is_db_ready(),
        "ai_rewrite_ready": ai_rewrite_ready(),
    }

@app.post("/api/generate-pdf")
async def generate_pdf(request: Request):
    data = await request.json()
    html_content = data.get("html")
    
    if not html_content:
        raise HTTPException(status_code=400, detail="Missing HTML content")

    api_key = os.getenv("PDF_ENDPOINT_KEY") 
    
    async with httpx.AsyncClient() as client:
        try:
            # 1. Ask PDF Endpoint to generate the file
            api_response = await client.post(
                "https://api.pdfendpoint.com/v1/convert",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                json={
                    "html": html_content,
                    "margin_top": "0in",
                    "margin_bottom": "0in",
                    "margin_left": "0in",
                    "margin_right": "0in",
                    "format": "A4"
                },
                timeout=15.0 
            )
            
            # If we hit the 100 limit, trigger the frontend fallback
            if not api_response.is_success:
                return Response(content="API Limit Reached", status_code=api_response.status_code)
                
            # 2. Extract the URL from their JSON response
            response_json = api_response.json()
            pdf_url = response_json.get("data", {}).get("url")
            
            if not pdf_url:
                # If they didn't return a URL, something is wrong on their end
                return Response(content="Invalid API Response", status_code=500)

            # 3. Fetch the actual PDF binary bytes from that URL
            pdf_binary_response = await client.get(pdf_url, timeout=15.0)
            
            # 4. Send the true binary bytes back to your frontend
            return Response(
                content=pdf_binary_response.content, 
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=resume.pdf"}
            )
            
        except httpx.RequestError as e:
            return Response(content="PDF Service Offline", status_code=503)


@app.post("/api/ai/rewrite", response_model=schemas.RewriteResponse)
async def rewrite_resume_section(payload: schemas.RewriteRequest):
    rewritten_text = await rewrite_resume_text(payload.model_dump())
    return {
        "rewritten_text": rewritten_text,
        "provider": "groq",
        "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
    }


@app.post("/api/ai/review-resume", response_model=schemas.ResumeReviewResponse)
async def review_resume(payload: schemas.ResumeReviewRequest):
    review_text = await review_resume_text(payload.model_dump())
    return {
        "review_text": review_text,
        "provider": "groq",
        "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        "review_type": payload.review_type,
    }

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


@app.post("/api/logout")
async def logout_user(current_user: models.User = Depends(get_current_user)):
    """Acknowledge logout on the server side.

    JWT tokens are stateless, so logout is handled on the client by removing
    the stored token. This endpoint exists to keep the API flow explicit and
    to allow future token revocation/blacklisting if needed.
    """
    return {"message": "Logged out successfully", "user_id": str(current_user.id)}

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