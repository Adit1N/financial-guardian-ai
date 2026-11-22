from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.core.config import settings
from api.core.cache import get_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    r = await get_redis()
    if r:
        print("✅ Redis connected")
    else:
        print("⚠️ Redis not available - caching disabled")
    yield
    if r:
        await r.close()
        print("🔌 Redis disconnected")


app = FastAPI(
    title="Financial Guardian API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc) if settings.DEBUG else "Hidden"},
    )

@app.get("/health")
async def health():
    redis_status = "connected" if await get_redis() else "disconnected"
    return {
        "status": "ok",
        "service": "financial-guardian-api",
        "version": "1.0.0",
        "redis": redis_status,
    }

from api.routes import shield, optimize, unified
app.include_router(shield.router, prefix="/api/v1/shield", tags=["shield"])
app.include_router(optimize.router, prefix="/api/v1/optimize", tags=["optimize"])
app.include_router(unified.router, prefix="/api/v1", tags=["unified"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.DEBUG)