from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from controllers.auth_controller import AuthController

auth_bp = Blueprint('auth', __name__)
auth_controller = AuthController()

@auth_bp.route('/register', methods=['POST'])
def register():
    return auth_controller.register()

@auth_bp.route('/login', methods=['POST'])
def login():
    return auth_controller.login()

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    return auth_controller.get_me(user_id)

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return auth_controller.logout()
