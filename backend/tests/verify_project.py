import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_project_lifecycle():
    # 1. Register as a client
    client_data = {
        "name": "Test Client",
        "email": "client_v1@test.com",
        "password": "password123",
        "role": "client"
    }
    print("Registering client...")
    resp = requests.post(f"{BASE_URL}/auth/register", json=client_data)
    print(f"Register status: {resp.status_code}")
    
    # 2. Login to get token
    login_data = {
        "email": "client_v1@test.com",
        "password": "password123"
    }
    print("\nLogging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    token = resp.json().get("token")
    if not token:
        # Try finding token elsewhere if the response format is different
        token = resp.json().get("access_token") 
    print(f"Login status: {resp.status_code}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create a project
    project_data = {
        "title": "Build a Flask Backend",
        "description": "I need a scalable Flask backend for an AI-powered project matching system.",
        "budget": "$500 - $1000",
        "timeline": "2 weeks",
        "required_skills": ["Python", "Flask", "SQLAlchemy"]
    }
    print("\nCreating project...")
    resp = requests.post(f"{BASE_URL}/projects", json=project_data, headers=headers)
    print(f"Create project status: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    
    if resp.status_code != 201:
        print("Project creation failed!")
        return

    project_id = resp.json()["data"]["id"]
    
    # 4. Get project by ID
    print(f"\nGetting project {project_id}...")
    resp = requests.get(f"{BASE_URL}/projects/{project_id}")
    print(f"Get project status: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    
    # 5. Get all projects
    print("\nGetting all projects...")
    resp = requests.get(f"{BASE_URL}/projects")
    print(f"Get all projects status: {resp.status_code}")
    # print(json.dumps(resp.json(), indent=2))
    
    # 6. Update project
    update_data = {
        "title": "Build a Flask Backend (Updated)",
        "required_skills": ["Python", "Flask", "PostgreSQL"]
    }
    print(f"\nUpdating project {project_id}...")
    resp = requests.put(f"{BASE_URL}/projects/{project_id}", json=update_data, headers=headers)
    print(f"Update project status: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))

if __name__ == "__main__":
    test_project_lifecycle()
