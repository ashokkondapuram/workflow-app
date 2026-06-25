import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bot, Send } from "lucide-react";
import { getReviews, postReply, triggerAutoReply } from "../api";
import { Review } from "../types";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {"★".repeat(rating)}
      <span className="text-gray-600">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const [searchParams] = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");

  const load = () => getReviews().then(setReviews);

  useEffect(() => {
    load();
  }, []);

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return r.reply_status === "none";
    if (filter === "replied") return r.reply_status === "posted";
    if (filter === "low") return r.rating <= 3;
    if (filter === "auto") return r.auto_replied;
    return true;
  });

  const handleReply = async (id: string) => {
    const text = replyDrafts[id]?.trim();
    if (!text) return;
    setLoading((s) => ({ ...s, [id]: true }));
    try {
      await postReply(id, text);
      setMsg("Reply sent.");
      load();
    } catch {
      setMsg("Failed to send reply.");
    }
    setLoading((s) => ({ ...s, [id]: false }));
    setTimeout(() => setMsg(""), 3000);
  };

  const handleAutoReply = async (id: string) => {
    setLoading((s) => ({ ...s, [id]: true }));
    try {
      const result = await triggerAutoReply(id);
      setReplyDrafts((d) => ({ ...d, [id]: result.reply_text }));
      setMsg(result.posted_to_google ? "Auto-reply published to Google." : "Reply saved — connect GBP to publish.");
      load();
    } catch {
      setMsg("Auto-reply failed.");
    }
    setLoading((s) => ({ ...s, [id]: false }));
    setTimeout(() => setMsg(""), 4000);
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Needs reply" },
    { id: "replied", label: "Replied" },
    { id: "low", label: "Low rating" },
    { id: "auto", label: "Auto-replied" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Reviews</h2>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} review{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-2 bg-green-900 border border-green-600 rounded-lg text-sm text-green-200">
          {msg}
        </div>
      )}

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No reviews match this filter.</div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">{r.author_name}</span>
                    <Stars rating={r.rating} />
                    {r.auto_replied && (
                      <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Bot size={12} /> Auto-replied
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">{r.relative_time}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    r.reply_status === "posted"
                      ? "bg-green-900 text-green-300"
                      : r.reply_status === "failed"
                        ? "bg-red-900 text-red-300"
                        : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {r.reply_status === "posted" ? "Replied" : r.reply_status === "none" ? "No reply" : r.reply_status}
                </span>
              </div>

              <p className="text-gray-300 text-sm mb-4">{r.text || <em className="text-gray-500">No comment</em>}</p>

              {r.reply_text ? (
                <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300 border-l-2 border-blue-500">
                  <p className="text-xs text-gray-500 mb-1">Your reply</p>
                  {r.reply_text}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={replyDrafts[r.id] || ""}
                    onChange={(e) => setReplyDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                    placeholder="Write a reply..."
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(r.id)}
                      disabled={loading[r.id] || !replyDrafts[r.id]?.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium"
                    >
                      <Send size={14} /> Send reply
                    </button>
                    <button
                      onClick={() => handleAutoReply(r.id)}
                      disabled={loading[r.id]}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm"
                    >
                      <Bot size={14} /> Generate auto-reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
