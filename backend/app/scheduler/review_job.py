import logging

from app import database as db
from app.services import google_business, google_places, reply_engine

logger = logging.getLogger(__name__)


async def sync_and_auto_reply() -> dict:
    fetched = 0
    new_reviews = 0
    auto_replied = 0
    alerts_sent = 0

    raw_reviews = []
    try:
        if google_business.is_gbp_configured():
            raw_reviews = await google_business.list_gbp_reviews()
        if not raw_reviews:
            raw_reviews = await google_places.fetch_reviews_from_places()
    except Exception as exc:
        logger.error("Failed to fetch reviews: %s", exc)
        return {"error": str(exc), "fetched": 0, "new_reviews": 0, "auto_replied": 0}

    fetched = len(raw_reviews)
    min_rating = int(db.get_config("auto_reply_min_rating", "4"))

    for raw in raw_reviews:
        existing = db.get_review_by_external_id(raw["external_id"])
        review = db.upsert_review(raw)
        if not existing:
            new_reviews += 1

        if raw.get("existing_reply") and review["reply_status"] == "none":
            db.update_review_reply(review["id"], raw["existing_reply"], "posted", auto_replied=False)
            continue

        if review["rating"] <= 3 and review["reply_status"] == "none":
            try:
                reply_engine.send_low_rating_alert(review)
                alerts_sent += 1
            except Exception as exc:
                logger.warning("Alert email failed: %s", exc)

        if review["reply_status"] != "none":
            continue

        if reply_engine.should_auto_reply(review["rating"]):
            result = await reply_engine.generate_and_post_reply(review, auto=True)
            if result.get("success"):
                auto_replied += 1

    return {
        "fetched": fetched,
        "new_reviews": new_reviews,
        "auto_replied": auto_replied,
        "alerts_sent": alerts_sent,
        "pending_replies": len(db.get_reviews_needing_reply(min_rating)),
    }
