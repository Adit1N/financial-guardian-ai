from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.shield import router as shield_router
from routes.optimize import router as optimize_router


app = FastAPI(
    title="Financial Guardian AI",
    description=(
        "AI-powered financial scam protection "
        "and financial optimization API"
    ),
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    shield_router,
    prefix="/shield",
    tags=["Shield"]
)


app.include_router(
    optimize_router,
    prefix="/optimize",
    tags=["Optimize"]
)


@app.get("/")
def home():
    return {
        "app": "Financial Guardian AI",
        "status": "running",
        "modules": [
            "Shield",
            "Optimize"
        ]
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "shield": "available",
        "optimize": "available"
    }