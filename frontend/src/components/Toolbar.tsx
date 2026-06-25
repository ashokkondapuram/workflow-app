import { useState } from "react";
import { Play, Download, Upload, Save } from "lucide-react";
import axios from "axios";
import { useWorkflowStore } from "../store";
import { WorkflowDefinition } from "../types";

export const Toolbar = () => {
  const { nodes, edges, workflowName, setWorkflowName, setLogs, loadWorkflow } =
    useWorkflowStore();
  const [running, setRunning] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const buildDefinition = (): WorkflowDefinition => ({
    id: `wf_${Date.now()}`,
    name: workflowName,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type || "workflowNode",
      position: n.position,
      data: n.data,
    })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label as string })),
  });

  const handleRun = async () => {
    setRunning(true);
    setLogs([]);
    try {
      const res = await axios.post("/api/workflows/execute", buildDefinition());
      setLogs(res.data.logs || []);
    } catch {
      setLogs([{ node_id: "system", status: "error", output: "Execution failed - check backend", timestamp: new Date().toISOString() }]);
    }
    setRunning(false);
  };

  const handleSave = async () => {
    try {
      await axios.post("/api/workflows/save", buildDefinition());
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch {
      setSaveStatus("Save failed");
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(buildDefinition(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, "_")}.json`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const def: WorkflowDefinition = JSON.parse(ev.target?.result as string);
          loadWorkflow(def.nodes as any, def.edges as any);
          setWorkflowName(def.name);
        } catch {
          alert("Invalid workflow JSON");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="h-14 bg-gray-900 border-b border-gray-700 flex items-center px-4 gap-3">
      <span className="text-white font-bold text-lg mr-2">⚡ FlowCraft</span>
      <input
        className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm w-56 focus:outline-none focus:border-blue-500"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        placeholder="Workflow name..."
      />
      <div className="flex-1" />
      <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">
        <Upload size={14} /> Import
      </button>
      <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">
        <Download size={14} /> Export JSON
      </button>
      <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">
        <Save size={14} /> {saveStatus || "Save"}
      </button>
      <button
        onClick={handleRun}
        disabled={running}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
      >
        <Play size={14} /> {running ? "Running..." : "Run"}
      </button>
    </div>
  );
};
