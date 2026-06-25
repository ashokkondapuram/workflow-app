import { useWorkflowStore } from "../store";

export const PropertiesPanel = () => {
  const { selectedNode, updateNodeConfig, updateNodeLabel } = useWorkflowStore();

  if (!selectedNode) {
    return (
      <div className="w-64 bg-gray-900 border-l border-gray-700 p-4 flex items-center justify-center">
        <p className="text-gray-500 text-sm text-center">Click a node to configure it</p>
      </div>
    );
  }

  const { data } = selectedNode;

  return (
    <div className="w-64 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Properties</p>

      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-1">Node Label</label>
        <input
          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
          value={data.label}
          onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
        />
      </div>

      <div className="mb-2">
        <p className="text-xs text-gray-400 mb-2 font-semibold">Configuration</p>
        {Object.entries(data.config).map(([key, val]) => (
          <div key={key} className="mb-3">
            <label className="block text-xs text-gray-500 mb-1 capitalize">{key.replace(/_/g, " ")}</label>
            <input
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              value={val as string}
              onChange={(e) =>
                updateNodeConfig(selectedNode.id, { ...data.config, [key]: e.target.value })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};
