from app import db
from models.messaging import MessageThread, Message
from models import User
from sqlalchemy import or_, and_
from datetime import datetime

class MessagingRepository:
    @staticmethod
    def get_or_create_thread(user_1_id, user_2_id, project_id=None, referral_id=None):
        # Normalize participant order to prevent duplicates like (1,2) and (2,1)
        p1, p2 = sorted([str(user_1_id), str(user_2_id)])
        
        thread = MessageThread.query.filter(
            and_(
                MessageThread.participant_1_id == p1,
                MessageThread.participant_2_id == p2,
                MessageThread.project_id == project_id,
                MessageThread.referral_id == referral_id
            )
        ).first()

        if not thread:
            thread = MessageThread(
                participant_1_id=p1,
                participant_2_id=p2,
                project_id=project_id,
                referral_id=referral_id
            )
            db.session.add(thread)
            db.session.commit()
        
        return thread

    @staticmethod
    def save_message(thread_id, sender_id, content):
        message = Message(
            thread_id=thread_id,
            sender_id=sender_id,
            content=content
        )
        db.session.add(message)
        db.session.commit()
        return message

    @staticmethod
    def get_thread_messages(thread_id, limit=50, offset=0):
        return Message.query.filter_by(thread_id=thread_id)\
            .order_by(Message.created_at.asc())\
            .limit(limit).offset(offset).all()

    @staticmethod
    def get_user_inbox(user_id):
        # Get all threads where the user is a participant
        return MessageThread.query.filter(
            or_(
                MessageThread.participant_1_id == user_id,
                MessageThread.participant_2_id == user_id
            )
        ).all()

    @staticmethod
    def mark_as_read(thread_id, user_id):
        # Mark all messages in the thread as read IF the sender is NOT the current user
        Message.query.filter(
            and_(
                Message.thread_id == thread_id,
                Message.sender_id != user_id,
                Message.is_read == False
            )
        ).update({"is_read": True})
        db.session.commit()

    @staticmethod
    def get_unread_count(thread_id, user_id):
        return Message.query.filter(
            and_(
                Message.thread_id == thread_id,
                Message.sender_id != user_id,
                Message.is_read == False
            )
        ).count()
