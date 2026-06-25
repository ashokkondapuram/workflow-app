import { Routes, Route, NavLink } from "react-router-dom";
import { Calendar, Settings, Bell, LayoutDashboard } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import AppointmentsPage from "./pages/AppointmentsPage";
import NewAppointment from "./pages/NewAppointment";
import SettingsPage from "./pages/SettingsPage";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export default function App() {
  const nav: NavItem[] = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/appointments", label: "Appointments", icon: <Calendar size={18} /> },
    { to: "/new", label: "+ New", icon: <Bell size={18} /> },
    { to: "/settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col p-4 gap-1 shrink-0">
        <div className="mb-6 px-2">
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <Bell size={20} className="text-blue-400" /> ApptRemind
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Appointment Automation</p>
        </div>
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            {n.icon}
            {n.label}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/new" element={<NewAppointment />} />
          <Route path="/edit/:id" element={<NewAppointment />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
