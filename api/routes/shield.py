from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter()

scan_history = []


class ScanRequest(BaseModel):
    text: str
    source: str = "manual"


@router.post("/scan")
def scan_message(request: ScanRequest):

    text = request.text.lower().strip()

    indicators = {
        "urgent": 2,
        "immediately": 2,
        "verify": 1,
        "account": 1,
        "bank details": 3,
        "bank account": 2,
        "wire transfer": 3,
        "gift card": 3,
        "password": 3,
        "otp": 3,
        "click here": 2,
        "payment": 1,
        "invoice": 1,
        "overdue": 1,
        "suspended": 2,
        "account suspended": 3,
        "send money": 3,
        "transfer money": 3,
        "confirm identity": 2,
        "login": 1,
        "limited time": 2
    }

    score = 0
    detected = []

    for phrase, weight in indicators.items():
        if phrase in text:
            score += weight
            detected.append(phrase)

    if "verify" in text and "account" in text:
        score += 2
        detected.append("request to verify account")

    if "invoice" in text and "overdue" in text:
        score += 2
        detected.append("overdue invoice")

    if "bank" in text and "otp" in text:
        score += 3
        detected.append("bank information with OTP request")

    if "urgent" in text and "payment" in text:
        score += 2
        detected.append("urgent payment request")

    detected = list(dict.fromkeys(detected))

    if score >= 8:
        label = "SCAM"
        risk_level = "HIGH"
        confidence = min(0.75 + score * 0.02, 0.99)

    elif score >= 4:
        label = "SUSPICIOUS"
        risk_level = "MEDIUM"
        confidence = min(0.55 + score * 0.03, 0.79)

    else:
        label = "SAFE"
        risk_level = "LOW"
        confidence = 0.90

    if detected:
        explanation = [
            f"Detected suspicious indicator: {item}"
            for item in detected
        ]
    else:
        explanation = [
            "No major scam indicators were detected."
        ]

    if label == "SCAM":
        recommendation = (
            "Do not send money, click suspicious links, or provide "
            "sensitive information. Verify the request using an "
            "official contact method."
        )

    elif label == "SUSPICIOUS":
        recommendation = (
            "Do not take immediate financial action. Verify the "
            "sender through an official channel first."
        )

    else:
        recommendation = (
            "No obvious threat was detected. Continue to remain "
            "cautious with financial requests."
        )

    result = {
        "label": label,
        "confidence": round(confidence, 2),
        "risk_level": risk_level,
        "category": "Financial Scam Detection",
        "explanation": explanation,
        "recommendation": recommendation
    }

    history_item = {
        "id": len(scan_history) + 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": request.source,
        "preview": request.text[:100],
        "label": label,
        "confidence": round(confidence, 2),
        "risk_level": risk_level
    }

    scan_history.insert(0, history_item)

    if len(scan_history) > 20:
        scan_history.pop()

    return result


@router.get("/history")
def get_scan_history():
    return {
        "total": len(scan_history),
        "scams": sum(
            1 for item in scan_history
            if item["label"] == "SCAM"
        ),
        "suspicious": sum(
            1 for item in scan_history
            if item["label"] == "SUSPICIOUS"
        ),
        "safe": sum(
            1 for item in scan_history
            if item["label"] == "SAFE"
        ),
        "scans": scan_history
    }