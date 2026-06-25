import json
from datetime import datetime

import httpx
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

from app import database as db

GBP_SCOPE = "https://www.googleapis.com/auth/business.manage"
GBP_BASE = "https://mybusiness.googleapis.com/v4"


def _get_credentials() -> Credentials | None:
    tokens = db.get_oauth_tokens()
    if not tokens or not tokens.get("refresh_token"):
        return None

    creds = Credentials(
        token=tokens.get("access_token") or None,
        refresh_token=tokens.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=db.get_config("google_client_id"),
        client_secret=db.get_config("google_client_secret"),
        scopes=[GBP_SCOPE],
    )
    if tokens.get("token_expiry"):
        try:
            creds.expiry = datetime.fromisoformat(tokens["token_expiry"])
        except ValueError:
            pass

    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        db.save_oauth_tokens(
            creds.token or "",
            creds.refresh_token or "",
            creds.expiry.isoformat() if creds.expiry else "",
        )
    return creds


def is_gbp_configured() -> bool:
    return bool(
        db.get_config("gbp_account_id")
        and db.get_config("gbp_location_id")
        and db.is_oauth_connected()
        and db.get_config("google_client_id")
        and db.get_config("google_client_secret")
    )


async def post_review_reply(review_name: str, reply_text: str) -> dict:
    """Post a reply via Google Business Profile API.

    review_name should be the GBP review resource name when available.
    For Places API-sourced reviews we synthesize a best-effort path.
    """
    if not is_gbp_configured():
        return {"posted": False, "reason": "Google Business Profile not connected"}

    creds = _get_credentials()
    if not creds or not creds.token:
        return {"posted": False, "reason": "OAuth token unavailable"}

    account_id = db.get_config("gbp_account_id")
    location_id = db.get_config("gbp_location_id")

    if review_name.startswith("accounts/"):
        resource = f"{review_name}/reply"
    else:
        resource = f"accounts/{account_id}/locations/{location_id}/reviews/{review_name}/reply"

    url = f"{GBP_BASE}/{resource}"
    headers = {
        "Authorization": f"Bearer {creds.token}",
        "Content-Type": "application/json",
    }
    body = {"comment": reply_text}

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.put(url, headers=headers, content=json.dumps(body))

    if response.status_code in (200, 201):
        return {"posted": True, "response": response.json()}

    return {
        "posted": False,
        "reason": response.text or f"HTTP {response.status_code}",
        "status_code": response.status_code,
    }


async def list_gbp_reviews() -> list[dict]:
    if not is_gbp_configured():
        return []

    creds = _get_credentials()
    if not creds or not creds.token:
        return []

    account_id = db.get_config("gbp_account_id")
    location_id = db.get_config("gbp_location_id")
    url = f"{GBP_BASE}/accounts/{account_id}/locations/{location_id}/reviews"
    headers = {"Authorization": f"Bearer {creds.token}"}

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(url, headers=headers)

    if response.status_code != 200:
        return []

    reviews = []
    for item in response.json().get("reviews", []):
        reviewer = item.get("reviewer", {})
        author = reviewer.get("displayName", "Anonymous")
        create_time = item.get("createTime", "")
        review_time = 0
        if create_time:
            try:
                review_time = int(datetime.fromisoformat(create_time.replace("Z", "+00:00")).timestamp())
            except ValueError:
                pass

        star_rating = item.get("starRating", "FIVE")
        rating_map = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}
        rating = rating_map.get(star_rating, 5)
        review_id = item.get("reviewId") or item.get("name", "").split("/")[-1]

        reviews.append({
            "external_id": review_id or db.make_external_id(author, review_time),
            "author_name": author,
            "rating": rating,
            "text": item.get("comment", ""),
            "relative_time": create_time,
            "time": review_time,
            "gbp_review_name": item.get("name", ""),
            "existing_reply": (item.get("reviewReply") or {}).get("comment", ""),
        })
    return reviews
