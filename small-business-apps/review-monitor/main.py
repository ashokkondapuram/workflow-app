import os, smtplib, httpx, json
from email.mime.text import MIMEText
from datetime import datetime
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="Review Monitor")
scheduler = AsyncIOScheduler()
SEEN_FILE = "seen_reviews.json"

def load_seen():
    if os.path.exists(SEEN_FILE):
        with open(SEEN_FILE) as f: return set(json.load(f))
    return set()

def save_seen(seen):
    with open(SEEN_FILE, "w") as f: json.dump(list(seen), f)

def send_alert(review):
    stars = "\u2b50" * int(review.get("rating", 1))
    body = f"<h2>New Low-Rating Review</h2><p><b>Rating:</b> {stars}</p><p><b>Review:</b> {review.get('text','')}</p><p><b>Author:</b> {review.get('author_name','')}</p><p><b>Time:</b> {review.get('relative_time_description','')}</p>"
    msg = MIMEText(body, "html")
    msg["Subject"] = f"New {review.get('rating',1)}\u2605 Review Alert"
    msg["From"] = os.getenv("SMTP_USER")
    msg["To"] = os.getenv("ALERT_EMAIL")
    with smtplib.SMTP(os.getenv("SMTP_HOST", "smtp.gmail.com"), 587) as s:
        s.starttls(); s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
        s.sendmail(msg["From"], [msg["To"]], msg.as_string())

async def check_reviews():
    api_key = os.getenv("GOOGLE_PLACES_API_KEY", "")
    place_id = os.getenv("PLACE_ID", "")
    if not api_key or not place_id:
        print("Missing GOOGLE_PLACES_API_KEY or PLACE_ID")
        return
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=reviews&key={api_key}"
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(url)
    reviews = r.json().get("result", {}).get("reviews", [])
    seen = load_seen()
    alerted = 0
    for rev in reviews:
        rid = f"{rev.get('author_name','')}_{rev.get('time',0)}"
        if rid not in seen and int(rev.get("rating", 5)) <= 3:
            try: send_alert(rev); alerted += 1
            except Exception as e: print(f"Email error: {e}")
        seen.add(rid)
    save_seen(seen)
    print(f"[{datetime.now().strftime('%H:%M')}] Reviews checked — {alerted} alerts sent")

@app.on_event("startup")
async def startup():
    scheduler.add_job(check_reviews, "interval", hours=4)
    scheduler.start()

@app.get("/")
def root(): return {"app": "Review Monitor", "status": "running"}

@app.get("/run")
async def run_now():
    await check_reviews()
    return {"message": "Done"}
