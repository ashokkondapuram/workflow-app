import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-zinc-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Toast({ message, type = "success" }: { message: string; type?: "success" | "error" }) {
  const styles =
    type === "success"
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
      : "bg-red-500/10 border-red-500/30 text-red-200";
  return (
    <div className={`mb-6 px-4 py-3 border rounded-xl text-sm ${styles}`}>{message}</div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
        {icon}
      </div>
      <h3 className="text-white font-medium mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
