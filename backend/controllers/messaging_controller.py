from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.messaging_service import MessagingService
from schemas.messaging_schema import CreateThreadSchema, SendMessageSchema, ThreadSchema, MessageSchema

class MessagingController:
    def __init__(self):
        self.messaging_service = MessagingService()
        self.create_thread_schema = CreateThreadSchema()
        self.send_message_schema = SendMessageSchema()
        self.thread_schema = ThreadSchema()
        self.message_schema = MessageSchema()

    @jwt_required()
    def get_or_create_thread(self):
        user_id = get_jwt_identity()
        json_data = request.get_json()
        
        errors = self.create_thread_schema.validate(json_data)
        if errors:
            return {"error": errors, "status": 400}, 400
            
        participant_id = json_data['participant_id']
        project_id = json_data.get('project_id')
        referral_id = json_data.get('referral_id')
        
        result = self.messaging_service.get_or_create_thread(user_id, participant_id, project_id, referral_id)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.thread_schema.dump(result["data"]),
            "status": result["status"]
        }, result["status"]

    @jwt_required()
    def send_message(self):
        user_id = get_jwt_identity()
        json_data = request.get_json()
        
        errors = self.send_message_schema.validate(json_data)
        if errors:
            return {"error": errors, "status": 400}, 400
            
        thread_id = json_data['thread_id']
        content = json_data['content']
        
        result = self.messaging_service.send_message(thread_id, user_id, content)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.message_schema.dump(result["data"]),
            "status": 201
        }, 201

    @jwt_required()
    def get_thread_messages(self, thread_id):
        user_id = get_jwt_identity()
        limit = request.args.get('limit', default=50, type=int)
        offset = request.args.get('offset', default=0, type=int)
        
        result = self.messaging_service.get_thread_messages(thread_id, user_id, limit, offset)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.message_schema.dump(result["data"], many=True),
            "status": 200
        }, 200

    @jwt_required()
    def get_inbox(self):
        user_id = get_jwt_identity()
        
        result = self.messaging_service.get_user_inbox(user_id)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.thread_schema.dump(result["data"], many=True),
            "status": 200
        }, 200

    @jwt_required()
    def mark_as_read(self, thread_id):
        user_id = get_jwt_identity()
        
        result = self.messaging_service.mark_as_read(thread_id, user_id)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {"status": 204}, 204
