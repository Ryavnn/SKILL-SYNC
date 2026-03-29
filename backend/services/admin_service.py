from app import db
from repositories.admin_repository import AdminRepository
from services.audit_log_service import AuditLogService
from sqlalchemy.exc import SQLAlchemyError

class AdminService:
    """Service for managing platform users and roles."""

    def __init__(self):
        self.repo = AdminRepository()
        self.audit = AuditLogService()

    def list_users(self):
        users = self.repo.get_all_users()
        return {"data": users, "status": 200}

    def update_user_role(self, admin_id, user_id, new_role):
        """Updates a user's role and logs the action."""
        user = self.repo.get_user_by_id(user_id)
        if not user:
            return {"error": "User not found", "status": 404}

        valid_roles = ['client', 'freelancer', 'admin']
        if new_role not in valid_roles:
            return {"error": f"Invalid role. Must be one of {valid_roles}", "status": 400}

        # Safety check: Cannot remove the last admin
        if user.role == 'admin' and new_role != 'admin':
            admin_count = self.repo.get_all_users() # Filtered by role would be better, but count is small
            admins = [u for u in admin_count if u.role == 'admin' and u.is_active]
            if len(admins) <= 1:
                return {"error": "Operation aborted: Platform must have at least one active admin", "status": 400}

        try:
            old_role = user.role
            user.role = new_role
            db.session.commit()

            self.audit.log_action(
                admin_id=admin_id,
                action_type='update_user_role',
                target_type='user',
                target_id=user_id,
                action_metadata={"old_role": old_role, "new_role": new_role}
            )

            return {"data": user, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def toggle_user_status(self, admin_id, user_id, is_active):
        """Deactivates/Activates a user account."""
        user = self.repo.get_user_by_id(user_id)
        if not user:
            return {"error": "User not found", "status": 404}

        if user.role == 'admin' and not is_active:
             # Safety check: Cannot deactivate the last admin
            admins = [u for u in self.repo.get_all_users() if u.role == 'admin' and u.is_active]
            if len(admins) <= 1:
                return {"error": "Operation aborted: Cannot deactivate the last active admin", "status": 400}

        try:
            user.is_active = is_active
            db.session.commit()

            action = 'deactivate_user' if not is_active else 'activate_user'
            self.audit.log_action(
                admin_id=admin_id,
                action_type=action,
                target_type='user',
                target_id=user_id
            )

            return {"data": user, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}
