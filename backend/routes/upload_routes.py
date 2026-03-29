from flask import Blueprint
from controllers.upload_controller import UploadController

upload_bp = Blueprint('upload', __name__)
controller = UploadController()


@upload_bp.route('/credential', methods=['POST'])
def upload_credential():
    """POST /api/uploads/credential — upload a credential document."""
    return controller.upload_credential()


@upload_bp.route('/portfolio', methods=['POST'])
def upload_portfolio():
    """POST /api/uploads/portfolio — upload a portfolio file."""
    return controller.upload_portfolio()


@upload_bp.route('/avatar', methods=['POST'])
def upload_avatar():
    """POST /api/uploads/avatar — upload a profile picture."""
    return controller.upload_avatar()
