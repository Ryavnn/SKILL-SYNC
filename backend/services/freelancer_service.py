from repositories.freelancer_repository import FreelancerRepository
from repositories.user_repository import UserRepository
from repositories.project_repository import ProjectRepository
from marshmallow import ValidationError

class FreelancerService:
    def __init__(self):
        self.freelancer_repo = FreelancerRepository()
        self.user_repo = UserRepository()

    def create_freelancer_profile(self, user_id, profile_data):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return {"error": "User not found", "status": 404}
        
        if user.role != 'freelancer':
            return {"error": "User does not have freelancer role", "status": 403}
        
        existing_profile = self.freelancer_repo.get_profile_by_user_id(user_id)
        if existing_profile:
            return {"error": "Freelancer profile already exists", "status": 400}
        
        skills = profile_data.pop('skills', [])
        profile_data['user_id'] = user_id
        
        try:
            profile = self.freelancer_repo.create_profile(profile_data, skills)
            return {"data": profile, "status": 201}
        except Exception as e:
            return {"error": str(e), "status": 500}

    def get_profile(self, profile_id):
        profile = self.freelancer_repo.get_profile_by_id(profile_id)
        
        # If not found by profile_id, try finding by user_id
        if not profile:
            profile = self.freelancer_repo.get_profile_by_user_id(profile_id)

        if not profile:
            return {"error": "Profile not found", "status": 404}
        return {"data": profile, "status": 200}

    def update_profile(self, profile_id, user_id, update_data):
        profile = self.freelancer_repo.get_profile_by_id(profile_id)
        
        # If not found by profile_id, try finding by user_id
        if not profile:
            profile = self.freelancer_repo.get_profile_by_user_id(profile_id)
            
        if not profile:
            return {"error": "Profile not found", "status": 404}
        
        if str(profile.user_id) != str(user_id):
            return {"error": "Unauthorized to update this profile", "status": 403}
        
        skills = update_data.pop('skills', None)
        
        try:
            updated_profile = self.freelancer_repo.update_profile(profile, update_data, skills)
            return {"data": updated_profile, "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}

    def get_freelancer_projects(self, user_id):
        project_repo = ProjectRepository()
        projects = project_repo.get_all_projects(filters={'assigned_freelancer_id': user_id})
        return {"data": projects, "status": 200}

    def get_freelancer_earnings(self, user_id):
        # Placeholder for complex earnings logic
        # For now, return some mocked stats based on the freelancer
        return {
            "data": {
                "total_amount": 0,
                "total_earned": 0,
                "hours_logged": "0h",
                "pending_clearance": 0,
                "active_contracts_value": 0,
                "earnings_history": []
            },
            "status": 200
        }
