from escpos.printer import Usb, Network, Serial
from typing import Optional, Union
import logging

class PrinterService:
    def __init__(self, connection_type: str = 'usb', **connection_params):
        """Initialize printer connection
        
        Args:
            connection_type: 'usb', 'network', or 'bluetooth'
            connection_params: Parameters specific to connection type
                USB: vendor_id, product_id, in_ep, out_ep
                Network: host, port
                Bluetooth: device_address
        """
        self.printer = None
        self.connection_type = connection_type
        self.connection_params = connection_params
        self.logger = logging.getLogger(__name__)
        
        try:
            if connection_type == 'usb':
                self.printer = Usb(
                    idVendor=connection_params.get('vendor_id'),
                    idProduct=connection_params.get('product_id'),
                    in_ep=connection_params.get('in_ep', 0x81),
                    out_ep=connection_params.get('out_ep', 0x03)
                )
            elif connection_type == 'network':
                self.printer = Network(
                    host=connection_params.get('host'),
                    port=connection_params.get('port', 9100)
                )
            elif connection_type == 'bluetooth':
                self.printer = Serial(
                    dev=connection_params.get('device_address')
                )
            else:
                raise ValueError(f"Unsupported connection type: {connection_type}")
                
            self.logger.info(f"Printer connected via {connection_type}")
        except Exception as e:
            self.logger.error(f"Failed to initialize printer: {str(e)}")
            raise

    def print_text(self, text: str, align: str = 'left'):
        """Print text with optional alignment
        
        Args:
            text: Text to print
            align: 'left', 'center', or 'right'
        """
        if not self.printer:
            raise RuntimeError("Printer not initialized")
            
        try:
            if align == 'center':
                self.printer.set(align='center')
            elif align == 'right':
                self.printer.set(align='right')
            else:
                self.printer.set(align='left')
                
            self.printer.text(text + "\n")
            self.printer.set(align='left')  # Reset alignment
        except Exception as e:
            self.logger.error(f"Print text failed: {str(e)}")
            raise

    def print_image(self, image_path: str):
        """Print an image from file path"""
        if not self.printer:
            raise RuntimeError("Printer not initialized")
            
        try:
            self.printer.image(image_path)
        except Exception as e:
            self.logger.error(f"Print image failed: {str(e)}")
            raise

    def cut(self):
        """Perform a full paper cut"""
        if not self.printer:
            raise RuntimeError("Printer not initialized")
            
        try:
            self.printer.cut()
        except Exception as e:
            self.logger.error(f"Cut failed: {str(e)}")
            raise

    def close(self):
        """Close printer connection"""
        if self.printer:
            try:
                self.printer.close()
                self.printer = None
            except Exception as e:
                self.logger.error(f"Failed to close printer: {str(e)}")

    def print_kitchen_order(self, order_details: dict):
        """Print a kitchen order ticket with formatted layout
        
        Args:
            order_details: Dictionary containing:
                - order_time: When order was placed
                - ready_time: Expected ready time
                - customer_name: Customer name
                - customer_contact: Phone/contact info
                - items: List of order items
        """
        if not self.printer:
            raise RuntimeError("Printer not initialized")
            
        try:
            # Header with order info
            self.printer.set(align='center', text_type='B', width=2, height=2)
            self.printer.text("KITCHEN ORDER\n")
            self.printer.set(align='left', text_type='B', width=1, height=1)
            
            # Order details
            self.printer.text(f"Order Time: {order_details['order_time']}\n")
            self.printer.text(f"Ready By: {order_details['ready_time']}\n\n")
            
            # Customer info
            self.printer.text(f"Customer: {order_details['customer_name']}\n")
            self.printer.text(f"Contact: {order_details['customer_contact']}\n\n")
            
            # Order items in large font
            self.printer.set(text_type='B', width=2, height=2)
            self.printer.text("ORDER ITEMS:\n")
            for item in order_details['items']:
                self.printer.text(f"- {item}\n")
            
            # Reset formatting and add cut line
            self.printer.set(text_type='normal', width=1, height=1)
            self.printer.text("\n")
            self.printer.cut()
            
        except Exception as e:
            self.logger.error(f"Print kitchen order failed: {str(e)}")
            raise