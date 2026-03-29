from app import db
from models.user import User

class UserRepository:
    def get_by_id(self, user_id):
        return User.query.get(user_id)

    def get_by_email(self, email):
        return User.query.filter_by(email=email).first()

    def get_all(self):
        return User.query.all()

    def create(self, user):
        db.session.add(user)
        db.session.commit()
        return user

    def save(self, user):
        db.session.add(user)
        db.session.commit()
        return user
