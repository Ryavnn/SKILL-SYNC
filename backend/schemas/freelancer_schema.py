from marshmallow import Schema, fields, validate, post_load
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models.freelancer import FreelancerProfile, Skill, Credential

class SkillSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Skill
        load_instance = True

class CredentialSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Credential
        load_instance = True
        include_fk = True

class FreelancerProfileSchema(Schema):
    id = fields.UUID(dump_only=True)
    user_id = fields.UUID(dump_only=True)
    title = fields.String()
    bio = fields.String()
    experience_level = fields.String(data_key="experience")
    portfolio_links = fields.List(fields.URL(), data_key="portfolioLinks")
    verification_status = fields.String(data_key="verificationStatus")
    hourly_rate = fields.Float(data_key="hourlyRate")
    location = fields.String()
    skills = fields.Method("get_skills_names")
    credentials = fields.List(fields.Nested(CredentialSchema), dump_only=True)

    def get_skills_names(self, obj):
        return [skill.name for skill in obj.skills]

class CreateFreelancerProfileSchema(Schema):
    title = fields.String(required=False)
    bio = fields.String(required=True)
    skills = fields.List(fields.String(), required=True, validate=validate.Length(min=1))
    experience_level = fields.String(required=True, data_key="experience", validate=validate.OneOf(['junior', 'mid', 'senior', 'expert']))
    portfolio_links = fields.List(fields.URL(), required=False, data_key="portfolioLinks")
    hourly_rate = fields.Float(required=False, data_key="hourlyRate")
    location = fields.String(required=False)

class UpdateFreelancerProfileSchema(Schema):
    title = fields.String(required=False)
    bio = fields.String(required=False)
    skills = fields.List(fields.String(), required=False)
    experience_level = fields.String(required=False, data_key="experience", validate=validate.OneOf(['junior', 'mid', 'senior', 'expert']))
    portfolio_links = fields.List(fields.URL(), required=False, data_key="portfolioLinks")
    hourly_rate = fields.Float(required=False, data_key="hourlyRate")
    location = fields.String(required=False)
