from flask import jsonify, request
from services.user_service import UserService
from schemas.auth_schema import UserSchema
from marshmallow import ValidationError

class UserController:
    def __init__(self):
        self.user_service = UserService()
        self.user_schema = UserSchema()

    def get_by_id(self, user_id):
        result = self.user_service.get_user_by_id(user_id)
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": result["data"],
            "status": 200
        }, 200

    def get_all(self):
        result = self.user_service.get_all_users()
        return {
            "data": result["data"],
            "status": 200
        }, 200

    def update(self, user_id):
        data = request.get_json()
        
        # Only allow updating name and email
        allowed_fields = ['name', 'email']
        filtered_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not filtered_data:
            return {"error": "No valid fields provided", "status": 400}, 400

        result = self.user_service.update_user(user_id, filtered_data)
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": result["data"],
            "status": 200
        }, 200
