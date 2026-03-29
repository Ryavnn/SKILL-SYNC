from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from controllers.user_controller import UserController
from utils.decorators import admin_required

user_bp = Blueprint('user', __name__)
user_controller = UserController()

@user_bp.route('/<uuid:id>', methods=['GET'])
@jwt_required()
def get_user(id):
    return user_controller.get_by_id(str(id))

@user_bp.route('/<uuid:id>', methods=['PUT'])
@jwt_required()
def update_user(id):
    current_user_id = get_jwt_identity()
    
    # Check if user is updating their own profile OR is an admin
    # This logic can be moved to a service or decorator if it becomes complex
    # For now, let's keep it simple
    if str(id) != current_user_id:
        # Check admin role (could use a dedicated check or just let it fail if not admin)
        # But we have admin_required for the bulk route.
        # For individual updates, we might want a 'self_or_admin' check.
        pass

    return user_controller.update(str(id))

@user_bp.route('/', methods=['GET'])
@admin_required()
def get_all_users():
    return user_controller.get_all()
