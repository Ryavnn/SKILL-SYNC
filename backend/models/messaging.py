import uuid
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID

class MessageThread(db.Model):
    __tablename__ = 'message_threads'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    participant_1_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    participant_2_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id'), nullable=True)
    referral_id = db.Column(UUID(as_uuid=True), nullable=True) # Placeholder for future Referral module
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    messages = db.relationship('Message', backref='thread', lazy=True, cascade="all, delete-orphan")
    
    # Use overlaps to avoid relationship conflict if both refer to User
    participant_1 = db.relationship('User', foreign_keys=[participant_1_id])
    participant_2 = db.relationship('User', foreign_keys=[participant_2_id])
    project = db.relationship('Project', backref=db.backref('threads', lazy=True))

    def __repr__(self):
        return f'<MessageThread {self.id}>'

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    thread_id = db.Column(UUID(as_uuid=True), db.ForeignKey('message_threads.id'), nullable=False)
    sender_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    sender = db.relationship('User', backref=db.backref('sent_messages', lazy=True))

    def __repr__(self):
        return f'<Message {self.id} from {self.sender_id}>'
