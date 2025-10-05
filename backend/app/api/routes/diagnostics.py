from fastapi import APIRouter, HTTPException
from typing import List
from app.models.diagnostic_models import Diagnostic, DiagnosticHistory
from app.services.diagnostic_service import DiagnosticService

router = APIRouter()
diagnostic_service = DiagnosticService()

@router.get("/history", response_model=DiagnosticHistory)
async def get_diagnostic_history():
    """
    Get all diagnostic history for a patient
    """
    try:
        history = await diagnostic_service.get_diagnostic_history()
        return DiagnosticHistory(diagnostics=history)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch diagnostic history: {str(e)}"
        )

@router.get("/{diagnostic_id}", response_model=Diagnostic)
async def get_diagnostic_by_id(diagnostic_id: int):
    """
    Get a specific diagnostic by ID
    """
    try:
        diagnostic = await diagnostic_service.get_diagnostic_by_id(diagnostic_id)
        if not diagnostic:
            raise HTTPException(
                status_code=404,
                detail=f"Diagnostic with ID {diagnostic_id} not found"
            )
        return diagnostic
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch diagnostic: {str(e)}"
        )