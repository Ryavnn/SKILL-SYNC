from models.contract import Contract, Milestone, Dispute
from models.project import Project
from models.user import User
from decimal import Decimal


class ContractValidationService:
    """State machine validation for contracts, milestones, and disputes."""

    # ── Transition Maps ──────────────────────────────────────────────
    CONTRACT_TRANSITIONS = {
        'pending_acceptance': ['active', 'rejected'],
        'active': ['completed', 'cancelled'],
    }

    MILESTONE_TRANSITIONS = {
        'pending': ['funded'],
        'funded': ['submitted'],
        'submitted': ['approved', 'disputed'],
        'approved': ['released'],
        'disputed': [],  # Frozen until dispute resolved
    }

    DISPUTE_TRANSITIONS = {
        'open': ['resolved'],
    }

    # ── Contract Validation ──────────────────────────────────────────

    @staticmethod
    def validate_contract_creation(project_id, client_id, milestones_data, total_amount):
        """Validate all preconditions for creating a contract."""

        # 1. Project must exist
        project = Project.query.get(project_id)
        if not project:
            return {"error": "Project not found", "status": 404}

        # 2. Creator must be the project client
        if str(project.client_id) != str(client_id):
            return {"error": "Only the project client can create a contract", "status": 403}

        # 3. Must have at least one milestone
        if not milestones_data or len(milestones_data) == 0:
            return {"error": "At least one milestone is required", "status": 400}

        # 4. Milestone amounts must sum to total_amount
        milestone_sum = sum(Decimal(str(m.get('amount', 0))) for m in milestones_data)
        if milestone_sum != Decimal(str(total_amount)):
            return {
                "error": f"Milestone amounts ({milestone_sum}) must equal total contract amount ({total_amount})",
                "status": 400
            }

        # 5. Freelancer must exist and have the freelancer role
        # (freelancer_id validation happens at schema level, but role check here)

        # 6. No duplicate active contract for the same project + freelancer combo
        existing = Contract.query.filter(
            Contract.project_id == project_id,
            Contract.status.in_(['pending_acceptance', 'active'])
        ).first()
        if existing:
            return {"error": "An active contract already exists for this project", "status": 409}

        return None

    @staticmethod
    def validate_contract_transition(contract, new_status):
        """Validate a contract status transition."""
        allowed = ContractValidationService.CONTRACT_TRANSITIONS.get(contract.status, [])
        if new_status not in allowed:
            return {
                "error": f"Cannot transition contract from '{contract.status}' to '{new_status}'",
                "status": 400
            }
        return None

    @staticmethod
    def validate_contract_participant(contract, user_id, required_role=None):
        """Validate user is a participant in the contract with the required role."""
        user = User.query.get(user_id)
        if not user:
            return {"error": "User not found", "status": 404}

        is_client = str(contract.client_id) == str(user_id)
        is_freelancer = str(contract.freelancer_id) == str(user_id)
        is_admin = user.role == 'admin'

        if not (is_client or is_freelancer or is_admin):
            return {"error": "You are not a participant of this contract", "status": 403}

        if required_role == 'client' and not is_client:
            return {"error": "Only the client can perform this action", "status": 403}

        if required_role == 'freelancer' and not is_freelancer:
            return {"error": "Only the freelancer can perform this action", "status": 403}

        if required_role == 'admin' and not is_admin:
            return {"error": "Only an admin can perform this action", "status": 403}

        return None

    # ── Milestone Validation ─────────────────────────────────────────

    @staticmethod
    def validate_milestone_transition(milestone, new_status):
        """Validate a milestone status transition."""
        allowed = ContractValidationService.MILESTONE_TRANSITIONS.get(milestone.status, [])
        if new_status not in allowed:
            return {
                "error": f"Cannot transition milestone from '{milestone.status}' to '{new_status}'",
                "status": 400
            }
        return None

    @staticmethod
    def validate_milestone_order(milestone, contract):
        """Ensure previous milestones are completed before this one can proceed."""
        if milestone.order <= 1:
            return None  # First milestone has no dependency

        # Find the previous milestone
        previous = Milestone.query.filter(
            Milestone.contract_id == contract.id,
            Milestone.order == milestone.order - 1
        ).first()

        if not previous:
            return None  # No previous milestone found, allow

        # Previous milestone must be at least approved or released
        if previous.status not in ['approved', 'released']:
            return {
                "error": f"Previous milestone (order {previous.order}) must be approved or released first",
                "status": 400
            }

        return None

    @staticmethod
    def validate_milestone_not_disputed(milestone):
        """Check if milestone has an open dispute, blocking further actions."""
        open_dispute = Dispute.query.filter_by(
            milestone_id=milestone.id,
            status='open'
        ).first()

        if open_dispute:
            return {
                "error": "Milestone has an open dispute. Resolve the dispute before proceeding",
                "status": 409
            }

        return None

    # ── Dispute Validation ───────────────────────────────────────────

    @staticmethod
    def validate_dispute_creation(milestone):
        """Validate dispute can be created on a milestone."""
        # Can only dispute a submitted milestone
        if milestone.status != 'submitted':
            return {
                "error": "Disputes can only be raised on submitted milestones",
                "status": 400
            }

        # No existing open dispute
        existing = Dispute.query.filter_by(
            milestone_id=milestone.id,
            status='open'
        ).first()
        if existing:
            return {"error": "An open dispute already exists for this milestone", "status": 409}

        return None

    @staticmethod
    def validate_dispute_transition(dispute, new_status):
        """Validate a dispute status transition."""
        allowed = ContractValidationService.DISPUTE_TRANSITIONS.get(dispute.status, [])
        if new_status not in allowed:
            return {
                "error": f"Cannot transition dispute from '{dispute.status}' to '{new_status}'",
                "status": 400
            }
        return None
