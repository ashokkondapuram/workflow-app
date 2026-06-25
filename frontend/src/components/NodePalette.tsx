import { Zap, Activity, GitBranch, Clock, Globe } from "lucide-react";
import { useWorkflowStore } from "../store";
import { WorkflowNodeData } from "../types";

const NODES: Array<{ type: WorkflowNodeData["type"]; label: string; icon: React.ReactNode; color: string }> = [
  { type: "trigger", label: "Trigger", icon: <Zap size={16} />, color: "bg-purple-700 hover:bg-purple-600" },
  { type: "action", label: "HTTP Action", icon: <Activity size={16} />, color: "bg-blue-700 hover:bg-blue-600" },
  { type: "condition", label: "Condition", icon: <GitBranch size={16} />, color: "bg-yellow-700 hover:bg-yellow-600" },
  { type: "delay", label: "Delay", icon: <Clock size={16} />, color: "bg-gray-600 hover:bg-gray-500" },
  { type: "webhook", label: "Webhook", icon: <Globe size={16} />, color: "bg-green-700 hover:bg-green-600" },
];

export const NodePalette = () => {
  const addNode = useWorkflowStore((s) => s.addNode);

  const onDragStart = (e: React.DragEvent, type: WorkflowNodeData["type"]) => {
    e.dataTransfer.setData("nodeType", type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-52 bg-gray-900 border-r border-gray-700 p-4 flex flex-col gap-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Node Library</p>
      {NODES.map((n) => (
        <div
          key={n.type}
          draggable
          onDragStart={(e) => onDragStart(e, n.type)}
          onClick={() => addNode(n.type, { x: 300 + Math.random() * 100, y: 150 + Math.random() * 100 })}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm cursor-grab active:cursor-grabbing ${n.color} transition-colors select-none`}
        >
          {n.icon}
          {n.label}
        </div>
      ))}
      <p className="text-xs text-gray-500 mt-2">Drag onto canvas or click to add</p>
    </div>
  );
};
