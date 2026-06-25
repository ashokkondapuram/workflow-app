import logging

from dotenv import load_dotenv

load_dotenv()

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import database as db
from app.routers import config, oauth, reviews
from app.scheduler.review_job import sync_and_auto_reply

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Google Reviews API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reviews.router)
app.include_router(config.router)
app.include_router(oauth.router)

scheduler = AsyncIOScheduler()


def _schedule_review_job():
    hours = int(db.get_config("poll_interval_hours", "4"))
    scheduler.add_job(
        sync_and_auto_reply,
        "interval",
        hours=hours,
        id="review_sync_job",
        replace_existing=True,
    )


@app.on_event("startup")
async def startup():
    db.init_db()
    _schedule_review_job()
    scheduler.start()
    logger.info("Google Reviews scheduler started")


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "scheduler": scheduler.running,
        "oauth_connected": db.is_oauth_connected(),
    }


@app.post("/api/trigger-sync")
async def trigger_sync():
    result = await sync_and_auto_reply()
    return {"message": "Review sync triggered", **result}
