from flask import Blueprint
from flask_jwt_extended import jwt_required
from controllers.ai_controller import AIController

ai_bp = Blueprint('ai', __name__)
controller = AIController()


@ai_bp.route('/match/<uuid:project_id>', methods=['GET'])
@jwt_required()
def match_by_project(project_id):
    """Get ranked freelancer matches for a specific project."""
    return controller.match_by_project(str(project_id))


@ai_bp.route('/match', methods=['POST'])
@jwt_required()
def match_by_description():
    """Ad-hoc matching from a raw job description and optional skills/budget."""
    return controller.match_by_description()
