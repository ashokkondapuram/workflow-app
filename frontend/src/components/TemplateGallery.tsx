import { TEMPLATES } from "../templates";
import { useWorkflowStore } from "../store";

const CATEGORY_COLORS: Record<string, string> = {
  Reporting: "bg-blue-800 text-blue-200",
  Monitoring: "bg-red-800 text-red-200",
  Finance: "bg-green-800 text-green-200",
  HR: "bg-purple-800 text-purple-200",
  Sales: "bg-orange-800 text-orange-200",
  Support: "bg-yellow-800 text-yellow-200",
  DevOps: "bg-gray-700 text-gray-200",
  "E-Commerce": "bg-pink-800 text-pink-200",
  Marketing: "bg-teal-800 text-teal-200",
  "Customer Success": "bg-cyan-800 text-cyan-200",
  Platform: "bg-violet-800 text-violet-200",
  Operations: "bg-lime-800 text-lime-200",
  Security: "bg-rose-800 text-rose-200",
};

const CATEGORY_ICONS: Record<string, string> = {
  Reporting: "\u{1F4CA}", Monitoring: "\u{1F6A8}", Finance: "\u{1F4B0}", HR: "\u{1F465}",
  Sales: "\u{1F3AF}", Support: "\u{1F3A7}", DevOps: "\u2699\uFE0F", "E-Commerce": "\u{1F6D2}",
  Marketing: "\u{1F4E3}", "Customer Success": "\u{1F48E}", Platform: "\u{1F916}",
  Operations: "\u{1F4E6}", Security: "\u{1F512}",
};

interface Props { onClose: () => void; }

export const TemplateGallery = ({ onClose }: Props) => {
  const { loadWorkflow, setWorkflowName } = useWorkflowStore();

  const handleLoad = (template: any) => {
    loadWorkflow(template.nodes, template.edges);
    setWorkflowName(template.name);
    onClose();
  };

  const categories = [...new Set(TEMPLATES.map((t: any) => t.category))];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-5xl max-h-[88vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">&#9889; Workflow Templates</h2>
            <p className="text-gray-400 text-sm mt-0.5">{TEMPLATES.length} ready-to-use business templates &mdash; click to load on canvas</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          {categories.map((cat) => (
            <div key={cat} className="mb-8">
              <h3 className="text-gray-300 font-semibold text-sm uppercase tracking-widest mb-3">
                {CATEGORY_ICONS[cat] || "\u{1F4CC}"} {cat}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.filter((t: any) => t.category === cat).map((t: any) => (
                  <div key={t.id}
                    className="bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-all group"
                    onClick={() => handleLoad(t)}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">{t.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${CATEGORY_COLORS[t.category] || "bg-gray-700 text-gray-300"}`}>
                        {t.category}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{t.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-gray-500">{t.nodes.length} nodes</span>
                      <span className="text-gray-600">&middot;</span>
                      <span className="text-xs text-gray-500">{t.edges.length} connections</span>
                      <span className="ml-auto text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Load template &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
