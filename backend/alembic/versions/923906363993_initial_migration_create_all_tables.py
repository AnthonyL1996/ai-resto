"""Initial migration - create all tables

Revision ID: 923906363993
Revises: 
Create Date: 2025-11-18 09:14:15.272219

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '923906363993'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create customers table
    op.create_table(
        'customers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('password_hash', sa.LargeBinary(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Create menu_items table
    op.create_table(
        'menu_items',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('is_available', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('prep_time', sa.Integer(), nullable=False, server_default='15'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('customer_id', sa.String(), nullable=True),
        sa.Column('reservation_id', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True, server_default='received'),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')),
        sa.Column('items', sa.JSON(), nullable=True),
        sa.Column('payment_method', sa.String(), nullable=False),
        sa.Column('payment_status', sa.String(), nullable=True, server_default='pending'),
        sa.Column('payment_provider', sa.String(), nullable=True, server_default='payconiq'),
        sa.Column('payment_reference', sa.String(), nullable=True),
        sa.Column('time_slot', sa.DateTime(), nullable=True),
        sa.Column('print_status', sa.String(), nullable=True, server_default='pending'),
        sa.Column('print_attempts', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('last_print_attempt', sa.DateTime(), nullable=True),
        sa.Column('email_sent', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('customer_email', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create reservations table
    op.create_table(
        'reservations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('customer_id', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('pickup_time', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'CONFIRMED', 'CANCELLED', 'READY', 'PICKED_UP', name='reservationstatus'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')),
        sa.Column('order_id', sa.String(), nullable=False),
        sa.Column('source', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Update orders table to add FK for reservation_id (circular dependency handled)
    op.create_foreign_key(
        'fk_orders_reservation_id',
        'orders',
        'reservations',
        ['reservation_id'],
        ['id']
    )


def downgrade() -> None:
    # Drop tables in reverse order to handle foreign keys
    op.drop_constraint('fk_orders_reservation_id', 'orders', type_='foreignkey')
    op.drop_table('reservations')
    op.drop_table('orders')
    op.drop_table('menu_items')
    op.drop_table('customers')
