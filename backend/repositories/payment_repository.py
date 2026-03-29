"""
Payment Repository — Database operations for M-Pesa payments.
"""

from app import db
from models.payment import Payment
from typing import Optional
import uuid


class PaymentRepository:
    """Data access layer for Payment model."""

    def create_payment(
        self,
        contract_id: str,
        user_id: str,
        phone_number: str,
        amount: float,
        milestone_ids: Optional[str] = None
    ) -> Payment:
        """
        Create a new payment record (initially pending).
        
        Returns:
            Payment object
        """
        payment = Payment(
            contract_id=uuid.UUID(contract_id),
            user_id=uuid.UUID(user_id),
            phone_number=phone_number,
            amount=amount,
            milestone_ids=milestone_ids,
            status='pending'
        )
        db.session.add(payment)
        db.session.commit()
        return payment

    def update_payment_stk_response(
        self,
        payment_id: str,
        checkout_request_id: str,
        merchant_request_id: str
    ) -> Optional[Payment]:
        """
        Update payment with STK Push response data.
        """
        payment = Payment.query.get(uuid.UUID(payment_id))
        if payment:
            payment.checkout_request_id = checkout_request_id
            payment.merchant_request_id = merchant_request_id
            db.session.commit()
        return payment

    def get_payment_by_id(self, payment_id: str) -> Optional[Payment]:
        """Get payment by ID."""
        try:
            return Payment.query.get(uuid.UUID(payment_id))
        except (ValueError, AttributeError):
            return None

    def get_payment_by_checkout_request_id(self, checkout_request_id: str) -> Optional[Payment]:
        """Find payment by M-Pesa CheckoutRequestID."""
        return Payment.query.filter_by(
            checkout_request_id=checkout_request_id
        ).first()

    def mark_payment_completed(
        self,
        payment_id: str,
        mpesa_receipt_number: str,
        result_code: str,
        result_desc: str
    ) -> Optional[Payment]:
        """
        Mark payment as completed after M-Pesa confirmation.
        """
        payment = Payment.query.get(uuid.UUID(payment_id))
        if payment:
            payment.status = 'completed'
            payment.mpesa_receipt_number = mpesa_receipt_number
            payment.result_code = result_code
            payment.result_desc = result_desc
            payment.completed_at = db.func.now()
            db.session.commit()
        return payment

    def mark_payment_failed(
        self,
        payment_id: str,
        result_code: str,
        result_desc: str
    ) -> Optional[Payment]:
        """
        Mark payment as failed.
        """
        payment = Payment.query.get(uuid.UUID(payment_id))
        if payment:
            payment.status = 'failed'
            payment.result_code = result_code
            payment.result_desc = result_desc
            db.session.commit()
        return payment

    def mark_payment_processing(self, payment_id: str) -> Optional[Payment]:
        """
        Mark payment as processing (payment confirmed, escrow being funded).
        """
        payment = Payment.query.get(uuid.UUID(payment_id))
        if payment:
            payment.status = 'processing'
            db.session.commit()
        return payment

    def link_escrow_transaction(
        self,
        payment_id: str,
        escrow_transaction_id: str
    ) -> Optional[Payment]:
        """
        Link payment to created EscrowTransaction.
        """
        payment = Payment.query.get(uuid.UUID(payment_id))
        if payment:
            payment.escrow_transaction_id = uuid.UUID(escrow_transaction_id)
            db.session.commit()
        return payment

    def get_user_payments(self, user_id: str, limit: int = 50) -> list[Payment]:
        """
        Get all payments for a user (most recent first).
        """
        return Payment.query.filter_by(
            user_id=uuid.UUID(user_id)
        ).order_by(
            Payment.created_at.desc()
        ).limit(limit).all()

    def get_contract_payments(self, contract_id: str) -> list[Payment]:
        """
        Get all payments for a specific contract.
        """
        return Payment.query.filter_by(
            contract_id=uuid.UUID(contract_id)
        ).order_by(
            Payment.created_at.desc()
        ).all()
