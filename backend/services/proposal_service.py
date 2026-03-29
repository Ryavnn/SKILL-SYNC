from repositories.proposal_repository import ProposalRepository
from repositories.project_repository import ProjectRepository

class ProposalService:
    def __init__(self):
        self.proposal_repo = ProposalRepository()
        self.project_repo = ProjectRepository()

    def submit_proposal(self, freelancer_id, proposal_data):
        proposal_data['freelancer_id'] = freelancer_id
        try:
            # Check if project exists
            project = self.project_repo.get_project_by_id(proposal_data['project_id'])
            if not project:
                return {"error": "Project not found", "status": 404}
            
            # Check if freelancer already applied
            existing = [p for p in project.proposals if str(p.freelancer_id) == str(freelancer_id)]
            if existing:
                return {"error": "You have already applied to this project", "status": 400}

            proposal = self.proposal_repo.create_proposal(proposal_data)
            return {"data": proposal, "status": 201}
        except Exception as e:
            return {"error": str(e), "status": 500}

    def get_project_proposals(self, project_id, client_id):
        project = self.project_repo.get_project_by_id(project_id)
        if not project:
            return {"error": "Project not found", "status": 404}
        
        if str(project.client_id) != str(client_id):
            return {"error": "Unauthorized to view proposals for this project", "status": 403}

        proposals = self.proposal_repo.get_proposals_by_project(project_id)
        return {"data": proposals, "status": 200}

    def update_proposal_status(self, proposal_id, client_id, status):
        proposal = self.proposal_repo.get_proposal_by_id(proposal_id)
        if not proposal:
            return {"error": "Proposal not found", "status": 404}
        
        if str(proposal.project.client_id) != str(client_id):
            return {"error": "Unauthorized to update this proposal", "status": 403}

        if status not in ['accepted', 'rejected']:
            return {"error": "Invalid status", "status": 400}

        try:
            updated_proposal = self.proposal_repo.update_proposal(proposal, {'status': status})
            
            # If accepted, we might want to update the project status or assigned_freelancer_id
            if status == 'accepted':
                self.project_repo.update_project(proposal.project, {
                    'status': 'in_progress',
                    'assigned_freelancer_id': proposal.freelancer_id
                })
                
            return {"data": updated_proposal, "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}
