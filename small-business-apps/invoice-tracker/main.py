import csv, os, smtplib
from email.mime.text import MIMEText
from datetime import datetime, date
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="Invoice Tracker")
scheduler = AsyncIOScheduler()

INVOICE_FILE = os.getenv("INVOICE_FILE", "invoices.csv")

def send_email(to, subject, body):
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = os.getenv("FROM_EMAIL")
    msg["To"] = to
    with smtplib.SMTP(os.getenv("SMTP_HOST", "smtp.gmail.com"), 587) as s:
        s.starttls()
        s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
        s.sendmail(msg["From"], [to], msg.as_string())

def check_invoices():
    if not os.path.exists(INVOICE_FILE):
        print("No invoice file found")
        return
    today = date.today()
    reminders = []
    with open(INVOICE_FILE) as f:
        for row in csv.DictReader(f):
            try:
                due = datetime.strptime(row["due_date"], "%Y-%m-%d").date()
            except ValueError:
                continue
            days_left = (due - today).days
            if row.get("status", "unpaid").lower() == "unpaid" and days_left in (7, 3, 1, 0):
                reminders.append({**row, "days_left": days_left})
    for inv in reminders:
        label = "TODAY" if inv["days_left"] == 0 else f"in {inv['days_left']} day(s)"
        body = f"""
        <h2 style='color:#1a1a2e'>Invoice Reminder</h2>
        <p>Invoice <b>#{inv['invoice_id']}</b> for <b>${inv['amount']}</b> is due <b>{label}</b>.</p>
        <p>Client: {inv.get('client_name','')}</p>
        <p style='color:gray;font-size:12px'>Sent by FlowCraft Invoice Tracker</p>
        """
        try:
            send_email(inv["client_email"], f"Invoice #{inv['invoice_id']} Due {label}", body)
        except Exception as e:
            print(f"Email error for {inv['client_email']}: {e}")
    print(f"[{today}] Checked invoices — {len(reminders)} reminders sent")

@app.on_event("startup")
async def startup():
    scheduler.add_job(check_invoices, "cron", hour=9, minute=0)
    scheduler.start()

@app.get("/")
def root():
    return {"app": "Invoice Tracker", "status": "running", "docs": "/docs"}

@app.get("/run")
def run_now():
    check_invoices()
    return {"message": "Invoice check complete"}
