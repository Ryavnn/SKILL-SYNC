from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.project_service import ProjectService
from schemas.project_schema import ProjectCreateSchema, ProjectUpdateSchema, ProjectResponseSchema
from marshmallow import ValidationError

class ProjectController:
    def __init__(self):
        self.project_service = ProjectService()
        self.create_schema = ProjectCreateSchema()
        self.update_schema = ProjectUpdateSchema()
        self.response_schema = ProjectResponseSchema()

    @jwt_required()
    def create_project(self):
        # Role check
        from models.user import User
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'client':
            return {"message": "Only clients can create projects", "status": 403}, 403
            
        json_data = request.get_json()
        print(f"DEBUG: Incoming project data: {json_data}")
        
        try:
            validated_data = self.create_schema.load(json_data)
        except ValidationError as err:
            print(f"DEBUG: Validation errors: {err.messages}")
            return {"message": "Validation failed", "errors": err.messages, "status": 400}, 400
            
        try:
            result = self.project_service.create_project(user_id, validated_data)
            if "error" in result:
                print(f"DEBUG: Service error: {result['error']}")
                return {"message": result["error"], "status": result["status"]}, result["status"]
                
            return {
                "message": "Project created successfully",
                "data": self.response_schema.dump(result["data"]),
                "status": 201
            }, 201
        except Exception as e:
            import traceback
            print(f"DEBUG: Exception in create_project: {str(e)}")
            traceback.print_exc()
            return {"message": str(e), "status": 500}, 500

    def get_project(self, id):
        result = self.project_service.get_project(id)
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def get_projects(self):
        user_id = get_jwt_identity()
        from models.user import User
        user = User.query.get(user_id)
        
        status = request.args.get('status')
        client_id = request.args.get('client_id')
        
        filters = {}
        if status: filters['status'] = status
        
        # If user is a client, override or set client_id to their own ID
        # (This ensures clients only see their own projects unless they are an admin)
        if user and user.role == 'client':
            filters['client_id'] = user_id
        elif client_id:
            filters['client_id'] = client_id
            
        result = self.project_service.get_all_projects(filters)
        return {
            "data": self.response_schema.dump(result["data"], many=True),
            "status": 200
        }, 200

    @jwt_required()
    def update_project(self, id):
        user_id = get_jwt_identity()
        json_data = request.get_json()
        
        try:
            validated_data = self.update_schema.load(json_data)
        except ValidationError as err:
            return {"message": "Validation failed", "errors": err.messages, "status": 400}, 400
            
        result = self.project_service.update_project(id, user_id, validated_data)
        
        if "error" in result:
            return {"message": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200
