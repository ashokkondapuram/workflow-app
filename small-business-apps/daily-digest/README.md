# 📊 Daily Business Digest

Sends a morning email summary (Mon-Fri at 7am) with orders, revenue, and tasks from your API.

## Quick Start
```bash
cp .env.example .env
docker build -t daily-digest .
docker run -d --env-file .env -p 8004:8004 daily-digest
```

## Environment Variables
```env
DATA_API_URL=https://your-api.com/stats   # should return {orders, revenue, tasks}
REPORT_EMAIL=owner@yourbusiness.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
```

## Endpoints
```
GET /run  — send digest now
GET /     — health check
```
API docs: http://localhost:8004/docs
