from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from services.ai_service import AIService
from models.user import User


class AIController:
    """Handles AI matching endpoints."""

    def __init__(self):
        self.ai_service = AIService()

    def match_by_project(self, project_id):
        """GET /api/ai/match/<project_id> — match freelancers to a specific project."""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 401

        matches = self.ai_service.match_freelancers_for_project(project_id)

        if matches is None:
            return jsonify({"status": "error", "message": "Project not found"}), 404

        return jsonify({
            "status": "success",
            "data": matches,
            "message": f"{len(matches)} matches found"
        }), 200

    def match_by_description(self):
        """POST /api/ai/match — ad-hoc matching from raw description + skills."""
        data = request.get_json()

        if not data or not data.get('description'):
            return jsonify({
                "status": "error",
                "message": "description is required"
            }), 400

        matches = self.ai_service.match_freelancers_by_description(
            description=data['description'],
            skills=data.get('skills', []),
            budget_min=data.get('budget_min'),
            budget_max=data.get('budget_max'),
        )

        return jsonify({
            "status": "success",
            "data": matches,
            "message": f"{len(matches)} matches found"
        }), 200
