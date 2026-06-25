# ApptRemind — Self-Hosted Appointment Reminder App

A full-stack appointment reminder system. Add appointments, configure a Slack/webhook URL, and the backend automatically sends reminders before each appointment.

## Quick Start

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

## Features
- Create / Edit / Cancel appointments
- Auto-reminder via Slack webhook (configurable hours before)
- Scheduler runs every 15 minutes automatically
- Manual "Send Reminders Now" button on dashboard
- SQLite persistence (no external DB needed)
- Dashboard with stats: today, tomorrow, total, reminded

## Setup
1. Go to Settings → paste your Slack Incoming Webhook URL
2. Set how many hours before to remind (default: 24)
3. Add appointments — reminders fire automatically!
