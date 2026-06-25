import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Wifi, WifiOff } from "lucide-react";
import { ReviewConfig } from "../types";

export function ConnectionStatus({ config }: { config: ReviewConfig | null }) {
  if (!config) return null;

  const steps = [
    {
      done: config.places_connected,
      label: "Reviews linked",
      detail: config.places_connected ? config.business_name || "Google Places" : "Add API key & Place ID",
    },
    {
      done: config.oauth_connected,
      label: "Google connected",
      detail: config.oauth_connected ? "Ready to publish" : "Optional — for live replies",
    },
    {
      done: config.ai_connected,
      label: "AI connected",
      detail: config.ai_connected ? "ChatGPT ready" : "Add OpenAI API key",
    },
  ];

  const allReady = config.places_connected;

  return (
    <div className="card p-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 shrink-0">
        {allReady ? (
          <Wifi size={18} className="text-emerald-400" />
        ) : (
          <WifiOff size={18} className="text-amber-400" />
        )}
        <span className="text-sm font-medium text-white">
          {allReady ? "Connected" : "Setup needed"}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 flex-1">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            {s.done ? (
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            ) : (
              <Circle size={14} className="text-zinc-600 shrink-0" />
            )}
            <span className={s.done ? "text-zinc-300" : "text-zinc-500"}>{s.label}</span>
          </div>
        ))}
      </div>

      {!allReady && (
        <Link to="/settings" className="btn-primary text-xs py-2 px-4 shrink-0">
          Connect now
        </Link>
      )}
    </div>
  );
}
