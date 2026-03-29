"""Add payments table for M-Pesa integration

Revision ID: add_payments_table
Revises: 
Create Date: 2026-03-28 19:16:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_payments_table'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contract_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contracts.id'), nullable=False),
        sa.Column('milestone_ids', sa.Text(), nullable=True),
        sa.Column('phone_number', sa.String(20), nullable=False),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('checkout_request_id', sa.String(255), nullable=True),
        sa.Column('merchant_request_id', sa.String(255), nullable=True),
        sa.Column('mpesa_receipt_number', sa.String(255), nullable=True),
        sa.Column('status', sa.String(20), default='pending', nullable=False),
        sa.Column('result_code', sa.String(10), nullable=True),
        sa.Column('result_desc', sa.String(255), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('escrow_transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(), nullable=True)
    )
    
    # Create indexes
    op.create_index('ix_payments_checkout_request_id', 'payments', ['checkout_request_id'])
    op.create_index('ix_payments_mpesa_receipt_number', 'payments', ['mpesa_receipt_number'])
    op.create_index('ix_payments_status', 'payments', ['status'])
    op.create_index('ix_payments_user_id', 'payments', ['user_id'])
    op.create_index('ix_payments_contract_id', 'payments', ['contract_id'])
    
    # Unique constraints
    op.create_unique_constraint('uq_payments_checkout_request_id', 'payments', ['checkout_request_id'])
    op.create_unique_constraint('uq_payments_mpesa_receipt_number', 'payments', ['mpesa_receipt_number'])


def downgrade():
    op.drop_table('payments')
