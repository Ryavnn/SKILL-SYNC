from models.admin import AdminActionLog
from app import db

class AuditLogService:
    """Service for mandatory tracking of all administrative actions."""

    @staticmethod
    def log_action(admin_id, action_type, target_type, target_id, action_metadata=None):
        """Records an admin action in the audit log."""
        log = AdminActionLog(
            admin_id=admin_id,
            action_type=action_type,
            target_type=target_type,
            target_id=str(target_id),
            action_metadata=action_metadata
        )
        db.session.add(log)
        db.session.commit()
        return log
