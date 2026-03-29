import uuid
from app import db
from models.user import User
from models.project import Project
from models.freelancer import FreelancerProfile, Skill, Credential
from models.referral import Referral
from models.contract import Contract, EscrowTransaction, Dispute
from sqlalchemy import func, desc

class AdminRepository:
    """Centralized data access for administrative operations and analytics."""

    # --- User Management ---
    def get_all_users(self):
        return User.query.all()

    def get_user_by_id(self, user_id):
        return User.query.get(user_id)

    # --- Moderation ---
    def get_pending_freelancers(self):
        return FreelancerProfile.query.filter_by(verification_status='unverified').all()

    def get_freelancer_profile(self, freelancer_id):
        return FreelancerProfile.query.get(freelancer_id)

    def get_all_projects(self):
        return Project.query.all()

    def get_project_by_id(self, project_id):
        return Project.query.get(project_id)

    # --- Disputes & Transactions ---
    def get_all_disputes(self):
        return Dispute.query.order_by(desc(Dispute.created_at)).all()

    def get_dispute_by_id(self, dispute_id):
        return Dispute.query.get(dispute_id)

    def get_all_transactions(self):
        return EscrowTransaction.query.order_by(desc(EscrowTransaction.created_at)).all()

    # --- Referrals ---
    def get_all_referrals(self):
        return Referral.query.order_by(desc(Referral.created_at)).all()

    # --- Skills ---
    def get_all_skills(self):
        return Skill.query.order_by(Skill.name).all()

    def get_skill_by_id(self, skill_id):
        return Skill.query.get(skill_id)

    def get_skill_by_name(self, name):
        return Skill.query.filter(func.lower(Skill.name) == func.lower(name)).first()

    # --- Analytics & Aggregation ---
    def get_platform_stats(self):
        """Aggregate high-level platform statistics."""
        return {
            "total_users": User.query.count(),
            "active_users": User.query.filter_by(is_active=True).count(),
            "total_projects": Project.query.count(),
            "total_contracts": Contract.query.count(),
            "total_referrals": Referral.query.count(),
            "open_disputes": Dispute.query.filter_by(status='open').count()
        }

    def get_revenue_stats(self):
        """Calculate total platform volume and revenue indicators."""
        total_deposited = db.session.query(func.sum(EscrowTransaction.amount)).filter_by(type='deposit', status='completed').scalar() or 0
        total_released = db.session.query(func.sum(EscrowTransaction.amount)).filter_by(type='release', status='completed').scalar() or 0
        
        return {
            "total_volume": float(total_deposited),
            "total_payouts": float(total_released),
            "in_escrow": float(total_deposited - total_released)
        }

    # --- Audit Logging ---
    def save_log(self, log_entry):
        db.session.add(log_entry)
        db.session.commit()
