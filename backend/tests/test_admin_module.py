import pytest
import uuid
from decimal import Decimal
from app import db
from models.user import User
from models.project import Project
from models.freelancer import FreelancerProfile, Skill
from models.admin import AdminActionLog
from services.admin_service import AdminService
from services.moderation_service import ModerationService
from services.analytics_service import AnalyticsService
from services.skill_service import SkillService
from services.audit_log_service import AuditLogService

from app import create_app, db

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        db.session.expire_on_commit = False
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def admin_user(app):
    with app.app_context():
        user = User(
            name="Platform Admin",
            email="admin@skillsync.com",
            password_hash="hashed",
            role="admin"
        )
        db.session.add(user)
        db.session.commit()
        return User.query.filter_by(email="admin@skillsync.com").first()

@pytest.fixture
def test_client_user(app):
    with app.app_context():
        user = User(
            name="Test Client",
            email="client@test.com",
            password_hash="hashed",
            role="client"
        )
        db.session.add(user)
        db.session.commit()
        return User.query.filter_by(email="client@test.com").first()

@pytest.fixture
def test_freelancer_profile(app, test_client_user):
    with app.app_context():
        # Using a separate freelancer user
        f_user = User(
            name="Test Freelancer",
            email="free@test.com",
            password_hash="hashed",
            role="freelancer"
        )
        db.session.add(f_user)
        db.session.commit()
        f_user = User.query.filter_by(email="free@test.com").first()
        
        profile = FreelancerProfile(
            user_id=f_user.id,
            experience_level="mid",
            verification_status="unverified"
        )
        db.session.add(profile)
        db.session.commit()
        return FreelancerProfile.query.filter_by(user_id=f_user.id).first()

class TestAdminModule:

    # --- User Management Tests ---
    def test_update_user_role(self, app, admin_user, test_client_user):
        admin_svc = AdminService()
        with app.app_context():
            result = admin_svc.update_user_role(admin_user.id, test_client_user.id, 'freelancer')
            assert result["status"] == 200
            
            updated_user = User.query.get(test_client_user.id)
            assert updated_user.role == 'freelancer'
            
            # Check Audit Log
            log = AdminActionLog.query.filter_by(action_type='update_user_role').first()
            assert log is not None
            assert log.admin_id == admin_user.id
            assert log.target_id == str(test_client_user.id)

    def test_deactivate_user_safety_guard(self, app, admin_user):
        admin_svc = AdminService()
        with app.app_context():
            # Try to deactivate the ONLY admin
            result = admin_svc.toggle_user_status(admin_user.id, admin_user.id, False)
            assert result["status"] == 400
            assert "Cannot deactivate the last active admin" in result["error"]
            
            active_admin = User.query.get(admin_user.id)
            assert active_admin.is_active is True

    # --- Moderation Tests ---
    def test_verify_freelancer(self, app, admin_user, test_freelancer_profile):
        mod_svc = ModerationService()
        with app.app_context():
            result = mod_svc.verify_freelancer(admin_user.id, test_freelancer_profile.id, 'verified')
            assert result["status"] == 200
            
            updated_profile = FreelancerProfile.query.get(test_freelancer_profile.id)
            assert updated_profile.verification_status == 'verified'
            
            log = AdminActionLog.query.filter_by(action_type='verify_freelancer').first()
            assert log.action_metadata['status'] == 'verified'

    def test_flag_project(self, app, admin_user, test_client_user):
        mod_svc = ModerationService()
        with app.app_context():
            project = Project(
                client_id=test_client_user.id,
                title="Dodgy Project",
                description="Needs flagging",
                budget="1000",
                timeline="1 week"
            )
            db.session.add(project)
            db.session.commit()
            project_id = project.id
            
            result = mod_svc.flag_project(admin_user.id, project_id, True)
            assert result["status"] == 200
            
            updated_project = Project.query.get(project_id)
            assert updated_project.is_flagged is True

    # --- Skill Management Tests ---
    def test_skill_taxonomy_management(self, app, admin_user):
        skill_svc = SkillService()
        with app.app_context():
            # Add
            result = skill_svc.add_skill(admin_user.id, "Python")
            assert result["status"] == 201
            skill_id = result["data"].id
            
            # Update
            result = skill_svc.update_skill(admin_user.id, skill_id, "Python Expert")
            assert result["status"] == 200
            assert Skill.query.get(skill_id).name == "Python Expert"
            
            # Delete
            result = skill_svc.delete_skill(admin_user.id, skill_id)
            assert result["status"] == 204
            assert Skill.query.get(skill_id) is None

    # --- Analytics Tests ---
    def test_analytics_overview(self, app, admin_user, test_client_user):
        analytics_svc = AnalyticsService()
        with app.app_context():
            result = analytics_svc.get_dashboard_overview()
            assert result["status"] == 200
            stats = result["data"]
            
            assert stats["total_users"] >= 2
            assert "total_volume" in stats
            assert "dispute_rate" in stats
