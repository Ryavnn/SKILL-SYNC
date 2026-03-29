import pytest
import uuid as uuid_lib
from app import create_app, db
from models.user import User
from models.project import Project
from models.contract import Contract, Milestone, EscrowTransaction, Dispute
from services.contract_service import ContractService
from services.milestone_service import MilestoneService
from services.escrow_service import EscrowService
from services.dispute_service import DisputeService
from decimal import Decimal


@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        db.session.expire_on_commit = False
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def seed_data(app):
    """Create client, freelancer, admin, and a project for testing."""
    with app.app_context():
        client = User(name="Client", email="client@test.com", password_hash="hash", role="client")
        freelancer = User(name="Freelancer", email="freelancer@test.com", password_hash="hash", role="freelancer")
        admin = User(name="Admin", email="admin@test.com", password_hash="hash", role="admin")
        db.session.add_all([client, freelancer, admin])
        db.session.commit()

        project = Project(
            client_id=client.id,
            title="Test Project",
            description="A test project for contract testing",
            budget="5000",
            timeline="3 months",
            assigned_freelancer_id=freelancer.id
        )
        db.session.add(project)
        db.session.commit()

        # Return UUID objects — not strings
        return {
            "client_id": client.id,
            "freelancer_id": freelancer.id,
            "admin_id": admin.id,
            "project_id": project.id
        }


def _create_contract(seed_data, milestones=None):
    svc = ContractService()
    if milestones is None:
        milestones = [
            {"title": "Design", "description": "UI Design", "amount": "2000"},
            {"title": "Development", "description": "Frontend Dev", "amount": "3000"}
        ]
    result = svc.create_contract(
        client_id=seed_data["client_id"],
        project_id=seed_data["project_id"],
        freelancer_id=seed_data["freelancer_id"],
        total_amount="5000",
        milestones_data=milestones
    )
    return result


def _create_active_contract(seed_data, milestones=None):
    result = _create_contract(seed_data, milestones)
    contract_id = result["data"].id
    svc = ContractService()
    svc.accept_contract(contract_id, seed_data["freelancer_id"])
    contract = Contract.query.get(contract_id)
    return contract


# ── Contract Lifecycle Tests ──────────────────────────────────────────

class TestContractLifecycle:
    def test_create_contract(self, app, seed_data):
        with app.app_context():
            result = _create_contract(seed_data)
            assert result["status"] == 201

            contract = Contract.query.get(result["data"].id)
            assert contract.status == "pending_acceptance"
            assert len(contract.milestones) == 2
            assert contract.milestones[0].order == 1
            assert contract.milestones[1].order == 2

    def test_accept_contract(self, app, seed_data):
        with app.app_context():
            create_result = _create_contract(seed_data, [{"title": "M1", "amount": "5000"}])
            contract_id = create_result["data"].id

            svc = ContractService()
            accept_result = svc.accept_contract(contract_id, seed_data["freelancer_id"])
            assert accept_result["status"] == 200

            contract = Contract.query.get(contract_id)
            assert contract.status == "active"

    def test_reject_contract(self, app, seed_data):
        with app.app_context():
            create_result = _create_contract(seed_data, [{"title": "M1", "amount": "5000"}])
            contract_id = create_result["data"].id

            svc = ContractService()
            reject_result = svc.reject_contract(contract_id, seed_data["freelancer_id"])
            assert reject_result["status"] == 200

            contract = Contract.query.get(contract_id)
            assert contract.status == "rejected"

    def test_client_cannot_accept_own_contract(self, app, seed_data):
        with app.app_context():
            create_result = _create_contract(seed_data, [{"title": "M1", "amount": "5000"}])
            contract_id = create_result["data"].id

            svc = ContractService()
            result = svc.accept_contract(contract_id, seed_data["client_id"])
            assert result["status"] == 403

    def test_milestone_amounts_must_match_total(self, app, seed_data):
        with app.app_context():
            svc = ContractService()
            result = svc.create_contract(
                client_id=seed_data["client_id"],
                project_id=seed_data["project_id"],
                freelancer_id=seed_data["freelancer_id"],
                total_amount="5000",
                milestones_data=[
                    {"title": "M1", "amount": "2000"},
                    {"title": "M2", "amount": "1000"}
                ]
            )
            assert result["status"] == 400
            assert "must equal" in result["error"]

    def test_duplicate_active_contract_prevented(self, app, seed_data):
        with app.app_context():
            _create_contract(seed_data, [{"title": "M1", "amount": "5000"}])

            svc = ContractService()
            result2 = svc.create_contract(
                client_id=seed_data["client_id"],
                project_id=seed_data["project_id"],
                freelancer_id=seed_data["freelancer_id"],
                total_amount="5000",
                milestones_data=[{"title": "M1", "amount": "5000"}]
            )
            assert result2["status"] == 409


# ── Escrow & Milestone Workflow Tests ─────────────────────────────────

class TestEscrowWorkflow:
    def test_fund_escrow(self, app, seed_data):
        with app.app_context():
            contract = _create_active_contract(seed_data)
            escrow = EscrowService()

            result = escrow.fund_escrow(contract.id, seed_data["client_id"])
            assert result["status"] == 200
            assert result["data"]["funded_milestones"] == 2
            assert Decimal(result["data"]["total_funded"]) == Decimal("5000")

            milestones = Milestone.query.filter_by(contract_id=contract.id).all()
            for m in milestones:
                assert m.status == "funded"

    def test_freelancer_cannot_fund(self, app, seed_data):
        with app.app_context():
            contract = _create_active_contract(seed_data)
            escrow = EscrowService()

            result = escrow.fund_escrow(contract.id, seed_data["freelancer_id"])
            assert result["status"] == 403

    def test_submit_and_approve_milestone(self, app, seed_data):
        with app.app_context():
            contract = _create_active_contract(seed_data)
            escrow = EscrowService()
            milestone_svc = MilestoneService()

            escrow.fund_escrow(contract.id, seed_data["client_id"])
            milestone = Milestone.query.filter_by(contract_id=contract.id, order=1).first()

            submit_result = milestone_svc.submit_milestone(milestone.id, seed_data["freelancer_id"])
            assert submit_result["status"] == 200

            db.session.refresh(milestone)
            assert milestone.status == "submitted"

            approve_result = milestone_svc.approve_milestone(milestone.id, seed_data["client_id"])
            assert approve_result["status"] == 200

            db.session.refresh(milestone)
            assert milestone.status == "released"

            release_txn = EscrowTransaction.query.filter_by(
                milestone_id=milestone.id, type='release'
            ).first()
            assert release_txn is not None
            assert release_txn.amount == Decimal("2000")

    def test_cannot_submit_unfunded_milestone(self, app, seed_data):
        with app.app_context():
            contract = _create_active_contract(seed_data)
            milestone_svc = MilestoneService()

            milestone = Milestone.query.filter_by(contract_id=contract.id, order=1).first()
            result = milestone_svc.submit_milestone(milestone.id, seed_data["freelancer_id"])
            assert result["status"] == 400

    def test_milestone_ordering_enforced(self, app, seed_data):
        with app.app_context():
            contract = _create_active_contract(seed_data)
            escrow = EscrowService()
            milestone_svc = MilestoneService()

            escrow.fund_escrow(contract.id, seed_data["client_id"])

            m2 = Milestone.query.filter_by(contract_id=contract.id, order=2).first()
            result = milestone_svc.submit_milestone(m2.id, seed_data["freelancer_id"])
            assert result["status"] == 400
            assert "Previous milestone" in result["error"]


# ── Dispute Tests ─────────────────────────────────────────────────────

class TestDisputeWorkflow:
    def _create_submitted_milestone(self, seed_data):
        contract = _create_active_contract(seed_data, [{"title": "Design", "amount": "5000"}])
        escrow = EscrowService()
        milestone_svc = MilestoneService()

        escrow.fund_escrow(contract.id, seed_data["client_id"])
        milestone = Milestone.query.filter_by(contract_id=contract.id, order=1).first()
        milestone_svc.submit_milestone(milestone.id, seed_data["freelancer_id"])

        db.session.refresh(milestone)
        db.session.refresh(contract)
        return contract, milestone

    def test_create_dispute(self, app, seed_data):
        with app.app_context():
            contract, milestone = self._create_submitted_milestone(seed_data)
            dispute_svc = DisputeService()

            result = dispute_svc.create_dispute(
                milestone_id=milestone.id,
                raised_by_id=seed_data["client_id"],
                reason="Quality concerns",
                description="Work does not meet requirements"
            )
            assert result["status"] == 201

            dispute = Dispute.query.get(result["data"].id)
            assert dispute.status == "open"

            db.session.refresh(milestone)
            assert milestone.status == "disputed"

    def test_dispute_blocks_approval(self, app, seed_data):
        with app.app_context():
            contract, milestone = self._create_submitted_milestone(seed_data)
            dispute_svc = DisputeService()
            milestone_svc = MilestoneService()

            dispute_svc.create_dispute(
                milestone_id=milestone.id,
                raised_by_id=seed_data["client_id"],
                reason="Quality issue"
            )

            result = milestone_svc.approve_milestone(milestone.id, seed_data["client_id"])
            assert result["status"] == 400

    def test_resolve_dispute_release(self, app, seed_data):
        with app.app_context():
            contract, milestone = self._create_submitted_milestone(seed_data)
            dispute_svc = DisputeService()

            dispute_result = dispute_svc.create_dispute(
                milestone_id=milestone.id,
                raised_by_id=seed_data["client_id"],
                reason="Quality issue"
            )
            dispute_id = dispute_result["data"].id

            resolve_result = dispute_svc.resolve_dispute(
                dispute_id=dispute_id,
                admin_id=seed_data["admin_id"],
                resolution_type="release"
            )
            assert resolve_result["status"] == 200

            dispute = Dispute.query.get(dispute_id)
            assert dispute.resolution_type == "release"

            db.session.refresh(milestone)
            assert milestone.status == "released"

    def test_resolve_dispute_refund(self, app, seed_data):
        with app.app_context():
            contract, milestone = self._create_submitted_milestone(seed_data)
            dispute_svc = DisputeService()

            dispute_result = dispute_svc.create_dispute(
                milestone_id=milestone.id,
                raised_by_id=seed_data["client_id"],
                reason="Quality issue"
            )
            dispute_id = dispute_result["data"].id

            resolve_result = dispute_svc.resolve_dispute(
                dispute_id=dispute_id,
                admin_id=seed_data["admin_id"],
                resolution_type="refund"
            )
            assert resolve_result["status"] == 200

            db.session.refresh(milestone)
            assert milestone.status == "pending"

            refund_txn = EscrowTransaction.query.filter_by(
                milestone_id=milestone.id, type='refund'
            ).first()
            assert refund_txn is not None

    def test_non_admin_cannot_resolve(self, app, seed_data):
        with app.app_context():
            contract, milestone = self._create_submitted_milestone(seed_data)
            dispute_svc = DisputeService()

            dispute_result = dispute_svc.create_dispute(
                milestone_id=milestone.id,
                raised_by_id=seed_data["client_id"],
                reason="Quality issue"
            )
            dispute_id = dispute_result["data"].id

            result = dispute_svc.resolve_dispute(
                dispute_id=dispute_id,
                admin_id=seed_data["freelancer_id"],
                resolution_type="release"
            )
            assert result["status"] == 403
