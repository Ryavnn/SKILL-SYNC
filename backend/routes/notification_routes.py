from flask import Blueprint
from controllers.notification_controller import NotificationController

notification_bp = Blueprint('notifications', __name__)
controller = NotificationController()

@notification_bp.route('/', methods=['GET'])
def get_notifications():
    return controller.get_notifications()

@notification_bp.route('/<string:notification_id>/read', methods=['PATCH'])
def mark_as_read(notification_id):
    return controller.mark_as_read(notification_id)

@notification_bp.route('/read-all', methods=['POST'])
def mark_all_as_read():
    return controller.mark_all_as_read()
