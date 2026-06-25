from fastapi import APIRouter

from app import database as db
from app.models import ReviewConfig
from app.services import google_business

router = APIRouter(prefix="/api/config", tags=["config"])

CONFIG_KEYS = [
    "google_places_api_key",
    "place_id",
    "business_name",
    "gbp_account_id",
    "gbp_location_id",
    "google_client_id",
    "google_client_secret",
    "oauth_redirect_uri",
    "auto_reply_enabled",
    "auto_reply_min_rating",
    "alert_low_ratings",
    "alert_email",
    "smtp_host",
    "smtp_user",
    "smtp_pass",
    "template_5_star",
    "template_4_star",
    "template_3_star",
    "poll_interval_hours",
]


def _mask_secret(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "••••••••"
    return value[:4] + "••••" + value[-4:]


@router.get("/")
async def get_config():
    return {
        "google_places_api_key": _mask_secret(db.get_config("google_places_api_key")),
        "place_id": db.get_config("place_id"),
        "business_name": db.get_config("business_name", "Our Business"),
        "gbp_account_id": db.get_config("gbp_account_id"),
        "gbp_location_id": db.get_config("gbp_location_id"),
        "google_client_id": _mask_secret(db.get_config("google_client_id")),
        "google_client_secret": _mask_secret(db.get_config("google_client_secret")),
        "oauth_redirect_uri": db.get_config(
            "oauth_redirect_uri", "http://127.0.0.1:8011/api/oauth/callback"
        ),
        "auto_reply_enabled": db.get_config("auto_reply_enabled", "true") == "true",
        "auto_reply_min_rating": int(db.get_config("auto_reply_min_rating", "4")),
        "alert_low_ratings": db.get_config("alert_low_ratings", "true") == "true",
        "alert_email": db.get_config("alert_email"),
        "smtp_host": db.get_config("smtp_host", "smtp.gmail.com"),
        "smtp_user": db.get_config("smtp_user"),
        "smtp_pass": _mask_secret(db.get_config("smtp_pass")),
        "template_5_star": db.get_config(
            "template_5_star",
            "Thank you so much, {author_name}! We're thrilled you had a great experience at {business_name}.",
        ),
        "template_4_star": db.get_config(
            "template_4_star",
            "Thanks for the kind words, {author_name}! We appreciate your feedback at {business_name}.",
        ),
        "template_3_star": db.get_config(
            "template_3_star",
            "Thank you for your feedback, {author_name}. We'd love to hear how we can improve at {business_name}.",
        ),
        "poll_interval_hours": int(db.get_config("poll_interval_hours", "4")),
        "gbp_connected": google_business.is_gbp_configured(),
        "oauth_connected": db.is_oauth_connected(),
    }


@router.post("/")
async def save_config(cfg: ReviewConfig):
    values = {
        "google_places_api_key": cfg.google_places_api_key,
        "place_id": cfg.place_id,
        "business_name": cfg.business_name,
        "gbp_account_id": cfg.gbp_account_id,
        "gbp_location_id": cfg.gbp_location_id,
        "google_client_id": cfg.google_client_id,
        "google_client_secret": cfg.google_client_secret,
        "oauth_redirect_uri": cfg.oauth_redirect_uri,
        "auto_reply_enabled": str(cfg.auto_reply_enabled).lower(),
        "auto_reply_min_rating": str(cfg.auto_reply_min_rating),
        "alert_low_ratings": str(cfg.alert_low_ratings).lower(),
        "alert_email": cfg.alert_email,
        "smtp_host": cfg.smtp_host,
        "smtp_user": cfg.smtp_user,
        "smtp_pass": cfg.smtp_pass,
        "template_5_star": cfg.template_5_star,
        "template_4_star": cfg.template_4_star,
        "template_3_star": cfg.template_3_star,
        "poll_interval_hours": str(cfg.poll_interval_hours),
    }

    for key, value in values.items():
        if "••••" in value:
            continue
        if key in ("google_places_api_key", "google_client_id", "google_client_secret", "smtp_pass"):
            if not value:
                continue
        db.set_config(key, value)

    return {"message": "Settings saved"}
