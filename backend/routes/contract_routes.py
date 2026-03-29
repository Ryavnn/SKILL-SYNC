from flask import Blueprint
from controllers.contract_controller import ContractController

contract_bp = Blueprint('contract', __name__)
controller = ContractController()

@contract_bp.route('/create', methods=['POST'])
def create_contract():
    return controller.create_contract()

@contract_bp.route('/', methods=['GET'])
def get_user_contracts():
    return controller.get_user_contracts()

@contract_bp.route('/<uuid:id>', methods=['GET'])
def get_contract(id):
    return controller.get_contract(str(id))

@contract_bp.route('/<uuid:id>/accept', methods=['PATCH'])
def accept_contract(id):
    return controller.accept_contract(str(id))

@contract_bp.route('/<uuid:id>/reject', methods=['PATCH'])
def reject_contract(id):
    return controller.reject_contract(str(id))

@contract_bp.route('/<uuid:id>/fund', methods=['POST'])
def fund_escrow(id):
    return controller.fund_escrow(str(id))

@contract_bp.route('/<uuid:id>/escrow', methods=['GET'])
def get_escrow_summary(id):
    return controller.get_escrow_summary(str(id))

@contract_bp.route('/milestones/<uuid:id>/submit', methods=['PATCH'])
def submit_milestone(id):
    return controller.submit_milestone(str(id))

@contract_bp.route('/milestones/<uuid:id>/approve', methods=['PATCH'])
def approve_milestone(id):
    return controller.approve_milestone(str(id))

@contract_bp.route('/<uuid:id>/milestones/add', methods=['POST'])
def add_milestone_to_contract(id):
    return controller.add_milestone(str(id))
