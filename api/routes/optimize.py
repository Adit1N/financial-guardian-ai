from fastapi import APIRouter 
router = APIRouter()

@router.get("/status")
async def optimize_status():
    return {"module": "optimize", "status": "ready"}