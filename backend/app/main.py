from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import workflows

app = FastAPI(title="FlowCraft API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflows.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
