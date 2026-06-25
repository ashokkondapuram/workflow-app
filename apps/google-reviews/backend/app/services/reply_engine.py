import smtplib
from email.mime.text import MIMEText

from app import database as db
from app.services import google_business


def render_template(template: str, review: dict) -> str:
    business_name = db.get_config("business_name", "Our Business")
    return template.format(
        author_name=review.get("author_name", "there"),
        rating=review.get("rating", 5),
        business_name=business_name,
    )


def get_template_for_rating(rating: int) -> str:
    if rating >= 5:
        return db.get_config(
            "template_5_star",
            "Thank you so much, {author_name}! We're thrilled you had a great experience at {business_name}.",
        )
    if rating == 4:
        return db.get_config(
            "template_4_star",
            "Thanks for the kind words, {author_name}! We appreciate your feedback at {business_name}.",
        )
    return db.get_config(
        "template_3_star",
        "Thank you for your feedback, {author_name}. We'd love to hear how we can improve at {business_name}.",
    )


def should_auto_reply(rating: int) -> bool:
    if db.get_config("auto_reply_enabled", "true") != "true":
        return False
    min_rating = int(db.get_config("auto_reply_min_rating", "4"))
    return rating >= min_rating


def send_low_rating_alert(review: dict):
    if db.get_config("alert_low_ratings", "true") != "true":
        return
    alert_email = db.get_config("alert_email")
    smtp_user = db.get_config("smtp_user")
    smtp_pass = db.get_config("smtp_pass")
    if not alert_email or not smtp_user or not smtp_pass:
        return

    stars = "★" * int(review.get("rating", 1))
    body = (
        f"<h2>Low-rating review needs attention</h2>"
        f"<p><b>Rating:</b> {stars}</p>"
        f"<p><b>Author:</b> {review.get('author_name', '')}</p>"
        f"<p><b>Review:</b> {review.get('text', '')}</p>"
        f"<p>Log in to your review dashboard to reply manually.</p>"
    )
    msg = MIMEText(body, "html")
    msg["Subject"] = f"New {review.get('rating', 1)}-star review"
    msg["From"] = smtp_user
    msg["To"] = alert_email
    smtp_host = db.get_config("smtp_host", "smtp.gmail.com")

    with smtplib.SMTP(smtp_host, 587) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, [alert_email], msg.as_string())


async def generate_and_post_reply(review: dict, reply_text: str | None = None, auto: bool = False) -> dict:
    text = reply_text or render_template(get_template_for_rating(review["rating"]), review)
    gbp_review_name = review.get("gbp_review_name") or review.get("external_id", "")
    result = await google_business.post_review_reply(gbp_review_name, text)

    if result.get("posted"):
        db.update_review_reply(review["id"], text, "posted", auto_replied=auto)
        return {"success": True, "reply_text": text, "posted_to_google": True}

    if google_business.is_gbp_configured():
        db.update_review_reply(review["id"], text, "failed", auto_replied=auto)
        return {
            "success": False,
            "reply_text": text,
            "posted_to_google": False,
            "reason": result.get("reason", "Failed to post reply"),
        }

    db.update_review_reply(review["id"], text, "pending", auto_replied=auto)
    return {
        "success": True,
        "reply_text": text,
        "posted_to_google": False,
        "reason": "Reply saved locally. Connect Google Business Profile to publish.",
    }
