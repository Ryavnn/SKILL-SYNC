from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from services.freelancer_service import FreelancerService
from schemas.freelancer_schema import FreelancerProfileSchema, CreateFreelancerProfileSchema, UpdateFreelancerProfileSchema
from schemas.project_schema import ProjectResponseSchema

class FreelancerController:
    def __init__(self):
        self.freelancer_service = FreelancerService()
        self.profile_schema = FreelancerProfileSchema()
        self.create_schema = CreateFreelancerProfileSchema()
        self.update_schema = UpdateFreelancerProfileSchema()

    @jwt_required()
    def create_profile(self):
        user_id = get_jwt_identity()
        data = request.get_json()
        
        try:
            validated_data = self.create_schema.load(data)
        except ValidationError as err:
            return {"message": str(err.messages), "status": 400}, 400
            
        result = self.freelancer_service.create_freelancer_profile(user_id, validated_data)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.profile_schema.dump(result["data"]),
            "status": 201
        }, 201

    def get_profile(self, id):
        result = self.freelancer_service.get_profile(id)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.profile_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def update_profile(self, id):
        user_id = get_jwt_identity()
        data = request.get_json()
        
        try:
            validated_data = self.update_schema.load(data)
        except ValidationError as err:
            return {"message": str(err.messages), "status": 400}, 400
            
        result = self.freelancer_service.update_profile(id, user_id, validated_data)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.profile_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def get_projects(self):
        user_id = get_jwt_identity()
        result = self.freelancer_service.get_freelancer_projects(user_id)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), result["status"]
            
        schema = ProjectResponseSchema(many=True)
        return {"data": schema.dump(result["data"]), "status": 200}, 200

    @jwt_required()
    def get_earnings(self):
        user_id = get_jwt_identity()
        result = self.freelancer_service.get_freelancer_earnings(user_id)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), result["status"]
            
        return {"data": result["data"], "status": 200}, 200
