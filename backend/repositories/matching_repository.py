from app import db
from models.project import Project
from models.freelancer import FreelancerProfile, Skill
from models.user import User

class MatchingRepository:
    @staticmethod
    def get_project_with_skills(project_id):
        """Fetch project and its required skills."""
        return Project.query.get(project_id)

    @staticmethod
    def get_all_freelancers_with_skills():
        """Fetch all freelancers with their skills and user bio."""
        return FreelancerProfile.query.options(
            db.joinedload(FreelancerProfile.skills),
            db.joinedload(FreelancerProfile.user)
        ).all()
