from flask import jsonify, request
from services.auth_service import AuthService
from schemas.auth_schema import RegisterSchema, LoginSchema
from marshmallow import ValidationError

class AuthController:
    def __init__(self):
        self.auth_service = AuthService()
        self.register_schema = RegisterSchema()
        self.login_schema = LoginSchema()

    def register(self):
        try:
            data = self.register_schema.load(request.get_json())
        except ValidationError as err:
            return jsonify({"error": "Validation failed", "details": err.messages}), 400

        result = self.auth_service.register_user(data)
        if "error" in result:
            return jsonify({"error": result["error"]}), result["status"]
        
        return jsonify(result), result["status"]

    def login(self):
        try:
            data = self.login_schema.load(request.get_json())
        except ValidationError as err:
            return jsonify({"error": "Validation failed", "details": err.messages}), 400

        result = self.auth_service.login_user(data)
        if "error" in result:
            return jsonify({"error": result["error"]}), result["status"]
            
        return jsonify(result), result["status"]

    def get_me(self, user_id):
        result = self.auth_service.get_user_by_id(user_id)
        if "error" in result:
            return jsonify({"error": result["error"]}), result["status"]
            
        return jsonify(result), result["status"]

    def logout(self):
        # Stateles JWT logout (client should delete token)
        return jsonify({"message": "Successfully logged out"}), 200
