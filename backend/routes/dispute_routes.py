from flask import Blueprint
from controllers.dispute_controller import DisputeController

dispute_bp = Blueprint('dispute', __name__)
controller = DisputeController()

@dispute_bp.route('/create', methods=['POST'])
def create_dispute():
    return controller.create_dispute()

@dispute_bp.route('/<uuid:id>/resolve', methods=['PATCH'])
def resolve_dispute(id):
    return controller.resolve_dispute(str(id))

@dispute_bp.route('/<uuid:id>', methods=['GET'])
def get_dispute(id):
    return controller.get_dispute(str(id))
