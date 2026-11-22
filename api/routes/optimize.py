from fastapi import APIRouter
from pydantic import BaseModel
from api.core.model_loader import get_predictor

router = APIRouter()

class TransactionRequest(BaseModel):
    description: str
    amount: float | None = None

@router.get("/status")
async def optimize_status():
    return {"module": "optimize", "status": "ready"}

@router.post("/categorize")
async def categorize_transaction(payload: TransactionRequest):
    result = get_predictor().predict(payload.description)
    return {
        "description": payload.description,
        "amount": payload.amount,
        "category": result["transaction_category"],
        "tax_deductible": result["tax_deductible"],
        "intent": result["intent"],
    }