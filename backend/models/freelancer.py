import uuid
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID

# Association table for Freelancer and Skill (Many-to-Many)
freelancer_skills = db.Table('freelancer_skills',
    db.Column('freelancer_id', UUID(as_uuid=True), db.ForeignKey('freelancer_profiles.id'), primary_key=True),
    db.Column('skill_id', db.Integer, db.ForeignKey('skills.id'), primary_key=True)
)

class Skill(db.Model):
    __tablename__ = 'skills'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)

    def __repr__(self):
        return f'<Skill {self.name}>'

class FreelancerProfile(db.Model):
    __tablename__ = 'freelancer_profiles'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    experience_level = db.Column(db.String(20), nullable=False) # junior, mid, senior
    portfolio_links = db.Column(db.JSON, nullable=True) # list of URLs
    location = db.Column(db.String(100), nullable=True)
    hourly_rate = db.Column(db.Numeric(10, 2), nullable=True)
    verification_status = db.Column(db.String(20), default='unverified') # unverified, verified, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('freelancer_profile', uselist=False))
    skills = db.relationship(Skill, secondary=freelancer_skills, backref=db.backref('freelancers', lazy='dynamic'))

    def __repr__(self):
        return f'<FreelancerProfile {self.id}>'

class Credential(db.Model):
    __tablename__ = 'credentials'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    freelancer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('freelancer_profiles.id'), nullable=False)
    document_url = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='unverified') # unverified, verified, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    freelancer = db.relationship('FreelancerProfile', backref=db.backref('credentials', lazy=True))

    def __repr__(self):
        return f'<Credential {self.id}>'
