from flask import Blueprint
from controllers.payment_controller import PaymentController

payment_bp = Blueprint('payment', __name__)
escrow_bp = Blueprint('escrow', __name__)
controller = PaymentController()


# ── Payment History ─────────────────────────────────────────
@payment_bp.route('/', methods=['GET'])
def get_payments():
    """GET /api/payments — user's payment transaction history."""
    return controller.get_payments()


# ── Escrow Operations ───────────────────────────────────────
@escrow_bp.route('/', methods=['POST'])
def fund_escrow():
    """POST /api/escrow — fund pending milestones for a contract."""
    return controller.fund_escrow()


@escrow_bp.route('/<uuid:contract_id>', methods=['GET'])
def get_escrow_summary(contract_id):
    """GET /api/escrow/<contract_id> — get escrow balance and history."""
    return controller.get_escrow_summary(str(contract_id))


# ── Earnings ────────────────────────────────────────────────
@payment_bp.route('/earnings', methods=['GET'])
def get_earnings():
    """GET /api/payments/earnings — freelancer earnings summary."""
    return controller.get_earnings()
