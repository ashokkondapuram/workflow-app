# 💸 Expense Logger & Weekly Summary

Log business expenses via API. Get a weekly summary email every Friday at 6pm.

## Quick Start
```bash
cp .env.example .env
docker build -t expense-logger .
docker run -d --env-file .env -p 8006:8006 expense-logger
```

## Log an Expense
```bash
curl -X POST http://localhost:8006/expense \
  -H 'Content-Type: application/json' \
  -d '{"description":"Office Supplies","amount":45.99,"category":"Supplies","submitted_by":"Alice"}'
```

## Endpoints
```
POST /expense   — log expense {description, amount, category, submitted_by, date?}
GET  /expenses  — list all expenses
GET  /run       — send weekly summary now
```
API docs: http://localhost:8006/docs
