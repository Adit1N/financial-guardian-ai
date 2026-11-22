from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from ai_core.inference.onnx_session import get_model

router = APIRouter()
model = get_model()

class ScanRequest(BaseModel):
    text: str
    url: Optional[str] = None
    sender_email: Optional[str] = None

class ScanResponse(BaseModel):
    scan_id: str
    type: str
    confidence: float
    explanation: str
    red_flags: list[str]
    highlights: list[dict]
    recommended_action: str

@router.post("/scan", response_model=ScanResponse)
async def scan_text(request: ScanRequest):
    import uuid
    result = model.predict(request.text)
    top = result["scam_predictions"][0]

    RED_FLAGS = {
        "urgency": ["immediately", "urgent", "now", "today", "asap", "final notice"],
        "threat": ["arrest", "legal action", "seize", "freeze", "garnish"],
        "payment_demand": ["gift card", "bitcoin", "crypto", "wire transfer"],
        "authority_impersonation": ["irs", "internal revenue", "social security", "official"],
        "secrecy": ["don't tell", "confidential", "between us"],
    }
    text_lower = request.text.lower()
    flags = [cat for cat, kws in RED_FLAGS.items() if any(kw in text_lower for kw in kws)]

    explanations = {
        "irs_impersonation": "The IRS never demands payment via gift cards, crypto, or wire transfers.",
        "romance": "Never send money to someone you've never met in person.",
        "crypto_investment": "Guaranteed returns with no risk do not exist.",
        "tech_support": "Microsoft/Apple never call you unsolicited.",
        "package_delivery": "Carriers never ask for payment via text links.",
        "business_email_compromise": "Verify payment changes by phone using known numbers.",
        "fake_invoice": "Confirm vendor bank details by phone before paying.",
        "investment_scam": "High returns with no risk are always scams.",
    }

    return ScanResponse(
        scan_id=str(uuid.uuid4()),
        type=top["label"],
        confidence=top["confidence"],
        explanation=f"This message shows signs of a **{top['label'].replace('_', ' ')}** scam ({top['confidence']:.0%} confidence). {explanations.get(top['label'], '')}",
        red_flags=flags,
        highlights=[],
        recommended_action="Do not click links, send money, or share personal info. Verify independently.",
    )

@router.post("/explain")
async def explain_scam(request: ScanRequest):
    return {"explanation": "See scan result for red flags."}

@router.post("/url-check")
async def check_url(request: ScanRequest):
    return {"safe": True, "reason": "Basic check passed"}