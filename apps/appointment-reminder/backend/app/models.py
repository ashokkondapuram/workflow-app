from pydantic import BaseModel
from typing import Optional

class Appointment(BaseModel):
    id: Optional[str] = None
    title: str
    client_name: str
    client_email: str
    client_phone: Optional[str] = ""
    date: str
    time: str
    duration_minutes: int = 60
    notes: Optional[str] = ""
    reminder_sent: bool = False
    status: str = "scheduled"

class AppointmentCreate(BaseModel):
    title: str
    client_name: str
    client_email: str
    client_phone: Optional[str] = ""
    date: str
    time: str
    duration_minutes: int = 60
    notes: Optional[str] = ""

class ReminderConfig(BaseModel):
    webhook_url: str
    reminder_hours_before: int = 24
    email_enabled: bool = True
    sms_enabled: bool = False
