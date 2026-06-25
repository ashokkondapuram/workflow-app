import csv, os, smtplib
from email.mime.text import MIMEText
from datetime import datetime
from fastapi import FastAPI, Request
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="Expense Logger")
scheduler = AsyncIOScheduler()
EXPENSE_FILE = "expenses.csv"
FIELDS = ["date", "description", "amount", "category", "submitted_by"]

def ensure_csv():
    if not os.path.exists(EXPENSE_FILE):
        with open(EXPENSE_FILE, "w", newline="") as f:
            csv.DictWriter(f, fieldnames=FIELDS).writeheader()

def send_email(subject, body):
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = os.getenv("SMTP_USER")
    msg["To"] = os.getenv("OWNER_EMAIL")
    with smtplib.SMTP(os.getenv("SMTP_HOST", "smtp.gmail.com"), 587) as s:
        s.starttls(); s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
        s.sendmail(msg["From"], [msg["To"]], msg.as_string())

def weekly_summary():
    ensure_csv()
    with open(EXPENSE_FILE) as f:
        rows = list(csv.DictReader(f))
    if not rows: return
    total = sum(float(r["amount"]) for r in rows)
    by_cat = {}
    for r in rows:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + float(r["amount"])
    cat_rows = "".join(f"<tr><td>{c}</td><td>${v:.2f}</td></tr>" for c, v in sorted(by_cat.items()))
    exp_rows = "".join(f"<tr><td>{r['date']}</td><td>{r['description']}</td><td>${float(r['amount']):.2f}</td><td>{r['category']}</td></tr>" for r in rows[-20:])
    body = f"<h2>Weekly Expense Summary</h2><h3>Total: ${total:.2f}</h3><h4>By Category</h4><table border='1' cellpadding='6'><tr><th>Category</th><th>Total</th></tr>{cat_rows}</table><h4>Recent</h4><table border='1' cellpadding='6'><tr><th>Date</th><th>Description</th><th>Amount</th><th>Category</th></tr>{exp_rows}</table>"
    try:
        send_email("Weekly Expense Summary", body)
        with open(EXPENSE_FILE, "w", newline="") as f:
            csv.DictWriter(f, fieldnames=FIELDS).writeheader()
    except Exception as e:
        print(f"Email error: {e}")

@app.on_event("startup")
async def startup():
    ensure_csv()
    scheduler.add_job(weekly_summary, "cron", day_of_week="fri", hour=18)
    scheduler.start()

@app.post("/expense")
async def log_expense(request: Request):
    data = await request.json()
    ensure_csv()
    with open(EXPENSE_FILE, "a", newline="") as f:
        csv.DictWriter(f, fieldnames=FIELDS).writerow({
            "date": data.get("date", datetime.now().strftime("%Y-%m-%d")),
            "description": data.get("description", ""),
            "amount": data.get("amount", 0),
            "category": data.get("category", "Other"),
            "submitted_by": data.get("submitted_by", "")
        })
    return {"message": "Expense logged"}

@app.get("/expenses")
def list_expenses():
    ensure_csv()
    with open(EXPENSE_FILE) as f: return {"expenses": list(csv.DictReader(f))}

@app.get("/run")
def run_now():
    weekly_summary()
    return {"message": "Summary sent"}

@app.get("/")
def root():
    return {"app": "Expense Logger", "endpoints": ["POST /expense", "GET /expenses", "GET /run"]}
