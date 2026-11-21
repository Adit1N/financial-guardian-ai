from fastapi import APIRouter
from pydantic import BaseModel
from typing import List


router = APIRouter()


class Transaction(BaseModel):
    merchant: str
    amount: float
    category: str = "Uncategorized"


class TaxRequest(BaseModel):
    income: float
    deductible_expenses: float


@router.get("/summary")
def get_summary():
    return {
        "monthly_income": 12450,
        "monthly_expenses": 5680,
        "estimated_quarterly_tax": 4200,
        "deductions_found": 1840,
        "potential_tax_savings": 600
    }


@router.get("/transactions")
def get_transactions():
    return [
        {
            "id": 1,
            "merchant": "Adobe",
            "amount": 54.99,
            "category": "Software",
            "deductible": True
        },
        {
            "id": 2,
            "merchant": "Uber",
            "amount": 32.50,
            "category": "Business Travel",
            "deductible": True
        },
        {
            "id": 3,
            "merchant": "Starbucks",
            "amount": 12.40,
            "category": "Food",
            "deductible": False
        },
        {
            "id": 4,
            "merchant": "AWS",
            "amount": 84.20,
            "category": "Cloud Services",
            "deductible": True
        },
        {
            "id": 5,
            "merchant": "Canva",
            "amount": 14.99,
            "category": "Software",
            "deductible": True
        }
    ]


@router.post("/categorize")
def categorize_transaction(transaction: Transaction):

    merchant = transaction.merchant.lower()

    category = "Other"
    deductible = False

    if any(
        name in merchant
        for name in ["adobe", "canva", "microsoft"]
    ):
        category = "Software"
        deductible = True

    elif any(
        name in merchant
        for name in ["uber", "ola", "lyft"]
    ):
        category = "Business Travel"
        deductible = True

    elif any(
        name in merchant
        for name in ["aws", "azure", "digitalocean"]
    ):
        category = "Cloud Services"
        deductible = True

    elif any(
        name in merchant
        for name in ["starbucks", "restaurant", "cafe"]
    ):
        category = "Food"
        deductible = False

    return {
        "merchant": transaction.merchant,
        "amount": transaction.amount,
        "category": category,
        "deductible": deductible
    }


@router.post("/categorize-batch")
def categorize_batch(transactions: List[Transaction]):

    results = []

    for transaction in transactions:
        result = categorize_transaction(transaction)
        results.append(result)

    return {
        "transactions": results
    }


@router.post("/tax-estimate")
def calculate_tax(request: TaxRequest):

    taxable_income = max(
        request.income - request.deductible_expenses,
        0
    )

    # Temporary simplified estimate for frontend development.
    estimated_tax = taxable_income * 0.20

    savings = request.deductible_expenses * 0.20

    return {
        "income": request.income,
        "deductible_expenses": request.deductible_expenses,
        "taxable_income": round(taxable_income, 2),
        "estimated_tax": round(estimated_tax, 2),
        "estimated_savings": round(savings, 2),
        "disclaimer": (
            "Demo estimate only. This is not professional tax advice."
        )
    }


@router.get("/forecast")
def get_forecast():
    return {
        "current_balance": 12450,
        "projected_30_day_balance": 13780,
        "projected_income": 6200,
        "projected_expenses": 4870,
        "cash_flow_status": "POSITIVE"
    }