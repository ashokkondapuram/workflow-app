import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  Star,
  MessageSquare,
  RefreshCw,
  Bot,
  AlertTriangle,
  Sparkles,
  Link2,
} from "lucide-react";
import { getReviewStats, getReviews, triggerSync, getConfig, getInsights } from "../api";
import { Review, ReviewStats, ReviewConfig, ReviewInsights } from "../types";
import { Stars } from "../components/Stars";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { PageHeader, Toast, EmptyState } from "../components/PageHeader";

function statusBadge(status: Review["reply_status"]) {
  const map: Record<string, string> = {
    none: "bg-zinc-800 text-zinc-400",
    pending: "bg-amber-500/15 text-amber-300",
    posted: "bg-emerald-500/15 text-emerald-300",
    failed: "bg-red-500/15 text-red-300",
  };
  const labels: Record<string, string> = {
    none: "Needs reply",
    pending: "Saved",
    posted: "Replied",
    failed: "Failed",
  };
  return (
    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [recent, setRecent] = useState<Review[]>([]);
  const [config, setConfig] = useState<ReviewConfig | null>(null);
  const [insights, setInsights] = useState<ReviewInsights | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  const load = () => {
    getReviewStats().then(setStats);
    getReviews().then((r) => setRecent(r.slice(0, 5)));
    getConfig().then(setConfig);
    getInsights().then(setInsights);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSync = async () => {
    if (!config?.places_connected) {
      setMsgType("error");
      setMsg("Connect Google Places first in the Connect tab.");
      setTimeout(() => setMsg(""), 4000);
      return;
    }
    setSyncing(true);
    try {
      const result = await triggerSync();
      setMsgType("success");
      setMsg(`Synced ${result.fetched} reviews · ${result.new_reviews} new · ${result.auto_replied} auto-replied`);
      load();
    } catch {
      setMsgType("error");
      setMsg("Sync failed. Check your connection settings.");
    }
    setSyncing(false);
    setTimeout(() => setMsg(""), 5000);
  };

  const statCards = [
    { label: "Reviews", value: stats?.total_reviews ?? 0, icon: MessageSquare, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Avg rating", value: stats?.average_rating ?? "—", icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Pending", value: stats?.pending_replies ?? 0, icon: RefreshCw, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Auto-replied", value: stats?.auto_replies_sent ?? 0, icon: Bot, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={format(new Date(), "EEEE, MMMM d, yyyy")}
        action={
          <button onClick={handleSync} disabled={syncing} className="btn-primary">
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing…" : "Sync reviews"}
          </button>
        }
      />

      {msg && <Toast message={msg} type={msgType} />}

      <div className="mb-6">
        <ConnectionStatus config={config} />
      </div>

      {insights && insights.analyzed_count > 0 && (
        <Link
          to="/insights"
          className="block mb-6 card p-4 hover:border-violet-500/30 transition-colors group"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-violet-400 font-medium mb-1">AI insight</p>
              <p className="text-zinc-300 text-sm line-clamp-2">{insights.ai_summary}</p>
            </div>
            <span className="text-indigo-400 text-xs group-hover:underline shrink-0">View →</span>
          </div>
        </Link>
      )}

      {(stats?.low_rating_count ?? 0) > 0 && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-200">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="flex-1">
            {stats?.low_rating_count} low-rating review{(stats?.low_rating_count ?? 0) > 1 ? "s" : ""} need your attention
          </span>
          <Link to="/reviews?filter=low" className="text-amber-100 underline underline-offset-2 hover:text-white text-xs font-medium">
            View
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={s.color} />
              </div>
              <div className="text-2xl font-semibold text-white tabular-nums">{s.value}</div>
              <div className="text-zinc-500 text-xs mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Recent reviews</h2>
          <Link to="/reviews" className="text-indigo-400 text-xs hover:text-indigo-300 font-medium">
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={24} />}
            title={config?.places_connected ? "No reviews yet" : "Get started in 2 minutes"}
            description={
              config?.places_connected
                ? "Hit Sync reviews to pull in your latest Google reviews."
                : "Add your Google API key and Place ID in Connect — that's all you need to import reviews."
            }
            action={
              config?.places_connected ? (
                <button onClick={handleSync} className="btn-primary">
                  <RefreshCw size={16} /> Sync reviews
                </button>
              ) : (
                <Link to="/settings" className="btn-primary">
                  <Link2 size={16} /> Connect Google
                </Link>
              )
            }
          />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {recent.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/20 flex items-center justify-center text-sm font-medium text-indigo-200 shrink-0">
                  {r.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white text-sm font-medium">{r.author_name}</span>
                    <Stars rating={r.rating} />
                    {r.auto_replied && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Bot size={10} /> Auto
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm line-clamp-2">{r.text || "No comment"}</p>
                  {r.reply_text && (
                    <p className="text-zinc-500 text-xs mt-2 pl-3 border-l-2 border-indigo-500/40">{r.reply_text}</p>
                  )}
                </div>
                <div className="text-right shrink-0 space-y-1.5">
                  <p className="text-zinc-600 text-[11px]">{r.relative_time}</p>
                  {statusBadge(r.reply_status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
