import { create } from "zustand";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { WorkflowNodeData, ExecutionLog } from "./types";

interface WorkflowStore {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNode: Node<WorkflowNodeData> | null;
  logs: ExecutionLog[];
  workflowName: string;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNode: (node: Node<WorkflowNodeData> | null) => void;
  updateNodeConfig: (id: string, config: Record<string, string>) => void;
  updateNodeLabel: (id: string, label: string) => void;
  addNode: (type: WorkflowNodeData["type"], position: { x: number; y: number }) => void;
  setLogs: (logs: ExecutionLog[]) => void;
  setWorkflowName: (name: string) => void;
  loadWorkflow: (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => void;
}

let nodeCounter = 1;

const NODE_DEFAULTS: Record<string, { label: string; config: Record<string, string> }> = {
  trigger: { label: "HTTP Trigger", config: { method: "POST", path: "/webhook" } },
  action: { label: "HTTP Request", config: { url: "", method: "GET" } },
  condition: { label: "If/Else", config: { field: "", operator: "equals", value: "" } },
  delay: { label: "Wait", config: { duration: "5", unit: "seconds" } },
  webhook: { label: "Send Webhook", config: { url: "", method: "POST", body: "" } },
};

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  logs: [],
  workflowName: "My Workflow",

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) as Node<WorkflowNodeData>[] }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) }),

  setSelectedNode: (node) => set({ selectedNode: node }),

  updateNodeConfig: (id, config) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, config } } : n
      ),
    }),

  updateNodeLabel: (id, label) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n
      ),
    }),

  addNode: (type, position) => {
    const defaults = NODE_DEFAULTS[type];
    const newNode: Node<WorkflowNodeData> = {
      id: `node_${nodeCounter++}`,
      type: "workflowNode",
      position,
      data: { label: defaults.label, type, config: { ...defaults.config }, status: "idle" },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  setLogs: (logs) => set({ logs }),
  setWorkflowName: (name) => set({ workflowName: name }),
  loadWorkflow: (nodes, edges) => set({ nodes, edges }),
}));
