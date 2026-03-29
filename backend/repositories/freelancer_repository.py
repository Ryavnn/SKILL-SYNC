from app import db
from datetime import datetime
from models.freelancer import FreelancerProfile, Skill
from sqlalchemy.exc import SQLAlchemyError

class FreelancerRepository:
    @staticmethod
    def create_profile(profile_data, skills):
        try:
            profile = FreelancerProfile(**profile_data)
            
            # Normalize and link skills
            unique_skill_names = set(name.strip() for name in skills if name)
            for skill_name in unique_skill_names:
                # Case-insensitive search
                skill_obj = Skill.query.filter(Skill.name.ilike(skill_name)).first()
                if not skill_obj:
                    skill_obj = Skill(name=skill_name)
                    db.session.add(skill_obj)
                profile.skills.append(skill_obj)
            
            db.session.add(profile)
            db.session.commit()
            return profile
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def get_profile_by_id(profile_id):
        return FreelancerProfile.query.get(profile_id)

    @staticmethod
    def get_profile_by_user_id(user_id):
        return FreelancerProfile.query.filter_by(user_id=user_id).first()

    @staticmethod
    def update_profile(profile, update_data, skills=None):
        try:
            for key, value in update_data.items():
                setattr(profile, key, value)
            
            if skills is not None:
                # Update skills association safely
                new_skills = []
                unique_skill_names = set(name.strip() for name in skills if name)
                for skill_name in unique_skill_names:
                    # Case-insensitive search
                    skill_obj = Skill.query.filter(Skill.name.ilike(skill_name)).first()
                    if not skill_obj:
                        skill_obj = Skill(name=skill_name)
                        db.session.add(skill_obj)
                    new_skills.append(skill_obj)
                profile.skills = new_skills
            
            db.session.commit()
            return profile
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
