from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from groq import Groq
from app.core.config import settings
import json
import uuid
from datetime import datetime
from pathlib import Path

router = APIRouter()

# Create prescriptions directory if it doesn't exist
PRESCRIPTIONS_DIR = Path("prescriptions_data")
PRESCRIPTIONS_DIR.mkdir(exist_ok=True)

# JSON file for persisting prescription data
PRESCRIPTIONS_FILE = PRESCRIPTIONS_DIR / "prescriptions.json"

# Load existing prescriptions or initialize empty storage
def load_prescriptions():
    """Load prescriptions from JSON file"""
    if PRESCRIPTIONS_FILE.exists():
        try:
            with open(PRESCRIPTIONS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading prescriptions: {e}")
            return []
    return []

def save_prescriptions(prescriptions):
    """Save prescriptions to JSON file"""
    try:
        with open(PRESCRIPTIONS_FILE, 'w') as f:
            json.dump(prescriptions, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving prescriptions: {e}")

class PrescriptionAnalysisRequest(BaseModel):
    medication: str
    api_response: Dict[str, Any]

class AlternativeMedication(BaseModel):
    name: str
    description: str
    benefits: List[str]
    considerations: List[str]

class PrescriptionRecommendation(BaseModel):
    medication: str
    risk_level: str  # "low", "moderate", "high"
    recommendation: str
    can_prescribe: bool
    evidence: Optional[str] = None
    alternatives: Optional[List[AlternativeMedication]] = None

@router.post("/analyze-prescription", response_model=PrescriptionRecommendation)
async def analyze_prescription(request: PrescriptionAnalysisRequest):
    """
    Analyze genetic scoring results and provide doctor-friendly recommendations
    """
    try:
        # Initialize Groq client
        client = Groq(api_key=settings.GROQ_API_KEY)

        # Create prompt for AI analysis
        prompt = f"""You are a clinical pharmacogenomics expert helping doctors make informed prescription decisions.

Analyze the following genetic scoring results for medication: {request.medication}

API Response Data:
{json.dumps(request.api_response, indent=2)}

Provide a structured analysis in the following JSON format:
{{
    "medication": "{request.medication}",
    "risk_level": "low|moderate|high",
    "recommendation": "Brief summary for doctor",
    "can_prescribe": true|false,
    "evidence": "Evidence and reasoning (only if risk is moderate/high, otherwise null)",
    "alternatives": [
        {{
            "name": "Alternative medication name",
            "description": "Brief description",
            "benefits": ["benefit 1", "benefit 2"],
            "considerations": ["consideration 1", "consideration 2"]
        }}
    ]
}}

Guidelines:
1. If risk_level is "low" (good genetic compatibility):
   - Set can_prescribe to true
   - recommendation should be "This medication is safe to prescribe based on genetic profile"
   - evidence should be null
   - alternatives should be null or empty array

2. If risk_level is "moderate" or "high":
   - Set can_prescribe to false
   - Provide clear evidence explaining the genetic risk
   - Suggest 2-3 alternative medications with similar therapeutic effects
   - For each alternative, list specific benefits and considerations

3. Base risk_level on:
   - Score values (if present): >70 = low, 40-70 = moderate, <40 = high
   - Warnings and risk indicators in the response
   - Recommendation text from the API

Return ONLY valid JSON, no additional text."""

        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a clinical pharmacogenomics expert. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=settings.GROQ_MODEL,
            temperature=0.3,
            max_tokens=2000,
        )

        # Parse the response
        ai_response = chat_completion.choices[0].message.content

        # Clean up response (remove markdown code blocks if present)
        ai_response = ai_response.strip()
        if ai_response.startswith("```json"):
            ai_response = ai_response[7:]
        if ai_response.startswith("```"):
            ai_response = ai_response[3:]
        if ai_response.endswith("```"):
            ai_response = ai_response[:-3]
        ai_response = ai_response.strip()

        # Parse JSON
        result = json.loads(ai_response)

        return PrescriptionRecommendation(**result)

    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"AI Response: {ai_response}")
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        print(f"Error analyzing prescription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class FinalizePrescriptionRequest(BaseModel):
    patient_id: Optional[int] = None
    patient_name: str
    medications: List[str]
    doctor_name: Optional[str] = "Dr. Smith"

@router.post("/finalize")
async def finalize_prescription(request: FinalizePrescriptionRequest):
    """
    Save finalized prescription and make it available to patient
    """
    try:
        # Load existing prescriptions
        prescriptions = load_prescriptions()

        # Create prescription record
        prescription_id = str(uuid.uuid4())
        prescription_data = {
            "id": prescription_id,
            "patient_id": request.patient_id,
            "patient_name": request.patient_name,
            "doctor_name": request.doctor_name,
            "medications": request.medications,
            "created_at": datetime.now().isoformat(),
            "status": "active",
            "read": False
        }

        # Add to prescriptions list
        prescriptions.append(prescription_data)
        save_prescriptions(prescriptions)

        return JSONResponse(content={
            "success": True,
            "prescription_id": prescription_id,
            "message": f"Prescription sent to {request.patient_name}",
            "medications_count": len(request.medications)
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_prescriptions(patient_id: Optional[int] = None):
    """
    Get list of prescriptions for a patient
    """
    try:
        prescriptions = load_prescriptions()

        # Filter by patient if provided
        if patient_id is not None:
            prescriptions = [p for p in prescriptions if p.get("patient_id") == patient_id]

        # Sort by created_at descending (newest first)
        prescriptions.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        return JSONResponse(content={
            "prescriptions": prescriptions
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{prescription_id}/read")
async def mark_prescription_read(prescription_id: str):
    """
    Mark a prescription as read by patient
    """
    try:
        prescriptions = load_prescriptions()

        # Find prescription
        prescription = next((p for p in prescriptions if p["id"] == prescription_id), None)

        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")

        prescription["read"] = True
        prescription["read_at"] = datetime.now().isoformat()

        save_prescriptions(prescriptions)

        return JSONResponse(content={
            "success": True,
            "message": "Prescription marked as read"
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
