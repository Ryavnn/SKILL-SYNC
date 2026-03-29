from app import create_app, db
from services.notification_service import NotificationService
from models.user import User

app = create_app()

with app.app_context():
    # Find any user
    user = User.query.first()
    if not user:
        print("No users found to test notifications.")
        exit(0)
        
    print(f"Testing notifications for user: {user.email}")
    service = NotificationService()
    
    # Create
    print("Creating a test notification...")
    result = service.create_notification(str(user.id), "system", "This is a test notification.")
    if "error" in result:
        print(f"Failed to create: {result}")
    else:
        print(f"Created notification ID: {result['data'].id}")
        notif_id = result['data'].id
        
        # Fetch
        print("Fetching notifications...")
        fetch_result = service.get_user_notifications(str(user.id))
        notifs = fetch_result["data"]["notifications"]
        unread = fetch_result["data"]["unread_count"]
        print(f"Found {len(notifs)} notifications, {unread} unread.")
        
        # Mark as read
        print("Marking as read...")
        read_result = service.mark_as_read(notif_id, str(user.id))
        if "error" in read_result:
             print(f"Failed to mark as read: {read_result}")
        else:
             print(f"Marked as read. Status: {read_result['data'].is_read}")
             
        # Fetch again
        print("Fetching notifications to verify unread count...")
        fetch_result2 = service.get_user_notifications(str(user.id))
        unread2 = fetch_result2["data"]["unread_count"]
        print(f"Now {unread2} unread.")
