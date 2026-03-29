import uuid
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID, JSON

class AdminActionLog(db.Model):
    __tablename__ = 'admin_action_logs'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False) # deactivate_user, verify_freelancer, flag_project, resolve_dispute, etc.
    target_type = db.Column(db.String(50), nullable=False) # user, freelancer, project, dispute, etc.
    target_id = db.Column(db.String(50), nullable=False)
    action_metadata = db.Column(JSON, nullable=True) # Any additional details
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    admin = db.relationship('User', backref=db.backref('admin_actions', lazy=True))

    def __repr__(self):
        return f'<AdminActionLog {self.action_type} by {self.admin_id}>'
