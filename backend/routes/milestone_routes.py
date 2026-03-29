from flask import Blueprint
from controllers.milestone_controller import MilestoneController

milestone_bp = Blueprint('milestone', __name__)
controller = MilestoneController()

@milestone_bp.route('/<uuid:id>/submit', methods=['POST'])
def submit_milestone(id):
    return controller.submit_milestone(str(id))

@milestone_bp.route('/<uuid:id>/approve', methods=['PATCH'])
def approve_milestone(id):
    return controller.approve_milestone(str(id))

@milestone_bp.route('/<uuid:id>/release', methods=['POST'])
def release_milestone(id):
    # Payment release is triggered by approval in the service layer
    return controller.approve_milestone(str(id))
