# FlowCraft — Small Business Standalone Apps

Each folder is a **self-contained Docker app** for one automation task.
No setup wizard, no SaaS subscription — just `docker run`.

## Apps

| App | Category | Port |
|-----|----------|------|
| 🧾 [Invoice Tracker](invoice-tracker/) | Finance | 8001 |
| 📅 [Appointment Reminder](appointment-reminder/) | Healthcare/Services | 8002 |
| 📦 [Inventory Low-Stock Alert](inventory-alert/) | Retail/Operations | 8003 |
| 📊 [Daily Business Digest](daily-digest/) | Reporting | 8004 |
| 🎯 [Lead Capture & Auto-Reply](lead-capture/) | Marketing | 8005 |
| 💸 [Expense Logger](expense-logger/) | Finance | 8006 |
| ⭐ [Google Reviews Monitor](review-monitor/) | Marketing | 8007 |
| 👥 [Staff Schedule Notifier](staff-scheduler/) | HR | 8008 |
| 🛒 [Order Confirmation Webhook](order-confirmation/) | E-Commerce | 8009 |
| 💾 [File Backup & Notify](backup-notifier/) | DevOps | 8010 |

## How to Use Any App

```bash
cd small-business-apps/<app-name>
cp .env.example .env          # fill in your values
docker build -t <app-name> .
docker run -d --env-file .env -p PORT:PORT <app-name>
```

## Run All Together

```bash
docker compose -f small-business-apps/docker-compose.yml up
```

Each app exposes a Swagger UI at `http://localhost:PORT/docs`.
