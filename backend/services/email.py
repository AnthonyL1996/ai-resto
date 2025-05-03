import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from jinja2 import Template
from database import SessionLocal
from models.order import Order

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "orders@restaurant.com")

class EmailService:
    def __init__(self):
        self.templates = {
            "order_confirmation": """
            <html>
            <body>
                <h1>Order Confirmation #{{ order.id }}</h1>
                <p>Thank you for your order!</p>
                <h2>Order Details:</h2>
                <ul>
                {% for item in order.items %}
                    <li>{{ item.quantity }}x {{ item.name }}</li>
                {% endfor %}
                </ul>
                <p>Status: {{ order.status }}</p>
            </body>
            </html>
            """
        }

    def send_order_confirmation(self, order_id: str):
        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.id == order_id).first()
            if not order or not order.customer_email:
                return False

            msg = MIMEMultipart()
            msg['From'] = SENDER_EMAIL
            msg['To'] = order.customer_email
            msg['Subject'] = f"Order Confirmation #{order.id}"

            template = Template(self.templates["order_confirmation"])
            html = template.render(order=order)
            msg.attach(MIMEText(html, 'html'))

            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)

            order.email_sent = True
            db.commit()
            return True
        except Exception as e:
            return False
        finally:
            db.close()