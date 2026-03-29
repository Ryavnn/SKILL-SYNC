from repositories.invitation_repository import InvitationRepository
from repositories.project_repository import ProjectRepository
from services.notification_service import NotificationService
from models.user import User

class InvitationService:
    def __init__(self):
        self.invitation_repo = InvitationRepository()
        self.project_repo = ProjectRepository()
        self.notification_service = NotificationService()
    
    def create_invitation(self, client_id, project_id, freelancer_id, message=None):
        """Create an invitation from client to freelancer"""
        # Verify project exists and belongs to client
        project = self.project_repo.get_project_by_id(project_id)
        if not project:
            return {"error": "Project not found", "status": 404}
        
        if str(project.client_id) != str(client_id):
            return {"error": "You can only invite freelancers to your own projects", "status": 403}
        
        # Verify freelancer exists
        freelancer = User.query.get(freelancer_id)
        if not freelancer or freelancer.role != 'freelancer':
            return {"error": "Freelancer not found", "status": 404}
        
        # Check for existing invitation
        existing = self.invitation_repo.check_existing_invitation(project_id, freelancer_id)
        if existing:
            return {"error": "An invitation already exists for this freelancer on this project", "status": 400}
        
        # Get client info
        client = User.query.get(client_id)
        
        try:
            # Create invitation
            invitation_data = {
                'project_id': project_id,
                'freelancer_id': freelancer_id,
                'client_id': client_id,
                'message': message or f"You've been invited to work on: {project.title}"
            }
            invitation = self.invitation_repo.create_invitation(invitation_data)
            
            # Create notification for freelancer
            self.notification_service.create_notification(
                freelancer_id,
                'project_invitation',
                f"{client.name} invited you to work on '{project.title}'"
            )
            
            return {"data": invitation, "status": 201}
        except Exception as e:
            return {"error": str(e), "status": 500}
    
    def get_freelancer_invitations(self, freelancer_id):
        """Get all invitations for a freelancer"""
        try:
            invitations = self.invitation_repo.get_freelancer_invitations(freelancer_id)
            return {"data": invitations, "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}
    
    def accept_invitation(self, invitation_id, freelancer_id):
        """Accept an invitation and assign freelancer to project"""
        invitation = self.invitation_repo.get_invitation_by_id(invitation_id)
        
        if not invitation:
            return {"error": "Invitation not found", "status": 404}
        
        if str(invitation.freelancer_id) != str(freelancer_id):
            return {"error": "You are not authorized to accept this invitation", "status": 403}
        
        if invitation.status != 'pending':
            return {"error": f"Invitation is already {invitation.status}", "status": 400}
        
        try:
            # Update invitation status
            self.invitation_repo.update_invitation_status(invitation, 'accepted')
            
            # Update project with assigned freelancer
            project = invitation.project
            self.project_repo.update_project(project, {
                'assigned_freelancer_id': freelancer_id,
                'status': 'in_progress'
            })
            
            # Notify client
            self.notification_service.create_notification(
                invitation.client_id,
                'invitation_accepted',
                f"Freelancer accepted your invitation for '{project.title}'"
            )
            
            return {"data": invitation, "message": "Invitation accepted successfully", "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}
    
    def decline_invitation(self, invitation_id, freelancer_id):
        """Decline an invitation"""
        invitation = self.invitation_repo.get_invitation_by_id(invitation_id)
        
        if not invitation:
            return {"error": "Invitation not found", "status": 404}
        
        if str(invitation.freelancer_id) != str(freelancer_id):
            return {"error": "You are not authorized to decline this invitation", "status": 403}
        
        if invitation.status != 'pending':
            return {"error": f"Invitation is already {invitation.status}", "status": 400}
        
        try:
            # Update invitation status
            self.invitation_repo.update_invitation_status(invitation, 'declined')
            
            # Notify client
            self.notification_service.create_notification(
                invitation.client_id,
                'invitation_declined',
                f"Freelancer declined your invitation for '{invitation.project.title}'"
            )
            
            return {"data": invitation, "message": "Invitation declined", "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}
