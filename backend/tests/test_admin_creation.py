import os
import sys
import pytest
import bcrypt

# Add the project root to sys.path so 'app' can be found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from models.user import User
from scripts.create_admin import create_admin_user

@pytest.fixture(scope='function')
def test_app():
    # Use testing config
    os.environ['FLASK_CONFIG'] = 'testing'
    app = create_app()
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

def test_admin_creation(test_app):
    admin = create_admin_user()
    assert admin is not None
    assert admin.role == 'admin'
    
    # Verify login works
    from services.auth_service import AuthService
    
    DEFAULT_ADMIN_EMAIL = test_app.config.get('DEFAULT_ADMIN_EMAIL', 'admin@skillsync.com')
    DEFAULT_ADMIN_PASSWORD = test_app.config.get('DEFAULT_ADMIN_PASSWORD', 'admin123')
    
    auth_service = AuthService()
    result = auth_service.login_user({'email': DEFAULT_ADMIN_EMAIL, 'password': DEFAULT_ADMIN_PASSWORD})
    
    assert result['status'] == 200
    assert 'token' in result
