import sqlite3, uuid
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path("data/appointments.db")
DB_PATH.parent.mkdir(exist_ok=True)

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                client_phone TEXT DEFAULT '',
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                duration_minutes INTEGER DEFAULT 60,
                notes TEXT DEFAULT '',
                reminder_sent INTEGER DEFAULT 0,
                status TEXT DEFAULT 'scheduled',
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        conn.commit()

def row_to_dict(row):
    d = dict(row)
    d['reminder_sent'] = bool(d['reminder_sent'])
    return d

def create_appointment(data: dict) -> dict:
    appt = {**data, "id": str(uuid.uuid4()), "reminder_sent": False,
            "status": "scheduled", "created_at": datetime.utcnow().isoformat()}
    with get_conn() as conn:
        conn.execute("""
            INSERT INTO appointments (id,title,client_name,client_email,client_phone,date,time,
            duration_minutes,notes,reminder_sent,status,created_at)
            VALUES (:id,:title,:client_name,:client_email,:client_phone,:date,:time,
            :duration_minutes,:notes,:reminder_sent,:status,:created_at)
        """, appt)
        conn.commit()
    return appt

def get_all_appointments() -> list:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM appointments ORDER BY date, time").fetchall()
    return [row_to_dict(r) for r in rows]

def get_appointment(appt_id: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM appointments WHERE id=?", (appt_id,)).fetchone()
    return row_to_dict(row) if row else None

def update_appointment(appt_id: str, data: dict):
    appt = get_appointment(appt_id)
    if not appt:
        return None
    appt.update({k: v for k, v in data.items() if k in appt})
    with get_conn() as conn:
        conn.execute("""
            UPDATE appointments SET title=:title, client_name=:client_name,
            client_email=:client_email, client_phone=:client_phone, date=:date,
            time=:time, duration_minutes=:duration_minutes, notes=:notes,
            reminder_sent=:reminder_sent, status=:status WHERE id=:id
        """, appt)
        conn.commit()
    return appt

def delete_appointment(appt_id: str):
    with get_conn() as conn:
        conn.execute("DELETE FROM appointments WHERE id=?", (appt_id,))
        conn.commit()

def get_config(key: str, default="") -> str:
    with get_conn() as conn:
        row = conn.execute("SELECT value FROM config WHERE key=?", (key,)).fetchone()
    return row[0] if row else default

def set_config(key: str, value: str):
    with get_conn() as conn:
        conn.execute("INSERT OR REPLACE INTO config (key, value) VALUES (?,?)", (key, value))
        conn.commit()

def get_upcoming_unreminded(hours_before: int) -> list:
    now = datetime.utcnow()
    cutoff = now + timedelta(hours=hours_before)
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT * FROM appointments
            WHERE status='scheduled' AND reminder_sent=0
            AND datetime(date || ' ' || time) <= ?
            AND datetime(date || ' ' || time) >= ?
        """, (cutoff.strftime("%Y-%m-%d %H:%M"), now.strftime("%Y-%m-%d %H:%M"))).fetchall()
    return [row_to_dict(r) for r in rows]
