from fastapi import APIRouter, HTTPException

from app import database as db
from app.models import ReviewReply
from app.scheduler.review_job import sync_and_auto_reply
from app.services import openai_service, reply_engine

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


@router.get("/insights")
async def review_insights():
    return await openai_service.get_aggregate_insights()


@router.post("/analyze-all")
async def analyze_all_reviews():
    if not openai_service.is_ai_configured():
        raise HTTPException(status_code=400, detail="Connect OpenAI in settings first")
    reviews = [r for r in db.get_all_reviews() if not r.get("ai_sentiment")]
    analyzed = 0
    for review in reviews:
        try:
            await openai_service.analyze_review(review)
            analyzed += 1
        except Exception as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"analyzed": analyzed, "total": len(reviews)}


@router.get("/{review_id}")
async def get_review(review_id: str):
    review = db.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.post("/sync")
async def sync_reviews():
    return await sync_and_auto_reply()


@router.post("/{review_id}/analyze")
async def analyze_review(review_id: str):
    review = db.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if not openai_service.is_ai_configured():
        raise HTTPException(status_code=400, detail="Connect OpenAI in settings first")
    try:
        return await openai_service.analyze_review(review)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/{review_id}/ai-reply")
async def ai_suggest_reply(review_id: str):
    review = db.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if not openai_service.is_ai_configured():
        raise HTTPException(status_code=400, detail="Connect OpenAI in settings first")
    try:
        if not review.get("ai_sentiment"):
            review = await openai_service.analyze_review(review)
        reply_text = await openai_service.generate_ai_reply(review, review)
        return {"reply_text": reply_text, "analysis": {
            "sentiment": review.get("ai_sentiment"),
            "summary": review.get("ai_summary"),
            "themes": review.get("ai_themes_list", []),
            "urgency": review.get("ai_urgency"),
            "action": review.get("ai_action"),
        }}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


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
