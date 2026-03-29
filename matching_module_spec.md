# AI Matching Module Specification

## Responsibilities
- Extract skills from project descriptions
- Match freelancers to projects

## Endpoints
POST   /matching/run  
GET    /matching/:project_id  

## Schemas

Response:
{
  "matches": [
    {
      "freelancer_id": "uuid",
      "score": 0.87,
      "skills": []
    }
  ]
}

## Database Tables
- match_results

## Dependencies
- Project Module
- Freelancer Module

## Events
- MATCHING_COMPLETED