import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Link2,
  Sparkles,
  Unlink,
  Zap,
  Brain,
} from "lucide-react";
import { disconnectOAuth, getConfig, saveConfig, syncReviews } from "../api";
import { ReviewConfig } from "../types";
import { PageHeader, Toast } from "../components/PageHeader";

const defaultConfig: ReviewConfig = {
  google_places_api_key: "",
  place_id: "",
  business_name: "",
  gbp_account_id: "",
  gbp_location_id: "",
  google_client_id: "",
  google_client_secret: "",
  oauth_redirect_uri: "http://127.0.0.1:8011/api/oauth/callback",
  auto_reply_enabled: true,
  auto_reply_min_rating: 4,
  alert_low_ratings: false,
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
  places_connected: false,
  can_publish_replies: false,
  ai_connected: false,
  openai_api_key: "",
  ai_enabled: true,
  ai_model: "gpt-4o-mini",
  ai_tone: "friendly",
  ai_auto_analyze: true,
  ai_auto_reply: false,
};

export default function SettingsPage() {
  const [cfg, setCfg] = useState<ReviewConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    getConfig().then(setCfg);
    const oauth = searchParams.get("oauth");
    if (oauth === "success") {
      setMsgType("success");
      setMsg("Google account connected. You can now publish replies.");
    }
    if (oauth === "error") {
      setMsgType("error");
      setMsg("Connection failed. Try again.");
    }
  }, [searchParams]);

  const set = (key: keyof ReviewConfig, value: string | number | boolean) =>
    setCfg((c) => ({ ...c, [key]: value }));

  const handleSaveAndSync = async () => {
    setSaving(true);
    try {
      await saveConfig(cfg);
      setMsgType("success");
      setMsg("Saved. Syncing reviews…");
      setSyncing(true);
      await syncReviews();
      setMsg("Connected and synced. Check Overview for your reviews.");
      getConfig().then(setCfg);
    } catch {
      setMsgType("error");
      setMsg("Save failed. Check your API key and Place ID.");
    }
    setSaving(false);
    setSyncing(false);
    setTimeout(() => setMsg(""), 5000);
  };

  const handleSaveAutoReply = async () => {
    setSaving(true);
    await saveConfig(cfg);
    setMsgType("success");
    setMsg("Auto-reply settings saved.");
    getConfig().then(setCfg);
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDisconnect = async () => {
    await disconnectOAuth();
    setMsgType("success");
    setMsg("Disconnected from Google.");
    getConfig().then(setCfg);
  };

  return (
    <>
      <PageHeader
        title="Connect"
        subtitle="Two steps to get started — import reviews, then optionally publish replies."
      />

      {msg && <Toast message={msg} type={msgType} />}

      <div className="space-y-5">
        {/* Step 1 — Import reviews */}
        <section className="card p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
              <span className="text-indigo-400 font-semibold text-sm">1</span>
            </div>
            <div>
              <h2 className="text-white font-medium flex items-center gap-2">
                Import reviews
                {cfg.places_connected && <CheckCircle2 size={16} className="text-emerald-400" />}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Pull reviews from Google with your API key and Place ID.
              </p>
            </div>
          </div>

          <div className="space-y-4 ml-14">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Business name</label>
              <input
                type="text"
                value={cfg.business_name}
                onChange={(e) => set("business_name", e.target.value)}
                placeholder="e.g. Joe's Coffee Shop"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Google Places API key</label>
              <input
                type="password"
                value={cfg.google_places_api_key}
                onChange={(e) => set("google_places_api_key", e.target.value)}
                placeholder="Paste your API key"
                className="input"
              />
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 text-xs mt-2 hover:text-indigo-300"
              >
                Get an API key <ExternalLink size={11} />
              </a>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Place ID</label>
              <input
                type="text"
                value={cfg.place_id}
                onChange={(e) => set("place_id", e.target.value)}
                placeholder="ChIJ…"
                className="input"
              />
              <a
                href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 text-xs mt-2 hover:text-indigo-300"
              >
                Find your Place ID <ExternalLink size={11} />
              </a>
            </div>

            <button
              onClick={handleSaveAndSync}
              disabled={saving || syncing}
              className="btn-primary w-full sm:w-auto"
            >
              <Sparkles size={16} />
              {saving || syncing ? "Connecting…" : "Save and sync reviews"}
            </button>
          </div>
        </section>

        {/* Step 2 — Publish replies */}
        <section className="card p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
              <span className="text-violet-400 font-semibold text-sm">2</span>
            </div>
            <div>
              <h2 className="text-white font-medium flex items-center gap-2">
                Publish replies
                {cfg.oauth_connected && <CheckCircle2 size={16} className="text-emerald-400" />}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Optional — connect Google to post replies live. Without this, replies are saved locally.
              </p>
            </div>
          </div>

          <div className="ml-14">
            {cfg.oauth_connected ? (
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Google connected</p>
                    <p className="text-zinc-500 text-xs">Replies will publish to your Business Profile</p>
                  </div>
                </div>
                <button onClick={handleDisconnect} className="btn-secondary py-2 text-xs">
                  <Unlink size={14} /> Disconnect
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <a href="/api/oauth/connect" className="btn-primary w-full sm:w-auto">
                  <Link2 size={16} /> Connect with Google
                </a>
                <p className="text-zinc-600 text-xs">
                  Requires Google Business Profile API enabled in Cloud Console.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mt-4 flex items-center gap-1.5 text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
            >
              <ChevronDown size={14} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              Advanced OAuth settings
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Account ID</label>
                    <input
                      type="text"
                      value={cfg.gbp_account_id}
                      onChange={(e) => set("gbp_account_id", e.target.value)}
                      className="input text-xs py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Location ID</label>
                    <input
                      type="text"
                      value={cfg.gbp_location_id}
                      onChange={(e) => set("gbp_location_id", e.target.value)}
                      className="input text-xs py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">OAuth client ID</label>
                  <input
                    type="password"
                    value={cfg.google_client_id}
                    onChange={(e) => set("google_client_id", e.target.value)}
                    className="input text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">OAuth client secret</label>
                  <input
                    type="password"
                    value={cfg.google_client_secret}
                    onChange={(e) => set("google_client_secret", e.target.value)}
                    className="input text-xs py-2"
                  />
                </div>
                <button
                  onClick={async () => {
                    await saveConfig(cfg);
                    setMsgType("success");
                    setMsg("Advanced settings saved.");
                    getConfig().then(setCfg);
                  }}
                  className="btn-secondary py-2 text-xs"
                >
                  Save advanced settings
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Step 3 — AI (ChatGPT) */}
        <section className="card p-6 border-violet-500/20">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
              <Brain size={18} className="text-violet-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-medium flex items-center gap-2">
                AI with ChatGPT
                {cfg.ai_connected && <CheckCircle2 size={16} className="text-emerald-400" />}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Analyze sentiment, spot themes, and write personalized replies.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={cfg.ai_enabled}
                onChange={(e) => set("ai_enabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:bg-violet-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>

          <div className="space-y-4 ml-14">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">OpenAI API key</label>
              <input
                type="password"
                value={cfg.openai_api_key}
                onChange={(e) => set("openai_api_key", e.target.value)}
                placeholder="sk-…"
                className="input"
              />
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-violet-400 text-xs mt-2 hover:text-violet-300"
              >
                Get an API key <ExternalLink size={11} />
              </a>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Model</label>
                <select
                  value={cfg.ai_model}
                  onChange={(e) => set("ai_model", e.target.value)}
                  className="input py-2"
                >
                  <option value="gpt-4o-mini">GPT-4o mini (fast, cheap)</option>
                  <option value="gpt-4o">GPT-4o (best quality)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Reply tone</label>
                <select
                  value={cfg.ai_tone}
                  onChange={(e) => set("ai_tone", e.target.value)}
                  className="input py-2"
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="warm">Warm</option>
                  <option value="empathetic">Empathetic</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.ai_auto_analyze}
                  onChange={(e) => set("ai_auto_analyze", e.target.checked)}
                  className="w-4 h-4 accent-violet-500 rounded"
                />
                <span className="text-zinc-300 text-sm">Auto-analyze new reviews on sync</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.ai_auto_reply}
                  onChange={(e) => set("ai_auto_reply", e.target.checked)}
                  className="w-4 h-4 accent-violet-500 rounded"
                />
                <span className="text-zinc-300 text-sm">Use AI for auto-replies (instead of templates)</span>
              </label>
            </div>

            <button
              onClick={async () => {
                setSaving(true);
                await saveConfig(cfg);
                setMsgType("success");
                setMsg("AI settings saved.");
                getConfig().then(setCfg);
                setSaving(false);
              }}
              disabled={saving}
              className="btn-primary bg-violet-600 hover:bg-violet-500"
            >
              <Brain size={16} /> Save AI settings
            </button>
          </div>
        </section>

        {/* Auto-reply — simple toggle */}
        <section className="card p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-medium">Auto-reply</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Automatically thank customers for positive reviews.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={cfg.auto_reply_enabled}
                onChange={(e) => set("auto_reply_enabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:bg-indigo-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>

          {cfg.auto_reply_enabled && (
            <div className="ml-14 flex items-center gap-4">
              <label className="text-sm text-zinc-400">Reply to reviews</label>
              <select
                value={cfg.auto_reply_min_rating}
                onChange={(e) => set("auto_reply_min_rating", parseInt(e.target.value))}
                className="input w-auto py-2 text-sm"
              >
                <option value={5}>5 stars only</option>
                <option value={4}>4 stars and above</option>
                <option value={3}>3 stars and above</option>
              </select>
              <span className="text-zinc-600 text-xs">Lower ratings need manual reply</span>
            </div>
          )}

          <div className="ml-14 mt-5">
            <button onClick={handleSaveAutoReply} disabled={saving} className="btn-secondary py-2 text-xs">
              Save auto-reply
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
