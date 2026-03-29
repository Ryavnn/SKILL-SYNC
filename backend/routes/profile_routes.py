from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from controllers.user_controller import UserController

profile_bp = Blueprint('profile', __name__)
user_controller = UserController()

@profile_bp.route('/', methods=['GET'])
@jwt_required()
def get_my_profile():
    return user_controller.get_by_id(str(get_jwt_identity()))

@profile_bp.route('/', methods=['PUT'])
@jwt_required()
def update_my_profile():
    return user_controller.update(str(get_jwt_identity()))

