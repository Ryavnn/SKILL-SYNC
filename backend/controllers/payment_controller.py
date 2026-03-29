from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.payment_service import PaymentService


class PaymentController:
    """Handles payment and escrow API endpoints."""

    def __init__(self):
        self.payment_service = PaymentService()

    @jwt_required()
    def get_payments(self):
        """Get payment history for the current user."""
        user_id = get_jwt_identity()
        result = self.payment_service.get_payment_history(str(user_id))

        return jsonify({
            "status": "success",
            "data": result["data"],
            "message": "Payment history retrieved"
        }), 200

    @jwt_required()
    def fund_escrow(self):
        """Client deposits funds into escrow for a contract."""
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or 'contract_id' not in data:
            return jsonify({
                "status": "error",
                "message": "contract_id is required"
            }), 400

        result = self.payment_service.fund_escrow(data['contract_id'], str(user_id))

        if "error" in result:
            return jsonify({
                "status": "error",
                "message": result["error"]
            }), result.get("status", 400)

        return jsonify({
            "status": "success",
            "data": result["data"],
            "message": "Escrow funded successfully"
        }), 200

    @jwt_required()
    def get_escrow_summary(self, contract_id):
        """Get escrow balance and transactions for a contract."""
        user_id = get_jwt_identity()
        result = self.payment_service.get_escrow_summary(contract_id, str(user_id))

        if "error" in result:
            return jsonify({
                "status": "error",
                "message": result["error"]
            }), result.get("status", 400)

        return jsonify({
            "status": "success",
            "data": result["data"],
            "message": "Escrow summary retrieved"
        }), 200

    @jwt_required()
    def get_earnings(self):
        """Get freelancer earnings summary."""
        user_id = get_jwt_identity()
        result = self.payment_service.get_freelancer_earnings(str(user_id))

        return jsonify({
            "status": "success",
            "data": result["data"],
            "message": "Earnings retrieved"
        }), 200
