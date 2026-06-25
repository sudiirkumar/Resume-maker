from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from backend.pdf_service import generate_pdf_from_html

app = FastAPI(title="Resume Generator API")

# Configure CORS so your frontend can communicate with this backend later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the expected JSON payload
class PDFRequest(BaseModel):
    html: str

def remove_file(path: str):
    """Background task to delete the file after it is downloaded."""
    if os.path.exists(path):
        os.remove(path)

@app.post("/api/generate-pdf")
async def generate_pdf(request: PDFRequest, background_tasks: BackgroundTasks):
    # 1. Generate the PDF and get the temporary path
    pdf_path = await generate_pdf_from_html(request.html)
    
    # 2. Schedule the file to be deleted AFTER the response is sent
    background_tasks.add_task(remove_file, pdf_path)
    
    # 3. Return the file to the client
    return FileResponse(
        path=pdf_path, 
        media_type="application/pdf", 
        filename="resume.pdf"
    )

@app.get("/")
def read_root():
    return {"status": "FastAPI Backend is running"}