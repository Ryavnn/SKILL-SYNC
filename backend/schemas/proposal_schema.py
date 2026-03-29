from marshmallow import Schema, fields, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models.proposal import Proposal

class ProposalResponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Proposal
        load_instance = True
        include_fk = True
        exclude = ('project_id', 'freelancer_id', 'created_at', 'updated_at', 'bid_amount', 'estimated_duration')

    # Camel case aliases
    projectId = fields.UUID(attribute="project_id")
    freelancerId = fields.UUID(attribute="freelancer_id")
    freelancerName = fields.Method("get_freelancer_name")
    freelancerEmail = fields.Method("get_freelancer_email")
    bidAmount = fields.Float(attribute="bid_amount")
    estimatedDuration = fields.String(attribute="estimated_duration")
    createdAt = fields.DateTime(attribute="created_at")
    updatedAt = fields.DateTime(attribute="updated_at")

    def get_freelancer_name(self, obj):
        return obj.freelancer.name if obj.freelancer else None

    def get_freelancer_email(self, obj):
        return obj.freelancer.email if obj.freelancer else None

class ProposalCreateSchema(Schema):
    project_id = fields.UUID(required=True, data_key="projectId")
    cover_letter = fields.String(required=True, validate=validate.Length(min=20), data_key="coverLetter")
    bid_amount = fields.Float(required=True, data_key="bidAmount")
    estimated_duration = fields.String(required=True, data_key="estimatedDuration")

class ProposalUpdateStatusSchema(Schema):
    status = fields.String(required=True, validate=validate.OneOf(['accepted', 'rejected']))
