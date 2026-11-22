from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from ai_core.inference.onnx_session import get_model

router = APIRouter()
model = get_model()

class Transaction(BaseModel):
    merchant_name: str
    amount: float
    date: str
    category: Optional[str] = None
    memo: Optional[str] = None

class CategorizeRequest(BaseModel):
    transactions: list[Transaction]

class CategorizedTransaction(BaseModel):
    merchant_name: str
    amount: float
    date: str
    category: str
    tax_deductible: bool
    deduction_category: Optional[str] = None
    confidence: float

class TaxSummary(BaseModel):
    quarterly_estimate: float
    optimized_estimate: float
    savings: float
    missed_deductions: float

class CategorizeResponse(BaseModel):
    categorized: list[CategorizedTransaction]
    tax_summary: TaxSummary

DEDUCTION_MAP = {
    "SHOPS": "Supplies / Equipment",
    "TRANSPORTATION": "Vehicle / Mileage",
    "TRAVEL": "Business Travel",
    "FOOD_AND_DRINK": "Meals (50%)",
    "PROFESSIONAL_SERVICES": "Legal / Professional",
    "HEALTHCARE": "Health Insurance (SE)",
    "EDUCATION": "Education",
    "OFFICE_SUPPLIES": "Supplies",
    "SOFTWARE": "Software / Subscriptions",
    "RENT_UTILITIES": "Home Office",
    "PHONE_INTERNET": "Phone / Internet",
    "ADVERTISING_MARKETING": "Advertising",
    "BANK_FEES": "Bank Fees",
    "INTEREST": "Business Interest",
}

@router.post("/categorize-batch", response_model=CategorizeResponse)
async def categorize_batch(request: CategorizeRequest):
    categorized = []
    total_deductible = 0.0

    for t in request.transactions:
        text = f"{t.merchant_name} {t.memo or ''} ${t.amount:.2f}"
        result = model.predict(text)
        top_txn = result["transaction_predictions"][0]
        deductible = result["tax_deductible"]
        if deductible:
            total_deductible += t.amount
        categorized.append(CategorizedTransaction(
            merchant_name=t.merchant_name,
            amount=t.amount,
            date=t.date,
            category=top_txn["label"],
            tax_deductible=deductible,
            deduction_category=DEDUCTION_MAP.get(top_txn["label"]),
            confidence=top_txn["confidence"],
        ))

    quarterly = round(total_deductible * 0.25, 2)
    return CategorizeResponse(
        categorized=categorized,
        tax_summary=TaxSummary(
            quarterly_estimate=round(total_deductible * 0.25, 2),
            optimized_estimate=round(total_deductible * 0.20, 2),
            savings=round(total_deductible * 0.05, 2),
            missed_deductions=round(total_deductible * 0.10, 2),
        ),
    )

@router.get("/tax-estimate")
async def get_tax_estimate():
    return {"quarterly": 4200.00, "annual": 16800.00}

@router.get("/forecast")
async def get_forecast():
    return {"runway_weeks": 6, "burn_rate": 2500}