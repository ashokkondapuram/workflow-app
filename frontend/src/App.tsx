import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore } from "./store";
import { WorkflowNode } from "./components/WorkflowNode";
import { NodePalette } from "./components/NodePalette";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Toolbar } from "./components/Toolbar";
import { ExecutionLogs } from "./components/ExecutionLogs";
import { WorkflowNodeData } from "./types";

const nodeTypes = { workflowNode: WorkflowNode };

function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNode, addNode } =
    useWorkflowStore();

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => setSelectedNode(node as Node<WorkflowNodeData>),
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => setSelectedNode(null), [setSelectedNode]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("nodeType") as WorkflowNodeData["type"];
      if (!type) return;
      const bounds = (e.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
      if (!bounds) return;
      addNode(type, { x: e.clientX - bounds.left - 80, y: e.clientY - bounds.top - 40 });
    },
    [addNode]
  );

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

  return (
    <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-950"
        defaultEdgeOptions={{ animated: true, style: { stroke: "#4B5563" } }}
      >
        <Background color="#374151" gap={20} />
        <Controls className="!bg-gray-800 !border-gray-700 !text-white" />
        <MiniMap className="!bg-gray-800 !border-gray-700" nodeColor="#4B5563" />
      </ReactFlow>
      <ExecutionLogs />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-gray-950 text-white">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <NodePalette />
          <FlowCanvas />
          <PropertiesPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
