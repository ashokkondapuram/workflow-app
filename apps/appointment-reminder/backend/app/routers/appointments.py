from fastapi import APIRouter, HTTPException
from app.models import AppointmentCreate
from app import database as db

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

@router.post("/", response_model=dict)
async def create(data: AppointmentCreate):
    return db.create_appointment(data.model_dump())

@router.get("/", response_model=list)
async def list_all():
    return db.get_all_appointments()

@router.get("/{appt_id}", response_model=dict)
async def get(appt_id: str):
    appt = db.get_appointment(appt_id)
    if not appt:
        raise HTTPException(404, "Appointment not found")
    return appt

@router.put("/{appt_id}", response_model=dict)
async def update(appt_id: str, data: AppointmentCreate):
    appt = db.update_appointment(appt_id, data.model_dump())
    if not appt:
        raise HTTPException(404, "Appointment not found")
    return appt

@router.patch("/{appt_id}/status")
async def update_status(appt_id: str, status: str):
    appt = db.get_appointment(appt_id)
    if not appt:
        raise HTTPException(404, "Not found")
    return db.update_appointment(appt_id, {"status": status})

@router.delete("/{appt_id}")
async def delete(appt_id: str):
    db.delete_appointment(appt_id)
    return {"message": "Deleted"}
