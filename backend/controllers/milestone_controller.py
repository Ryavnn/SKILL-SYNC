from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.milestone_service import MilestoneService
from schemas.contract_schema import MilestoneResponseSchema


class MilestoneController:
    """Orchestrates milestone submission and approval endpoints."""

    def __init__(self):
        self.milestone_service = MilestoneService()
        self.response_schema = MilestoneResponseSchema()

    @jwt_required()
    def submit_milestone(self, id):
        user_id = get_jwt_identity()
        result = self.milestone_service.submit_milestone(id, user_id)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def approve_milestone(self, id):
        user_id = get_jwt_identity()
        result = self.milestone_service.approve_milestone(id, user_id)

        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]

        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200
