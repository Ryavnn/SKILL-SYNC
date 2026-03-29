from flask import Blueprint
from controllers.admin_controller import AdminController
from utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__)
controller = AdminController()

# --- User Management ---
@admin_bp.route('/users', methods=['GET'])
@admin_required()
def list_users():
    return controller.list_users()

@admin_bp.route('/users/<uuid:user_id>/role', methods=['PATCH'])
@admin_required()
def update_user_role(user_id):
    return controller.update_user_role(str(user_id))

@admin_bp.route('/users/<uuid:user_id>/status', methods=['PATCH'])
@admin_required()
def toggle_user_status(user_id):
    return controller.toggle_user_status(str(user_id))

# --- Freelancer Moderation ---
@admin_bp.route('/freelancers/pending', methods=['GET'])
@admin_required()
def list_pending_verifications():
    return controller.list_pending_verifications()

@admin_bp.route('/freelancers/<uuid:freelancer_id>/verify', methods=['PATCH'])
@admin_required()
def verify_freelancer(freelancer_id):
    return controller.verify_freelancer(str(freelancer_id))

# --- Project Moderation ---
@admin_bp.route('/projects', methods=['GET'])
@admin_required()
def list_projects():
    return controller.list_projects()

@admin_bp.route('/projects/<uuid:project_id>/flag', methods=['PATCH'])
@admin_required()
def flag_project(project_id):
    return controller.flag_project(str(project_id))

# --- Disputes & Transactions ---
@admin_bp.route('/disputes', methods=['GET'])
@admin_required()
def list_disputes():
    return controller.list_disputes()

@admin_bp.route('/transactions', methods=['GET'])
@admin_required()
def list_transactions():
    return controller.list_transactions()

# --- Skill Management ---
@admin_bp.route('/skills', methods=['GET'])
@admin_required()
def list_skills():
    return controller.list_skills()

@admin_bp.route('/skills', methods=['POST'])
@admin_required()
def create_skill():
    return controller.create_skill()

@admin_bp.route('/skills/<int:skill_id>', methods=['PATCH'])
@admin_required()
def update_skill(skill_id):
    return controller.update_skill(skill_id)

@admin_bp.route('/skills/<int:skill_id>', methods=['DELETE'])
@admin_required()
def delete_skill(skill_id):
    return controller.delete_skill(skill_id)

# --- Analytics ---
@admin_bp.route('/analytics/overview', methods=['GET'])
@admin_required()
def get_analytics():
    return controller.get_analytics()
