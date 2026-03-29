import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_freelancer_flow():
    # 1. Register as a freelancer
    register_data = {
        "name": "Test Freelancer",
        "email": "freelancer_v6@test.com",
        "password": "password123",
        "role": "freelancer"
    }
    print("Registering freelancer...")
    resp = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(resp.json())
    
    # 2. Login to get token
    login_data = {
        "email": "freelancer_v6@test.com",
        "password": "password123"
    }
    print("\nLogging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    token = resp.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Token acquired. Status: {resp.status_code}")
    
    # 3. Create profile
    profile_data = {
        "bio": "Expert Python Developer with 5 years of experience in backend systems.",
        "skills": ["Python", "Flask", "PostgreSQL", "React"],
        "experience_level": "senior",
        "portfolio_links": ["https://github.com/testfree"]
    }
    print("\nCreating profile...")
    resp = requests.post(f"{BASE_URL}/freelancers/profile", json=profile_data, headers=headers)
    profile = resp.json().get("data")
    print(resp.json())
    
    if not profile:
        print("Profile creation failed!")
        return
        
    profile_id = profile["id"]
    
    # 4. Get profile
    print(f"\nGetting profile {profile_id}...")
    resp = requests.get(f"{BASE_URL}/freelancers/{profile_id}")
    print(resp.json())
    
    # 5. Update profile
    update_data = {
        "bio": "Updated bio: Expert Full Stack Developer.",
        "skills": ["Python", "Flask", "Next.js"]
    }
    print(f"\nUpdating profile {profile_id}...")
    resp = requests.put(f"{BASE_URL}/freelancers/{profile_id}", json=update_data, headers=headers)
    print(resp.json())

if __name__ == "__main__":
    try:
        test_freelancer_flow()
    except Exception as e:
        print(f"Error: {e}")
