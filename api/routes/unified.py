import sys, time
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal, Optional

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from ai_core.inference.onnx_session import get_model

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str
    context: Optional[dict] = None

class AnalyzeResponse(BaseModel):
    intent: Literal["scam", "transaction", "tax_question", "other"]
    confidence: float
    result: Optional[dict] = None
    processing_ms: float

model = get_model()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    start = time.perf_counter()
    result = model.predict(request.text)
    return AnalyzeResponse(
        intent=result["intent"],
        confidence=result["intent_confidence"],
        result={k: v for k, v in result.items() if k not in ("intent", "intent_confidence")},
        processing_ms=(time.perf_counter() - start) * 1000,
    )