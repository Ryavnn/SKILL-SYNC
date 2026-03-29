import uuid
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID


class Contract(db.Model):
    __tablename__ = 'contracts'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id'), nullable=False)
    client_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    freelancer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.String(30), default='pending_acceptance', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = db.relationship('Project', backref=db.backref('contracts', lazy=True))
    client = db.relationship('User', foreign_keys=[client_id], backref=db.backref('client_contracts', lazy=True))
    freelancer = db.relationship('User', foreign_keys=[freelancer_id], backref=db.backref('freelancer_contracts', lazy=True))
    milestones = db.relationship('Milestone', backref='contract', lazy=True, cascade='all, delete-orphan', order_by='Milestone.order')
    escrow_transactions = db.relationship('EscrowTransaction', backref='contract', lazy=True, cascade='all, delete-orphan')

    # Indexes
    __table_args__ = (
        db.Index('ix_contracts_project_id', 'project_id'),
        db.Index('ix_contracts_client_id', 'client_id'),
        db.Index('ix_contracts_freelancer_id', 'freelancer_id'),
        db.Index('ix_contracts_status', 'status'),
    )

    def __repr__(self):
        return f'<Contract {self.id} Status: {self.status}>'


class Milestone(db.Model):
    __tablename__ = 'milestones'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id = db.Column(UUID(as_uuid=True), db.ForeignKey('contracts.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    order = db.Column(db.Integer, nullable=False)  # Sequential order within contract
    status = db.Column(db.String(20), default='pending', nullable=False)
    submitted_at = db.Column(db.DateTime, nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    disputes = db.relationship('Dispute', backref='milestone', lazy=True, cascade='all, delete-orphan')

    # Indexes
    __table_args__ = (
        db.Index('ix_milestones_contract_id', 'contract_id'),
        db.Index('ix_milestones_status', 'status'),
    )

    def __repr__(self):
        return f'<Milestone {self.title} Order: {self.order} Status: {self.status}>'


class EscrowTransaction(db.Model):
    __tablename__ = 'escrow_transactions'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id = db.Column(UUID(as_uuid=True), db.ForeignKey('contracts.id'), nullable=False)
    milestone_id = db.Column(UUID(as_uuid=True), db.ForeignKey('milestones.id'), nullable=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # deposit, release, refund
    status = db.Column(db.String(20), default='completed', nullable=False)  # pending, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        db.Index('ix_escrow_contract_id', 'contract_id'),
        db.Index('ix_escrow_milestone_id', 'milestone_id'),
        db.Index('ix_escrow_type', 'type'),
    )

    def __repr__(self):
        return f'<EscrowTransaction {self.id} Type: {self.type} Amount: {self.amount}>'


class Dispute(db.Model):
    __tablename__ = 'disputes'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    milestone_id = db.Column(UUID(as_uuid=True), db.ForeignKey('milestones.id'), nullable=False)
    raised_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='open', nullable=False)  # open, resolved
    resolution_type = db.Column(db.String(20), nullable=True)  # refund, release, split
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    raiser = db.relationship('User', foreign_keys=[raised_by], backref=db.backref('raised_disputes', lazy=True))

    # Indexes
    __table_args__ = (
        db.Index('ix_disputes_milestone_id', 'milestone_id'),
        db.Index('ix_disputes_status', 'status'),
    )

    def __repr__(self):
        return f'<Dispute {self.id} Status: {self.status}>'
