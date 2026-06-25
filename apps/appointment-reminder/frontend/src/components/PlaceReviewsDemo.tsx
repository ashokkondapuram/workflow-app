import { useState } from "react";
import PlaceReviews from "./PlaceReviews";
import { Search, Info } from "lucide-react";

// Well-known place IDs for demo purposes
const DEMO_PLACES = [
  { label: "Faneuil Hall, Boston", id: "ChIJpyiwa4Zw44kRBQSGWKv4wgA" },
  { label: "Eiffel Tower, Paris", id: "ChIJLU7jZClu5kcR4PcOOO6p3I0" },
  { label: "Central Park, NYC", id: "ChIJ4zGFAZpYwokRGUGph3Mf37k" },
  { label: "Sydney Opera House", id: "ChIJ3S-JXmauEmsRUcIaWtf4MzE" },
];

interface Props {
  defaultApiKey?: string;
}

export default function PlaceReviewsDemo({ defaultApiKey = "" }: Props) {
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [placeId, setPlaceId] = useState(DEMO_PLACES[0].id);
  const [inputPlaceId, setInputPlaceId] = useState(DEMO_PLACES[0].id);
  const [inputKey, setInputKey] = useState(defaultApiKey);
  const [submitted, setSubmitted] = useState(false);

  const handleLoad = () => {
    setPlaceId(inputPlaceId);
    setApiKey(inputKey);
    setSubmitted(true);
  };

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-2">Place Reviews</h2>
      <p className="text-gray-400 text-sm mb-6">
        Powered by Google Maps JavaScript API &mdash; Places library.
      </p>

      {/* Config panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Google Maps API Key</label>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="AIza..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600 font-mono"
          />
          <p className="text-gray-500 text-xs mt-1">
            Requires Maps JavaScript API + Places API enabled in Google Cloud Console.
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Quick Demo Places</label>
          <div className="flex flex-wrap gap-2">
            {DEMO_PLACES.map((p) => (
              <button
                key={p.id}
                onClick={() => { setInputPlaceId(p.id); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  inputPlaceId === p.id
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Place ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputPlaceId}
              onChange={(e) => setInputPlaceId(e.target.value)}
              placeholder="ChIJ..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600 font-mono"
            />
            <button
              onClick={handleLoad}
              disabled={!inputKey || !inputPlaceId}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
            >
              <Search size={14} /> Load
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Find a Place ID at{" "}
            <a href="https://developers.google.com/maps/documentation/javascript/place-id" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              developers.google.com/maps/documentation/javascript/place-id
            </a>
          </p>
        </div>

        {!submitted && (
          <div className="flex items-start gap-2 bg-blue-950 border border-blue-800 rounded-lg px-3 py-2">
            <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
            <p className="text-blue-300 text-xs">
              Enter your Google Maps API key and click <strong>Load</strong> to see live reviews and the map.
            </p>
          </div>
        )}
      </div>

      {/* Reviews widget */}
      {submitted && apiKey && placeId && (
        <PlaceReviews key={`${placeId}-${apiKey}`} placeId={placeId} apiKey={apiKey} maxReviews={5} />
      )}
    </div>
  );
}
