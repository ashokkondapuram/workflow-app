import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { analyzeAllReviews, getInsights } from "../api";
import { ReviewInsights } from "../types";
import { PageHeader, Toast } from "../components/PageHeader";
import { SentimentBadge } from "../components/AiBadge";

export default function InsightsPage() {
  const [insights, setInsights] = useState<ReviewInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  const load = () => {
    setLoading(true);
    getInsights().then(setInsights).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeAllReviews();
      setMsgType("success");
      setMsg(`Analyzed ${result.analyzed} review${result.analyzed !== 1 ? "s" : ""} with AI.`);
      load();
    } catch {
      setMsgType("error");
      setMsg("Analysis failed. Add your OpenAI API key in Connect.");
    }
    setAnalyzing(false);
    setTimeout(() => setMsg(""), 4000);
  };

  const total = insights
    ? insights.sentiment_breakdown.positive +
      insights.sentiment_breakdown.neutral +
      insights.sentiment_breakdown.negative
    : 0;

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <>
      <PageHeader
        title="AI insights"
        subtitle="ChatGPT analyzes your reviews for sentiment, themes, and priorities."
        action={
          <button onClick={handleAnalyzeAll} disabled={analyzing} className="btn-primary">
            <Brain size={16} className={analyzing ? "animate-pulse" : ""} />
            {analyzing ? "Analyzing…" : "Analyze all reviews"}
          </button>
        }
      />

      {msg && <Toast message={msg} type={msgType} />}

      {loading ? (
        <div className="card p-12 text-center text-zinc-500 text-sm">Loading insights…</div>
      ) : (
        <div className="space-y-5">
          {/* AI summary */}
          <div className="card p-6 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border-violet-500/20">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <Sparkles size={20} className="text-violet-400" />
              </div>
              <div>
                <h2 className="text-white font-medium mb-2">What customers are saying</h2>
                <p className="text-zinc-300 text-sm leading-relaxed">{insights?.ai_summary}</p>
                <p className="text-zinc-600 text-xs mt-2">
                  {insights?.analyzed_count ?? 0} reviews analyzed by AI
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Sentiment breakdown */}
            <div className="card p-5">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-400" /> Sentiment
              </h3>
              {total === 0 ? (
                <p className="text-zinc-500 text-sm">Sync and analyze reviews to see sentiment.</p>
              ) : (
                <div className="space-y-3">
                  {(["positive", "neutral", "negative"] as const).map((s) => {
                    const count = insights?.sentiment_breakdown[s] ?? 0;
                    const colors = {
                      positive: "bg-emerald-500",
                      neutral: "bg-zinc-500",
                      negative: "bg-red-500",
                    };
                    return (
                      <div key={s}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-zinc-400 capitalize flex items-center gap-2">
                            <SentimentBadge sentiment={s} /> {count}
                          </span>
                          <span className="text-zinc-500">{pct(count)}%</span>
                        </div>
                        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[s]} transition-all`}
                            style={{ width: `${pct(count)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top themes */}
            <div className="card p-5">
              <h3 className="text-sm font-medium text-white mb-4">Common themes</h3>
              {(insights?.top_themes.length ?? 0) === 0 ? (
                <p className="text-zinc-500 text-sm">Themes appear after AI analysis.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {insights?.top_themes.map((t) => (
                    <span
                      key={t.theme}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs"
                    >
                      {t.theme} <span className="text-indigo-500/60">×{t.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Needs attention */}
          {(insights?.needs_attention.length ?? 0) > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-medium text-white">Needs your attention</h3>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {insights?.needs_attention.map((r) => (
                  <Link
                    key={r.id}
                    to="/reviews"
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-300 text-sm font-medium">
                      {r.author_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{r.author_name}</span>
                        <span className="text-amber-400 text-xs">{r.rating}★</span>
                        <span className="text-[10px] text-red-400 uppercase">{r.urgency}</span>
                      </div>
                      <p className="text-zinc-500 text-xs truncate">{r.summary}</p>
                    </div>
                    <RefreshCw size={14} className="text-zinc-600 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
