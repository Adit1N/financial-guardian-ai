from fastapi import APIRouter
from pydantic import BaseModel
from api.core.model_loader import get_predictor

router = APIRouter()

class ScanRequest(BaseModel):
    text: str

@router.get("/status")
async def shield_status():
    return {"module": "shield", "status": "ready"}

@router.post("/scan")
async def scan_message(payload: ScanRequest):
    result = get_predictor().predict(payload.text)
    scam = result["scam"]
    is_scam = scam["label"] != "legitimate"
    return {
        "is_scam": is_scam,
        "threat_type": scam["label"],
        "confidence": scam["confidence"],
        "intent": result["intent"],
    }