from app import db
from models.contract import Dispute, Milestone
from models.user import User
from repositories.contract_repository import ContractRepository
from services.contract_validation_service import ContractValidationService
from services.notification_trigger import trigger_dispute_created, trigger_dispute_resolved
from datetime import datetime
from decimal import Decimal
from sqlalchemy.exc import SQLAlchemyError


class DisputeService:
    """Business logic for dispute creation and resolution on milestones."""

    def __init__(self):
        self.repo = ContractRepository()
        self.validator = ContractValidationService()

    def create_dispute(self, milestone_id, raised_by_id, reason, description=None):
        """Raise a dispute on a submitted milestone. Freezes milestone transactions."""
        milestone = self.repo.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"error": "Milestone not found", "status": 404}

        contract = self.repo.get_contract_by_id(milestone.contract_id)
        if not contract:
            return {"error": "Associated contract not found", "status": 404}

        # Must be a participant (client or freelancer)
        participant_error = self.validator.validate_contract_participant(contract, raised_by_id)
        if participant_error:
            return participant_error

        # Validate dispute creation
        creation_error = self.validator.validate_dispute_creation(milestone)
        if creation_error:
            return creation_error

        try:
            dispute = Dispute(
                milestone_id=milestone_id,
                raised_by=raised_by_id,
                reason=reason,
                description=description,
                status='open'
            )
            db.session.add(dispute)

            # Freeze the milestone
            milestone.status = 'disputed'

            db.session.commit()

            trigger_dispute_created(dispute, contract)

            return {"data": dispute, "status": 201}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def resolve_dispute(self, dispute_id, admin_id, resolution_type):
        """
        Admin resolves a dispute.
        - refund: return funds to client
        - release: pay freelancer
        - split: partial split (50/50 for simplicity)
        """
        dispute = self.repo.get_dispute_by_id(dispute_id)
        if not dispute:
            return {"error": "Dispute not found", "status": 404}

        # Must be admin
        admin = User.query.get(admin_id)
        if not admin or admin.role != 'admin':
            return {"error": "Only an admin can resolve disputes", "status": 403}

        # Validate transition
        transition_error = self.validator.validate_dispute_transition(dispute, 'resolved')
        if transition_error:
            return transition_error

        milestone = self.repo.get_milestone_by_id(dispute.milestone_id)
        contract = self.repo.get_contract_by_id(milestone.contract_id)

        try:
            # Import escrow service for payment operations
            from services.escrow_service import EscrowService
            escrow = EscrowService()

            if resolution_type == 'refund':
                # Refund full amount to client
                escrow.refund_payment(milestone.id, contract.id)
                milestone.status = 'pending'  # Reset milestone

            elif resolution_type == 'release':
                # Pay freelancer
                milestone.status = 'approved'
                db.session.flush()
                escrow.release_payment(milestone.id, contract.id)

            elif resolution_type == 'split':
                # 50/50 split — refund half, release half
                half_amount = milestone.amount / Decimal('2')
                escrow.refund_payment(milestone.id, contract.id, amount=half_amount)

                # For the release half, mark approved then release
                milestone.status = 'approved'
                db.session.flush()

                # Create a partial release transaction
                from models.contract import EscrowTransaction
                txn = EscrowTransaction(
                    contract_id=contract.id,
                    milestone_id=milestone.id,
                    amount=half_amount,
                    type='release',
                    status='completed'
                )
                db.session.add(txn)
                milestone.status = 'released'

            # Resolve the dispute
            dispute.status = 'resolved'
            dispute.resolution_type = resolution_type
            dispute.resolved_at = datetime.utcnow()

            db.session.commit()

            trigger_dispute_resolved(dispute, contract)

            return {"data": dispute, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def get_dispute(self, dispute_id, user_id):
        """Get dispute details."""
        dispute = self.repo.get_dispute_by_id(dispute_id)
        if not dispute:
            return {"error": "Dispute not found", "status": 404}

        milestone = self.repo.get_milestone_by_id(dispute.milestone_id)
        contract = self.repo.get_contract_by_id(milestone.contract_id)

        # Must be participant or admin
        participant_error = self.validator.validate_contract_participant(contract, user_id)
        if participant_error:
            return participant_error

        return {"data": dispute, "status": 200}
