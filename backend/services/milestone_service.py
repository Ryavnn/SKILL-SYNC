from app import db
from models.contract import Milestone, EscrowTransaction
from repositories.contract_repository import ContractRepository
from services.contract_validation_service import ContractValidationService
from services.notification_trigger import trigger_milestone_submitted, trigger_milestone_approved, trigger_payment_released
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError


class MilestoneService:
    """Business logic for milestone lifecycle within a contract."""

    def __init__(self):
        self.repo = ContractRepository()
        self.validator = ContractValidationService()

    def submit_milestone(self, milestone_id, user_id):
        """Freelancer submits work for a milestone → submitted."""
        milestone = self.repo.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"error": "Milestone not found", "status": 404}

        contract = self.repo.get_contract_by_id(milestone.contract_id)
        if not contract:
            return {"error": "Associated contract not found", "status": 404}

        # Must be active contract
        if contract.status != 'active':
            return {"error": "Contract is not active", "status": 400}

        # Must be the freelancer
        participant_error = self.validator.validate_contract_participant(
            contract, user_id, required_role='freelancer'
        )
        if participant_error:
            return participant_error

        # Validate milestone transition
        transition_error = self.validator.validate_milestone_transition(milestone, 'submitted')
        if transition_error:
            return transition_error

        # Enforce milestone ordering for submission
        order_error = self.validator.validate_milestone_order(milestone, contract)
        if order_error:
            return order_error

        # Check for disputes
        dispute_error = self.validator.validate_milestone_not_disputed(milestone)
        if dispute_error:
            return dispute_error

        try:
            milestone.status = 'submitted'
            milestone.submitted_at = datetime.utcnow()
            db.session.commit()

            trigger_milestone_submitted(milestone, contract)

            return {"data": milestone, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def approve_milestone(self, milestone_id, user_id):
        """Client approves a milestone → approved → triggers payment release."""
        milestone = self.repo.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"error": "Milestone not found", "status": 404}

        contract = self.repo.get_contract_by_id(milestone.contract_id)
        if not contract:
            return {"error": "Associated contract not found", "status": 404}

        if contract.status != 'active':
            return {"error": "Contract is not active", "status": 400}

        # Must be the client
        participant_error = self.validator.validate_contract_participant(
            contract, user_id, required_role='client'
        )
        if participant_error:
            return participant_error

        # Validate transition
        transition_error = self.validator.validate_milestone_transition(milestone, 'approved')
        if transition_error:
            return transition_error

        # Check for disputes
        dispute_error = self.validator.validate_milestone_not_disputed(milestone)
        if dispute_error:
            return dispute_error

        try:
            milestone.status = 'approved'
            milestone.approved_at = datetime.utcnow()
            db.session.commit()

            trigger_milestone_approved(milestone, contract)

            # Auto-release payment
            from services.escrow_service import EscrowService
            escrow = EscrowService()
            release_result = escrow.release_payment(milestone.id, contract.id)

            if "error" in release_result:
                # Payment release failed, but milestone is already approved
                # Log the error — in production this would be retried
                print(f"WARNING: Payment release failed for milestone {milestone_id}: {release_result['error']}")

            # Check if all milestones are now completed
            if self.repo.get_all_milestones_completed(contract.id):
                from services.contract_service import ContractService
                contract_svc = ContractService()
                contract_svc.complete_contract(contract.id)

            return {"data": milestone, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}
