from app import db
from models.invitation import Invitation
from datetime import datetime

class InvitationRepository:
    def create_invitation(self, data):
        """Create a new invitation"""
        invitation = Invitation(
            project_id=data['project_id'],
            freelancer_id=data['freelancer_id'],
            client_id=data['client_id'],
            message=data.get('message', ''),
            status='pending'
        )
        db.session.add(invitation)
        db.session.commit()
        return invitation
    
    def get_invitation_by_id(self, invitation_id):
        """Get invitation by ID"""
        return Invitation.query.get(invitation_id)
    
    def get_project_invitations(self, project_id):
        """Get all invitations for a project"""
        return Invitation.query.filter_by(project_id=project_id).all()
    
    def get_freelancer_invitations(self, freelancer_id, status=None):
        """Get invitations for a freelancer, optionally filtered by status"""
        query = Invitation.query.filter_by(freelancer_id=freelancer_id)
        if status:
            query = query.filter_by(status=status)
        return query.order_by(Invitation.created_at.desc()).all()
    
    def update_invitation_status(self, invitation, status):
        """Update invitation status"""
        invitation.status = status
        invitation.updated_at = datetime.utcnow()
        db.session.commit()
        return invitation
    
    def check_existing_invitation(self, project_id, freelancer_id):
        """Check if an invitation already exists"""
        return Invitation.query.filter_by(
            project_id=project_id,
            freelancer_id=freelancer_id
        ).filter(Invitation.status.in_(['pending', 'accepted'])).first()
