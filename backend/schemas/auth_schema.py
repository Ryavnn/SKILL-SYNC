from marshmallow import Schema, fields, validate

class UserSchema(Schema):
    id = fields.UUID(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=2))
    email = fields.Email(required=True)
    role = fields.String(required=True, validate=validate.OneOf(['client', 'freelancer', 'admin']))
    is_active = fields.Boolean(dump_only=True)
    created_at = fields.DateTime(dump_only=True)

class RegisterSchema(UserSchema):
    password = fields.String(required=True, validate=validate.Length(min=8))

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)
