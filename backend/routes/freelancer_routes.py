from flask import Blueprint, jsonify
from controllers.freelancer_controller import FreelancerController

freelancer_bp = Blueprint('freelancer', __name__)
freelancer_controller = FreelancerController()

@freelancer_bp.route('/', methods=['POST'])
def create_profile():
    return freelancer_controller.create_profile()

@freelancer_bp.route('/projects', methods=['GET'])
def get_projects():
    return freelancer_controller.get_projects()

@freelancer_bp.route('/earnings', methods=['GET'])
def get_earnings():
    return freelancer_controller.get_earnings()

@freelancer_bp.route('/<uuid:id>', methods=['GET'])
def get_profile(id):
    return freelancer_controller.get_profile(str(id))

@freelancer_bp.route('/<uuid:id>', methods=['PUT'])
def update_profile(id):
    return freelancer_controller.update_profile(str(id))
