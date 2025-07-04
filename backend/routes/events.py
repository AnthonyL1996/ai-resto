from fastapi import APIRouter, Query, HTTPException, Response
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from services.event_queue import kds_event_queue, get_kds_events

router = APIRouter(prefix="/events", tags=["events"])

class EventResponse(BaseModel):
    id: str
    type: str
    data: dict
    timestamp: str
    consumed: bool
    consumer_id: Optional[str] = None

class EventStatsResponse(BaseModel):
    total_events: int
    consumed_events: int
    unconsumed_events: int
    active_consumers: int
    event_types: dict
    max_events: int
    event_ttl_seconds: int

class MarkConsumedRequest(BaseModel):
    event_ids: List[str]
    consumer_id: str

@router.get("/", response_model=List[EventResponse])
async def get_events(
    response: Response,
    consumer_id: str = Query(..., description="Unique consumer identifier"),
    since: Optional[str] = Query(None, description="ISO timestamp to get events since"),
    event_types: Optional[List[str]] = Query(None, description="Filter by event types"),
    limit: Optional[int] = Query(50, description="Maximum number of events to return", le=100),
    _t: Optional[str] = Query(None, description="Cache busting parameter")
):
    """
    Get events for a specific consumer
    
    This endpoint supports two modes:
    1. Get unconsumed events (when since is not provided)
    2. Get events since a specific timestamp (when since is provided)
    """
    try:
        if since:
            # Validate timestamp format
            try:
                datetime.fromisoformat(since.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid timestamp format. Use ISO format like '2023-12-01T10:30:00Z'"
                )
            
            events = kds_event_queue.get_events_since(
                timestamp=since,
                consumer_id=consumer_id,
                event_types=event_types,
                limit=limit
            )
        else:
            # Get unconsumed events
            events = kds_event_queue.get_unconsumed_events(
                consumer_id=consumer_id,
                event_types=event_types,
                limit=limit
            )
        
        return [EventResponse(**event) for event in events]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving events: {str(e)}")

@router.get("/kds", response_model=List[EventResponse])
async def get_kds_events_endpoint(
    response: Response,
    consumer_id: str = Query(..., description="Unique KDS consumer identifier"),
    since: Optional[str] = Query(None, description="ISO timestamp to get events since"),
    _t: Optional[str] = Query(None, description="Cache busting parameter")
):
    """
    Get KDS-specific events (new_order, order_update, order_delete)
    
    This is a convenience endpoint specifically for KDS consumers
    """
    try:
        events = get_kds_events(consumer_id, since)
        return [EventResponse(**event) for event in events]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving KDS events: {str(e)}")

@router.post("/consume")
async def mark_events_consumed(request: MarkConsumedRequest):
    """
    Mark specific events as consumed by a consumer
    """
    try:
        marked_count = kds_event_queue.mark_events_consumed(
            event_ids=request.event_ids,
            consumer_id=request.consumer_id
        )
        
        return {
            "message": f"Marked {marked_count} events as consumed",
            "marked_count": marked_count,
            "consumer_id": request.consumer_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking events as consumed: {str(e)}")

@router.get("/stats", response_model=EventStatsResponse)
async def get_event_stats():
    """
    Get event queue statistics
    """
    try:
        stats = kds_event_queue.get_stats()
        return EventStatsResponse(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}")

@router.delete("/clear")
async def clear_events():
    """
    Clear all events from the queue (admin endpoint)
    """
    try:
        kds_event_queue.clear()
        return {"message": "Event queue cleared successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing events: {str(e)}")

@router.get("/health")
async def event_system_health():
    """
    Health check for the event system
    """
    try:
        stats = kds_event_queue.get_stats()
        
        # Basic health checks
        health_status = "healthy"
        issues = []
        
        if stats["total_events"] >= stats["max_events"] * 0.9:
            issues.append("Event queue nearly full")
            health_status = "warning"
        
        if stats["active_consumers"] == 0:
            issues.append("No active consumers")
            health_status = "warning"
        
        return {
            "status": health_status,
            "timestamp": datetime.utcnow().isoformat(),
            "stats": stats,
            "issues": issues
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }