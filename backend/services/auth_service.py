import bcrypt
from flask_jwt_extended import create_access_token
from models.user import User
from repositories.user_repository import UserRepository
from schemas.auth_schema import UserSchema

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.user_schema = UserSchema()

    def register_user(self, data):
        existing_user = self.user_repo.get_by_email(data['email'])
        if existing_user:
            return {"error": "Email already registered", "status": 400}

        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        new_user = User(
            name=data['name'],
            email=data['email'],
            password_hash=hashed_password,
            role=data['role']
        )
        
        self.user_repo.create(new_user)
        
        access_token = create_access_token(identity=str(new_user.id))
        
        return {
            "token": access_token,
            "user": self.user_schema.dump(new_user),
            "status": 201
        }

    def login_user(self, data):
        user = self.user_repo.get_by_email(data['email'])
        if not user:
            return {"error": "Invalid email or password", "status": 401}

        if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
            return {"error": "Invalid email or password", "status": 401}

        access_token = create_access_token(identity=str(user.id))
        
        return {
            "token": access_token,
            "user": self.user_schema.dump(user),
            "status": 200
        }

    def get_user_by_id(self, user_id):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return {"error": "User not found", "status": 404}
        
        return {"user": self.user_schema.dump(user), "status": 200}
