const colors: Record<string, string> = {
  positive: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  neutral: "bg-zinc-500/15 text-zinc-300 border-zinc-500/25",
  negative: "bg-red-500/15 text-red-300 border-red-500/25",
};

export function SentimentBadge({ sentiment }: { sentiment?: string }) {
  if (!sentiment) return null;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${colors[sentiment] || colors.neutral}`}>
      {sentiment}
    </span>
  );
}

export function UrgencyDot({ urgency }: { urgency?: string }) {
  if (!urgency || urgency === "low") return null;
  const color = urgency === "high" ? "bg-red-400" : "bg-amber-400";
  return <span className={`w-2 h-2 rounded-full ${color} shrink-0`} title={`${urgency} urgency`} />;
}

export function AiInsightCard({ summary, action, themes }: { summary?: string; action?: string; themes?: string[] }) {
  if (!summary) return null;
  return (
    <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-3 mt-3">
      <p className="text-[11px] text-violet-400 font-medium mb-1 flex items-center gap-1">
        <SparkleIcon /> AI insight
      </p>
      <p className="text-zinc-400 text-xs leading-relaxed">{summary}</p>
      {action && <p className="text-zinc-500 text-xs mt-1.5">→ {action}</p>}
      {themes && themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {themes.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
