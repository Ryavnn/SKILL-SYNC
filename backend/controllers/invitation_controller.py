from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.invitation_service import InvitationService
from models.user import User

class InvitationController:
    def __init__(self):
        self.invitation_service = InvitationService()
    
    @jwt_required()
    def create_invitation(self):
        """Client creates an invitation for a freelancer"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'client':
            return jsonify({"message": "Only clients can send invitations"}), 403
        
        data = request.get_json()
        project_id = data.get('project_id')
        freelancer_id = data.get('freelancer_id')
        message = data.get('message')
        
        if not project_id or not freelancer_id:
            return jsonify({"message": "project_id and freelancer_id are required"}), 400
        
        result = self.invitation_service.create_invitation(
            client_id=user_id,
            project_id=project_id,
            freelancer_id=freelancer_id,
            message=message
        )
        
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status"]
        
        return jsonify({
            "message": "Invitation sent successfully",
            "data": {
                "id": result["data"].id,
                "project_id": result["data"].project_id,
                "freelancer_id": result["data"].freelancer_id,
                "status": result["data"].status,
                "created_at": result["data"].created_at.isoformat()
            }
        }), result["status"]
    
    @jwt_required()
    def get_my_invitations(self):
        """Freelancer gets their invitations"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'freelancer':
            return jsonify({"message": "Only freelancers can view invitations"}), 403
        
        result = self.invitation_service.get_freelancer_invitations(user_id)
        
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status"]
        
        # Format response
        invitations_data = []
        for inv in result["data"]:
            invitations_data.append({
                "id": inv.id,
                "project": {
                    "id": inv.project.id,
                    "title": inv.project.title,
                    "description": inv.project.description,
                    "budget": float(inv.project.budget) if inv.project.budget else 0,
                    "status": inv.project.status
                },
                "client": {
                    "id": inv.client.id,
                    "name": inv.client.name,
                    "email": inv.client.email
                },
                "message": inv.message,
                "status": inv.status,
                "created_at": inv.created_at.isoformat(),
                "updated_at": inv.updated_at.isoformat()
            })
        
        return jsonify({"data": invitations_data}), 200
    
    @jwt_required()
    def accept_invitation(self, invitation_id):
        """Freelancer accepts an invitation"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'freelancer':
            return jsonify({"message": "Only freelancers can accept invitations"}), 403
        
        result = self.invitation_service.accept_invitation(invitation_id, user_id)
        
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status"]
        
        return jsonify({"message": result["message"]}), result["status"]
    
    @jwt_required()
    def decline_invitation(self, invitation_id):
        """Freelancer declines an invitation"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'freelancer':
            return jsonify({"message": "Only freelancers can decline invitations"}), 403
        
        result = self.invitation_service.decline_invitation(invitation_id, user_id)
        
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status"]
        
        return jsonify({"message": result["message"]}), result["status"]
