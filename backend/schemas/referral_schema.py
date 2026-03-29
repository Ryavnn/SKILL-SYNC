from marshmallow import Schema, fields, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models.referral import Referral, ReferralHistory

class ReferralResponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Referral
        load_instance = True
        include_fk = True

class ReferralCreateSchema(Schema):
    project_id = fields.UUID(required=True)
    referred_freelancer_id = fields.UUID(required=True)
    message = fields.String(validate=validate.Length(max=500))

class ReferralHistorySchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReferralHistory
        load_instance = True
        include_fk = True


class ReferralStatsSchema(Schema):
    """Shape of GET /referral/stats response data."""
    total_referrals   = fields.Integer()
    pending_referrals = fields.Integer()
    accepted_referrals = fields.Integer()
    rejected_referrals = fields.Integer()
    expired_referrals  = fields.Integer()
    total_earned       = fields.Float()   # placeholder — 0 until a reward column exists


class ReferralHistoryItemSchema(Schema):
    """Shape of a single item in GET /referral/history response."""
    id              = fields.String()
    project_title   = fields.String()
    referred_user   = fields.String()   # referred freelancer's name
    status          = fields.String()
    created_at      = fields.DateTime(format='iso')
    reward          = fields.Float()    # 0 until reward tracking is added
