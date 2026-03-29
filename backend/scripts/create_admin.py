import os
import sys
import bcrypt

# Add the project root to sys.path so 'app' can be found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from models.user import User

app = create_app()

def create_admin_user():
    with app.app_context():
        DEFAULT_ADMIN_EMAIL = app.config.get('DEFAULT_ADMIN_EMAIL', 'admin@skillsync.com')
        DEFAULT_ADMIN_PASSWORD = app.config.get('DEFAULT_ADMIN_PASSWORD', 'admin123')
        
        hashed_password = bcrypt.hashpw(DEFAULT_ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        existing = User.query.filter_by(email=DEFAULT_ADMIN_EMAIL).first()
        if existing:
            print(f"Admin user already exists with id: {existing.id}. Updating password...")
            existing.password_hash = hashed_password
            existing.role = 'admin'
            db.session.commit()
            print("Password updated successfully.")
            return existing
        
        admin_user = User(
            name='System Administrator',
            email=DEFAULT_ADMIN_EMAIL,
            password_hash=hashed_password,
            role='admin',
            is_active=True
        )
        db.session.add(admin_user)
        db.session.commit()
        print(f"Created admin user with id: {admin_user.id}")
        return admin_user

if __name__ == '__main__':
    create_admin_user()
