from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.routers import appointments, config
from app.database import init_db
from app.scheduler.reminder_job import send_reminders
import logging

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="Appointment Reminder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(appointments.router)
app.include_router(config.router)
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup():
    init_db()
    scheduler.add_job(send_reminders, "interval", minutes=15, id="reminder_job")
    scheduler.start()

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()

@app.get("/health")
async def health():
    return {"status": "ok", "scheduler": scheduler.running}

@app.post("/api/trigger-reminders")
async def trigger_reminders():
    await send_reminders()
    return {"message": "Reminder check triggered"}
