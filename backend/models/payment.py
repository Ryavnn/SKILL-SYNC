"""
Payment Model — Tracks M-Pesa transaction lifecycle.

Separate from EscrowTransaction:
  - Payment: Real-world M-Pesa payment status (pending → completed/failed)
  - EscrowTransaction: Ledger entry created AFTER payment succeeds
"""

import uuid
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Contract/Milestone reference
    contract_id = db.Column(UUID(as_uuid=True), db.ForeignKey('contracts.id'), nullable=False)
    milestone_ids = db.Column(db.Text, nullable=True)  # JSON array of milestone IDs being funded
    
    # M-Pesa specific fields
    phone_number = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    
    # M-Pesa response fields
    checkout_request_id = db.Column(db.String(255), nullable=True, unique=True)
    merchant_request_id = db.Column(db.String(255), nullable=True)
    mpesa_receipt_number = db.Column(db.String(255), nullable=True, unique=True)
    
    # Payment status
    status = db.Column(db.String(20), default='pending', nullable=False)
    # pending: STK Push sent, waiting for user to enter PIN
    # processing: Payment confirmed by M-Pesa, escrow being updated
    # completed: Escrow funded successfully
    # failed: User cancelled or insufficient funds
    
    # Additional metadata
    result_code = db.Column(db.String(10), nullable=True)
    result_desc = db.Column(db.String(255), nullable=True)
    
    # Relationships
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    escrow_transaction_id = db.Column(UUID(as_uuid=True), nullable=True)  # Links to created EscrowTransaction
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('payments', lazy=True))
    contract = db.relationship('Contract', backref=db.backref('payments', lazy=True))
    
    # Indexes for fast lookups
    __table_args__ = (
        db.Index('ix_payments_checkout_request_id', 'checkout_request_id'),
        db.Index('ix_payments_mpesa_receipt_number', 'mpesa_receipt_number'),
        db.Index('ix_payments_status', 'status'),
        db.Index('ix_payments_user_id', 'user_id'),
        db.Index('ix_payments_contract_id', 'contract_id'),
    )

    def __repr__(self):
        return f'<Payment {self.id} Status: {self.status} Amount: {self.amount}>'
