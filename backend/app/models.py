from pydantic import BaseModel
from typing import Any, Optional

class Position(BaseModel):
    x: float
    y: float

class NodeData(BaseModel):
    label: str
    type: str
    config: dict[str, Any] = {}
    status: Optional[str] = "idle"

class WorkflowNode(BaseModel):
    id: str
    type: str
    position: Position
    data: NodeData

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class WorkflowDefinition(BaseModel):
    id: str
    name: str
    nodes: list[WorkflowNode]
    edges: list[WorkflowEdge]

class ExecutionLog(BaseModel):
    node_id: str
    status: str
    output: str
    timestamp: str

class ExecutionResult(BaseModel):
    workflow_id: str
    status: str
    logs: list[ExecutionLog]
