import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { getAppointments, deleteAppointment, updateStatus } from "../api";
import type { Appointment } from "../types";

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-blue-900 text-blue-300",
  completed: "bg-green-900 text-green-300",
  cancelled: "bg-red-900 text-red-300",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered =
    filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    await deleteAppointment(id);
    load();
  };

  const handleStatus = async (id: string, status: string) => {
    await updateStatus(id, status);
    load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Appointments</h2>
        <Link to="/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          + New Appointment
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {["all", "scheduled", "completed", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              filter === f ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                {["Title", "Client", "Date & Time", "Duration", "Status", "Reminded", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500 text-sm">
                    No appointments found.
                    {filter !== "all" && (
                      <button onClick={() => setFilter("all")} className="ml-2 text-blue-400 hover:underline">
                        Show all
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm">{a.title}</p>
                      {a.notes && <p className="text-gray-500 text-xs truncate max-w-[140px]">{a.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{a.client_name}</p>
                      <p className="text-gray-400 text-xs">{a.client_email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                      {a.date} at {a.time}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{a.duration_minutes}m</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[a.status] ?? "bg-gray-800 text-gray-300"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        a.reminder_sent ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400"
                      }`}>
                        {a.reminder_sent ? "✓ Sent" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/edit/${a.id}`} className="text-gray-400 hover:text-blue-400 transition-colors">
                          <Pencil size={14} />
                        </Link>
                        {a.status === "scheduled" && (
                          <>
                            <button
                              onClick={() => handleStatus(a.id, "completed")}
                              title="Mark completed"
                              className="text-gray-400 hover:text-green-400 transition-colors"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleStatus(a.id, "cancelled")}
                              title="Cancel"
                              className="text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(a.id)}
                          title="Delete"
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
