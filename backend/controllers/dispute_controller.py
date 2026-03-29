from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.dispute_service import DisputeService
from schemas.contract_schema import DisputeCreateSchema, DisputeResolveSchema, DisputeResponseSchema
from utils.decorators import admin_required


class DisputeController:
    """Orchestrates dispute creation and resolution endpoints."""

    def __init__(self):
        self.dispute_service = DisputeService()
        self.create_schema = DisputeCreateSchema()
        self.resolve_schema = DisputeResolveSchema()
        self.response_schema = DisputeResponseSchema()

    @jwt_required()
    def create_dispute(self):
        user_id = get_jwt_identity()
        json_data = request.get_json()

        errors = self.create_schema.validate(json_data)
        if errors:
            return {"error": errors, "status": 400}, 400

        result = self.dispute_service.create_dispute(
            milestone_id=json_data['milestone_id'],
            raised_by_id=user_id,
            reason=json_data['reason'],
            description=json_data.get('description')
        )

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 201
        }, 201

    @admin_required()
    def resolve_dispute(self, id):
        admin_id = get_jwt_identity()
        json_data = request.get_json()

        errors = self.resolve_schema.validate(json_data)
        if errors:
            return {"error": errors, "status": 400}, 400

        result = self.dispute_service.resolve_dispute(
            dispute_id=id,
            admin_id=admin_id,
            resolution_type=json_data['resolution_type']
        )

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def get_dispute(self, id):
        user_id = get_jwt_identity()
        result = self.dispute_service.get_dispute(id, user_id)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200
