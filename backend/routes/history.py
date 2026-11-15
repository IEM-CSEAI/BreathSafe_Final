from fastapi import APIRouter, Query
from schemas import HistoryResponse
from services import history as history_service

router = APIRouter()


@router.get("/history", response_model=HistoryResponse)
def get_history(minutes: int = Query(30, ge=1, le=60)):
    points = history_service.get(minutes)
    return HistoryResponse(count=len(points), points=points)