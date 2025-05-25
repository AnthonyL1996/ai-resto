import time
import logging
from database import redis_client
from models.order import Order
from sqlalchemy.orm import Session
from utils.logger import setup_logger

logger = setup_logger(__name__)

PRINT_QUEUE = "print_queue"
MAX_RETRIES = 3
RETRY_DELAY = 30  # seconds

class PrinterService:
    def __init__(self, db: Session):
        self.db = db
        
    def queue_print_job(self, order_id: str):
        """Add order to print queue"""
        redis_client.lpush(PRINT_QUEUE, order_id)
        
    def process_queue(self):
        """Process print jobs from queue"""
        while True:
            order_id = redis_client.rpop(PRINT_QUEUE)
            if not order_id:
                time.sleep(1)
                continue
                
            order = self.db.query(Order).get(order_id)
            if not order:
                continue
                
            try:
                logger.debug(f"Processing print job for order {order_id}")
                self._print_order(order)
                order.print_status = "completed"
                logger.info(f"Successfully printed order {order_id}")
            except Exception as e:
                logger.error(f"Print failed for order {order_id}: {str(e)}")
                order.print_attempts += 1
                if order.print_attempts >= MAX_RETRIES:
                    order.print_status = "failed"
                    logger.error(f"Max retries reached for order {order_id}")
                else:
                    logger.warning(f"Requeuing order {order_id}, attempt {order.print_attempts}")
                    redis_client.lpush(PRINT_QUEUE, order_id)
                    time.sleep(RETRY_DELAY)
                    
            order.last_print_attempt = time.time()
            self.db.commit()
            
    def _print_order(self, order):
        """Actual printing logic"""
        # TODO: Implement printer-specific logic
        print(f"Printing order {order.id}")
        # Simulate print delay
        time.sleep(1)