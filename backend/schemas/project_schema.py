from marshmallow import Schema, fields, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models.project import Project
from models.freelancer import Skill

class ProjectSkillSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Skill
        load_instance = True

class ProjectResponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Project
        load_instance = True
        include_fk = True
        include_pk = True
        # Exclude original snake_case fields if they conflict or aren't needed
        exclude = ('client_id', 'created_at', 'assigned_freelancer_id', 'budget_min', 'budget_max', 'proposals_count')
    
    required_skills = fields.Method("get_skills_names")
    requiredSkills = fields.Method("get_skills_names")
    
    # Adding camelCase aliases for frontend consumption
    budgetMin = fields.Float(attribute="budget_min")
    budgetMax = fields.Float(attribute="budget_max")
    clientId = fields.UUID(attribute="client_id")
    createdAt = fields.DateTime(attribute="created_at")
    assignedFreelancerId = fields.UUID(attribute="assigned_freelancer_id")
    assignedFreelancerName = fields.Method("get_assigned_freelancer_name")
    proposalsCount = fields.Integer(attribute="proposals_count")
    clientName = fields.Method("get_client_name")
    clientEmail = fields.Method("get_client_email")
    
    def get_client_name(self, obj):
        return obj.client.name if obj.client else None

    def get_client_email(self, obj):
        return obj.client.email if obj.client else None
    
    def get_assigned_freelancer_name(self, obj):
        return obj.assigned_freelancer.name if obj.assigned_freelancer else None
    
    # Redundant but explicit for clarity
    title = fields.String()
    description = fields.String()
    status = fields.String()
    timeline = fields.String()

    def get_skills_names(self, obj):
        return [skill.name for skill in obj.required_skills]

class ProjectCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=5, max=255))
    description = fields.String(required=True, validate=validate.Length(min=20))
    budget_min = fields.Float(required=True)
    budget_max = fields.Float(required=True)
    timeline = fields.String(required=True)
    required_skills = fields.List(fields.String(), required=False, data_key="skills")
    
class ProjectUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=5, max=255))
    description = fields.String(validate=validate.Length(min=20))
    budget_min = fields.Float()
    budget_max = fields.Float()
    timeline = fields.String()
    required_skills = fields.List(fields.String(), data_key="skills")
    status = fields.String(validate=validate.OneOf(['open', 'in_progress', 'completed', 'cancelled']))
