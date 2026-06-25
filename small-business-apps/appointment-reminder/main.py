import csv, os, smtplib
from email.mime.text import MIMEText
from datetime import datetime
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="Appointment Reminder")
scheduler = AsyncIOScheduler()
APPT_FILE = os.getenv("APPT_FILE", "appointments.csv")

def send_email(to, subject, body):
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = os.getenv("SMTP_USER")
    msg["To"] = to
    with smtplib.SMTP(os.getenv("SMTP_HOST", "smtp.gmail.com"), 587) as s:
        s.starttls()
        s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
        s.sendmail(msg["From"], [to], msg.as_string())

def check_appointments():
    if not os.path.exists(APPT_FILE):
        return
    now = datetime.now()
    windows = [1440, 60]
    sent = 0
    with open(APPT_FILE) as f:
        for row in csv.DictReader(f):
            try:
                appt_dt = datetime.strptime(row["datetime"], "%Y-%m-%d %H:%M")
            except ValueError:
                continue
            mins_until = (appt_dt - now).total_seconds() / 60
            for window in windows:
                if abs(mins_until - window) < 15:
                    label = "24 hours" if window == 1440 else "1 hour"
                    body = f"""
                    <h2>Appointment Reminder</h2>
                    <p>Hi {row['name']}, your appointment is in <b>{label}</b>.</p>
                    <p><b>Time:</b> {row['datetime']}<br>
                    <b>With:</b> {row.get('provider','')}<br>
                    <b>Location:</b> {row.get('location','')}</p>
                    """
                    try:
                        send_email(row["email"], f"Reminder: Appointment in {label}", body)
                        sent += 1
                    except Exception as e:
                        print(f"Email error: {e}")
    print(f"[{now.strftime('%H:%M')}] Checked appointments — {sent} reminders sent")

@app.on_event("startup")
async def startup():
    scheduler.add_job(check_appointments, "interval", minutes=30)
    scheduler.start()

@app.get("/")
def root():
    return {"app": "Appointment Reminder", "status": "running"}

@app.get("/run")
def run_now():
    check_appointments()
    return {"message": "Done"}
