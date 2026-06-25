import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, CheckCircle, Clock, Bell } from "lucide-react";
import { getAppointments, triggerReminders } from "../api";
import type { Appointment } from "../types";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .catch(() => setError("Failed to load appointments. Is the backend running?"));
  }, []);

  const scheduled = appointments.filter((a) => a.status === "scheduled");
  const todayAppts = appointments.filter((a) => {
    try { return isToday(parseISO(a.date)) && a.status === "scheduled"; }
    catch { return false; }
  });
  const tomorrowAppts = appointments.filter((a) => {
    try { return isTomorrow(parseISO(a.date)) && a.status === "scheduled"; }
    catch { return false; }
  });
  const reminded = appointments.filter((a) => a.reminder_sent);
  const upcoming = scheduled.slice(0, 6);

  const handleTrigger = async () => {
    setTriggering(true);
    setMsg("");
    try {
      await triggerReminders();
      setMsg("✓ Reminder check triggered successfully!");
    } catch {
      setMsg("Failed to trigger — is the backend running?");
    }
    setTimeout(() => setMsg(""), 4000);
    setTriggering(false);
  };

  const stats = [
    { label: "Total Scheduled", value: scheduled.length, icon: <Calendar size={20} />, color: "text-blue-400", bg: "bg-blue-950" },
    { label: "Today", value: todayAppts.length, icon: <Clock size={20} />, color: "text-yellow-400", bg: "bg-yellow-950" },
    { label: "Tomorrow", value: tomorrowAppts.length, icon: <Bell size={20} />, color: "text-purple-400", bg: "bg-purple-950" },
    { label: "Reminders Sent", value: reminded.length, icon: <CheckCircle size={20} />, color: "text-green-400", bg: "bg-green-950" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Bell size={16} />
          {triggering ? "Checking..." : "Send Reminders Now"}
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-950 border border-red-700 rounded-lg text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}
      {msg && (
        <div className="mb-4 px-4 py-2 bg-green-950 border border-green-700 rounded-lg text-sm text-green-300">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} border border-gray-800 rounded-xl p-5`}>
            <div className={`${s.color} mb-3`}>{s.icon}</div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-gray-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-semibold">Upcoming Appointments</h3>
          <Link to="/appointments" className="text-blue-400 hover:text-blue-300 text-sm">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-gray-500 text-sm">No upcoming appointments.</p>
            <Link to="/new" className="mt-2 inline-block text-blue-400 hover:underline text-sm">+ Create one</Link>
          </div>
        ) : (
          upcoming.map((a) => (
            <div key={a.id} className="px-6 py-4 border-b border-gray-800 last:border-0 flex items-center justify-between hover:bg-gray-800/40 transition-colors">
              <div>
                <p className="text-white font-medium">{a.title}</p>
                <p className="text-gray-400 text-sm">{a.client_name} · {a.client_email}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-white text-sm">{a.date} at {a.time}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  a.reminder_sent ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400"
                }`}>
                  {a.reminder_sent ? "✓ Reminded" : "Pending"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
