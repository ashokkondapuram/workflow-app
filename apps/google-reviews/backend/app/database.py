import json
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path

DB_PATH = Path("data/reviews.db")
DB_PATH.parent.mkdir(exist_ok=True)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                external_id TEXT UNIQUE NOT NULL,
                author_name TEXT NOT NULL,
                rating INTEGER NOT NULL,
                text TEXT DEFAULT '',
                relative_time TEXT DEFAULT '',
                review_time INTEGER DEFAULT 0,
                reply_text TEXT DEFAULT '',
                reply_status TEXT DEFAULT 'none',
                auto_replied INTEGER DEFAULT 0,
                fetched_at TEXT NOT NULL,
                replied_at TEXT DEFAULT ''
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS oauth_tokens (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                access_token TEXT DEFAULT '',
                refresh_token TEXT DEFAULT '',
                token_expiry TEXT DEFAULT '',
                updated_at TEXT NOT NULL
            )
        """)
        conn.commit()


def row_to_dict(row):
    d = dict(row)
    d["auto_replied"] = bool(d.get("auto_replied", 0))
    return d


def make_external_id(author_name: str, review_time: int) -> str:
    return f"{author_name}_{review_time}"


def upsert_review(data: dict) -> dict:
    external_id = data["external_id"]
    existing = get_review_by_external_id(external_id)
    if existing:
        return existing

    review = {
        "id": str(uuid.uuid4()),
        "external_id": external_id,
        "author_name": data.get("author_name", "Anonymous"),
        "rating": int(data.get("rating", 5)),
        "text": data.get("text", ""),
        "relative_time": data.get("relative_time", ""),
        "review_time": int(data.get("time", data.get("review_time", 0))),
        "reply_text": "",
        "reply_status": "none",
        "auto_replied": False,
        "fetched_at": datetime.utcnow().isoformat(),
        "replied_at": "",
    }
    with get_conn() as conn:
        conn.execute("""
            INSERT INTO reviews (
                id, external_id, author_name, rating, text, relative_time,
                review_time, reply_text, reply_status, auto_replied, fetched_at, replied_at
            ) VALUES (
                :id, :external_id, :author_name, :rating, :text, :relative_time,
                :review_time, :reply_text, :reply_status, :auto_replied, :fetched_at, :replied_at
            )
        """, {**review, "auto_replied": int(review["auto_replied"])})
        conn.commit()
    return review


def get_review_by_external_id(external_id: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM reviews WHERE external_id=?", (external_id,)).fetchone()
    return row_to_dict(row) if row else None


def get_review(review_id: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM reviews WHERE id=?", (review_id,)).fetchone()
    return row_to_dict(row) if row else None


def get_all_reviews() -> list:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM reviews ORDER BY review_time DESC, fetched_at DESC"
        ).fetchall()
    return [row_to_dict(r) for r in rows]


def get_reviews_needing_reply(min_rating: int) -> list:
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT * FROM reviews
            WHERE reply_status='none' AND rating >= ?
            ORDER BY review_time DESC
        """, (min_rating,)).fetchall()
    return [row_to_dict(r) for r in rows]


def update_review_reply(review_id: str, reply_text: str, status: str, auto_replied: bool = False):
    replied_at = datetime.utcnow().isoformat() if status == "posted" else ""
    with get_conn() as conn:
        conn.execute("""
            UPDATE reviews
            SET reply_text=?, reply_status=?, auto_replied=?, replied_at=?
            WHERE id=?
        """, (reply_text, status, int(auto_replied), replied_at, review_id))
        conn.commit()
    return get_review(review_id)


def get_stats() -> dict:
    reviews = get_all_reviews()
    if not reviews:
        return {
            "total_reviews": 0,
            "average_rating": 0,
            "pending_replies": 0,
            "auto_replies_sent": 0,
            "low_rating_count": 0,
        }
    ratings = [r["rating"] for r in reviews]
    return {
        "total_reviews": len(reviews),
        "average_rating": round(sum(ratings) / len(ratings), 1),
        "pending_replies": len([r for r in reviews if r["reply_status"] == "none"]),
        "auto_replies_sent": len([r for r in reviews if r["auto_replied"]]),
        "low_rating_count": len([r for r in reviews if r["rating"] <= 3]),
    }


def get_config(key: str, default="") -> str:
    with get_conn() as conn:
        row = conn.execute("SELECT value FROM config WHERE key=?", (key,)).fetchone()
    return row[0] if row else default


def set_config(key: str, value: str):
    with get_conn() as conn:
        conn.execute("INSERT OR REPLACE INTO config (key, value) VALUES (?,?)", (key, value))
        conn.commit()


def get_all_config() -> dict:
    with get_conn() as conn:
        rows = conn.execute("SELECT key, value FROM config").fetchall()
    return {row[0]: row[1] for row in rows}


def save_oauth_tokens(access_token: str, refresh_token: str, token_expiry: str):
    with get_conn() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO oauth_tokens (id, access_token, refresh_token, token_expiry, updated_at)
            VALUES (1, ?, ?, ?, ?)
        """, (access_token, refresh_token, token_expiry, datetime.utcnow().isoformat()))
        conn.commit()


def get_oauth_tokens():
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM oauth_tokens WHERE id=1").fetchone()
    return dict(row) if row else None


def is_oauth_connected() -> bool:
    tokens = get_oauth_tokens()
    return bool(tokens and tokens.get("refresh_token"))
