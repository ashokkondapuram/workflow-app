import { useWorkflowStore } from "../store";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";

export const ExecutionLogs = () => {
  const logs = useWorkflowStore((s) => s.logs);

  if (logs.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto">
      <div className="px-4 py-2 border-b border-gray-700">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Execution Log</p>
      </div>
      {logs.map((log, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-2 border-b border-gray-800 last:border-0">
          {log.status === "success" && <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />}
          {log.status === "error" && <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />}
          {log.status === "skipped" && <MinusCircle size={14} className="text-gray-400 mt-0.5 shrink-0" />}
          <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-300 font-mono">{log.node_id}</span>
            <span className="text-xs text-gray-500 ml-2">{log.output}</span>
          </div>
          <span className="text-xs text-gray-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
};
