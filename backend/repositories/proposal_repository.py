from app import db
from models.proposal import Proposal
from sqlalchemy.exc import SQLAlchemyError

class ProposalRepository:
    @staticmethod
    def create_proposal(proposal_data):
        try:
            proposal = Proposal(**proposal_data)
            db.session.add(proposal)
            
            # Update project proposals_count safely
            from models.project import Project
            project = Project.query.get(proposal.project_id)
            if project:
                if project.proposals_count is None:
                    project.proposals_count = 0
                project.proposals_count += 1
                
            db.session.commit()
            return proposal
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    @staticmethod
    def get_proposal_by_id(proposal_id):
        return Proposal.query.get(proposal_id)

    @staticmethod
    def get_proposals_by_project(project_id):
        return Proposal.query.filter_by(project_id=project_id).order_by(Proposal.created_at.desc()).all()

    @staticmethod
    def get_proposals_by_freelancer(freelancer_id):
        return Proposal.query.filter_by(freelancer_id=freelancer_id).order_by(Proposal.created_at.desc()).all()

    @staticmethod
    def update_proposal(proposal, update_data):
        try:
            for key, value in update_data.items():
                setattr(proposal, key, value)
            db.session.commit()
            return proposal
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
