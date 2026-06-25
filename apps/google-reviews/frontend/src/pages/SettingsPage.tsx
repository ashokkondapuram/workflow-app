import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, Link2, Unlink } from "lucide-react";
import { disconnectOAuth, getConfig, saveConfig } from "../api";
import { ReviewConfig } from "../types";

const defaultConfig: ReviewConfig = {
  google_places_api_key: "",
  place_id: "",
  business_name: "Our Business",
  gbp_account_id: "",
  gbp_location_id: "",
  google_client_id: "",
  google_client_secret: "",
  oauth_redirect_uri: "http://127.0.0.1:8011/api/oauth/callback",
  auto_reply_enabled: true,
  auto_reply_min_rating: 4,
  alert_low_ratings: true,
  alert_email: "",
  smtp_host: "smtp.gmail.com",
  smtp_user: "",
  smtp_pass: "",
  template_5_star:
    "Thank you so much, {author_name}! We're thrilled you had a great experience at {business_name}.",
  template_4_star:
    "Thanks for the kind words, {author_name}! We appreciate your feedback at {business_name}.",
  template_3_star:
    "Thank you for your feedback, {author_name}. We'd love to hear how we can improve at {business_name}.",
  poll_interval_hours: 4,
  gbp_connected: false,
  oauth_connected: false,
};

export default function SettingsPage() {
  const [cfg, setCfg] = useState<ReviewConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    getConfig().then(setCfg);
    const oauth = searchParams.get("oauth");
    if (oauth === "success") setMsg("Google account connected.");
    if (oauth === "error") setMsg("Google connection failed. Try again.");
  }, [searchParams]);

  const set = (key: keyof ReviewConfig, value: string | number | boolean) =>
    setCfg((c) => ({ ...c, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveConfig(cfg);
    setMsg("Settings saved.");
    getConfig().then(setCfg);
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDisconnect = async () => {
    await disconnectOAuth();
    setMsg("Disconnected from Google.");
    getConfig().then(setCfg);
  };

  const inputClass =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500";

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
      <p className="text-gray-400 text-sm mb-8">
        Connect Google, configure auto-replies, and set alert rules.
      </p>

      {msg && (
        <div className="mb-4 px-4 py-2 bg-green-900 border border-green-600 rounded-lg text-sm text-green-200">
          {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-white font-semibold">Google Places (read reviews)</h3>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Places API key</label>
            <input
              type="password"
              value={cfg.google_places_api_key}
              onChange={(e) => set("google_places_api_key", e.target.value)}
              placeholder="AIza..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Place ID</label>
            <input
              type="text"
              value={cfg.place_id}
              onChange={(e) => set("place_id", e.target.value)}
              placeholder="ChIJ..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Business name</label>
            <input
              type="text"
              value={cfg.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              className={inputClass}
            />
            <p className="text-gray-500 text-xs mt-1">Used in reply templates as {"{business_name}"}.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-white font-semibold">Google Business Profile (post replies)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Account ID</label>
              <input
                type="text"
                value={cfg.gbp_account_id}
                onChange={(e) => set("gbp_account_id", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Location ID</label>
              <input
                type="text"
                value={cfg.gbp_location_id}
                onChange={(e) => set("gbp_location_id", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">OAuth client ID</label>
            <input
              type="password"
              value={cfg.google_client_id}
              onChange={(e) => set("google_client_id", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">OAuth client secret</label>
            <input
              type="password"
              value={cfg.google_client_secret}
              onChange={(e) => set("google_client_secret", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">OAuth redirect URI</label>
            <input
              type="url"
              value={cfg.oauth_redirect_uri}
              onChange={(e) => set("oauth_redirect_uri", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium flex items-center gap-2">
                {cfg.oauth_connected ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  <Link2 size={16} className="text-gray-400" />
                )}
                {cfg.oauth_connected ? "Connected to Google" : "Not connected"}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Required to publish replies to Google Business Profile.
              </p>
            </div>
            {cfg.oauth_connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                <Unlink size={14} /> Disconnect
              </button>
            ) : (
              <a
                href="/api/oauth/connect"
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm"
              >
                <Link2 size={14} /> Connect Google
              </a>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-white font-semibold">Auto-reply rules</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cfg.auto_reply_enabled}
              onChange={(e) => set("auto_reply_enabled", e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-gray-300 text-sm">Enable automated replies</span>
          </label>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Auto-reply for ratings at or above</label>
            <select
              value={cfg.auto_reply_min_rating}
              onChange={(e) => set("auto_reply_min_rating", parseInt(e.target.value))}
              className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {[5, 4, 3].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-xs mt-1">
              Lower ratings are flagged for manual review instead of auto-reply.
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Poll interval (hours)</label>
            <input
              type="number"
              min={1}
              max={168}
              value={cfg.poll_interval_hours}
              onChange={(e) => set("poll_interval_hours", parseInt(e.target.value))}
              className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-white font-semibold">Reply templates</h3>
          <p className="text-gray-500 text-xs">
            Use {"{author_name}"}, {"{rating}"}, and {"{business_name}"} as placeholders.
          </p>
          {[
            { key: "template_5_star" as const, label: "5-star template" },
            { key: "template_4_star" as const, label: "4-star template" },
            { key: "template_3_star" as const, label: "3-star template" },
          ].map((t) => (
            <div key={t.key}>
              <label className="block text-sm text-gray-300 mb-1.5">{t.label}</label>
              <textarea
                value={cfg[t.key]}
                onChange={(e) => set(t.key, e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h3 className="text-white font-semibold">Low-rating alerts</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cfg.alert_low_ratings}
              onChange={(e) => set("alert_low_ratings", e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-gray-300 text-sm">Email me when a 1–3 star review arrives</span>
          </label>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Alert email</label>
            <input
              type="email"
              value={cfg.alert_email}
              onChange={(e) => set("alert_email", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">SMTP user</label>
              <input
                type="email"
                value={cfg.smtp_user}
                onChange={(e) => set("smtp_user", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">SMTP password</label>
              <input
                type="password"
                value={cfg.smtp_pass}
                onChange={(e) => set("smtp_pass", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </div>
  );
}
