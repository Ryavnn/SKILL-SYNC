"""
M-Pesa Payment Routes — Endpoints for M-Pesa payment processing.
"""

from flask import Blueprint
from controllers.mpesa_controller import MpesaPaymentController

mpesa_bp = Blueprint('mpesa', __name__)
controller = MpesaPaymentController()


# ── STK Push Initiation ─────────────────────────────────────────
@mpesa_bp.route('/stk-push', methods=['POST'])
def initiate_stk_push():
    """
    POST /api/payments/mpesa/stk-push
    
    Initiate M-Pesa STK Push for escrow funding.
    Requires: phone_number, contract_id
    """
    return controller.initiate_stk_push()


# ── M-Pesa Callback ─────────────────────────────────────────────
@mpesa_bp.route('/callback', methods=['POST'])
def mpesa_callback():
    """
    POST /api/payments/mpesa/callback
    
    M-Pesa callback endpoint (called by Safaricom).
    NO JWT REQUIRED.
    """
    return controller.handle_mpesa_callback()


# ── Payment Status ──────────────────────────────────────────────
@mpesa_bp.route('/status/<uuid:payment_id>', methods=['GET'])
def get_payment_status(payment_id):
    """
    GET /api/payments/status/<payment_id>
    
    Check payment status.
    """
    return controller.get_payment_status(str(payment_id))
