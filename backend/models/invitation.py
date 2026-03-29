from app import db
from datetime import datetime
import uuid

class Invitation(db.Model):
    __tablename__ = 'invitations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    freelancer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    client_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    message = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('Project', backref='invitations')
    freelancer = db.relationship('User', foreign_keys=[freelancer_id], backref='received_invitations')
    client = db.relationship('User', foreign_keys=[client_id], backref='sent_invitations')
    
    def __repr__(self):
        return f'<Invitation {self.id} - Project: {self.project_id}, Freelancer: {self.freelancer_id}, Status: {self.status}>'
