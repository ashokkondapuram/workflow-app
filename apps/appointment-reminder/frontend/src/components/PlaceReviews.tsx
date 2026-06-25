import { useEffect, useRef, useState } from "react";
import { Star, MapPin, ExternalLink, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    google: typeof google;
  }
}

interface Review {
  rating: number;
  text: string;
  authorName: string;
  authorUri: string;
  relativeTime?: string;
}

interface PlaceInfo {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  reviews: Review[];
}

interface Props {
  placeId: string;
  apiKey: string;
  /** How many reviews to show (default 5) */
  maxReviews?: number;
}

export default function PlaceReviews({ placeId, apiKey, maxReviews = 5 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [placeInfo, setPlaceInfo] = useState<PlaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReview, setSelectedReview] = useState(0);

  useEffect(() => {
    if (!placeId || !apiKey) {
      setError("Place ID and API Key are required.");
      setLoading(false);
      return;
    }
    loadGoogleMaps(apiKey).then(() => initMap(placeId)).catch((e) => {
      setError(String(e));
      setLoading(false);
    });
  }, [placeId, apiKey]);

  async function loadGoogleMaps(key: string): Promise<void> {
    if (window.google?.maps) return;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=weekly`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps API"));
      document.head.appendChild(script);
    });
  }

  async function initMap(id: string) {
    try {
      setLoading(true);
      setError("");

      const [{ InfoWindow }, { AdvancedMarkerElement }, { Place }] = await Promise.all([
        google.maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
        google.maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
        google.maps.importLibrary("places") as Promise<google.maps.PlacesLibrary>,
      ]);

      // Fetch place fields including reviews
      const place = new Place({ id });
      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location", "reviews"],
      });

      // Build reviews list
      const reviews: Review[] = (place.reviews ?? []).slice(0, maxReviews).map((r) => ({
        rating: r.rating ?? 0,
        text: r.text ?? "",
        authorName: r.authorAttribution?.displayName ?? "Anonymous",
        authorUri: r.authorAttribution?.uri ?? "",
        relativeTime: r.relativePublishTimeDescription ?? "",
      }));

      const location = {
        lat: place.location?.lat() ?? 0,
        lng: place.location?.lng() ?? 0,
      };

      setPlaceInfo({
        name: place.displayName ?? "",
        address: place.formattedAddress ?? "",
        location,
        reviews,
      });

      // Init map
      if (mapRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: place.location!,
          zoom: 15,
          mapId: "appointment_place_map",
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
        });

        // Build info window content
        const content = document.createElement("div");
        content.style.cssText = "padding:8px;max-width:260px;font-family:sans-serif";
        content.innerHTML = `
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${place.displayName ?? ""}</div>
          <div style="color:#666;font-size:12px;margin-bottom:6px">${place.formattedAddress ?? ""}</div>
          ${reviews.length > 0
            ? `<div style="font-size:12px;color:#f59e0b;margin-bottom:4px">${"★".repeat(reviews[0].rating)}${"".repeat(5 - reviews[0].rating)} ${reviews[0].rating}/5</div>
               <div style="font-size:12px;color:#444;font-style:italic;margin-bottom:4px">"${reviews[0].text.substring(0, 120)}${reviews[0].text.length > 120 ? "..." : ""}"</div>
               <div style="font-size:11px;color:#888">— ${reviews[0].authorName}</div>`
            : `<div style="font-size:12px;color:#888">No reviews found.</div>`
          }
        `;

        const infoWindow = new InfoWindow({ content, ariaLabel: place.displayName });

        const marker = new AdvancedMarkerElement({
          map,
          position: place.location,
          title: place.displayName,
        });

        marker.addListener("click", () => infoWindow.open({ anchor: marker, map }));
        infoWindow.open({ anchor: marker, map });
      }
    } catch (e) {
      setError(`Failed to load place: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}
        />
      ))}
      <span className="text-gray-400 text-xs ml-1">{rating}/5</span>
    </div>
  );

  if (error) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Map */}
      <div ref={mapRef} className="w-full h-64" style={{ background: "#1a1a2e" }}>
        {loading && (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading map...
          </div>
        )}
      </div>

      {placeInfo && (
        <div className="p-5">
          {/* Place header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-base">{placeInfo.name}</h3>
              <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
                <MapPin size={13} />
                <span>{placeInfo.address}</span>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${placeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
              title="Open in Google Maps"
            >
              <ExternalLink size={16} />
            </a>
          </div>

          {/* Reviews */}
          {placeInfo.reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No reviews available for this place.</p>
          ) : (
            <>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                {placeInfo.reviews.length} Review{placeInfo.reviews.length !== 1 ? "s" : ""}
              </p>

              {/* Review tabs */}
              {placeInfo.reviews.length > 1 && (
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {placeInfo.reviews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedReview(i)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        selectedReview === i
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      #{i + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Active review card */}
              {(() => {
                const r = placeInfo.reviews[selectedReview];
                return (
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      {renderStars(r.rating)}
                      {r.relativeTime && (
                        <span className="text-gray-500 text-xs">{r.relativeTime}</span>
                      )}
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed italic mb-3">
                      "{r.text || "No written review."}"  
                    </p>
                    <div className="flex items-center gap-2">
                      {r.authorUri ? (
                        <a
                          href={r.authorUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1"
                        >
                          {r.authorName} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">{r.authorName}</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
