from flask import jsonify, request
from services.marketplace_service import MarketplaceService
from schemas.freelancer_schema import FreelancerProfileSchema

class MarketplaceController:
    def __init__(self):
        self.service = MarketplaceService()
        self.schema = FreelancerProfileSchema(many=True)

    def search_freelancers(self):
        search_term = request.args.get('search_term')
        skills = request.args.getlist('skills') # Expecting skills payload or multiple params
        min_experience = int(request.args.get('min_experience', 0))
        verified_only = request.args.get('verified_only', 'false').lower() == 'true'
        
        freelancers = self.service.search_freelancers(
            search_term=search_term,
            skills=skills,
            min_experience=min_experience,
            verified_only=verified_only
        )
        
        # We need to ensure the schema also picks up the user's name if we want to show it.
        # Let's adjust the schema slightly in the response if needed, 
        # but for now we'll use the existing schema which has Method fields for skills.
        
        # Manual data enrichment for the frontend if the schema doesn't have User info
        results = []
        for f in freelancers:
            data = FreelancerProfileSchema().dump(f)
            data['name'] = f.user.name
            results.append(data)
            
        return jsonify({"data": results, "status": 200}), 200
