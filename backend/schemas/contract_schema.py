from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models.contract import Contract, Milestone, EscrowTransaction, Dispute


# ── Request Schemas ──────────────────────────────────────────────────

class MilestoneInputSchema(Schema):
    """Schema for milestone data within a contract creation request."""
    title = fields.String(required=True, validate=validate.Length(min=1, max=255))
    description = fields.String(validate=validate.Length(max=2000))
    amount = fields.Decimal(required=True)

    @validates_schema
    def validate_amount(self, data, **kwargs):
        if data.get('amount') is not None and data['amount'] <= 0:
            raise ValidationError("Milestone amount must be greater than zero", "amount")


class ContractCreateSchema(Schema):
    """Schema for creating a new contract."""
    project_id = fields.UUID(required=True, data_key="projectId")
    freelancer_id = fields.UUID(required=True, data_key="freelancerId")
    total_amount = fields.Decimal(required=True, data_key="totalAmount")
    milestones = fields.List(fields.Nested(MilestoneInputSchema), required=True, validate=validate.Length(min=1))

    @validates_schema
    def validate_total_amount(self, data, **kwargs):
        if data.get('total_amount') is not None and data['total_amount'] <= 0:
            raise ValidationError("Total amount must be greater than zero", "total_amount")


class DisputeCreateSchema(Schema):
    """Schema for creating a dispute."""
    milestone_id = fields.UUID(required=True)
    reason = fields.String(required=True, validate=validate.Length(min=1, max=255))
    description = fields.String(validate=validate.Length(max=2000))


class DisputeResolveSchema(Schema):
    """Schema for resolving a dispute."""
    resolution_type = fields.String(
        required=True,
        validate=validate.OneOf(['refund', 'release', 'split'])
    )


# ── Response Schemas ─────────────────────────────────────────────────

class MilestoneResponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Milestone
        load_instance = True
        include_fk = True
        include_pk = True
        exclude = ('contract_id',)

    amount = fields.Decimal(as_string=True)
    contractId = fields.UUID(attribute="contract_id")


class EscrowTransactionResponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = EscrowTransaction
        load_instance = True
        include_fk = True

    amount = fields.Decimal(as_string=True)


class ContractResponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Contract
        load_instance = True
        include_fk = True
        include_pk = True
        exclude = ('total_amount', 'project_id', 'freelancer_id', 'client_id')

    totalAmount = fields.Decimal(attribute="total_amount", as_string=True, dump_only=True)
    projectId = fields.UUID(attribute="project_id", dump_only=True)
    freelancerId = fields.UUID(attribute="freelancer_id", dump_only=True)
    clientId = fields.UUID(attribute="client_id", dump_only=True)
    milestones = fields.List(fields.Nested(MilestoneResponseSchema))
    freelancer_name = fields.Method("get_freelancer_name")
    freelancerName = fields.Method("get_freelancer_name")
    freelancer_title = fields.Method("get_freelancer_title")
    freelancerTitle = fields.Method("get_freelancer_title")
    project_title = fields.Method("get_project_title")
    projectTitle = fields.Method("get_project_title")

    def get_project_title(self, obj):
        return obj.project.title if getattr(obj, "project", None) else None

    def get_freelancer_name(self, obj):
        return obj.freelancer.name if obj.freelancer else None

    def get_freelancer_title(self, obj):
        if obj.freelancer and obj.freelancer.freelancer_profile:
            return obj.freelancer.freelancer_profile.title
        return None


class DisputeResponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Dispute
        load_instance = True
        include_fk = True
