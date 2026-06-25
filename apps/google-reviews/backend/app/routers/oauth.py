from datetime import datetime
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow

from app import database as db

router = APIRouter(prefix="/api/oauth", tags=["oauth"])

SCOPES = ["https://www.googleapis.com/auth/business.manage"]


def _get_flow() -> Flow:
    client_id = db.get_config("google_client_id")
    client_secret = db.get_config("google_client_secret")
    redirect_uri = db.get_config("oauth_redirect_uri", "http://127.0.0.1:8011/api/oauth/callback")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=400,
            detail="Add Google Client ID and Client Secret in Settings first.",
        )

    return Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        },
        scopes=SCOPES,
        redirect_uri=redirect_uri,
    )


@router.get("/status")
async def oauth_status():
    return {
        "connected": db.is_oauth_connected(),
        "redirect_uri": db.get_config("oauth_redirect_uri", "http://127.0.0.1:8011/api/oauth/callback"),
    }


@router.get("/connect")
async def connect_google():
    flow = _get_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return RedirectResponse(auth_url)


@router.get("/callback")
async def oauth_callback(code: str | None = None, error: str | None = None):
    if error:
        return RedirectResponse(f"/settings?oauth=error&message={error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    flow = _get_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials

    db.save_oauth_tokens(
        creds.token or "",
        creds.refresh_token or "",
        creds.expiry.isoformat() if creds.expiry else datetime.utcnow().isoformat(),
    )
    return RedirectResponse("/settings?oauth=success")


@router.post("/disconnect")
async def disconnect_google():
    with db.get_conn() as conn:
        conn.execute("DELETE FROM oauth_tokens WHERE id=1")
        conn.commit()
    return {"message": "Disconnected from Google Business Profile"}
