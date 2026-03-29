# Referral Module Specification

## Responsibilities
- Manage freelancer referrals
- Track referral chains

## Endpoints
POST   /referrals  
GET    /referrals/:project_id  

## Schemas

Request:
{
  "project_id": "uuid",
  "from_freelancer": "uuid",
  "to_freelancer": "uuid"
}

## Database Tables
- referrals

## Dependencies
- Project Module
- Freelancer Module

## Events
- REFERRAL_CREATED
- REFERRAL_ACCEPTED