from repositories.project_repository import ProjectRepository

class ProjectService:
    def __init__(self):
        self.project_repo = ProjectRepository()

    def create_project(self, client_id, project_data):
        # We assume the role check is done in the controller or decorator, 
        # but the service can also verify if needed.
        project_data['client_id'] = client_id
        # 'required_skills' key comes from schema loading 'skills' with data_key
        required_skills = project_data.pop('required_skills', [])
        
        try:
            project = self.project_repo.create_project(project_data, required_skills)
            return {"data": project, "status": 201}
        except Exception as e:
            return {"error": str(e), "status": 500}

    def get_project(self, project_id):
        project = self.project_repo.get_project_by_id(project_id)
        if not project:
            return {"error": "Project not found", "status": 404}
        return {"data": project, "status": 200}

    def get_all_projects(self, filters=None):
        projects = self.project_repo.get_all_projects(filters)
        return {"data": projects, "status": 200}

    def update_project(self, project_id, client_id, update_data):
        project = self.project_repo.get_project_by_id(project_id)
        if not project:
            return {"error": "Project not found", "status": 404}
        
        # Ownership check
        if str(project.client_id) != str(client_id):
            return {"error": "Unauthorized to update this project", "status": 403}
        
        required_skills = update_data.pop('required_skills', None)
        
        # Prevent arbitrary status changes if needed 
        # (Though update_data might contain a valid status from the schema)
        
        try:
            updated_project = self.project_repo.update_project(project, update_data, required_skills)
            return {"data": updated_project, "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}
