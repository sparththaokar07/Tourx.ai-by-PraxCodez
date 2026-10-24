export interface PlaceSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchIndianCities(query: string): Promise<PlaceSuggestion[]> {
  if (!query || query.length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&countrycodes=in&limit=5&addressdetails=1`;
  
  const res = await fetch(url, { headers: { "User-Agent": "Tourx-AI-Planner" } });
  if (!res.ok) return [];
  return res.json();
}

export async function getLiveRoadDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<{ distanceKm: number; durationHours: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === "Ok" && data.routes?.length > 0) {
      const distanceKm = Math.round(data.routes[0].distance / 1000);
      const durationHours = +(data.routes[0].duration / 3600).toFixed(1);
      return { distanceKm, durationHours };
    }
  } catch (err) {
    console.error("OSRM Routing error, falling back to Haversine:", err);
  }
  return null;
}
