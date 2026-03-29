from flask import Blueprint
from controllers.proposal_controller import ProposalController

proposal_bp = Blueprint('proposals', __name__)
proposal_controller = ProposalController()

@proposal_bp.route('/submit', methods=['POST'])
def submit_proposal():
    return proposal_controller.submit_proposal()

@proposal_bp.route('/project/<project_id>', methods=['GET'])
def get_project_proposals(project_id):
    return proposal_controller.get_project_proposals(project_id)

@proposal_bp.route('/<proposal_id>/status', methods=['PATCH'])
def update_proposal_status(proposal_id):
    return proposal_controller.update_proposal_status(proposal_id)
