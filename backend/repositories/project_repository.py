from app import db
from models.project import Project
from models.freelancer import Skill
from sqlalchemy.exc import SQLAlchemyError

class ProjectRepository:
    @staticmethod
    def create_project(project_data, required_skills=None):
        try:
            skills = []
            if required_skills:
                unique_skill_names = set(name.strip() for name in required_skills if name)
                for skill_name in unique_skill_names:
                    # Case-insensitive search
                    skill_obj = Skill.query.filter(Skill.name.ilike(skill_name)).first()
                    if not skill_obj:
                        skill_obj = Skill(name=skill_name)
                        db.session.add(skill_obj)
                    skills.append(skill_obj)
            
            project = Project(**project_data)
            project.required_skills = skills
            
            db.session.add(project)
            db.session.commit()
            return project
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    @staticmethod
    def get_project_by_id(project_id):
        return Project.query.get(project_id)

    @staticmethod
    def get_all_projects(filters=None):
        query = Project.query
        if filters:
            if 'status' in filters:
                query = query.filter_by(status=filters['status'])
            if 'client_id' in filters:
                query = query.filter_by(client_id=filters['client_id'])
            if 'assigned_freelancer_id' in filters:
                query = query.filter_by(assigned_freelancer_id=filters['assigned_freelancer_id'])
        return query.all()

    @staticmethod
    def update_project(project, update_data, required_skills=None):
        try:
            for key, value in update_data.items():
                setattr(project, key, value)
            
            if required_skills is not None:
                new_skills = []
                unique_skill_names = set(name.strip() for name in required_skills if name)
                for skill_name in unique_skill_names:
                    # Case-insensitive search
                    skill_obj = Skill.query.filter(Skill.name.ilike(skill_name)).first()
                    if not skill_obj:
                        skill_obj = Skill(name=skill_name)
                        db.session.add(skill_obj)
                    new_skills.append(skill_obj)
                project.required_skills = new_skills
            
            db.session.commit()
            return project
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
