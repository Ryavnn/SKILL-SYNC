# Auth Module Specification

## Responsibilities
- User authentication (login/register)
- JWT token generation and validation
- Password hashing and security
- Session management

## Does NOT Handle
- User profile data
- Freelancer-specific data

## Endpoints
POST   /auth/register  
POST   /auth/login  
GET    /auth/me  
POST   /auth/logout  

## Input/Output Schemas

### Register
Request:
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "client | freelancer"
}

Response:
{
  "token": "jwt_token",
  "user": { ... }
}

### Login
Request:
{
  "email": "string",
  "password": "string"
}

Response:
{
  "token": "jwt_token"
}

## Database Tables
- users (id, email, password_hash, role, created_at)

## Dependencies
- None (core module)

## Events
- USER_REGISTERED
- USER_LOGGED_IN