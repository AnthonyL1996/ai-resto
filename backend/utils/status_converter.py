"""Status conversion utilities for handling English/Dutch status mappings"""

# Map English status values (database) to Dutch status values (frontend)
ENGLISH_TO_DUTCH_STATUS = {
    "new": "Nieuw",
    "preparing": "In bereiding", 
    "ready": "Klaar",
    "completed": "Voltooid",
    "cancelled": "Geannuleerd"
}

# Map Dutch status values (frontend) to English status values (database)
DUTCH_TO_ENGLISH_STATUS = {
    "Nieuw": "new",
    "In bereiding": "preparing",
    "Klaar": "ready", 
    "Voltooid": "completed",
    "Geannuleerd": "cancelled"
}

def convert_status_to_dutch(english_status: str) -> str:
    """Convert English status to Dutch status for frontend"""
    return ENGLISH_TO_DUTCH_STATUS.get(english_status, english_status)

def convert_status_to_english(dutch_status: str) -> str:
    """Convert Dutch status to English status for database"""
    return DUTCH_TO_ENGLISH_STATUS.get(dutch_status, dutch_status)

def normalize_order_data_for_frontend(order_data: dict) -> dict:
    """Convert order data to use Dutch status values for frontend compatibility"""
    if "status" in order_data:
        order_data["status"] = convert_status_to_dutch(order_data["status"])
    return order_data