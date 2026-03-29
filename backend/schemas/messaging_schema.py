from marshmallow import Schema, fields, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models.messaging import MessageThread, Message
from models.user import User

class UserBriefSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = User
        fields = ('id', 'name', 'email')

class MessageSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Message
        load_instance = True
        include_fk = True

    sender = fields.Nested(UserBriefSchema, dump_only=True)

class ThreadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = MessageThread
        load_instance = True
        include_fk = True

    participant_1 = fields.Nested(UserBriefSchema, dump_only=True)
    participant_2 = fields.Nested(UserBriefSchema, dump_only=True)
    last_message = fields.Method("get_last_message", dump_only=True)
    unread_count = fields.Method("get_unread_count", dump_only=True)

    def get_last_message(self, obj):
        last_msg = Message.query.filter_by(thread_id=obj.id).order_by(Message.created_at.desc()).first()
        if last_msg:
            return MessageSchema().dump(last_msg)
        return None

    def get_unread_count(self, obj):
        # This count is specific to the "current" user, so it might need context
        # For now, we return a general count or leave for the service to populate
        return 0 

class CreateThreadSchema(Schema):
    participant_id = fields.UUID(required=True)
    project_id = fields.UUID(required=False)
    referral_id = fields.UUID(required=False)

class SendMessageSchema(Schema):
    thread_id = fields.UUID(required=True)
    content = fields.String(required=True, validate=validate.Length(min=1))
