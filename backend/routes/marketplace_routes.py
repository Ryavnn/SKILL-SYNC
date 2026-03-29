from flask import Blueprint, request
from controllers.marketplace_controller import MarketplaceController

marketplace_bp = Blueprint('marketplace', __name__)
controller = MarketplaceController()

@marketplace_bp.route('/search', methods=['GET'])
def search_freelancers():
    return controller.search_freelancers()
