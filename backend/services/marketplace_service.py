from models.freelancer import FreelancerProfile, Skill
from models.user import User
from app import db
from sqlalchemy import or_

class MarketplaceService:
    def search_freelancers(self, search_term=None, skills=None, min_experience=0, verified_only=False):
        query = FreelancerProfile.query.join(User)
        
        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_pattern),
                    FreelancerProfile.title.ilike(search_pattern),
                    FreelancerProfile.bio.ilike(search_pattern)
                )
            )
        
        if skills:
            for skill_name in skills:
                query = query.filter(FreelancerProfile.skills.any(Skill.name.ilike(skill_name)))
                
        # Handle experience filtering
        if min_experience > 0:
            levels = []
            if min_experience <= 2:
                levels = ['junior', 'mid', 'senior', 'expert']
            elif min_experience <= 5:
                levels = ['mid', 'senior', 'expert']
            elif min_experience <= 9:
                levels = ['senior', 'expert']
            else:
                levels = ['expert']
            
            query = query.filter(FreelancerProfile.experience_level.in_(levels))
            
        if verified_only:
            query = query.filter(FreelancerProfile.verification_status == 'verified')
            
        return query.all()
