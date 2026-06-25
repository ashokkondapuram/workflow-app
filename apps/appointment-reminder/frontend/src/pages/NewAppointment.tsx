import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createAppointment, updateAppointment, getAppointments } from "../api";

const EMPTY = { title:"", client_name:"", client_email:"", client_phone:"", date:"", time:"", duration_minutes:60, notes:"" };

export default function NewAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      getAppointments().then(list => {
        const a = list.find(x => x.id === id);
        if (a) setForm({ title:a.title, client_name:a.client_name, client_email:a.client_email,
          client_phone:a.client_phone||"", date:a.date, time:a.time,
          duration_minutes:a.duration_minutes, notes:a.notes||"" });
      });
    }
  }, [id]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.title || !form.client_name || !form.client_email || !form.date || !form.time) {
      setError("Please fill in all required fields."); return;
    }
    setSaving(true);
    try {
      if (id) await updateAppointment(id, form);
      else await createAppointment(form);
      navigate("/appointments");
    } catch { setError("Failed to save. Please try again."); }
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">{id ? "Edit" : "New"} Appointment</h2>
      {error && <div className="mb-4 px-4 py-2 bg-red-900 border border-red-600 rounded-lg text-sm text-red-200">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          { label:"Title *", key:"title", type:"text", ph:"e.g. Dental Checkup" },
          { label:"Client Name *", key:"client_name", type:"text", ph:"Full name" },
          { label:"Client Email *", key:"client_email", type:"email", ph:"client@email.com" },
          { label:"Client Phone", key:"client_phone", type:"tel", ph:"+1 555 000 0000" },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-sm text-gray-300 mb-1.5">{f.label}</label>
            <input type={f.type} placeholder={f.ph} value={(form as any)[f.key]}
              onChange={e => set(f.key, e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
        ))}
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-sm text-gray-300 mb-1.5">Date *</label>
            <input type="date" value={form.date} onChange={e => set("date",e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm text-gray-300 mb-1.5">Time *</label>
            <input type="time" value={form.time} onChange={e => set("time",e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm text-gray-300 mb-1.5">Duration (min)</label>
            <input type="number" min={15} step={15} value={form.duration_minutes}
              onChange={e => set("duration_minutes",parseInt(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
        </div>
        <div><label className="block text-sm text-gray-300 mb-1.5">Notes</label>
          <textarea rows={3} value={form.notes} onChange={e => set("notes",e.target.value)}
            placeholder="Any additional information..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" /></div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
            {saving ? "Saving..." : id ? "Update Appointment" : "Create Appointment"}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
