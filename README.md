# FlowCraft — Self-Hosted Drag & Drop Workflow Automation

A Power Automate-style workflow builder you can self-host. Build workflows visually, export as JSON, and redeploy anywhere.

## Quick Start

### With Docker (Recommended)
```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Without Docker

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## Features
- Drag & drop canvas (React Flow)
- 5 node types: Trigger, HTTP Action, Condition, Delay, Webhook
- Export/Import workflows as JSON
- Save workflows to server
- Execution engine with step-by-step logs
- Fully self-hosted via Docker

## Tech Stack
- **Frontend**: React 18, TypeScript, React Flow, Zustand, TailwindCSS, Vite
- **Backend**: FastAPI, Python 3.12, httpx, Pydantic
- **Deploy**: Docker + Docker Compose
