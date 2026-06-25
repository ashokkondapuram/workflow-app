# 🧾 Invoice Tracker & Reminder

**Category:** Finance

Tracks unpaid invoices from a CSV file and sends reminder emails automatically at 9am daily — 7 days, 3 days, 1 day, and day-of.

## Quick Start

```bash
cp .env.example .env
# edit .env with your SMTP credentials

docker build -t invoice-tracker .
docker run -d --env-file .env -p 8001:8001 -v $(pwd)/invoices.csv:/app/invoices.csv invoice-tracker
```

## Environment Variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=you@gmail.com
INVOICE_FILE=invoices.csv
```

## Sample `invoices.csv`

```csv
invoice_id,client_name,client_email,amount,due_date,status
INV-001,Acme Corp,billing@acme.com,1500.00,2026-07-01,unpaid
INV-002,Beta Inc,ap@beta.com,800.00,2026-07-05,unpaid
```

## Endpoints

```
GET /     — health check
GET /run  — trigger invoice check immediately
```

API docs: http://localhost:8001/docs
