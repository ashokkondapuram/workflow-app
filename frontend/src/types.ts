export type NodeType = "trigger" | "action" | "condition" | "delay" | "webhook";

export interface WorkflowNodeData {
  label: string;
  type: NodeType;
  config: Record<string, string>;
  status?: "idle" | "running" | "success" | "error";
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: WorkflowNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

export interface ExecutionLog {
  node_id: string;
  status: "success" | "error" | "skipped";
  output: string;
  timestamp: string;
}
