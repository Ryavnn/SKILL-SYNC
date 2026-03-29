from app import db
from repositories.admin_repository import AdminRepository
from services.audit_log_service import AuditLogService
from sqlalchemy.exc import SQLAlchemyError

class ModerationService:
    """Service for platform content moderation and verification."""

    def __init__(self):
        self.repo = AdminRepository()
        self.audit = AuditLogService()

    # --- Freelancer Verification ---
    def list_pending_verifications(self):
        freelancers = self.repo.get_pending_freelancers()
        return {"data": freelancers, "status": 200}

    def verify_freelancer(self, admin_id, freelancer_id, status):
        """Verify or reject a freelancer profile."""
        if status not in ['verified', 'rejected']:
            return {"error": "Invalid status. Must be 'verified' or 'rejected'", "status": 400}

        profile = self.repo.get_freelancer_profile(freelancer_id)
        if not profile:
            return {"error": "Freelancer profile not found", "status": 404}

        try:
            profile.verification_status = status
            db.session.commit()

            self.audit.log_action(
                admin_id=admin_id,
                action_type='verify_freelancer',
                target_type='freelancer_profile',
                target_id=freelancer_id,
                action_metadata={"status": status}
            )

            return {"data": profile, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    # --- Project Moderation ---
    def flag_project(self, admin_id, project_id, is_flagged):
        """Flag or unflag a project as suspicious."""
        project = self.repo.get_project_by_id(project_id)
        if not project:
            return {"error": "Project not found", "status": 404}

        try:
            project.is_flagged = is_flagged
            db.session.commit()

            action = 'flag_project' if is_flagged else 'unflag_project'
            self.audit.log_action(
                admin_id=admin_id,
                action_type=action,
                target_type='project',
                target_id=project_id
            )

            return {"data": project, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def remove_project(self, admin_id, project_id, reason):
        """Moderator removal of a project listing."""
        project = self.repo.get_project_by_id(project_id)
        if not project:
            return {"error": "Project not found", "status": 404}

        try:
            # Soft delete logic — set status to cancelled
            # If we had a deleted_at field, we'd use it here.
            # Spec says "soft delete where possible", so we update status.
            project.status = 'cancelled'
            db.session.commit()

            self.audit.log_action(
                admin_id=admin_id,
                action_type='remove_project',
                target_type='project',
                target_id=project_id,
                action_metadata={"reason": reason}
            )

            return {"message": "Project listing removed successfully", "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}
