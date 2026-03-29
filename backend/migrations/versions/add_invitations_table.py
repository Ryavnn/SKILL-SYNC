"""Add invitations table

Revision ID: add_invitations_table
Revises: 40c9a37e32df
Create Date: 2026-03-28

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_invitations_table'
down_revision = '40c9a37e32df'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'invitations',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('project_id', sa.UUID(), sa.ForeignKey('projects.id'), nullable=False),
        sa.Column('freelancer_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('client_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow, nullable=False),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False),
    )
    
    # Create indexes for better query performance
    op.create_index('ix_invitations_project_id', 'invitations', ['project_id'])
    op.create_index('ix_invitations_freelancer_id', 'invitations', ['freelancer_id'])
    op.create_index('ix_invitations_status', 'invitations', ['status'])


def downgrade():
    op.drop_index('ix_invitations_status')
    op.drop_index('ix_invitations_freelancer_id')
    op.drop_index('ix_invitations_project_id')
    op.drop_table('invitations')
