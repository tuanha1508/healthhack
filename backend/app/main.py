from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import chat, diagnostics, youtube, transcribe, videos
from app.core.config import settings

app = FastAPI(
    title="HealthHack API",
    description="Backend API for Alzheimer's detection and patient care system",
    version="1.0.0"
)

# Configure CORS - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(diagnostics.router, prefix="/api/diagnostics", tags=["diagnostics"])
app.include_router(youtube.router, prefix="/api/youtube", tags=["youtube"])
app.include_router(transcribe.router, prefix="/api/transcribe", tags=["transcribe"])
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])

@app.get("/")
async def root():
    return {"message": "HealthHack API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}