from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from services.matching_service import MatchingService
from repositories.project_repository import ProjectRepository
from models.user import User

class MatchingController:
    def __init__(self):
        self.service = MatchingService()
        self.project_repo = ProjectRepository()

    def get_project_matches(self, project_id):
        # 1. Fetch current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 401
        
        # 2. Fetch project
        project = self.project_repo.get_project_by_id(project_id)
        if not project:
            return jsonify({"status": "error", "message": "Project not found"}), 404
        
        # 3. Check ownership permissions
        # Only project owner (client) or admin can see matches
        if str(project.client_id) != str(user_id) and user.role != 'admin':
            return jsonify({"status": "error", "message": "Unauthorized access to project matches"}), 403
        
        # 4. Get matches
        try:
            matches = self.service.get_matches_for_project(project_id)
            if matches is None:
                return jsonify({"status": "error", "message": "Project not found during matching"}), 404
                
            return jsonify({
                "status": "success",
                "data": matches,
                "message": "Matches retrieved successfully"
            }), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
