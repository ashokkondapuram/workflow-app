import PlaceReviewsDemo from "../components/PlaceReviewsDemo";

export default function PlaceReviewsPage() {
  // Read API key from env if provided (VITE_GOOGLE_MAPS_API_KEY)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string ?? "";
  return <PlaceReviewsDemo defaultApiKey={apiKey} />;
}
