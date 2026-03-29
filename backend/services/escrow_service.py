from app import db
from models.contract import EscrowTransaction, Milestone
from repositories.contract_repository import ContractRepository
from services.notification_trigger import trigger_milestone_funded, trigger_payment_released
from services.contract_validation_service import ContractValidationService
from decimal import Decimal
from sqlalchemy.exc import SQLAlchemyError


class EscrowService:
    """Simulated escrow payment system for holding and releasing funds."""

    def __init__(self):
        self.repo = ContractRepository()
        self.validator = ContractValidationService()

    def fund_escrow_after_payment(self, payment_id, contract_id):
        """
        Fund escrow for pending milestones AFTER M-Pesa payment is confirmed.
        
        This is called from the M-Pesa callback handler once payment succeeds.
        Replaced the simulated fund_escrow() method.
        
        Args:
            payment_id: UUID of the completed Payment record
            contract_id: UUID of the contract
            
        Returns:
            {"data": {...}, "status": 200} or {"error": "...", "status": 4xx/5xx}
        """
        contract = self.repo.get_contract_by_id(contract_id)
        if not contract:
            return {"error": "Contract not found", "status": 404}

        # Contract must be active
        if contract.status != 'active':
            return {"error": "Contract must be active to fund", "status": 400}

        # Get pending milestones
        pending_milestones = self.repo.get_pending_milestones(contract_id)
        if not pending_milestones:
            return {"error": "No pending milestones to fund", "status": 400}

        try:
            funded_milestones = []
            total_funded = Decimal('0')

            # Mark milestones as funded
            for milestone in pending_milestones:
                milestone.status = 'funded'
                total_funded += milestone.amount
                funded_milestones.append(milestone)

            # Record escrow deposit transaction
            txn = EscrowTransaction(
                contract_id=contract_id,
                amount=total_funded,
                type='deposit',
                status='completed'
            )
            db.session.add(txn)
            db.session.flush()  # Get transaction ID before commit

            # Link payment to escrow transaction
            from repositories.payment_repository import PaymentRepository
            payment_repo = PaymentRepository()
            payment_repo.link_escrow_transaction(str(payment_id), str(txn.id))

            db.session.commit()

            # Trigger notifications for each funded milestone
            for milestone in funded_milestones:
                trigger_milestone_funded(milestone, contract)

            return {
                "data": {
                    "contract_id": str(contract_id),
                    "funded_milestones": len(funded_milestones),
                    "total_funded": str(total_funded),
                    "transaction_id": str(txn.id),
                    "payment_id": str(payment_id)
                },
                "status": 200
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def release_payment(self, milestone_id, contract_id):
        """
        Internal: Release funds from escrow to freelancer for an approved milestone.
        Called automatically when a milestone is approved.
        """
        milestone = self.repo.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"error": "Milestone not found", "status": 404}

        # Prevent double release
        if self.repo.has_release_for_milestone(milestone_id):
            return {"error": "Payment already released for this milestone", "status": 409}

        # Milestone must be approved
        if milestone.status != 'approved':
            return {"error": "Milestone must be approved before releasing payment", "status": 400}

        try:
            # Record release transaction
            txn = EscrowTransaction(
                contract_id=contract_id,
                milestone_id=milestone_id,
                amount=milestone.amount,
                type='release',
                status='completed'
            )
            db.session.add(txn)

            # Update milestone status
            milestone.status = 'released'

            db.session.commit()

            contract = self.repo.get_contract_by_id(contract_id)
            trigger_payment_released(milestone, contract)

            return {
                "data": {
                    "milestone_id": str(milestone_id),
                    "amount_released": str(milestone.amount),
                    "transaction_id": str(txn.id)
                },
                "status": 200
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def refund_payment(self, milestone_id, contract_id, amount=None):
        """
        Refund funds from escrow back to client.
        Used during dispute resolution.
        """
        milestone = self.repo.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"error": "Milestone not found", "status": 404}

        refund_amount = Decimal(str(amount)) if amount else milestone.amount

        try:
            txn = EscrowTransaction(
                contract_id=contract_id,
                milestone_id=milestone_id,
                amount=refund_amount,
                type='refund',
                status='completed'
            )
            db.session.add(txn)
            db.session.commit()

            return {
                "data": {
                    "milestone_id": str(milestone_id),
                    "amount_refunded": str(refund_amount),
                    "transaction_id": str(txn.id)
                },
                "status": 200
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e), "status": 500}

    def get_escrow_summary(self, contract_id, user_id):
        """Get escrow balance and transaction history for a contract."""
        contract = self.repo.get_contract_by_id(contract_id)
        if not contract:
            return {"error": "Contract not found", "status": 404}

        participant_error = self.validator.validate_contract_participant(contract, user_id)
        if participant_error:
            return participant_error

        balance = self.repo.get_escrow_balance(contract_id)
        transactions = self.repo.get_escrow_transactions(contract_id)

        return {
            "data": {
                "contract_id": str(contract_id),
                "balance": str(balance),
                "transactions": transactions
            },
            "status": 200
        }
