from fastapi import APIRouter
from pydantic import BaseModel
from api.core.model_loader import get_predictor

router = APIRouter()

class UnifiedRequest(BaseModel):
    text: str

@router.get("/status")
async def unified_status():
    return {"module": "unified", "status": "ready"}

@router.post("/analyze")
async def analyze_text(payload: UnifiedRequest):
    return {
        "input": payload.text,
        "predictions": get_predictor().predict(payload.text),
    }
