import httpx, logging
from app.database import get_upcoming_unreminded, update_appointment, get_config

logger = logging.getLogger("reminder")

async def send_reminders():
    hours = int(get_config("reminder_hours_before", "24"))
    webhook_url = get_config("webhook_url", "")
    appointments = get_upcoming_unreminded(hours)
    logger.info(f"Reminder check: {len(appointments)} appointment(s) due")

    for appt in appointments:
        try:
            message = build_message(appt)
            if webhook_url:
                async with httpx.AsyncClient(timeout=10) as client:
                    await client.post(webhook_url, json={"text": message})
            update_appointment(appt["id"], {"reminder_sent": True})
            logger.info(f"Reminder sent: {appt['title']} for {appt['client_name']}")
        except Exception as e:
            logger.error(f"Reminder failed for {appt['id']}: {e}")

def build_message(appt: dict) -> str:
    msg = (
        f"\U0001f4c5 *Appointment Reminder*\n"
        f"*{appt['title']}* with *{appt['client_name']}*\n"
        f"\U0001f4c6 {appt['date']} at {appt['time']}\n"
        f"\u23f1 Duration: {appt['duration_minutes']} minutes\n"
        f"\U0001f4e7 {appt['client_email']}"
    )
    if appt.get('client_phone'):
        msg += f"\n\U0001f4de {appt['client_phone']}"
    if appt.get('notes'):
        msg += f"\n\U0001f4dd {appt['notes']}"
    return msg
