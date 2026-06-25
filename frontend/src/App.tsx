import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageSquare, Link2, Star, Brain } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import ReviewsPage from "./pages/ReviewsPage";
import SettingsPage from "./pages/SettingsPage";
import InsightsPage from "./pages/InsightsPage";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/reviews", label: "Reviews", icon: MessageSquare },
  { to: "/insights", label: "AI insights", icon: Brain },
  { to: "/settings", label: "Connect", icon: Link2 },
];

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <aside className="relative w-60 border-r border-white/[0.06] flex flex-col p-5 shrink-0">
        <div className="mb-8 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Star size={18} className="text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-[15px] leading-tight">ReviewFlow</h1>
              <p className="text-zinc-500 text-[11px]">Google reviews</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to);
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-indigo-500/15 text-indigo-300 font-medium"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.25 : 2} />
                {n.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="relative flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
