from flask import Blueprint
from controllers.project_controller import ProjectController

project_bp = Blueprint('projects', __name__)
controller = ProjectController()

@project_bp.route('', methods=['POST'])
def create_project():
    return controller.create_project()

@project_bp.route('', methods=['GET'])
def get_projects():
    return controller.get_projects()

@project_bp.route('/<uuid:id>', methods=['GET'])
def get_project(id):
    return controller.get_project(str(id))

@project_bp.route('/<uuid:id>', methods=['PUT'])
def update_project(id):
    return controller.update_project(str(id))
