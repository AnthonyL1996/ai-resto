import asyncio
import json
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, asdict
from threading import Lock
import logging

logger = logging.getLogger(__name__)

@dataclass
class Event:
    """Represents an event in the queue"""
    id: str
    type: str
    data: Dict[str, Any]
    timestamp: str
    consumed: bool = False
    consumer_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Event':
        return cls(**data)

class EventQueue:
    """High-precision in-memory event queue with consumer tracking"""
    
    def __init__(self, max_events: int = 200, event_ttl_seconds: int = 3600):
        self.events: deque[Event] = deque(maxlen=max_events)
        self.max_events = max_events
        self.event_ttl_seconds = event_ttl_seconds
        self._lock = Lock()
        self._consumers: Dict[str, datetime] = {}
        self._subscribers: List[Callable[[Event], None]] = []
        
        # Start cleanup task
        asyncio.create_task(self._cleanup_expired_events())
    
    def _get_current_timestamp(self) -> str:
        """Get current UTC timestamp with microsecond precision"""
        return datetime.now(timezone.utc).isoformat()
    
    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """Parse ISO timestamp string to datetime object"""
        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    
    def publish(self, event_type: str, data: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Publish an event to the queue
        
        Args:
            event_type: Type of event (e.g., 'new_order', 'order_update')
            data: Event payload data
            metadata: Optional metadata to include with event
            
        Returns:
            Event ID
        """
        event_id = str(uuid.uuid4())
        
        # Merge metadata into data if provided
        event_data = {**data}
        if metadata:
            event_data['_metadata'] = metadata
        
        event = Event(
            id=event_id,
            type=event_type,
            data=event_data,
            timestamp=self._get_current_timestamp()
        )
        
        with self._lock:
            self.events.append(event)
        
        # Notify subscribers asynchronously
        asyncio.create_task(self._notify_subscribers(event))
        
        logger.info(f"Published event {event_type} with ID {event_id}")
        return event_id
    
    def get_events_since(self, 
                        timestamp: Optional[str] = None, 
                        consumer_id: Optional[str] = None,
                        event_types: Optional[List[str]] = None,
                        limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get events since a given timestamp
        
        Args:
            timestamp: ISO timestamp string, if None returns all events
            consumer_id: Optional consumer ID for tracking
            event_types: Optional list of event types to filter
            limit: Optional limit on number of events returned
            
        Returns:
            List of event dictionaries
        """
        with self._lock:
            events = list(self.events)
        
        # Filter by timestamp
        if timestamp:
            cutoff_time = self._parse_timestamp(timestamp)
            events = [e for e in events if self._parse_timestamp(e.timestamp) > cutoff_time]
        
        # Filter by event types
        if event_types:
            events = [e for e in events if e.type in event_types]
        
        # Apply limit
        if limit:
            events = events[-limit:]
        
        # Update consumer tracking
        if consumer_id:
            self._consumers[consumer_id] = datetime.now(timezone.utc)
        
        # Convert to dictionaries
        result = [event.to_dict() for event in events]
        
        logger.debug(f"Retrieved {len(result)} events for consumer {consumer_id}")
        return result
    
    def get_unconsumed_events(self, 
                             consumer_id: str,
                             event_types: Optional[List[str]] = None,
                             limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get events that haven't been consumed by a specific consumer
        
        Args:
            consumer_id: Consumer identifier
            event_types: Optional list of event types to filter
            limit: Optional limit on number of events
            
        Returns:
            List of unconsumed event dictionaries
        """
        last_poll = self._consumers.get(consumer_id)
        timestamp = last_poll.isoformat() if last_poll else None
        
        return self.get_events_since(
            timestamp=timestamp,
            consumer_id=consumer_id,
            event_types=event_types,
            limit=limit
        )
    
    def mark_events_consumed(self, event_ids: List[str], consumer_id: str) -> int:
        """
        Mark specific events as consumed by a consumer
        
        Args:
            event_ids: List of event IDs to mark as consumed
            consumer_id: Consumer identifier
            
        Returns:
            Number of events marked as consumed
        """
        marked_count = 0
        
        with self._lock:
            for event in self.events:
                if event.id in event_ids and not event.consumed:
                    event.consumed = True
                    event.consumer_id = consumer_id
                    marked_count += 1
        
        logger.debug(f"Marked {marked_count} events as consumed by {consumer_id}")
        return marked_count
    
    def subscribe(self, callback: Callable[[Event], None]) -> str:
        """
        Subscribe to all events with a callback function
        
        Args:
            callback: Function to call when events are published
            
        Returns:
            Subscription ID
        """
        subscription_id = str(uuid.uuid4())
        self._subscribers.append(callback)
        logger.info(f"Added subscriber {subscription_id}")
        return subscription_id
    
    async def _notify_subscribers(self, event: Event):
        """Notify all subscribers of a new event"""
        for callback in self._subscribers:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(event)
                else:
                    callback(event)
            except Exception as e:
                logger.error(f"Error notifying subscriber: {e}")
    
    async def _cleanup_expired_events(self):
        """Background task to clean up expired events"""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                
                cutoff_time = datetime.now(timezone.utc)
                cutoff_time = cutoff_time.replace(second=cutoff_time.second - self.event_ttl_seconds)
                
                with self._lock:
                    # Remove expired events
                    initial_count = len(self.events)
                    self.events = deque(
                        (e for e in self.events 
                         if self._parse_timestamp(e.timestamp) > cutoff_time),
                        maxlen=self.max_events
                    )
                    removed_count = initial_count - len(self.events)
                
                if removed_count > 0:
                    logger.info(f"Cleaned up {removed_count} expired events")
                
                # Clean up inactive consumers
                active_cutoff = datetime.now(timezone.utc)
                active_cutoff = active_cutoff.replace(second=active_cutoff.second - 1800)  # 30 minutes
                
                inactive_consumers = [
                    consumer_id for consumer_id, last_seen in self._consumers.items()
                    if last_seen < active_cutoff
                ]
                
                for consumer_id in inactive_consumers:
                    del self._consumers[consumer_id]
                
                if inactive_consumers:
                    logger.info(f"Cleaned up {len(inactive_consumers)} inactive consumers")
                    
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        with self._lock:
            total_events = len(self.events)
            consumed_events = sum(1 for e in self.events if e.consumed)
            event_types = {}
            
            for event in self.events:
                event_types[event.type] = event_types.get(event.type, 0) + 1
        
        return {
            "total_events": total_events,
            "consumed_events": consumed_events,
            "unconsumed_events": total_events - consumed_events,
            "active_consumers": len(self._consumers),
            "event_types": event_types,
            "max_events": self.max_events,
            "event_ttl_seconds": self.event_ttl_seconds
        }
    
    def clear(self):
        """Clear all events and consumers"""
        with self._lock:
            self.events.clear()
            self._consumers.clear()
        logger.info("Event queue cleared")

# Global event queue instance
kds_event_queue = EventQueue(max_events=200, event_ttl_seconds=3600)

# Convenience functions
def publish_order_event(event_type: str, order_data: Dict[str, Any], play_sound: bool = False):
    """Publish an order-related event"""
    metadata = {
        "play_sound": play_sound,
        "source": "kds"
    }
    return kds_event_queue.publish(event_type, order_data, metadata)

def publish_new_order(order_data: Dict[str, Any]):
    """Publish a new order event with sound"""
    return publish_order_event("new_order", order_data, play_sound=True)

def publish_order_update(order_id: str, status: str, order_data: Optional[Dict[str, Any]] = None):
    """Publish an order status update event"""
    data = {"order_id": order_id, "status": status}
    if order_data:
        data.update(order_data)
    return publish_order_event("order_update", data)

def get_kds_events(consumer_id: str, since: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get KDS events for a consumer"""
    return kds_event_queue.get_unconsumed_events(
        consumer_id=consumer_id,
        event_types=["new_order", "order_update", "order_delete"],
        limit=50
    )