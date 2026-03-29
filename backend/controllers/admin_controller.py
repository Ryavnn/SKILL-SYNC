from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from services.admin_service import AdminService
from services.moderation_service import ModerationService
from services.analytics_service import AnalyticsService
from services.skill_service import SkillService
from services.dispute_service import DisputeService
from marshmallow import Schema, fields, post_dump
from schemas.auth_schema import UserSchema
from schemas.admin_schema import AdminUserSchema, AdminFreelancerSchema, SkillSchema, PlatformAnalyticsSchema
from repositories.admin_repository import AdminRepository # For shared lookups
from schemas.contract_schema import DisputeResponseSchema, EscrowTransactionResponseSchema # Reused from contracts

class AdminController:
    """Unified controller for all administrative operations."""

    def __init__(self):
        self.admin_svc = AdminService()
        self.moderation_svc = ModerationService()
        self.analytics_svc = AnalyticsService()
        self.skill_svc = SkillService()
        self.dispute_svc = DisputeService() # External service integration
        self.repo = AdminRepository()

    # --- User Management ---
    def list_users(self):
        result = self.admin_svc.list_users()
        if "error" in result:
            return jsonify(result), result["status"]
        schema = AdminUserSchema(many=True)
        return jsonify({"users": schema.dump(result["data"])}), 200

    def update_user_role(self, user_id):
        admin_id = get_jwt_identity()
        data = request.get_json()
        new_role = data.get('role')
        
        result = self.admin_svc.update_user_role(admin_id, user_id, new_role)
        if "error" in result:
            return jsonify(result), result["status"]
        
        return jsonify({"message": f"User role updated to {new_role}", "user": AdminUserSchema().dump(result["data"])}), 200

    def toggle_user_status(self, user_id):
        admin_id = get_jwt_identity()
        data = request.get_json()
        is_active = data.get('is_active', True)
        
        result = self.admin_svc.toggle_user_status(admin_id, user_id, is_active)
        if "error" in result:
            return jsonify(result), result["status"]
            
        status_text = "activated" if is_active else "deactivated"
        return jsonify({"message": f"User account {status_text}", "user": AdminUserSchema().dump(result["data"])}), 200

    # --- Freelancer Moderation ---
    def list_pending_verifications(self):
        result = self.moderation_svc.list_pending_verifications()
        return jsonify({"pending_freelancers": AdminFreelancerSchema(many=True).dump(result["data"])}), 200

    def verify_freelancer(self, freelancer_id):
        admin_id = get_jwt_identity()
        data = request.get_json()
        status = data.get('status')
        
        result = self.moderation_svc.verify_freelancer(admin_id, freelancer_id, status)
        if "error" in result:
            return jsonify(result), result["status"]
            
        return jsonify({"message": f"Freelancer profile {status}", "profile": AdminFreelancerSchema().dump(result["data"])}), 200

    # --- Project Moderation ---
    def list_projects(self):
        projects = self.repo.get_all_projects()
        # Note: Ideally use a specific admin project schema here if needed
        return jsonify({"projects": [p.id for p in projects]}), 200 # Stub for list

    def flag_project(self, project_id):
        admin_id = get_jwt_identity()
        data = request.get_json()
        is_flagged = data.get('is_flagged', True)
        
        result = self.moderation_svc.flag_project(admin_id, project_id, is_flagged)
        if "error" in result:
            return jsonify(result), result["status"]
            
        return jsonify({"message": "Project flagged" if is_flagged else "Project unflagged", "project_id": str(project_id)}), 200

    # --- Disputes & Transactions ---
    def list_disputes(self):
        disputes = self.repo.get_all_disputes()
        return jsonify({"disputes": DisputeResponseSchema(many=True).dump(disputes)}), 200

    def list_transactions(self):
        txns = self.repo.get_all_transactions()
        return jsonify({"transactions": EscrowTransactionResponseSchema(many=True).dump(txns)}), 200

    # --- Skill Management ---
    def list_skills(self):
        skills = self.repo.get_all_skills()
        return jsonify({"skills": SkillSchema(many=True).dump(skills)}), 200

    def create_skill(self):
        admin_id = get_jwt_identity()
        data = request.get_json()
        name = data.get('name')
        
        result = self.skill_svc.add_skill(admin_id, name)
        if "error" in result:
            return jsonify(result), result["status"]
            
        return jsonify({"message": "Skill added", "skill": SkillSchema().dump(result["data"])}), 201

    def update_skill(self, skill_id):
        admin_id = get_jwt_identity()
        data = request.get_json()
        name = data.get('name')
        
        result = self.skill_svc.update_skill(admin_id, skill_id, name)
        if "error" in result:
            return jsonify(result), result["status"]
            
        return jsonify({"message": "Skill updated", "skill": SkillSchema().dump(result["data"])}), 200

    def delete_skill(self, skill_id):
        admin_id = get_jwt_identity()
        result = self.skill_svc.delete_skill(admin_id, skill_id)
        if "error" in result:
            return jsonify(result), result["status"]
            
        return jsonify({"message": "Skill removed"}), 200

    # --- Analytics ---
    def get_analytics(self):
        result = self.analytics_svc.get_dashboard_overview()
        return jsonify(PlatformAnalyticsSchema().dump(result["data"])), 200
