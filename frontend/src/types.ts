export interface Review {
  id: string;
  external_id: string;
  author_name: string;
  rating: number;
  text: string;
  relative_time: string;
  review_time: number;
  reply_text: string;
  reply_status: "none" | "pending" | "posted" | "failed";
  auto_replied: boolean;
  fetched_at: string;
  replied_at: string;
  ai_sentiment?: string;
  ai_summary?: string;
  ai_themes?: string;
  ai_themes_list?: string[];
  ai_urgency?: string;
  ai_action?: string;
  ai_analyzed_at?: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  pending_replies: number;
  auto_replies_sent: number;
  low_rating_count: number;
}

export interface ReviewInsights {
  sentiment_breakdown: { positive: number; neutral: number; negative: number };
  top_themes: { theme: string; count: number }[];
  needs_attention: {
    id: string;
    author_name: string;
    rating: number;
    summary: string;
    urgency: string;
  }[];
  ai_summary: string;
  analyzed_count: number;
}

export interface ReviewConfig {
  google_places_api_key: string;
  place_id: string;
  business_name: string;
  gbp_account_id: string;
  gbp_location_id: string;
  google_client_id: string;
  google_client_secret: string;
  oauth_redirect_uri: string;
  auto_reply_enabled: boolean;
  auto_reply_min_rating: number;
  alert_low_ratings: boolean;
  alert_email: string;
  smtp_host: string;
  smtp_user: string;
  smtp_pass: string;
  template_5_star: string;
  template_4_star: string;
  template_3_star: string;
  poll_interval_hours: number;
  gbp_connected: boolean;
  oauth_connected: boolean;
  places_connected: boolean;
  can_publish_replies: boolean;
  ai_connected: boolean;
  openai_api_key: string;
  ai_enabled: boolean;
  ai_model: string;
  ai_tone: string;
  ai_auto_analyze: boolean;
  ai_auto_reply: boolean;
}
