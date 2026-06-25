from pydantic import BaseModel, Field


class ReviewReply(BaseModel):
    reply_text: str = Field(min_length=1, max_length=4096)


class ReviewConfig(BaseModel):
    google_places_api_key: str = ""
    place_id: str = ""
    business_name: str = "Our Business"
    gbp_account_id: str = ""
    gbp_location_id: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    oauth_redirect_uri: str = "http://127.0.0.1:8011/api/oauth/callback"
    auto_reply_enabled: bool = True
    auto_reply_min_rating: int = Field(default=4, ge=1, le=5)
    alert_low_ratings: bool = True
    alert_email: str = ""
    smtp_host: str = "smtp.gmail.com"
    smtp_user: str = ""
    smtp_pass: str = ""
    template_5_star: str = (
        "Thank you so much, {author_name}! We're thrilled you had a great experience at {business_name}."
    )
    template_4_star: str = (
        "Thanks for the kind words, {author_name}! We appreciate your feedback at {business_name}."
    )
    template_3_star: str = (
        "Thank you for your feedback, {author_name}. We'd love to hear how we can improve at {business_name}."
    )
    poll_interval_hours: int = Field(default=4, ge=1, le=168)
