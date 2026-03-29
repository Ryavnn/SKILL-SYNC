from app import db
from models.notification import Notification
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

class NotificationService:
    def create_notification(self, user_id, n_type, message):
        """Creates a new notification for a user."""
        if not user_id:
            return {"error": "user_id is required", "status": 400}
            
        try:
            notification = Notification(
                user_id=user_id,
                type=n_type,
                message=message
            )
            db.session.add(notification)
            db.session.commit()
            
            # Here we could easily integrate email or websocket sending
            # self._send_email_or_socket(notification)
            
            return {"data": notification, "status": 201}
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Error creating notification: {str(e)}")
            return {"error": "Database error while creating notification", "status": 500}

    def get_user_notifications(self, user_id, limit=50, offset=0):
        """Fetches notifications for a specific user, ordered by newest first."""
        try:
            notifications = Notification.query.filter_by(user_id=user_id)\
                .order_by(Notification.created_at.desc())\
                .limit(limit)\
                .offset(offset)\
                .all()
                
            unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
            
            return {
                "data": {
                    "notifications": notifications,
                    "unread_count": unread_count
                },
                "status": 200
            }
        except SQLAlchemyError as e:
            print(f"Error fetching notifications: {str(e)}")
            return {"error": "Database error while fetching notifications", "status": 500}

    def mark_as_read(self, notification_id, user_id):
        """Marks a specific notification as read."""
        notification = Notification.query.get(notification_id)
        if not notification:
            return {"error": "Notification not found", "status": 404}
            
        if str(notification.user_id) != str(user_id):
            return {"error": "Unauthorized to access this notification", "status": 403}
            
        try:
            notification.is_read = True
            db.session.commit()
            return {"data": notification, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Error marking notification as read: {str(e)}")
            return {"error": "Database error while updating notification", "status": 500}
            
    def mark_all_as_read(self, user_id):
        """Marks all notifications for a user as read."""
        try:
            Notification.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
            db.session.commit()
            return {"message": "All notifications marked as read", "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Error marking all notifications as read: {str(e)}")
            return {"error": "Database error", "status": 500}
