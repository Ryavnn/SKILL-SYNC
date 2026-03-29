from app import db
from models.contract import Contract, Milestone
from models.user import User
from models.project import Project
from repositories.contract_repository import ContractRepository
from services.contract_validation_service import ContractValidationService
from services.notification_trigger import trigger_contract_created, trigger_contract_accepted
from services.escrow_service import EscrowService
from sqlalchemy.exc import SQLAlchemyError
from decimal import Decimal


class ContractService:
    """Core business logic for contract lifecycle management."""

    def __init__(self):
        self.repo = ContractRepository()
        self.validator = ContractValidationService()
        self.escrow = EscrowService()

    def create_contract(self, client_id, project_id, freelancer_id, total_amount, milestones_data):
        """Create a new contract with milestones. Caller must be the project client."""

        # 1. Validate freelancer exists and has correct role
        freelancer = User.query.get(freelancer_id)
        if not freelancer or freelancer.role != 'freelancer':
            return {"error": "Invalid freelancer", "status": 400}

        # 2. Run creation validations
        validation_error = self.validator.validate_contract_creation(
            project_id=project_id,
            client_id=client_id,
            milestones_data=milestones_data,
            total_amount=total_amount
        )
        if validation_error:
            return validation_error

        try:
            # 3. Create contract
            contract = Contract(
                project_id=project_id,
                client_id=client_id,
                freelancer_id=freelancer_id,
                total_amount=Decimal(str(total_amount)),
                status='pending_acceptance'
            )
            db.session.add(contract)
            db.session.flush()

            # 4. Create milestones with sequential ordering
            for idx, m_data in enumerate(milestones_data, start=1):
                milestone = Milestone(
                    contract_id=contract.id,
                    title=m_data['title'],
                    description=m_data.get('description', ''),
                    amount=Decimal(str(m_data['amount'])),
                    order=idx,
                    status='pending'
                )
                db.session.add(milestone)

            db.session.commit()

            # 5. Refresh to load relationships
            db.session.refresh(contract)

            # 6. Trigger notification
            trigger_contract_created(contract)

            return {"data": contract, "status": 201}

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def accept_contract(self, contract_id, user_id):
        """Freelancer accepts a pending contract → active."""
        contract = self.repo.get_contract_by_id(contract_id)
        if not contract:
            return {"error": "Contract not found", "status": 404}

        # Must be the freelancer on the contract
        participant_error = self.validator.validate_contract_participant(
            contract, user_id, required_role='freelancer'
        )
        if participant_error:
            return participant_error

        # Validate transition
        transition_error = self.validator.validate_contract_transition(contract, 'active')
        if transition_error:
            return transition_error

        try:
            contract.status = 'active'
            db.session.commit()
            trigger_contract_accepted(contract)
            return {"data": contract, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def reject_contract(self, contract_id, user_id):
        """Freelancer rejects a pending contract → rejected."""
        contract = self.repo.get_contract_by_id(contract_id)
        if not contract:
            return {"error": "Contract not found", "status": 404}

        participant_error = self.validator.validate_contract_participant(
            contract, user_id, required_role='freelancer'
        )
        if participant_error:
            return participant_error

        transition_error = self.validator.validate_contract_transition(contract, 'rejected')
        if transition_error:
            return transition_error

        try:
            contract.status = 'rejected'
            db.session.commit()
            return {"data": contract, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def get_contract(self, contract_id, user_id):
        """Get contract details. Must be a participant."""
        contract = self.repo.get_contract_by_id(contract_id)
        if not contract:
            return {"error": "Contract not found", "status": 404}

        participant_error = self.validator.validate_contract_participant(contract, user_id)
        if participant_error:
            return participant_error

        return {"data": contract, "status": 200}

    def get_user_contracts(self, user_id):
        """Get all contracts for a user (as client or freelancer)."""
        contracts = self.repo.get_contracts_by_user(user_id)
        return {"data": contracts, "status": 200}

    def complete_contract(self, contract_id):
        """Internal: mark contract as completed when all milestones are released."""
        contract = self.repo.get_contract_by_id(contract_id)
        if not contract:
            return {"error": "Contract not found", "status": 404}

        if not self.repo.get_all_milestones_completed(contract_id):
            return {"error": "Not all milestones are completed", "status": 400}

        try:
            contract.status = 'completed'
            db.session.commit()
            return {"data": contract, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def submit_milestone(self, milestone_id, user_id):
        """Freelancer submits work for a milestone."""
        milestone = self.repo.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"error": "Milestone not found", "status": 404}
        
        contract = milestone.contract
        # Must be the freelancer
        participant_error = self.validator.validate_contract_participant(contract, user_id, required_role='freelancer')
        if participant_error: return participant_error

        # If it's pending, let's auto-fund it for now (escrow sim)
        if milestone.status == 'pending':
            milestone.status = 'funded'

        # Validate transition to submitted
        msg_error = self.validator.validate_milestone_transition(milestone, 'submitted')
        if msg_error: return msg_error

        try:
            milestone.status = 'submitted'
            db.session.commit()
            return {"data": milestone, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def approve_milestone(self, milestone_id, user_id):
        """Client approves a submitted milestone, triggering release."""
        milestone = self.repo.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"error": "Milestone not found", "status": 404}
        
        contract = milestone.contract
        # Must be the client
        participant_error = self.validator.validate_contract_participant(contract, user_id, required_role='client')
        if participant_error: return participant_error

        # Validate transition to approved
        msg_error = self.validator.validate_milestone_transition(milestone, 'approved')
        if msg_error: return msg_error

        try:
            milestone.status = 'approved'
            db.session.commit()

            # Trigger actual payment release record
            release_result = self.escrow.release_payment(milestone.id, contract.id)
            if 'error' in release_result:
                return release_result

            # Check if all milestones are done to complete the contract
            if self.repo.get_all_milestones_completed(contract.id):
                self.complete_contract(contract.id)

            return {"data": milestone, "status": 200}
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def add_milestone(self, contract_id, user_id, data):
        """Add a new milestone to an existing contract (Client only)."""
        contract = self.repo.get_contract_by_id(contract_id)
        if not contract:
            return {"error": "Contract not found", "status": 404}

        # Must be the client
        participant_error = self.validator.validate_contract_participant(contract, user_id, required_role='client')
        if participant_error: return participant_error

        # Contract must be active, drafting, pending_acceptance, or completed (to reopen)
        print(f"DEBUG: Attempting to add milestone to contract {contract_id} with status '{contract.status}'")
        if contract.status not in ['active', 'draft', 'completed', 'pending_acceptance']:
             return {"error": f"Cannot add milestones to a {contract.status} contract", "status": 400}

        try:
            # If contract was completed, reopen it
            if contract.status == 'completed':
                contract.status = 'active'

            # Calculate next order index
            next_order = len(contract.milestones) + 1

            new_milestone = Milestone(
                contract_id=contract.id,
                title=data.get('title'),
                description=data.get('description', ''),
                amount=Decimal(str(data.get('amount'))),
                order=next_order,
                status='pending'
            )
            # Update total contract amount
            contract.total_amount += new_milestone.amount
            
            db.session.add(new_milestone)
            db.session.commit()
            return {"data": new_milestone, "status": 201}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}
