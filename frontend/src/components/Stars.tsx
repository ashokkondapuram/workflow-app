export function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "text-base" : "text-sm";
  return (
    <span className={`${cls} tracking-tight`} aria-label={`${rating} out of 5 stars`}>
      <span className="text-amber-400">{"★".repeat(rating)}</span>
      <span className="text-zinc-700">{"★".repeat(5 - rating)}</span>
    </span>
  );
}
