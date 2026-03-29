from repositories.messaging_repository import MessagingRepository
from models.messaging import MessageThread

class MessagingService:
    def __init__(self):
        self.messaging_repo = MessagingRepository()

    def get_or_create_thread(self, user_1_id, user_2_id, project_id=None, referral_id=None):
        try:
            thread = self.messaging_repo.get_or_create_thread(user_1_id, user_2_id, project_id, referral_id)
            return {"data": thread, "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}

    def send_message(self, thread_id, sender_id, content):
        thread = MessageThread.query.get(thread_id)
        if not thread:
            return {"error": "Thread not found", "status": 404}
        
        # Participant check
        if str(thread.participant_1_id) != str(sender_id) and str(thread.participant_2_id) != str(sender_id):
            return {"error": "Unauthorized to send message in this thread", "status": 403}
        
        try:
            message = self.messaging_repo.save_message(thread_id, sender_id, content)
            return {"data": message, "status": 201}
        except Exception as e:
            return {"error": str(e), "status": 500}

    def get_thread_messages(self, thread_id, user_id, limit=50, offset=0):
        thread = MessageThread.query.get(thread_id)
        if not thread:
            return {"error": "Thread not found", "status": 404}
        
        # Participant check
        if str(thread.participant_1_id) != str(user_id) and str(thread.participant_2_id) != str(user_id):
            return {"error": "Unauthorized to view this thread", "status": 403}
            
        try:
            messages = self.messaging_repo.get_thread_messages(thread_id, limit, offset)
            return {"data": messages, "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}

    def get_user_inbox(self, user_id):
        try:
            threads = self.messaging_repo.get_user_inbox(user_id)
            # Add unread counts to each thread object (dynamically for the response)
            for thread in threads:
                thread.unread_count = self.messaging_repo.get_unread_count(thread.id, user_id)
            return {"data": threads, "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}

    def mark_as_read(self, thread_id, user_id):
        thread = MessageThread.query.get(thread_id)
        if not thread:
            return {"error": "Thread not found", "status": 404}
        
        # Participant check
        if str(thread.participant_1_id) != str(user_id) and str(thread.participant_2_id) != str(user_id):
            return {"error": "Unauthorized to access this thread", "status": 403}
            
        try:
            self.messaging_repo.mark_as_read(thread_id, user_id)
            return {"status": 204}
        except Exception as e:
            return {"error": str(e), "status": 500}
