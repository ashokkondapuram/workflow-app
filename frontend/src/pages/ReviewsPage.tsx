import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bot, Brain, Send, MessageSquare, Sparkles } from "lucide-react";
import { aiSuggestReply, analyzeReview, getReviews, postReply } from "../api";
import { Review } from "../types";
import { Stars } from "../components/Stars";
import { AiInsightCard, SentimentBadge, UrgencyDot } from "../components/AiBadge";
import { PageHeader, Toast, EmptyState } from "../components/PageHeader";

const filters = [
  { id: "all", label: "All" },
  { id: "pending", label: "Needs reply" },
  { id: "replied", label: "Replied" },
  { id: "low", label: "Low rating" },
];

export default function ReviewsPage() {
  const [searchParams] = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  const load = () => getReviews().then(setReviews);

  useEffect(() => {
    load();
  }, []);

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return r.reply_status === "none";
    if (filter === "replied") return r.reply_status === "posted";
    if (filter === "low") return r.rating <= 3;
    return true;
  });

  const setLoad = (id: string, action: string | null) =>
    setLoading((s) => {
      const next = { ...s };
      if (action) next[id] = action;
      else delete next[id];
      return next;
    });

  const handleReply = async (id: string) => {
    const text = replyDrafts[id]?.trim();
    if (!text) return;
    setLoad(id, "send");
    try {
      await postReply(id, text);
      setMsgType("success");
      setMsg("Reply sent.");
      load();
    } catch {
      setMsgType("error");
      setMsg("Failed to send reply.");
    }
    setLoad(id, null);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleAiReply = async (id: string) => {
    setLoad(id, "ai");
    try {
      const result = await aiSuggestReply(id);
      setReplyDrafts((d) => ({ ...d, [id]: result.reply_text }));
      setMsgType("success");
      setMsg("AI reply ready — review and send.");
      load();
    } catch {
      setMsgType("error");
      setMsg("AI failed. Add your OpenAI key in Connect.");
    }
    setLoad(id, null);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleAnalyze = async (id: string) => {
    setLoad(id, "analyze");
    try {
      await analyzeReview(id);
      setMsgType("success");
      setMsg("Review analyzed.");
      load();
    } catch {
      setMsgType("error");
      setMsg("Analysis failed. Connect OpenAI first.");
    }
    setLoad(id, null);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle={`${filtered.length} review${filtered.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex gap-1.5 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06]">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f.id ? "bg-indigo-500 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      {msg && <Toast message={msg} type={msgType} />}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          title="No reviews here"
          description="Try a different filter, or sync reviews from Overview."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500/25 to-violet-500/15 flex items-center justify-center text-sm font-semibold text-indigo-200 shrink-0">
                  {r.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{r.author_name}</span>
                      <Stars rating={r.rating} size="md" />
                      <SentimentBadge sentiment={r.ai_sentiment} />
                      <UrgencyDot urgency={r.ai_urgency} />
                      {r.auto_replied && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Bot size={10} /> Auto
                        </span>
                      )}
                    </div>
                    <span className="text-zinc-600 text-xs shrink-0">{r.relative_time}</span>
                  </div>

                  <p className="text-zinc-300 text-sm leading-relaxed">
                    {r.text || <span className="text-zinc-600 italic">No comment</span>}
                  </p>

                  <AiInsightCard
                    summary={r.ai_summary}
                    action={r.ai_action}
                    themes={r.ai_themes_list}
                  />

                  {!r.ai_sentiment && (
                    <button
                      onClick={() => handleAnalyze(r.id)}
                      disabled={!!loading[r.id]}
                      className="mt-3 text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      <Brain size={12} />
                      {loading[r.id] === "analyze" ? "Analyzing…" : "Analyze with AI"}
                    </button>
                  )}

                  {r.reply_text ? (
                    <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4 mt-4">
                      <p className="text-[11px] text-indigo-400 font-medium mb-1.5 uppercase tracking-wide">Your reply</p>
                      <p className="text-zinc-300 text-sm">{r.reply_text}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      <textarea
                        value={replyDrafts[r.id] || ""}
                        onChange={(e) => setReplyDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                        placeholder="Write a reply…"
                        rows={2}
                        className="input resize-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleReply(r.id)}
                          disabled={!!loading[r.id] || !replyDrafts[r.id]?.trim()}
                          className="btn-primary py-2 text-xs"
                        >
                          <Send size={14} />
                          {loading[r.id] === "send" ? "Sending…" : "Send reply"}
                        </button>
                        <button
                          onClick={() => handleAiReply(r.id)}
                          disabled={!!loading[r.id]}
                          className="btn-secondary py-2 text-xs border-violet-500/20 text-violet-300 hover:bg-violet-500/10"
                        >
                          <Sparkles size={14} />
                          {loading[r.id] === "ai" ? "Thinking…" : "AI write reply"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
