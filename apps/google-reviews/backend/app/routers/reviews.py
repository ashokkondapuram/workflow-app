from fastapi import APIRouter, HTTPException

from app import database as db
from app.models import ReviewReply
from app.scheduler.review_job import sync_and_auto_reply
from app.services import reply_engine

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.get("/")
async def list_reviews(rating: int | None = None, status: str | None = None):
    reviews = db.get_all_reviews()
    if rating is not None:
        reviews = [r for r in reviews if r["rating"] == rating]
    if status:
        reviews = [r for r in reviews if r["reply_status"] == status]
    return reviews


@router.get("/stats")
async def review_stats():
    return db.get_stats()


@router.get("/{review_id}")
async def get_review(review_id: str):
    review = db.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.post("/sync")
async def sync_reviews():
    return await sync_and_auto_reply()


@router.post("/{review_id}/reply")
async def post_reply(review_id: str, body: ReviewReply):
    review = db.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["reply_status"] == "posted":
        raise HTTPException(status_code=400, detail="This review already has a reply")

    result = await reply_engine.generate_and_post_reply(review, reply_text=body.reply_text, auto=False)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("reason", "Failed to post reply"))
    return result


@router.post("/{review_id}/auto-reply")
async def trigger_auto_reply(review_id: str):
    review = db.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["reply_status"] == "posted":
        raise HTTPException(status_code=400, detail="This review already has a reply")

    result = await reply_engine.generate_and_post_reply(review, auto=True)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("reason", "Failed to generate reply"))
    return result
