from app import db
from models.referral import Referral, ReferralHistory
from models.project import Project
from services.referral_validation_service import ReferralValidationService
from services.notification_trigger import (
    trigger_referral_created, 
    trigger_referral_accepted, 
    trigger_referral_rejected
)
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

class ReferralService:
    def __init__(self):
        self.validation_service = ReferralValidationService()

    def create_referral(self, project_id, referrer_id, referred_freelancer_id, message=None):
        # 1. Validate creation
        validation_error = self.validation_service.validate_creation(
            project_id=project_id,
            referrer_id=referrer_id,
            referred_freelancer_id=referred_freelancer_id
        )
        if validation_error:
            return validation_error
        
        try:
            # 2. Calculate expiration (e.g., 7 days)
            expires_at = datetime.utcnow() + timedelta(days=7)
            
            # 3. Create referral
            referral = Referral(
                project_id=project_id,
                referrer_id=referrer_id,
                referred_freelancer_id=referred_freelancer_id,
                message=message,
                expires_at=expires_at,
                status='pending'
            )
            db.session.add(referral)
            db.session.flush() # Get the ID
            
            # 4. Create history entry
            history = ReferralHistory(
                referral_id=referral.id,
                action='created',
                performed_by=referrer_id
            )
            db.session.add(history)
            
            db.session.commit()
            
            # 5. Trigger notification
            trigger_referral_created(referral)
            
            return {"data": referral, "status": 201}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def accept_referral(self, referral_id, user_id):
        referral = Referral.query.get(referral_id)
        if not referral:
            return {"error": "Referral not found", "status": 404}
            
        # Only the referred freelancer can accept
        if str(referral.referred_freelancer_id) != str(user_id):
            return {"error": "Unauthorized to accept this referral", "status": 403}
        
        # Validate status transition
        transition_error = self.validation_service.validate_transition(referral, 'accepted')
        if transition_error:
            return transition_error
            
        try:
            # Update status
            referral.status = 'accepted'
            
            # Update project assignment
            project = Project.query.get(referral.project_id)
            project.assigned_freelancer_id = user_id
            
            # Add history
            history = ReferralHistory(
                referral_id=referral.id,
                action='accepted',
                performed_by=user_id
            )
            db.session.add(history)
            
            db.session.commit()
            
            # Trigger notification
            trigger_referral_accepted(referral)
            
            return {"data": referral, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def reject_referral(self, referral_id, user_id):
        referral = Referral.query.get(referral_id)
        if not referral:
            return {"error": "Referral not found", "status": 404}
            
        if str(referral.referred_freelancer_id) != str(user_id):
            return {"error": "Unauthorized to reject this referral", "status": 403}
            
        transition_error = self.validation_service.validate_transition(referral, 'rejected')
        if transition_error:
            return transition_error
            
        try:
            referral.status = 'rejected'
            
            history = ReferralHistory(
                referral_id=referral.id,
                action='rejected',
                performed_by=user_id
            )
            db.session.add(history)
            db.session.commit()
            
            trigger_referral_rejected(referral)
            
            return {"data": referral, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def get_user_referrals(self, user_id, r_type='incoming'):
        if r_type == 'incoming':
            referrals = Referral.query.filter_by(referred_freelancer_id=user_id).all()
        else:
            referrals = Referral.query.filter_by(referrer_id=user_id).all()
        return {"data": referrals, "status": 200}

    def get_referral_stats(self, user_id):
        """Aggregate outgoing referral counts per status for the given user."""
        # Group counts by status in a single query
        rows = (
            db.session.query(Referral.status, func.count(Referral.id))
            .filter(Referral.referrer_id == user_id)
            .group_by(Referral.status)
            .all()
        )

        counts = {status: count for status, count in rows}
        total = sum(counts.values())

        data = {
            "total_referrals":    total,
            "pending_referrals":  counts.get('pending',  0),
            "accepted_referrals": counts.get('accepted', 0),
            "rejected_referrals": counts.get('rejected', 0),
            "expired_referrals":  counts.get('expired',  0),
            # Reward tracking not yet implemented — placeholder 0
            "total_earned": 0.0,
        }
        return {"data": data, "status": 200}

    def get_referral_history_enriched(self, user_id):
        """Return outgoing referrals enriched with project title and referred user name."""
        referrals = (
            Referral.query
            .filter_by(referrer_id=user_id)
            .order_by(Referral.created_at.desc())
            .all()
        )

        items = []
        for r in referrals:
            # Access ORM relationships (loaded within active app context)
            project_title  = r.project.title if r.project else 'Unknown Project'
            referred_name  = r.referred_freelancer.name if r.referred_freelancer else 'Unknown User'

            items.append({
                "id":             str(r.id),
                "project_title":  project_title,
                "referred_user":  referred_name,
                "status":         r.status,
                "created_at":     r.created_at,
                "reward":         0.0,   # placeholder until reward column is added
            })

        return {"data": items, "status": 200}

    def expire_referrals(self):
        # Auto-expire pending referrals that passed expires_at
        now = datetime.utcnow()
        expired_referrals = Referral.query.filter(
            Referral.status == 'pending',
            Referral.expires_at < now
        ).all()
        
        count = 0
        for referral in expired_referrals:
            referral.status = 'expired'
            history = ReferralHistory(
                referral_id=referral.id,
                action='expired',
                performed_by=referral.referrer_id # System action, but attributed to context or generic admin
            )
            db.session.add(history)
            count += 1
            
        if count > 0:
            db.session.commit()
            
        return {"count": count}
