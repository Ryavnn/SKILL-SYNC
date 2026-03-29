import uuid
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID
from .freelancer import Skill

# Association table for Project and Skill (Many-to-Many)
project_skills = db.Table('project_skills',
    db.Column('project_id', UUID(as_uuid=True), db.ForeignKey('projects.id'), primary_key=True),
    db.Column('skill_id', db.Integer, db.ForeignKey('skills.id'), primary_key=True)
)

class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    budget_min = db.Column(db.Float, nullable=True)
    budget_max = db.Column(db.Float, nullable=True)
    timeline = db.Column(db.String(100), nullable=False)
    deadline = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='open', nullable=False) # open, in_progress, completed, cancelled
    is_flagged = db.Column(db.Boolean, default=False, nullable=False)
    assigned_freelancer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    proposals_count = db.Column(db.Integer, default=0)

    # Relationships
    client = db.relationship('User', backref=db.backref('projects', lazy=True), foreign_keys=[client_id])
    assigned_freelancer = db.relationship('User', foreign_keys=[assigned_freelancer_id])
    required_skills = db.relationship(Skill, secondary=project_skills, backref=db.backref('projects', lazy='dynamic'))


    def __repr__(self):
        return f'<Project {self.title}>'
