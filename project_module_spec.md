# Project Module Specification

## Responsibilities
- Project creation and lifecycle management

## Endpoints
POST   /projects  
GET    /projects/:id  
GET    /projects  
PUT    /projects/:id  

## Schemas

Request:
{
  "title": "string",
  "description": "string",
  "budget": "number",
  "timeline": "string",
  "skills_required": ["string"]
}

Response:
{
  "id": "uuid",
  "status": "open | in_progress | completed"
}

## Database Tables
- projects
- project_skills

## Dependencies
- User Module

## Events
- PROJECT_CREATED
- PROJECT_UPDATED