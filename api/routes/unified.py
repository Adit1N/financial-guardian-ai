from fastapi import APIRouter 
router = APIRouter()

@router.get("/status")
async def unified_status():
    return {"module": "unified", "status": "ready"}