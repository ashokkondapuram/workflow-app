import httpx

from app import database as db


async def fetch_reviews_from_places() -> list[dict]:
    api_key = db.get_config("google_places_api_key")
    place_id = db.get_config("place_id")
    if not api_key or not place_id:
        return []

    url = (
        "https://maps.googleapis.com/maps/api/place/details/json"
        f"?place_id={place_id}&fields=reviews,rating,user_ratings_total&key={api_key}"
    )
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(url)
        response.raise_for_status()
        payload = response.json()

    if payload.get("status") != "OK":
        raise RuntimeError(payload.get("error_message") or payload.get("status", "Places API error"))

    result = payload.get("result", {})
    reviews = []
    for review in result.get("reviews", []):
        reviews.append({
            "external_id": db.make_external_id(review.get("author_name", ""), review.get("time", 0)),
            "author_name": review.get("author_name", "Anonymous"),
            "rating": review.get("rating", 5),
            "text": review.get("text", ""),
            "relative_time": review.get("relative_time_description", ""),
            "time": review.get("time", 0),
        })
    return reviews
