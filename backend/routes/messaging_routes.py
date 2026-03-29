from flask import Blueprint
from controllers.messaging_controller import MessagingController

messaging_bp = Blueprint('messaging', __name__, url_prefix='/api/messages')
controller = MessagingController()

@messaging_bp.route('/threads', methods=['POST'])
def get_or_create_thread():
    return controller.get_or_create_thread()

@messaging_bp.route('/send', methods=['POST'])
def send_message():
    return controller.send_message()

@messaging_bp.route('/threads/<thread_id>', methods=['GET'])
def get_thread_messages(thread_id):
    return controller.get_thread_messages(thread_id)

@messaging_bp.route('/inbox', methods=['GET'])
def get_inbox():
    return controller.get_inbox()

@messaging_bp.route('/<thread_id>/read', methods=['PATCH'])
def mark_as_read(thread_id):
    return controller.mark_as_read(thread_id)
