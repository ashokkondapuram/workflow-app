# ⭐ Google Reviews Monitor

Polls Google Places API every 4 hours. Sends instant email alert when a new 1-3 star review is posted.

## Quick Start
```bash
cp .env.example .env  # add your Google Places API key and Place ID
docker build -t review-monitor .
docker run -d --env-file .env -p 8007:8007 review-monitor
```

## Find Your Place ID
Visit: https://developers.google.com/maps/documentation/places/web-service/place-id

## Endpoints
```
GET /run  — check reviews now
GET /     — health check
```
API docs: http://localhost:8007/docs
