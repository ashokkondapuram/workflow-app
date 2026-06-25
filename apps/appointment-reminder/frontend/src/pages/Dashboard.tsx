import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Clock, Bell } from "lucide-react";
import { getAppointments, triggerReminders } from "../api";
import { Appointment } from "../types";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { getAppointments().then(setAppointments); }, []);

  const scheduled = appointments.filter(a => a.status === "scheduled");
  const today = appointments.filter(a => { try { return isToday(parseISO(a.date)) && a.status === "scheduled"; } catch { return false; } });
  const tomorrow = appointments.filter(a => { try { return isTomorrow(parseISO(a.date)) && a.status === "scheduled"; } catch { return false; } });
  const reminded = appointments.filter(a => a.reminder_sent);
  const upcoming = scheduled.slice(0, 6);

  const handleTrigger = async () => {
    setTriggering(true);
    await triggerReminders();
    setMsg("Reminder check triggered!");
    setTimeout(() => setMsg(""), 3000);
    setTriggering(false);
  };

  const stats = [
    { label: "Total Scheduled", value: scheduled.length, icon: <Calendar size={20} />, color: "text-blue-400" },
    { label: "Today", value: today.length, icon: <Clock size={20} />, color: "text-yellow-400" },
    { label: "Tomorrow", value: tomorrow.length, icon: <Bell size={20} />, color: "text-purple-400" },
    { label: "Reminders Sent", value: reminded.length, icon: <CheckCircle size={20} />, color: "text-green-400" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <button onClick={handleTrigger} disabled={triggering}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <Bell size={16} /> {triggering ? "Checking..." : "Send Reminders Now"}
        </button>
      </div>
      {msg && <div className="mb-4 px-4 py-2 bg-green-900 border border-green-600 rounded-lg text-sm text-green-200">{msg}</div>}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-gray-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold">Upcoming Appointments</h3>
        </div>
        {upcoming.length === 0 ? (
          <div className="px-6 py-8 text-gray-500 text-sm text-center">No upcoming appointments. <a href="/new" className="text-blue-400 hover:underline">Create one</a></div>
        ) : upcoming.map(a => (
          <div key={a.id} className="px-6 py-4 border-b border-gray-800 last:border-0 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{a.title}</p>
              <p className="text-gray-400 text-sm">{a.client_name} &middot; {a.client_email}</p>
            </div>
            <div className="text-right">
              <p className="text-white text-sm">{a.date} at {a.time}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ a.reminder_sent ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400" }`}>
                {a.reminder_sent ? "\u2713 Reminded" : "Pending"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
