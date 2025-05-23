import logging
from services.printer_service import PrinterService
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_printer(connection_type='usb', **kwargs):
    """Test printer functionality"""
    try:
        logger.info(f"Testing {connection_type} printer connection")
        
        # Initialize printer
        printer = PrinterService(connection_type, **kwargs)
        
        # Test kitchen order printing
        logger.info("Testing kitchen order printing")
        printer.print_kitchen_order({
            "order_time": "2025-05-23 22:15:00",
            "ready_time": "2025-05-23 22:30:00",
            "customer_name": "John Doe",
            "customer_contact": "+32 123 456 789",
            "items": [
                "Burger with fries",
                "Coca-Cola",
                "Chocolate cake"
            ]
        })
        

        
        logger.info("All tests completed successfully")
        
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
    finally:
        if 'printer' in locals():
            printer.close()

if __name__ == "__main__":
    # Example configurations - modify these for your printer
    # Try all possible endpoint combinations
    endpoint_combinations = []
    for in_ep in range(0x81, 0x8F):
        print(in_ep)
        for out_ep in range(0x01, 0x0F):
            print('in_ep' + in_ep + ' | out_ep' + out_ep)
            endpoint_combinations.append({'in_ep': in_ep, 'out_ep': out_ep})
    
    for endpoints in endpoint_combinations:
        try:
            print(f"\nTrying endpoints: in={hex(endpoints['in_ep'])}, out={hex(endpoints['out_ep'])}")
            usb_config = {
                'vendor_id': 0x0416,
                'product_id': 0x5011,
                **endpoints
            }
            test_printer('usb', **usb_config)
            break  # Stop if successful
        except Exception as e:
            print(f"Failed with these endpoints: {e}")
    
    network_config = {
        'host': '192.168.1.100',
        'port': 9100
    }
    
    bluetooth_config = {
        'device_address': '/dev/rfcomm0'  # Modify for your BT device
    }
    
    try:
        # First try USB
        test_printer('usb', **usb_config)
    except Exception as e:
        print(f"USB connection failed: {e}")
        print("Trying network connection...")
        try:
            test_printer('network', **network_config)
        except Exception as e:
            print(f"Network connection failed: {e}")
            print("Trying Bluetooth connection...")
            test_printer('bluetooth', **bluetooth_config)