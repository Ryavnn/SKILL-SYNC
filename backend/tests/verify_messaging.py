import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_messaging_flow():
    # 1. Register/Login Users
    users = [
        {"name": "Client X", "email": "client_x@test.com", "password": "password123", "role": "client"},
        {"name": "Freelancer Y", "email": "freelancer_y@test.com", "password": "password123", "role": "freelancer"},
        {"name": "Stranger Z", "email": "stranger_z@test.com", "password": "password123", "role": "freelancer"}
    ]
    
    tokens = {}
    user_ids = {}

    for u in users:
        print(f"Registering/Logging in {u['name']}...")
        reg_resp = requests.post(f"{BASE_URL}/auth/register", json=u)
        if reg_resp.status_code == 201:
            user_ids[u["name"]] = reg_resp.json()["user"]["id"]
        
        login_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": u["email"], "password": u["password"]})
        tokens[u["name"]] = login_resp.json().get("token") or login_resp.json().get("access_token")
        
        # If registration was 400 (already exists), we need to get ID some other way 
        # but for fresh tests, 201 is fine. 
        # To be safe, let's assume login might return it if we updated it, 
        # but since it doesn't, we'll just use the reg_resp for now.
    
    # Check if we got all IDs
    if len(user_ids) < 3:
        # Fallback: if they already exist, we might need an admin or a /me endpoint
        # Let's try /api/auth/me if we can (though not officially in my list, it was in the controller)
        for u_name in tokens:
            if u_name not in user_ids:
                me_resp = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {tokens[u_name]}"})
                if me_resp.status_code == 200:
                    user_ids[u_name] = me_resp.json()["user"]["id"]

    # 3. Create Thread
    print("\nCreating thread between Client X and Freelancer Y...")
    thread_data = {"participant_id": user_ids["Freelancer Y"]}
    resp = requests.post(f"{BASE_URL}/messages/threads", json=thread_data, headers={"Authorization": f"Bearer {tokens['Client X']}"})
    print(f"Thread creation status: {resp.status_code}")
    thread_id = resp.json()["data"]["id"]

    # 4. Send Message (Client X)
    print("\nSending message from Client X...")
    msg_data = {"thread_id": thread_id, "content": "Hello, are you available for a project?"}
    resp = requests.post(f"{BASE_URL}/messages/send", json=msg_data, headers={"Authorization": f"Bearer {tokens['Client X']}"})
    print(f"Send status (X): {resp.status_code}")

    # 5. Send Reply (Freelancer Y)
    print("\nSending reply from Freelancer Y...")
    msg_data = {"thread_id": thread_id, "content": "Yes, I am! Tell me more."}
    resp = requests.post(f"{BASE_URL}/messages/send", json=msg_data, headers={"Authorization": f"Bearer {tokens['Freelancer Y']}"})
    print(f"Send status (Y): {resp.status_code}")

    # 6. Fetch Messages
    print("\nFetching messages for the thread...")
    resp = requests.get(f"{BASE_URL}/messages/threads/{thread_id}", headers={"Authorization": f"Bearer {tokens['Client X']}"})
    print(f"Fetch status: {resp.status_code}")
    messages = resp.json()["data"]
    print(f"Found {len(messages)} messages.")

    # 7. Check Inbox (Freelancer Y)
    print("\nChecking inbox for Freelancer Y...")
    resp = requests.get(f"{BASE_URL}/messages/inbox", headers={"Authorization": f"Bearer {tokens['Freelancer Y']}"})
    print(f"Inbox status: {resp.status_code}")
    inbox = resp.json()["data"]
    print(f"Threads in inbox: {len(inbox)}")
    if len(inbox) > 0:
        print(f"Unread count: {inbox[0]['unread_count']}")

    # 8. Mark as Read
    print("\nMarking thread as read...")
    resp = requests.patch(f"{BASE_URL}/messages/{thread_id}/read", headers={"Authorization": f"Bearer {tokens['Freelancer Y']}"})
    print(f"Mark as read status: {resp.status_code}")

    # 9. Verify Unread Count is 0
    resp = requests.get(f"{BASE_URL}/messages/inbox", headers={"Authorization": f"Bearer {tokens['Freelancer Y']}"})
    inbox = resp.json()["data"]
    if len(inbox) > 0:
        print(f"Updated unread count: {inbox[0]['unread_count']}")

    # 10. Security Test (Stranger Z trying to read thread X-Y)
    print("\nSecurity check: Stranger Z trying to read X-Y thread...")
    resp = requests.get(f"{BASE_URL}/messages/threads/{thread_id}", headers={"Authorization": f"Bearer {tokens['Stranger Z']}"})
    print(f"Stranger fetch status (expected 403): {resp.status_code}")

if __name__ == "__main__":
    test_messaging_flow()
