import pytest
from app import create_app, db
from models.user import User
from models.project import Project
from models.freelancer import FreelancerProfile
from services.referral_service import ReferralService
from datetime import datetime
import uuid

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def freelancer_service():
    return ReferralService()

def test_create_referral_logic(app):
    with app.app_context():
        # 1. Create Users
        u1 = User(name="Referrer", email="ref@test.com", password_hash="hash", role="freelancer")
        u2 = User(name="Referred", email="target@test.com", password_hash="hash", role="freelancer")
        db.session.add_all([u1, u2])
        db.session.commit()
        
        # 2. Create Project
        p = Project(
            client_id=u1.id, # Mocking client as ref for simplicity in setup
            title="Test Project",
            description="Testing referral module implementation",
            budget="1000",
            timeline="1 month",
            assigned_freelancer_id=u1.id
        )
        db.session.add(p)
        db.session.commit()
        
        service = ReferralService()
        
        # 3. Create Referral
        result = service.create_referral(p.id, u1.id, u2.id, "Hey, check this out!")
        assert result["status"] == 201
        referral = result["data"]
        assert referral.status == 'pending'
        assert referral.referrer_id == u1.id
        
        # 4. Circular Prevention test
        result_fail = service.create_referral(p.id, u2.id, u1.id)
        assert result_fail["status"] == 400
        assert "Only the assigned freelancer" in result_fail["error"] # u2 is not assigned yet
        
        # 5. Accept Referral
        accept_res = service.accept_referral(referral.id, u2.id)
        assert accept_res["status"] == 200
        assert accept_res["data"].status == 'accepted'
        
        # 6. Verify Project Assignment updated
        db.session.refresh(p)
        assert p.assigned_freelancer_id == u2.id
