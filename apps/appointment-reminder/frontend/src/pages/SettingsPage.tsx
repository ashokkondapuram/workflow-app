import { useEffect, useState } from "react";
import { getConfig, saveConfig } from "../api";

export default function SettingsPage() {
  const [cfg, setCfg] = useState({ webhook_url:"", reminder_hours_before:24, email_enabled:true, sms_enabled:false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { getConfig().then(setCfg); }, []);
  const set = (k: string, v: any) => setCfg(c => ({ ...c, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await saveConfig(cfg);
    setMsg("Settings saved!"); setTimeout(() => setMsg(""), 3000);
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-xl">
      <h2 className="text-2xl font-bold text-white mb-2">Reminder Settings</h2>
      <p className="text-gray-400 text-sm mb-8">Configure how and when reminders are sent.</p>
      {msg && <div className="mb-4 px-4 py-2 bg-green-900 border border-green-600 rounded-lg text-sm text-green-200">{msg}</div>}
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Slack / Webhook URL</label>
          <input type="url" value={cfg.webhook_url} onChange={e => set("webhook_url",e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
          <p className="text-gray-500 text-xs mt-1">Reminder notifications will be posted here.</p>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Remind how many hours before?</label>
          <input type="number" min={1} max={168} value={cfg.reminder_hours_before}
            onChange={e => set("reminder_hours_before",parseInt(e.target.value))}
            className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
          <p className="text-gray-500 text-xs mt-1">Scheduler checks every 15 minutes automatically.</p>
        </div>
        <div className="space-y-3">
          <label className="block text-sm text-gray-300">Notification Channels</label>
          {[
            { key:"email_enabled", label:"Email reminders" },
            { key:"sms_enabled", label:"SMS reminders (requires Twilio)" },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={(cfg as any)[opt.key]} onChange={e => set(opt.key,e.target.checked)}
                className="w-4 h-4 accent-blue-500" />
              <span className="text-gray-300 text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-white text-sm font-semibold mb-2">How it works</p>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>&#x2022; Backend checks every <strong>15 minutes</strong> for upcoming appointments</li>
            <li>&#x2022; Appointments within your window get a reminder sent to the webhook</li>
            <li>&#x2022; Each appointment is only reminded <strong>once</strong></li>
            <li>&#x2022; Use <strong>Send Reminders Now</strong> on Dashboard to trigger immediately</li>
          </ul>
        </div>
        <button type="submit" disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
