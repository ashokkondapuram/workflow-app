import json
import logging

import httpx

from app import database as db

logger = logging.getLogger(__name__)

OPENAI_URL = "https://api.openai.com/v1/chat/completions"


def is_ai_configured() -> bool:
    return bool(db.get_config("openai_api_key")) and db.get_config("ai_enabled", "true") == "true"


def _get_model() -> str:
    return db.get_config("ai_model", "gpt-4o-mini")


def _get_tone() -> str:
    return db.get_config("ai_tone", "friendly")


async def _chat(system: str, user: str, json_mode: bool = False) -> str:
    api_key = db.get_config("openai_api_key")
    if not api_key:
        raise RuntimeError("OpenAI API key not configured")

    body: dict = {
        "model": _get_model(),
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.7,
        "max_tokens": 600,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            OPENAI_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=body,
        )

    if response.status_code != 200:
        logger.error("OpenAI error: %s", response.text)
        raise RuntimeError(f"OpenAI request failed: {response.status_code}")

    return response.json()["choices"][0]["message"]["content"].strip()


async def analyze_review(review: dict) -> dict:
    business = db.get_config("business_name", "Our Business")
    system = (
        "You analyze Google Business reviews for small businesses. "
        "Respond with valid JSON only."
    )
    user = f"""Analyze this review for "{business}":

Author: {review.get("author_name", "Anonymous")}
Rating: {review.get("rating", 0)}/5 stars
Review: {review.get("text") or "(no text)"}

Return JSON:
{{
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "one sentence summary",
  "themes": ["theme1", "theme2"],
  "urgency": "low" | "medium" | "high",
  "action": "brief recommended action for the business owner"
}}"""

    raw = await _chat(system, user, json_mode=True)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {
            "sentiment": "neutral",
            "summary": raw[:200],
            "themes": [],
            "urgency": "low",
            "action": "Review manually",
        }

    analysis = {
        "ai_sentiment": data.get("sentiment", "neutral"),
        "ai_summary": data.get("summary", ""),
        "ai_themes": json.dumps(data.get("themes", [])),
        "ai_urgency": data.get("urgency", "low"),
        "ai_action": data.get("action", ""),
    }
    db.update_review_ai(review["id"], analysis)
    return {**review, **analysis, "ai_themes_list": data.get("themes", [])}


async def generate_ai_reply(review: dict, analysis: dict | None = None) -> str:
    business = db.get_config("business_name", "Our Business")
    tone = _get_tone()
    rating = review.get("rating", 5)
    author = review.get("author_name", "there")
    text = review.get("text", "")

    context = ""
    if analysis:
        context = f"\nSentiment: {analysis.get('ai_sentiment')}. Summary: {analysis.get('ai_summary')}."

    system = (
        f"You write Google Business review replies for {business}. "
        f"Tone: {tone}, professional, human, concise. "
        "Never be defensive. For negative reviews, acknowledge concerns and invite offline resolution. "
        "Keep replies under 80 words. No placeholders — use the reviewer's first name."
    )
    user = f"""Write a reply to this {rating}-star review from {author}:

"{text or 'No comment provided'}"
{context}

Reply only with the reply text, no quotes or labels."""

    return await _chat(system, user)


async def get_aggregate_insights() -> dict:
    reviews = db.get_all_reviews()
    if not reviews:
        return {
            "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0},
            "top_themes": [],
            "needs_attention": [],
            "ai_summary": "No reviews to analyze yet.",
            "analyzed_count": 0,
        }

    analyzed = [r for r in reviews if r.get("ai_sentiment")]
    sentiment = {"positive": 0, "neutral": 0, "negative": 0}
    theme_counts: dict[str, int] = {}
    needs_attention = []

    for r in analyzed:
        s = r.get("ai_sentiment", "neutral")
        if s in sentiment:
            sentiment[s] += 1
        try:
            for theme in json.loads(r.get("ai_themes") or "[]"):
                theme_counts[theme] = theme_counts.get(theme, 0) + 1
        except json.JSONDecodeError:
            pass
        if r.get("ai_urgency") in ("medium", "high") and r.get("reply_status") == "none":
            needs_attention.append({
                "id": r["id"],
                "author_name": r["author_name"],
                "rating": r["rating"],
                "summary": r.get("ai_summary", ""),
                "urgency": r.get("ai_urgency"),
            })

    top_themes = sorted(theme_counts.items(), key=lambda x: -x[1])[:6]
    top_themes = [{"theme": t, "count": c} for t, c in top_themes]

    if not is_ai_configured():
        return {
            "sentiment_breakdown": sentiment,
            "top_themes": top_themes,
            "needs_attention": needs_attention[:5],
            "ai_summary": "Connect OpenAI in settings for AI-powered insights.",
            "analyzed_count": len(analyzed),
        }

    if len(analyzed) >= 3:
        try:
            sample = "\n".join(
                f"- {r['rating']}★ {r.get('ai_summary', r.get('text', '')[:60])}"
                for r in analyzed[:10]
            )
            summary = await _chat(
                "You summarize review trends for business owners in 2-3 sentences. Be specific and actionable.",
                f"Business: {db.get_config('business_name')}\nRecent review analyses:\n{sample}",
            )
        except Exception as exc:
            logger.warning("Aggregate summary failed: %s", exc)
            summary = f"{len(analyzed)} reviews analyzed. {sentiment['positive']} positive, {sentiment['negative']} negative."
    else:
        summary = f"{len(analyzed)} review(s) analyzed so far. Sync more reviews for richer insights."

    return {
        "sentiment_breakdown": sentiment,
        "top_themes": top_themes,
        "needs_attention": needs_attention[:5],
        "ai_summary": summary,
        "analyzed_count": len(analyzed),
    }
