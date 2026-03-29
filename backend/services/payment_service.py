"""
Payment Service — Orchestrates payment operations for SkillSync.

Responsibilities:
  - Payment history retrieval for a user (all escrow transactions across their contracts)
  - Escrow funding (delegates to EscrowService)
  - Escrow summary for a specific contract
  - Earnings calculation for freelancers
"""

from app import db
from models.contract import Contract, EscrowTransaction, Milestone
from repositories.contract_repository import ContractRepository
from services.escrow_service import EscrowService
from sqlalchemy import or_
from decimal import Decimal


class PaymentService:
    """High-level payment operations, built on top of EscrowService."""

    def __init__(self):
        self.repo = ContractRepository()
        self.escrow = EscrowService()

    # ------------------------------------------------------------------
    # Payment History
    # ------------------------------------------------------------------

    def get_payment_history(self, user_id):
        """
        Return all escrow transactions across contracts
        where the user is either the client or freelancer.
        """
        contracts = Contract.query.filter(
            or_(
                Contract.client_id == user_id,
                Contract.freelancer_id == user_id
            )
        ).all()

        if not contracts:
            return {"data": [], "status": 200}

        contract_ids = [c.id for c in contracts]

        transactions = EscrowTransaction.query.filter(
            EscrowTransaction.contract_id.in_(contract_ids)
        ).order_by(EscrowTransaction.created_at.desc()).all()

        result = []
        for txn in transactions:
            contract = next((c for c in contracts if c.id == txn.contract_id), None)
            result.append({
                "id":             str(txn.id),
                "contract_id":    str(txn.contract_id),
                "milestone_id":   str(txn.milestone_id) if txn.milestone_id else None,
                "amount":         str(txn.amount),
                "type":           txn.type,
                "status":         txn.status,
                "created_at":     txn.created_at.isoformat() if txn.created_at else None,
                "project_title":  contract.project.title if contract and contract.project else None,
                "freelancer_name": contract.freelancer.name if contract and hasattr(contract, 'freelancer') and contract.freelancer else "Unknown",
                "client_name":     contract.client.name if contract and hasattr(contract, 'client') and contract.client else "Unknown",
            })

        return {"data": result, "status": 200}

    # ------------------------------------------------------------------
    # Escrow Operations (delegates)
    # ------------------------------------------------------------------

    def fund_escrow(self, contract_id, user_id):
        """Client deposits funds for pending milestones."""
        return self.escrow.fund_escrow(contract_id, user_id)

    def get_escrow_summary(self, contract_id, user_id):
        """Get escrow balance and transaction breakdown for a contract."""
        return self.escrow.get_escrow_summary(contract_id, user_id)

    # ------------------------------------------------------------------
    # Freelancer Earnings
    # ------------------------------------------------------------------

    def get_freelancer_earnings(self, user_id):
        """
        Calculate total and per-contract earnings for a freelancer
        by summing all 'release' transactions across their contracts.
        """
        contracts = Contract.query.filter_by(freelancer_id=user_id).all()

        if not contracts:
            return {
                "data": {
                    "total_earned": "0.00",
                    "pending": "0.00",
                    "contracts": []
                },
                "status": 200
            }

        contract_ids = [c.id for c in contracts]

        # Released payments
        released_txns = EscrowTransaction.query.filter(
            EscrowTransaction.contract_id.in_(contract_ids),
            EscrowTransaction.type == 'release',
            EscrowTransaction.status == 'completed'
        ).all()

        total_earned = sum(float(t.amount) for t in released_txns)

        # Pending: funded milestones not yet released
        funded_milestones = Milestone.query.filter(
            Milestone.contract_id.in_(contract_ids),
            Milestone.status.in_(['funded', 'submitted'])
        ).all()

        pending = sum(float(m.amount) for m in funded_milestones)

        # Per-contract breakdown
        contract_data = []
        for contract in contracts:
            contract_released = sum(
                float(t.amount) for t in released_txns if t.contract_id == contract.id
            )
            contract_data.append({
                "contract_id":  str(contract.id),
                "project_title": contract.project.title if contract.project else None,
                "status":        contract.status,
                "earned":        str(round(contract_released, 2)),
            })

        return {
            "data": {
                "total_earned": str(round(total_earned, 2)),
                "pending":      str(round(pending, 2)),
                "contracts":    contract_data
            },
            "status": 200
        }
