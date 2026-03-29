from app import db
from models.freelancer import Skill
from repositories.admin_repository import AdminRepository
from services.audit_log_service import AuditLogService
from sqlalchemy.exc import SQLAlchemyError

class SkillService:
    """Service for managing the platform's skill taxonomy."""

    def __init__(self):
        self.repo = AdminRepository()
        self.audit = AuditLogService()

    def add_skill(self, admin_id, name):
        """Adds a new skill to the taxonomy."""
        existing = self.repo.get_skill_by_name(name)
        if existing:
            return {"error": "Skill already exists", "status": 400}

        try:
            skill = Skill(name=name)
            db.session.add(skill)
            db.session.commit()

            self.audit.log_action(
                admin_id=admin_id,
                action_type='add_skill',
                target_type='skill',
                target_id=skill.id,
                action_metadata={"name": name}
            )

            return {"data": skill, "status": 201}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def update_skill(self, admin_id, skill_id, new_name):
        """Renames an existing skill."""
        skill = self.repo.get_skill_by_id(skill_id)
        if not skill:
            return {"error": "Skill not found", "status": 404}

        try:
            old_name = skill.name
            skill.name = new_name
            db.session.commit()

            self.audit.log_action(
                admin_id=admin_id,
                action_type='update_skill',
                target_type='skill',
                target_id=skill_id,
                action_metadata={"old_name": old_name, "new_name": new_name}
            )

            return {"data": skill, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def delete_skill(self, admin_id, skill_id):
        """Deactivates/removes a skill. Caution: affects Many-to-Many links."""
        skill = self.repo.get_skill_by_id(skill_id)
        if not skill:
            return {"error": "Skill not found", "status": 404}

        try:
            db.session.delete(skill)
            db.session.commit()

            self.audit.log_action(
                admin_id=admin_id,
                action_type='delete_skill',
                target_type='skill',
                target_id=skill_id,
                action_metadata={"name": skill.name}
            )

            return {"message": "Skill removed", "status": 204}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}
