import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap, GitBranch, Clock, Globe, Activity } from "lucide-react";
import { WorkflowNodeData } from "../types";

const ICONS: Record<string, React.ReactNode> = {
  trigger: <Zap size={14} />,
  action: <Activity size={14} />,
  condition: <GitBranch size={14} />,
  delay: <Clock size={14} />,
  webhook: <Globe size={14} />,
};

const COLORS: Record<string, string> = {
  trigger: "bg-purple-600 border-purple-400",
  action: "bg-blue-600 border-blue-400",
  condition: "bg-yellow-600 border-yellow-400",
  delay: "bg-gray-600 border-gray-400",
  webhook: "bg-green-600 border-green-400",
};

const STATUS_RING: Record<string, string> = {
  idle: "",
  running: "ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-900 animate-pulse",
  success: "ring-2 ring-green-400 ring-offset-1 ring-offset-gray-900",
  error: "ring-2 ring-red-400 ring-offset-1 ring-offset-gray-900",
};

export const WorkflowNode = memo(({ data, selected }: NodeProps) => {
  const d = data as WorkflowNodeData;
  const color = COLORS[d.type] || "bg-gray-600 border-gray-400";
  const ring = STATUS_RING[d.status || "idle"];

  return (
    <div
      className={`min-w-[160px] rounded-lg border-2 shadow-lg ${color} ${ring} ${
        selected ? "brightness-125" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-white !w-3 !h-3" />
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 text-white">
          <span className="opacity-80">{ICONS[d.type]}</span>
          <span className="text-sm font-semibold truncate max-w-[120px]">{d.label}</span>
        </div>
        <div className="mt-1 text-xs text-white/60 capitalize">{d.type}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-white !w-3 !h-3" />
    </div>
  );
});
