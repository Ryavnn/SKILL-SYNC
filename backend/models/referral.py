import uuid
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID

class Referral(db.Model):
    __tablename__ = 'referrals'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id'), nullable=False)
    referrer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    referred_freelancer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False) # pending, accepted, rejected, expired
    message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

    # Relationships
    project = db.relationship('Project', backref=db.backref('referrals', lazy=True))
    referrer = db.relationship('User', foreign_keys=[referrer_id], backref=db.backref('sent_referrals', lazy=True))
    referred_freelancer = db.relationship('User', foreign_keys=[referred_freelancer_id], backref=db.backref('received_referrals', lazy=True))

    def __repr__(self):
        return f'<Referral {self.id} Status: {self.status}>'

class ReferralHistory(db.Model):
    __tablename__ = 'referral_history'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referral_id = db.Column(UUID(as_uuid=True), db.ForeignKey('referrals.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False) # created, accepted, rejected, expired
    performed_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    referral = db.relationship('Referral', backref=db.backref('history', lazy=True, cascade="all, delete-orphan"))
    performer = db.relationship('User', foreign_keys=[performed_by])

    def __repr__(self):
        return f'<ReferralHistory {self.id} Action: {self.action}>'
