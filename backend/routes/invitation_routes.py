from flask import Blueprint
from controllers.invitation_controller import InvitationController

invitation_bp = Blueprint('invitations', __name__)
controller = InvitationController()

@invitation_bp.route('', methods=['POST'])
def create_invitation():
    """Client sends an invitation to a freelancer"""
    return controller.create_invitation()

@invitation_bp.route('/my', methods=['GET'])
def get_my_invitations():
    """Freelancer gets their invitations"""
    return controller.get_my_invitations()

@invitation_bp.route('/<invitation_id>/accept', methods=['POST'])
def accept_invitation(invitation_id):
    """Freelancer accepts an invitation"""
    return controller.accept_invitation(invitation_id)

@invitation_bp.route('/<invitation_id>/decline', methods=['POST'])
def decline_invitation(invitation_id):
    """Freelancer declines an invitation"""
    return controller.decline_invitation(invitation_id)
