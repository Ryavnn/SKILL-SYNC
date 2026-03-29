import re
from repositories.matching_repository import MatchingRepository

class MatchingService:
    def __init__(self):
        self.repository = MatchingRepository()

    def get_matches_for_project(self, project_id):
        project = self.repository.get_project_with_skills(project_id)
        if not project:
            return None
        
        freelancers = self.repository.get_all_freelancers_with_skills()
        
        matches = []
        for freelancer in freelancers:
            score_data = self.calculate_score(project, freelancer)
            matches.append(score_data)
        
        # Rank by score descending
        matches.sort(key=lambda x: x['score'], reverse=True)
        return matches

    def calculate_score(self, project, freelancer):
        """
        Calculate match score based on:
        - Skill Match (50%)
        - Experience Level Match (20%)
        - Verification Boost (20%)
        - Keyword Match (10%)
        """
        # 1. Skill Match (50%)
        project_skills = {s.name.lower() for s in project.required_skills}
        freelancer_skills = {s.name.lower() for s in freelancer.skills}
        
        matched_skills = project_skills & freelancer_skills
        missing_skills = project_skills - freelancer_skills
        
        skill_score = 0.0
        if project_skills:
            skill_score = len(matched_skills) / len(project_skills)
        
        # 2. Experience Level Match (20%)
        # Mapping: Junior: 0.33, Mid: 0.66, Senior: 1.0
        exp_map = {'junior': 0.33, 'mid': 0.66, 'senior': 1.0}
        experience_score = exp_map.get(freelancer.experience_level.lower(), 0.5) # Default to 0.5 if unknown
        
        # 3. Verification Boost (20%)
        verification_score = 1.0 if freelancer.verification_status == 'verified' else 0.0
        
        # 4. Keyword Match (10%)
        # Simple keyword overlap with freelancer bio
        keyword_score = 0.0
        if freelancer.bio:
            # Extract potential keywords from project description (words > 3 chars)
            desc_keywords = set(re.findall(r'\b\w{4,}\b', project.description.lower()))
            bio_text = freelancer.bio.lower()
            
            matches_found = 0
            for kw in desc_keywords:
                if kw in bio_text:
                    matches_found += 1
            
            if desc_keywords:
                # Cap at 5 matches or ratio
                keyword_score = min(matches_found / 5, 1.0)

        # Final Weighted Score
        final_score = (
            (skill_score * 0.5) +
            (experience_score * 0.2) +
            (verification_score * 0.2) +
            (keyword_score * 0.1)
        )
        
        return {
            "freelancer_id": str(freelancer.id),
            "name": freelancer.user.name,
            "score": round(final_score, 2),
            "matched_skills": list(matched_skills),
            "missing_skills": list(missing_skills),
            "is_verified": freelancer.verification_status == 'verified',
            "experience_level": freelancer.experience_level
        }
