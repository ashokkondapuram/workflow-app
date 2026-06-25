# 📅 Appointment Reminder

Reads appointments from a CSV and sends email reminders 24h and 1h before each appointment.

## Quick Start

```bash
cp .env.example .env
docker build -t appointment-reminder .
docker run -d --env-file .env -p 8002:8002 -v $(pwd)/appointments.csv:/app/appointments.csv appointment-reminder
```

## Sample `appointments.csv`

```csv
name,email,datetime,provider,location
John Smith,john@example.com,2026-07-01 10:00,Dr. Jones,123 Main St
Sarah Lee,sarah@example.com,2026-07-01 14:30,Dr. Patel,456 Oak Ave
```

## Endpoints
```
GET /     — health
GET /run  — check now
```
API docs: http://localhost:8002/docs
