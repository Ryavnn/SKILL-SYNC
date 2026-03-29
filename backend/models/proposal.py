import uuid
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID

class Proposal(db.Model):
    __tablename__ = 'proposals'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id'), nullable=False)
    freelancer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    cover_letter = db.Column(db.Text, nullable=False)
    bid_amount = db.Column(db.Numeric(12, 2), nullable=False)
    estimated_duration = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='pending', nullable=False) # pending, accepted, rejected, withdrawn
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = db.relationship('Project', backref=db.backref('proposals', lazy=True, cascade='all, delete-orphan'))
    freelancer = db.relationship('User', foreign_keys=[freelancer_id], backref=db.backref('proposals', lazy=True))

    def __repr__(self):
        return f'<Proposal {self.id} Status: {self.status}>'
