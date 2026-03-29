from app import db
from models.contract import Contract, Milestone, EscrowTransaction, Dispute
from sqlalchemy.exc import SQLAlchemyError


class ContractRepository:
    """Data access layer for contracts, milestones, escrow transactions, and disputes."""

    # ── Contract Queries ─────────────────────────────────────────────

    @staticmethod
    def get_contract_by_id(contract_id):
        return Contract.query.get(contract_id)

    @staticmethod
    def get_contracts_by_user(user_id):
        """Get all contracts where user is client or freelancer."""
        return Contract.query.filter(
            db.or_(
                Contract.client_id == user_id,
                Contract.freelancer_id == user_id
            )
        ).order_by(Contract.created_at.desc()).all()

    @staticmethod
    def get_contracts_by_project(project_id):
        return Contract.query.filter_by(project_id=project_id).all()

    # ── Milestone Queries ────────────────────────────────────────────

    @staticmethod
    def get_milestone_by_id(milestone_id):
        return Milestone.query.get(milestone_id)

    @staticmethod
    def get_milestones_by_contract(contract_id):
        return Milestone.query.filter_by(
            contract_id=contract_id
        ).order_by(Milestone.order).all()

    @staticmethod
    def get_all_milestones_completed(contract_id):
        """Check if all milestones in a contract are released."""
        total = Milestone.query.filter_by(contract_id=contract_id).count()
        released = Milestone.query.filter_by(
            contract_id=contract_id,
            status='released'
        ).count()
        return total > 0 and total == released

    @staticmethod
    def get_pending_milestones(contract_id):
        """Get milestones that are still pending funding."""
        return Milestone.query.filter_by(
            contract_id=contract_id,
            status='pending'
        ).order_by(Milestone.order).all()

    # ── Escrow Queries ───────────────────────────────────────────────

    @staticmethod
    def get_escrow_transactions(contract_id):
        return EscrowTransaction.query.filter_by(
            contract_id=contract_id
        ).order_by(EscrowTransaction.created_at.desc()).all()

    @staticmethod
    def get_escrow_balance(contract_id):
        """Calculate current escrow balance (deposits - releases - refunds)."""
        transactions = EscrowTransaction.query.filter_by(
            contract_id=contract_id,
            status='completed'
        ).all()

        balance = 0
        for txn in transactions:
            if txn.type == 'deposit':
                balance += float(txn.amount)
            elif txn.type in ('release', 'refund'):
                balance -= float(txn.amount)

        return balance

    @staticmethod
    def has_release_for_milestone(milestone_id):
        """Check if a release transaction already exists for a milestone."""
        return EscrowTransaction.query.filter_by(
            milestone_id=milestone_id,
            type='release',
            status='completed'
        ).first() is not None

    # ── Dispute Queries ──────────────────────────────────────────────

    @staticmethod
    def get_dispute_by_id(dispute_id):
        return Dispute.query.get(dispute_id)

    @staticmethod
    def get_open_dispute_for_milestone(milestone_id):
        return Dispute.query.filter_by(
            milestone_id=milestone_id,
            status='open'
        ).first()

    @staticmethod
    def get_disputes_by_contract(contract_id):
        """Get all disputes for milestones belonging to a contract."""
        milestone_ids = db.session.query(Milestone.id).filter_by(
            contract_id=contract_id
        ).subquery()
        return Dispute.query.filter(
            Dispute.milestone_id.in_(milestone_ids)
        ).order_by(Dispute.created_at.desc()).all()
