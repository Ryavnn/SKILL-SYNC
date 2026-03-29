from repositories.user_repository import UserRepository
from schemas.auth_schema import UserSchema

class UserService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.user_schema = UserSchema()

    def get_user_by_id(self, user_id):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return {"error": "User not found", "status": 404}
        
        return {"data": self.user_schema.dump(user), "status": 200}

    def get_all_users(self):
        users = self.user_repo.get_all() # Need to add this to repo
        return {"data": self.user_schema.dump(users, many=True), "status": 200}

    def update_user(self, user_id, data):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return {"error": "User not found", "status": 404}

        # Prevent email duplication if changed
        if 'email' in data and data['email'] != user.email:
            existing = self.user_repo.get_by_email(data['email'])
            if existing:
                return {"error": "Email already in use", "status": 400}
            user.email = data['email']

        if 'name' in data:
            user.name = data['name']
            
        self.user_repo.save(user)
        
        return {"data": self.user_schema.dump(user), "status": 200}
