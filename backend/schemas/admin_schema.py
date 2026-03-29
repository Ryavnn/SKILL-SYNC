from marshmallow import Schema, fields, post_dump
from schemas.auth_schema import UserSchema

class AdminUserSchema(UserSchema):
    """Extended user schema with admin-only fields."""
    is_active = fields.Boolean(dump_only=True)
    admin_actions = fields.Nested('AdminActionLogSchema', many=True, exclude=('admin',))

class AdminActionLogSchema(Schema):
    """Schema for audit logging entries."""
    id = fields.UUID(dump_only=True)
    admin_id = fields.UUID(required=True)
    action_type = fields.String(required=True)
    target_type = fields.String(required=True)
    target_id = fields.String(required=True)
    action_metadata = fields.Dict(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    
    # Nested field to show the admin name
    admin = fields.Nested(UserSchema, only=('id', 'name', 'email'), dump_only=True)

class SkillSchema(Schema):
    """Schema for skill taxonomy."""
    id = fields.Integer(dump_only=True)
    name = fields.String(required=True)

class PlatformAnalyticsSchema(Schema):
    """Schema for dashboard overview statistics."""
    total_users = fields.Integer()
    active_users = fields.Integer()
    total_projects = fields.Integer()
    total_contracts = fields.Integer()
    total_referrals = fields.Integer()
    open_disputes = fields.Integer()
    dispute_rate = fields.Float()
    total_volume = fields.Float()
    total_payouts = fields.Float()
    in_escrow = fields.Float()

class AdminFreelancerSchema(Schema):
    """Schema for freelancer verification review."""
    id = fields.UUID(dump_only=True)
    user = fields.Nested(UserSchema, only=('id', 'name', 'email'))
    bio = fields.String()
    experience_level = fields.String()
    verification_status = fields.String()
    created_at = fields.DateTime(dump_only=True)
    credentials = fields.List(fields.Nested(Schema.from_dict({
        "id": fields.UUID(),
        "document_url": fields.String(),
        "status": fields.String()
    })))
