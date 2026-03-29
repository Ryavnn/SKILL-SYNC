from models.referral import Referral
from models.project import Project
from models.user import User
from flask import current_app
from datetime import datetime, timedelta

class ReferralValidationService:
    @staticmethod
    def validate_creation(project_id, referrer_id, referred_freelancer_id):
        # 1. Project must exist
        project = Project.query.get(project_id)
        if not project:
            return {"error": "Project not found", "status": 404}
        
        # 2. Only assigned freelancer can refer
        if not project.assigned_freelancer_id or str(project.assigned_freelancer_id) != str(referrer_id):
            return {"error": "Only the assigned freelancer can refer this project", "status": 403}
        
        # 3. Cannot refer to self
        if str(referrer_id) == str(referred_freelancer_id):
            return {"error": "You cannot refer a project to yourself", "status": 400}
        
        # 4. Referred freelancer must exist and be a freelancer
        referred_user = User.query.get(referred_freelancer_id)
        if not referred_user or referred_user.role != 'freelancer':
            return {"error": "Referred user is not a valid freelancer", "status": 400}
        
        # 5. Check for single active referral rule
        active_referral = Referral.query.filter_by(
            project_id=project_id,
            status='pending'
        ).first()
        if active_referral:
            return {"error": "Project already has an active referral", "status": 400}
        
        # 6. Circular Referral Prevention
        # Check if the referred freelancer has previously referred this project back to the current referrer
        loop_referral = Referral.query.filter_by(
            project_id=project_id,
            referrer_id=referred_freelancer_id,
            referred_freelancer_id=referrer_id
        ).first()
        if loop_referral:
            return {"error": "Circular referral detected", "status": 400}
            
        # 7. Referral Limits (Rate Limiting)
        # Limit referrals per day (e.g., 5 per day)
        daily_limit = 5 # Could be configurable
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        referral_count = Referral.query.filter(
            Referral.referrer_id == referrer_id,
            Referral.created_at >= today
        ).count()
        if referral_count >= daily_limit:
            return {"error": "Daily referral limit reached", "status": 429}
            
        return None # Validation passed

    @staticmethod
    def validate_transition(referral, new_status):
        allowed_transitions = {
            'pending': ['accepted', 'rejected', 'expired']
        }
        
        if referral.status not in allowed_transitions:
            return {"error": f"Cannot transition from {referral.status}", "status": 400}
            
        if new_status not in allowed_transitions[referral.status]:
            return {"error": f"Invalid transition to {new_status}", "status": 400}
            
        return None
