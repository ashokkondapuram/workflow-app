import csv, os, smtplib
from email.mime.text import MIMEText
from datetime import datetime
from fastapi import FastAPI, Request
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="Lead Capture")
LEADS_FILE = os.getenv("LEADS_FILE", "leads.csv")
FIELDS = ["timestamp", "name", "email", "phone", "message", "source"]

def ensure_csv():
    if not os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, "w", newline="") as f:
            csv.DictWriter(f, fieldnames=FIELDS).writeheader()

def save_lead(data):
    ensure_csv()
    with open(LEADS_FILE, "a", newline="") as f:
        csv.DictWriter(f, fieldnames=FIELDS).writerow({
            "timestamp": datetime.now().isoformat(),
            "name": data.get("name", ""), "email": data.get("email", ""),
            "phone": data.get("phone", ""), "message": data.get("message", ""),
            "source": data.get("source", "web")
        })

def send_auto_reply(to_email, name):
    body = f"<h2>Thanks for reaching out, {name}!</h2><p>We received your message and will get back to you within 1 business day.</p>"
    msg = MIMEText(body, "html")
    msg["Subject"] = "We received your message!"
    msg["From"] = os.getenv("FROM_EMAIL", os.getenv("SMTP_USER"))
    msg["To"] = to_email
    with smtplib.SMTP(os.getenv("SMTP_HOST", "smtp.gmail.com"), 587) as s:
        s.starttls(); s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
        s.sendmail(msg["From"], [to_email], msg.as_string())

def notify_owner(data):
    body = f"<h3>New Lead</h3><p><b>Name:</b> {data['name']}<br><b>Email:</b> {data['email']}<br><b>Message:</b> {data.get('message', '')}</p>"
    msg = MIMEText(body, "html")
    msg["Subject"] = f"New Lead: {data['name']}"
    msg["From"] = os.getenv("FROM_EMAIL", os.getenv("SMTP_USER"))
    msg["To"] = os.getenv("SMTP_USER")
    with smtplib.SMTP(os.getenv("SMTP_HOST", "smtp.gmail.com"), 587) as s:
        s.starttls(); s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
        s.sendmail(msg["From"], [msg["To"]], msg.as_string())

@app.post("/lead")
async def capture_lead(request: Request):
    data = await request.json()
    save_lead(data)
    try:
        send_auto_reply(data["email"], data.get("name", "there"))
        notify_owner(data)
    except Exception as e:
        print(f"Email error: {e}")
    return {"message": "Lead captured", "name": data.get("name")}

@app.get("/leads")
def list_leads():
    ensure_csv()
    with open(LEADS_FILE) as f:
        return {"leads": list(csv.DictReader(f))}

@app.get("/")
def root():
    return {"app": "Lead Capture", "endpoint": "POST /lead"}
