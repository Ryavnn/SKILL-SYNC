from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.notification_service import NotificationService

class NotificationController:
    def __init__(self):
        self.notification_service = NotificationService()

    @jwt_required()
    def get_notifications(self):
        user_id = get_jwt_identity()
        
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        result = self.notification_service.get_user_notifications(user_id, limit, offset)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), result["status"]
            
        # Serialize without Marshmallow for simplicity
        notifications_data = [{
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        } for n in result["data"]["notifications"]]
        
        return jsonify({
            "status": "success",
            "data": {
                "notifications": notifications_data,
                "unread_count": result["data"]["unread_count"]
            }
        }), 200

    @jwt_required()
    def mark_as_read(self, notification_id):
        user_id = get_jwt_identity()
        
        result = self.notification_service.mark_as_read(notification_id, user_id)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), result["status"]
            
        return jsonify({
            "status": "success",
            "message": "Notification marked as read",
            "data": {
                "id": result["data"].id,
                "is_read": result["data"].is_read
            }
        }), 200

    @jwt_required()
    def mark_all_as_read(self):
        user_id = get_jwt_identity()
        
        result = self.notification_service.mark_all_as_read(user_id)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), result["status"]
            
        return jsonify({
            "status": "success",
            "message": result["message"]
        }), 200
