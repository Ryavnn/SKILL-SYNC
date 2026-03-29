# User Module Specification

## Responsibilities
- Manage user data
- Handle roles and permissions

## Endpoints
GET    /users/:id  
PUT    /users/:id  
GET    /users  

## Schemas

Response:
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "role": "client | freelancer | admin"
}

## Database Tables
- users

## Dependencies
- Auth Module

## Events
- USER_UPDATED