"""
M-Pesa Payment Controller — Handles M-Pesa payment endpoints.

Endpoints:
  - POST /api/payments/mpesa/stk-push: Initiate payment
  - POST /api/payments/mpesa/callback: M-Pesa callback handler
  - GET /api/payments/status/<payment_id>: Check payment status
"""

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.mpesa_service import MpesaService
from services.escrow_service import EscrowService
from repositories.payment_repository import PaymentRepository
from repositories.contract_repository import ContractRepository
from services.contract_validation_service import ContractValidationService
from decimal import Decimal
import json


class MpesaPaymentController:
    """Handles M-Pesa payment operations."""

    def __init__(self):
        self.mpesa = MpesaService()
        self.payment_repo = PaymentRepository()
        self.contract_repo = ContractRepository()
        self.escrow = EscrowService()
        self.validator = ContractValidationService()

    # ──────────────────────────────────────────────────────────────
    # STK Push Initiation
    # ──────────────────────────────────────────────────────────────

    @jwt_required()
    def initiate_stk_push(self):
        """
        POST /api/payments/mpesa/stk-push
        
        Initiate M-Pesa STK Push for escrow funding.
        
        Request:
        {
            "phone_number": "0712345678",
            "contract_id": "uuid"
        }
        
        Response:
        {
            "status": "success",
            "data": {
                "payment_id": "uuid",
                "checkout_request_id": "...",
                "message": "Check your phone to complete payment"
            }
        }
        """
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate request
        if not data or 'phone_number' not in data or 'contract_id' not in data:
            return jsonify({
                "status": "error",
                "message": "phone_number and contract_id are required"
            }), 400

        phone_number = data['phone_number']
        contract_id = data['contract_id']

        # Validate contract exists and user is client
        contract = self.contract_repo.get_contract_by_id(contract_id)
        if not contract:
            return jsonify({
                "status": "error",
                "message": "Contract not found"
            }), 404

        # Must be the client
        participant_error = self.validator.validate_contract_participant(
            contract, str(user_id), required_role='client'
        )
        if participant_error:
            return jsonify({
                "status": "error",
                "message": participant_error.get("error", "Unauthorized")
            }), participant_error.get("status", 403)

        # Contract must be active
        if contract.status != 'active':
            return jsonify({
                "status": "error",
                "message": "Contract must be active to fund"
            }), 400

        # Get pending milestones to calculate total amount
        pending_milestones = self.contract_repo.get_pending_milestones(contract_id)
        if not pending_milestones:
            return jsonify({
                "status": "error",
                "message": "No pending milestones to fund"
            }), 400

        # Calculate total amount
        total_amount = sum(milestone.amount for milestone in pending_milestones)
        milestone_ids = [str(m.id) for m in pending_milestones]

        # Create payment record
        payment = self.payment_repo.create_payment(
            contract_id=str(contract_id),
            user_id=str(user_id),
            phone_number=phone_number,
            amount=float(total_amount),
            milestone_ids=json.dumps(milestone_ids)
        )

        # Initiate STK Push
        stk_result = self.mpesa.initiate_stk_push(
            phone_number=phone_number,
            amount=float(total_amount),
            account_reference=f"Contract-{contract_id}",
            transaction_desc=f"SkillSync Escrow - {contract.project.title if contract.project else 'Project'}"
        )

        if not stk_result.get('success'):
            # Mark payment as failed
            self.payment_repo.mark_payment_failed(
                payment_id=str(payment.id),
                result_code='999',
                result_desc=stk_result.get('error', 'STK Push failed')
            )

            return jsonify({
                "status": "error",
                "message": stk_result.get('error', 'Failed to initiate payment')
            }), 400

        # Update payment with STK response
        self.payment_repo.update_payment_stk_response(
            payment_id=str(payment.id),
            checkout_request_id=stk_result.get('checkout_request_id'),
            merchant_request_id=stk_result.get('merchant_request_id')
        )

        return jsonify({
            "status": "success",
            "data": {
                "payment_id": str(payment.id),
                "checkout_request_id": stk_result.get('checkout_request_id'),
                "amount": float(total_amount),
                "phone_number": phone_number,
                "message": stk_result.get('customer_message', 'Check your phone to complete payment')
            },
            "message": "Payment initiated successfully"
        }), 200

    # ──────────────────────────────────────────────────────────────
    # M-Pesa Callback Handler
    # ──────────────────────────────────────────────────────────────

    def handle_mpesa_callback(self):
        """
        POST /api/payments/mpesa/callback
        
        Receives M-Pesa payment confirmation.
        
        NO JWT REQUIRED - This is called by Safaricom servers.
        
        Process:
        1. Parse callback data
        2. Find payment by CheckoutRequestID
        3. If successful: Fund escrow
        4. If failed: Mark payment as failed
        5. Return acknowledgment to M-Pesa
        """
        try:
            callback_data = request.get_json()

            # Process callback
            result = self.mpesa.process_callback(callback_data)

            # Find payment by CheckoutRequestID
            checkout_request_id = result.get('checkout_request_id')
            if not checkout_request_id:
                return jsonify({
                    "ResultCode": 1,
                    "ResultDesc": "Invalid callback data"
                }), 400

            payment = self.payment_repo.get_payment_by_checkout_request_id(checkout_request_id)
            if not payment:
                return jsonify({
                    "ResultCode": 1,
                    "ResultDesc": "Payment not found"
                }), 404

            # Payment already processed
            if payment.status in ['completed', 'failed']:
                return jsonify({
                    "ResultCode": 0,
                    "ResultDesc": "Callback already processed"
                }), 200

            # Payment successful
            if result.get('success'):
                # Mark payment as processing
                self.payment_repo.mark_payment_processing(str(payment.id))

                # Fund escrow
                escrow_result = self.escrow.fund_escrow_after_payment(
                    payment_id=str(payment.id),
                    contract_id=str(payment.contract_id)
                )

                if "error" in escrow_result:
                    # Escrow funding failed - mark payment as failed
                    self.payment_repo.mark_payment_failed(
                        payment_id=str(payment.id),
                        result_code='500',
                        result_desc=f"Escrow funding failed: {escrow_result['error']}"
                    )

                    return jsonify({
                        "ResultCode": 1,
                        "ResultDesc": "Escrow funding failed"
                    }), 500

                # Mark payment as completed
                self.payment_repo.mark_payment_completed(
                    payment_id=str(payment.id),
                    mpesa_receipt_number=result.get('mpesa_receipt_number', ''),
                    result_code=result.get('result_code', '0'),
                    result_desc=result.get('result_desc', 'Success')
                )

                return jsonify({
                    "ResultCode": 0,
                    "ResultDesc": "Payment processed successfully"
                }), 200

            else:
                # Payment failed
                self.payment_repo.mark_payment_failed(
                    payment_id=str(payment.id),
                    result_code=result.get('result_code', '1'),
                    result_desc=result.get('result_desc', 'Payment failed')
                )

                return jsonify({
                    "ResultCode": 0,
                    "ResultDesc": "Callback acknowledged"
                }), 200

        except Exception as e:
            print(f"M-Pesa Callback Error: {str(e)}")
            return jsonify({
                "ResultCode": 1,
                "ResultDesc": f"Server error: {str(e)}"
            }), 500

    # ──────────────────────────────────────────────────────────────
    # Payment Status Check
    # ──────────────────────────────────────────────────────────────

    @jwt_required()
    def get_payment_status(self, payment_id):
        """
        GET /api/payments/status/<payment_id>
        
        Check status of a payment.
        
        Response:
        {
            "status": "success",
            "data": {
                "payment_id": "uuid",
                "status": "pending|processing|completed|failed",
                "amount": "1000.00",
                "phone_number": "254712345678",
                "mpesa_receipt_number": "ABC123",
                "result_desc": "...",
                "created_at": "...",
                "completed_at": "..."
            }
        }
        """
        user_id = get_jwt_identity()

        payment = self.payment_repo.get_payment_by_id(payment_id)
        if not payment:
            return jsonify({
                "status": "error",
                "message": "Payment not found"
            }), 404

        # Verify user owns this payment
        if str(payment.user_id) != str(user_id):
            return jsonify({
                "status": "error",
                "message": "Unauthorized"
            }), 403

        return jsonify({
            "status": "success",
            "data": {
                "payment_id": str(payment.id),
                "contract_id": str(payment.contract_id),
                "status": payment.status,
                "amount": str(payment.amount),
                "phone_number": payment.phone_number,
                "mpesa_receipt_number": payment.mpesa_receipt_number,
                "result_desc": payment.result_desc,
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "completed_at": payment.completed_at.isoformat() if payment.completed_at else None
            },
            "message": "Payment status retrieved"
        }), 200
