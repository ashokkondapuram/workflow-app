# 🎯 Lead Capture & Auto-Reply

Receives contact form submissions via webhook, saves to CSV, and sends an instant auto-reply to the lead + notifies you.

## Quick Start
```bash
cp .env.example .env
docker build -t lead-capture .
docker run -d --env-file .env -p 8005:8005 lead-capture
```

## Send a Lead
```bash
curl -X POST http://localhost:8005/lead \
  -H 'Content-Type: application/json' \
  -d '{"name":"Jane Doe","email":"jane@example.com","message":"Interested in your services","source":"website"}'
```

## Endpoints
```
POST /lead    — capture a lead {name, email, phone, message, source}
GET  /leads   — list all captured leads
GET  /        — health check
```
API docs: http://localhost:8005/docs
