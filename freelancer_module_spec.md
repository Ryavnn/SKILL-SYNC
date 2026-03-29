# Freelancer Profile Module Specification

## Responsibilities
- Freelancer profile creation and management
- Skills and portfolio handling
- Credential verification status

## Endpoints
POST   /freelancers/profile  
GET    /freelancers/:id  
PUT    /freelancers/:id  

## Schemas

Request:
{
  "bio": "string",
  "skills": ["string"],
  "experience_level": "junior | mid | senior",
  "portfolio_links": ["string"]
}

Response:
{
  "id": "uuid",
  "user_id": "uuid",
  "skills": [],
  "verified": true
}

## Database Tables
- freelancer_profiles
- skills
- freelancer_skills
- credentials

## Dependencies
- User Module

## Events
- PROFILE_CREATED
- PROFILE_UPDATED
- PROFILE_VERIFIED