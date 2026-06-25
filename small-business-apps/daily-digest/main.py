import os, smtplib, httpx
from email.mime.text import MIMEText
from datetime import date
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="Daily Digest")
scheduler = AsyncIOScheduler()

async def fetch_data():
    url = os.getenv("DATA_API_URL", "")
    if not url:
        return {"orders": "N/A", "revenue": "N/A", "tasks": "N/A"}
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(url)
            return r.json()
    except Exception:
        return {"orders": "Error", "revenue": "Error", "tasks": "Error"}

def send_email(subject, body):
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = os.getenv("SMTP_USER")
    msg["To"] = os.getenv("REPORT_EMAIL")
    with smtplib.SMTP(os.getenv("SMTP_HOST", "smtp.gmail.com"), 587) as s:
        s.starttls()
        s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
        s.sendmail(msg["From"], [msg["To"]], msg.as_string())

async def send_digest():
    data = await fetch_data()
    today = date.today().strftime("%A, %B %d %Y")
    body = f"""
    <h2 style='color:#1a1a2e'>Daily Business Digest — {today}</h2>
    <table border='1' cellpadding='10' style='border-collapse:collapse'>
      <tr style='background:#f0f0f0'><th>Metric</th><th>Value</th></tr>
      <tr><td>Orders Today</td><td><b>{data.get('orders','N/A')}</b></td></tr>
      <tr><td>Revenue</td><td><b>{data.get('revenue','N/A')}</b></td></tr>
      <tr><td>Open Tasks</td><td><b>{data.get('tasks','N/A')}</b></td></tr>
    </table>
    <p style='color:gray;font-size:12px'>Sent automatically by FlowCraft Daily Digest</p>
    """
    try:
        send_email(f"Daily Digest — {today}", body)
        print(f"[{today}] Digest sent")
    except Exception as e:
        print(f"Email error: {e}")

@app.on_event("startup")
async def startup():
    scheduler.add_job(send_digest, "cron", hour=7, day_of_week="mon-fri")
    scheduler.start()

@app.get("/")
def root():
    return {"app": "Daily Digest", "status": "running"}

@app.get("/run")
async def run_now():
    await send_digest()
    return {"message": "Digest sent"}
