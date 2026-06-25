import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Star, MessageSquare, RefreshCw, Bot, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { getReviewStats, getReviews, triggerSync } from "../api";
import { Review, ReviewStats } from "../types";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {"★".repeat(rating)}
      <span className="text-gray-600">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function statusBadge(status: Review["reply_status"]) {
  const styles: Record<string, string> = {
    none: "bg-gray-800 text-gray-400",
    pending: "bg-yellow-900 text-yellow-300",
    posted: "bg-green-900 text-green-300",
    failed: "bg-red-900 text-red-300",
  };
  const labels: Record<string, string> = {
    none: "No reply",
    pending: "Pending publish",
    posted: "Replied",
    failed: "Failed",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [recent, setRecent] = useState<Review[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => {
    getReviewStats().then(setStats);
    getReviews().then((r) => setRecent(r.slice(0, 6)));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerSync();
      setMsg(
        `Synced ${result.fetched} reviews — ${result.new_reviews} new, ${result.auto_replied} auto-replied`
      );
      load();
    } catch {
      setMsg("Sync failed. Check your API settings.");
    }
    setSyncing(false);
    setTimeout(() => setMsg(""), 5000);
  };

  const statCards = [
    {
      label: "Total reviews",
      value: stats?.total_reviews ?? 0,
      icon: <MessageSquare size={20} />,
      color: "text-blue-400",
    },
    {
      label: "Average rating",
      value: stats?.average_rating ?? 0,
      icon: <Star size={20} />,
      color: "text-yellow-400",
    },
    {
      label: "Pending replies",
      value: stats?.pending_replies ?? 0,
      icon: <RefreshCw size={20} />,
      color: "text-purple-400",
    },
    {
      label: "Auto-replies sent",
      value: stats?.auto_replies_sent ?? 0,
      icon: <Bot size={20} />,
      color: "text-green-400",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Sync reviews now"}
        </button>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-2 bg-green-900 border border-green-600 rounded-lg text-sm text-green-200">
          {msg}
        </div>
      )}

      {(stats?.low_rating_count ?? 0) > 0 && (
        <div className="mb-4 px-4 py-3 bg-amber-900/40 border border-amber-700 rounded-lg flex items-center gap-3 text-sm text-amber-200">
          <AlertTriangle size={18} />
          {stats?.low_rating_count} low-rating review{(stats?.low_rating_count ?? 0) > 1 ? "s" : ""} need
          your attention.{" "}
          <Link to="/reviews?filter=low" className="underline hover:text-white">
            View reviews
          </Link>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-gray-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-semibold">Recent reviews</h3>
          <Link to="/reviews" className="text-blue-400 text-sm hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-8 text-gray-500 text-sm text-center">
            No reviews yet.{" "}
            <button onClick={handleSync} className="text-blue-400 hover:underline">
              Sync from Google
            </button>{" "}
            or check your{" "}
            <Link to="/settings" className="text-blue-400 hover:underline">
              settings
            </Link>
            .
          </div>
        ) : (
          recent.map((r) => (
            <div
              key={r.id}
              className="px-6 py-4 border-b border-gray-800 last:border-0 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-medium">{r.author_name}</p>
                  <Stars rating={r.rating} />
                  {r.auto_replied && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Bot size={12} /> Auto
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm line-clamp-2">{r.text || "No comment"}</p>
                {r.reply_text && (
                  <p className="text-gray-500 text-xs mt-2 border-l-2 border-gray-700 pl-2">
                    Reply: {r.reply_text}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-gray-500 text-xs mb-1">{r.relative_time}</p>
                {statusBadge(r.reply_status)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
