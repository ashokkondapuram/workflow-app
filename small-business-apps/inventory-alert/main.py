import csv, os, smtplib
from email.mime.text import MIMEText
from datetime import date
from fastapi import FastAPI, Request
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="Inventory Alert")
scheduler = AsyncIOScheduler()
INV_FILE = os.getenv("INVENTORY_FILE", "inventory.csv")
THRESHOLD = int(os.getenv("THRESHOLD", "20"))

def send_email(subject, body):
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = os.getenv("SMTP_USER")
    msg["To"] = os.getenv("OWNER_EMAIL")
    with smtplib.SMTP(os.getenv("SMTP_HOST", "smtp.gmail.com"), 587) as s:
        s.starttls()
        s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
        s.sendmail(msg["From"], [msg["To"]], msg.as_string())

def check_inventory():
    if not os.path.exists(INV_FILE):
        print("No inventory file")
        return
    low = []
    with open(INV_FILE) as f:
        for row in csv.DictReader(f):
            if int(row.get("quantity", 0)) < THRESHOLD:
                low.append(row)
    if low:
        rows = "".join(f"<tr><td>{r['product']}</td><td style='color:red'>{r['quantity']}</td><td>{r.get('sku','')}</td></tr>" for r in low)
        body = f"<h2>Low Stock Alert</h2><table border='1' cellpadding='6'><tr><th>Product</th><th>Qty</th><th>SKU</th></tr>{rows}</table>"
        try:
            send_email(f"\u26a0\ufe0f {len(low)} Products Low on Stock", body)
        except Exception as e:
            print(f"Email error: {e}")
    print(f"[{date.today()}] Inventory check — {len(low)} low-stock items")

@app.on_event("startup")
async def startup():
    scheduler.add_job(check_inventory, "cron", hour=8)
    scheduler.start()

@app.get("/")
def root():
    return {"app": "Inventory Alert", "threshold": THRESHOLD}

@app.get("/run")
def run_now():
    check_inventory()
    return {"message": "Done"}

@app.post("/update")
async def update_stock(request: Request):
    data = await request.json()
    if not os.path.exists(INV_FILE):
        return {"updated": False}
    with open(INV_FILE) as f:
        rows = list(csv.DictReader(f))
    updated = False
    for r in rows:
        if r["sku"] == data.get("sku"):
            r["quantity"] = str(data["quantity"])
            updated = True
    if updated:
        with open(INV_FILE, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=rows[0].keys())
            w.writeheader()
            w.writerows(rows)
    return {"updated": updated}
