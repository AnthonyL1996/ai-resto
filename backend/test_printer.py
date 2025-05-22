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
        
        # Test text printing
        logger.info("Testing text printing")
        printer.print_text("MY WIFE ONLY GIVES A 7/10 FOR TITANT", align="center")
        printer.print_text("SOME TIMES SHE IS NICE, OTHER TIMES SHE FARTS TOO MUCH")
        printer.print_text("SHE ALSO FARTS IN THE EARLY MORNING, WHEN WAKING UP, BUT ALSO IN HER SLEEP")
        printer.print_text("Center aligned text", align="center")
        printer.print_text("Right aligned text", align="right")
        
        # Test cutting
        logger.info("Testing paper cut")
        printer.cut()
        
        # Wait a moment between tests
        time.sleep(2)
        
        # Test full cut again
        printer.print_text("Testing full cut")
        printer.cut()
        
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
        for out_ep in range(0x01, 0x0F):
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