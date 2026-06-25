from fastapi import APIRouter
from app.models import ReminderConfig
from app import database as db

router = APIRouter(prefix="/api/config", tags=["config"])

@router.get("/")
async def get_config():
    return {
        "webhook_url": db.get_config("webhook_url"),
        "reminder_hours_before": int(db.get_config("reminder_hours_before", "24")),
        "email_enabled": db.get_config("email_enabled", "true") == "true",
        "sms_enabled": db.get_config("sms_enabled", "false") == "true",
    }

@router.post("/")
async def save_config(cfg: ReminderConfig):
    db.set_config("webhook_url", cfg.webhook_url)
    db.set_config("reminder_hours_before", str(cfg.reminder_hours_before))
    db.set_config("email_enabled", str(cfg.email_enabled).lower())
    db.set_config("sms_enabled", str(cfg.sms_enabled).lower())
    return {"message": "Config saved"}
