# Messaging Module Specification

## Responsibilities
- Handle user communication

## Endpoints
POST   /messages  
GET    /messages/:conversation_id  

## Schemas

Request:
{
  "sender_id": "uuid",
  "receiver_id": "uuid",
  "message": "string"
}

## Database Tables
- conversations
- messages

## Dependencies
- User Module

## Events
- MESSAGE_SENT