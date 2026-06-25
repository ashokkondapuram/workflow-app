import json, os
from fastapi import APIRouter, HTTPException
from app.models import WorkflowDefinition, ExecutionResult
from app.engine.executor import execute_workflow

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

STORAGE_DIR = "data/workflows"
os.makedirs(STORAGE_DIR, exist_ok=True)


@router.post("/execute", response_model=ExecutionResult)
async def execute(workflow: WorkflowDefinition):
    logs = await execute_workflow(workflow)
    return ExecutionResult(workflow_id=workflow.id, status="completed", logs=logs)


@router.post("/save")
async def save(workflow: WorkflowDefinition):
    path = os.path.join(STORAGE_DIR, f"{workflow.id}.json")
    with open(path, "w") as f:
        json.dump(workflow.model_dump(), f, indent=2)
    return {"message": "Saved", "id": workflow.id}


@router.get("/list")
async def list_workflows():
    files = [f.replace(".json", "") for f in os.listdir(STORAGE_DIR) if f.endswith(".json")]
    return {"workflows": files}


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    path = os.path.join(STORAGE_DIR, f"{workflow_id}.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")
    with open(path) as f:
        return json.load(f)
