# Google Reviews Dashboard & Auto-Reply

A full-stack app for monitoring Google reviews and automating replies.

## Features

- **Review dashboard** — stats, recent reviews, average rating, pending replies
- **Review inbox** — filter by status, rating, or auto-reply; manual and template replies
- **Automated reply machine** — template-based replies by star rating, scheduled polling
- **Low-rating alerts** — email notifications for 1–3 star reviews
- **Google Business Profile integration** — OAuth connect to publish replies live

## Quick start (local dev)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8011 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://127.0.0.1:5173**

### Docker (single container)

```bash
docker build -t google-reviews .
docker run -d \
  --name google-reviews \
  -p 127.0.0.1:8080:80 \
  -v google-reviews-data:/app/data \
  google-reviews
```

Open **http://127.0.0.1:8080**

### Docker Compose (separate frontend + backend)

```bash
cp .env.example .env   # fill in your keys
docker compose up --build
```

## Setup

### 1. Google Places API (read reviews)

1. Enable **Places API** in [Google Cloud Console](https://console.cloud.google.com/)
2. Create an API key and add it in **Settings**
3. Find your **Place ID** via [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder)

Places API returns up to 5 most relevant reviews. For full review access, connect Google Business Profile below.

### 2. Google Business Profile (post replies)

1. Enable **Google Business Profile API** in Cloud Console
2. Create OAuth 2.0 credentials (Web application)
3. Add redirect URI: `http://127.0.0.1:8011/api/oauth/callback`
4. Enter Client ID, Client Secret, Account ID, and Location ID in **Settings**
5. Click **Connect Google**

### 3. Auto-reply rules

- Enable automated replies in Settings
- Set minimum star rating for auto-reply (default: 4+)
- Customize templates with `{author_name}`, `{rating}`, `{business_name}`
- Reviews below the threshold are flagged for manual reply
- Scheduler polls every 4 hours (configurable)

### 4. Low-rating alerts (optional)

Configure SMTP and alert email to get notified when 1–3 star reviews arrive.

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/` | List reviews |
| GET | `/api/reviews/stats` | Dashboard stats |
| POST | `/api/reviews/sync` | Fetch reviews + run auto-reply |
| POST | `/api/reviews/{id}/reply` | Post manual reply |
| POST | `/api/reviews/{id}/auto-reply` | Generate template reply |
| POST | `/api/trigger-sync` | Manual scheduler trigger |
| GET | `/api/oauth/connect` | Start Google OAuth |
| GET/POST | `/api/config/` | Settings |

## Architecture

```
├── backend/          # FastAPI + SQLite + APScheduler
│   └── app/
│       ├── services/   # Google Places, GBP API, reply engine
│       └── scheduler/  # Poll + auto-reply job
└── frontend/         # React + Tailwind dashboard
```

## Notes

- Without GBP OAuth, replies are saved locally with status **Pending publish**
- Auto-replies use templates, not AI (no LLM dependency)
- Self-hosted; no built-in authentication
