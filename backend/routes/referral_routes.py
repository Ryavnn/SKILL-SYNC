from flask import Blueprint
from controllers.referral_controller import ReferralController

referral_bp = Blueprint('referral', __name__)
controller = ReferralController()

# ── New: Freelancer dashboard endpoints ──────────────────────────────────────

@referral_bp.route('/me', methods=['GET'])
def get_my_referral():
    """Returns the current user's referral link and code."""
    return controller.get_my_referral()

@referral_bp.route('/stats', methods=['GET'])
def get_referral_stats():
    """Returns aggregated referral stats for the current user."""
    return controller.get_referral_stats()

@referral_bp.route('/history', methods=['GET'])
def get_referral_history():
    """Returns enriched outgoing referral history for the current user."""
    return controller.get_referral_history()

# ── Existing CRUD endpoints ──────────────────────────────────────────────────

@referral_bp.route('/create', methods=['POST'])
def create_referral():
    return controller.create_referral()

@referral_bp.route('/', methods=['GET'])
def get_referrals():
    return controller.get_referrals()

@referral_bp.route('/<uuid:id>/accept', methods=['PATCH'])
def accept_referral(id):
    return controller.accept_referral(str(id))

@referral_bp.route('/<uuid:id>/reject', methods=['PATCH'])
def reject_referral(id):
    return controller.reject_referral(str(id))

@referral_bp.route('/system/expire', methods=['POST'])
def expire_referrals():
    return controller.system_expire_referrals()
