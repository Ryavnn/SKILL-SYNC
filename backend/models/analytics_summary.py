import uuid
from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID

class AnalyticsSummary(db.Model):
    __tablename__ = 'analytics_summary'

    # Using a simple integer ID since we'll only ever have one row
    id = db.Column(db.Integer, primary_key=True, default=1)
    
    total_users = db.Column(db.Integer, default=0)
    total_revenue = db.Column(db.Float, default=0.0)
    total_projects = db.Column(db.Integer, default=0)
    dispute_rate = db.Column(db.Float, default=0.0)
    total_volume = db.Column(db.Float, default=0.0)
    in_escrow = db.Column(db.Float, default=0.0)
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<AnalyticsSummary updated_at={self.updated_at}>"
