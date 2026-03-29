from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from services.contract_service import ContractService
from services.escrow_service import EscrowService
from schemas.contract_schema import (
    ContractCreateSchema,
    ContractResponseSchema,
    MilestoneResponseSchema,
    EscrowTransactionResponseSchema
)
from models.user import User


class ContractController:
    """Orchestrates contract and escrow endpoints."""

    def __init__(self):
        self.contract_service = ContractService()
        self.escrow_service = EscrowService()
        self.create_schema = ContractCreateSchema()
        self.response_schema = ContractResponseSchema()
        self.milestone_response_schema = MilestoneResponseSchema()
        self.escrow_response_schema = EscrowTransactionResponseSchema()

    @jwt_required()
    def create_contract(self):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or user.role != 'client':
            return {"error": "Only clients can create contracts", "status": 403}, 403

        json_data = request.get_json()
        try:
            validated_data = self.create_schema.load(json_data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}, 400

        result = self.contract_service.create_contract(
            client_id=user_id,
            project_id=validated_data['project_id'],
            freelancer_id=validated_data['freelancer_id'],
            total_amount=validated_data['total_amount'],
            milestones_data=validated_data['milestones']
        )

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 201
        }, 201

    @jwt_required()
    def get_contract(self, id):
        user_id = get_jwt_identity()
        result = self.contract_service.get_contract(id, user_id)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def get_user_contracts(self):
        user_id = get_jwt_identity()
        result = self.contract_service.get_user_contracts(user_id)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.response_schema.dump(result["data"], many=True),
            "status": 200
        }, 200

    @jwt_required()
    def accept_contract(self, id):
        user_id = get_jwt_identity()
        result = self.contract_service.accept_contract(id, user_id)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def reject_contract(self, id):
        user_id = get_jwt_identity()
        result = self.contract_service.reject_contract(id, user_id)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def fund_escrow(self, id):
        user_id = get_jwt_identity()
        result = self.escrow_service.fund_escrow(id, user_id)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {"data": result["data"], "status": 200}, 200

    @jwt_required()
    def get_escrow_summary(self, id):
        user_id = get_jwt_identity()
        result = self.escrow_service.get_escrow_summary(id, user_id)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        data = result["data"]
        # Serialize transactions
        data["transactions"] = self.escrow_response_schema.dump(data["transactions"], many=True)

        return {"data": data, "status": 200}, 200

    @jwt_required()
    def submit_milestone(self, id):
        user_id = get_jwt_identity()
        result = self.contract_service.submit_milestone(id, user_id)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.milestone_response_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def approve_milestone(self, id):
        user_id = get_jwt_identity()
        result = self.contract_service.approve_milestone(id, user_id)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.milestone_response_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def add_milestone(self, id):
        user_id = get_jwt_identity()
        json_data = request.get_json()
        
        result = self.contract_service.add_milestone(id, user_id, json_data)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.milestone_response_schema.dump(result["data"]),
            "status": 201
        }, 201
