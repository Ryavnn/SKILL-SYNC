from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from services.proposal_service import ProposalService
from schemas.proposal_schema import (
    ProposalCreateSchema, 
    ProposalResponseSchema, 
    ProposalUpdateStatusSchema
)

class ProposalController:
    def __init__(self):
        self.proposal_service = ProposalService()
        self.create_schema = ProposalCreateSchema()
        self.response_schema = ProposalResponseSchema(many=True)
        self.single_response_schema = ProposalResponseSchema()
        self.update_status_schema = ProposalUpdateStatusSchema()

    @jwt_required()
    def submit_proposal(self):
        current_user = User.query.get(get_jwt_identity())
        if not current_user or current_user.role != 'freelancer':
            return {"error": "Only freelancers can submit proposals"}, 403
            
        json_data = request.get_json()
        try:
            validated_data = self.create_schema.load(json_data)
        except Exception as e:
            return {"error": str(e)}, 400
            
        result = self.proposal_service.submit_proposal(current_user.id, validated_data)
        if "error" in result:
            return {"error": result["error"]}, result["status"]
            
        return {"data": self.single_response_schema.dump(result["data"])}, 201

    @jwt_required()
    def get_project_proposals(self, project_id):
        current_user = User.query.get(get_jwt_identity())
        if not current_user or current_user.role != 'client':
            return {"error": "Only clients can view proposals for their projects"}, 403
            
        result = self.proposal_service.get_project_proposals(project_id, current_user.id)
        if "error" in result:
            return {"error": result["error"]}, result["status"]
            
        return {"data": self.response_schema.dump(result["data"])}, 200

    @jwt_required()
    def update_proposal_status(self, proposal_id):
        current_user = User.query.get(get_jwt_identity())
        if not current_user or current_user.role != 'client':
            return {"error": "Only clients can update proposal statuses"}, 403
            
        json_data = request.get_json()
        errors = self.update_status_schema.validate(json_data)
        if errors:
            return {"error": errors}, 400
            
        result = self.proposal_service.update_proposal_status(
            proposal_id, current_user.id, json_data['status']
        )
        if "error" in result:
            return {"error": result["error"]}, result["status"]
            
        return {"data": self.single_response_schema.dump(result["data"])}, 200
