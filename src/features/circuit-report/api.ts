export type CircuitReport = {
  id?: number;
  location: string;
  race_context?: string;
  overview: string;
  overtaking_zones: string;
  tire_fuel_notes: string;
  risk_areas: string;
  recommendations: string;
  source_title?: string;
  source_url?: string;
  image_url?: string;
  data_source?: string;
  source_status?: string;
  created_at?: string;
};

const API_BASE = "http://127.0.0.1:8000";

export const DEMO_CIRCUIT_REPORT: CircuitReport = {
  location: "Barber Motorsports Park",
  race_context: "sample endurance race",
  overview:
    "A compact technical venue where rhythm, braking discipline, and traffic timing matter more than raw top speed.",
  overtaking_zones:
    "Best moves are made after long commitment corners into heavy braking, with secondary chances when traffic compresses the field.",
  tire_fuel_notes:
    "Rear tire preservation is central. Fuel save works best through early lift before the major braking references.",
  risk_areas:
    "Cold tires, pit exit merge, and multi-class closing speed create the most expensive errors.",
  recommendations:
    "Prioritize clean air before the stop, avoid GT traffic before undercut laps, and push only when the next two sectors are clear.",
  source_title: "Circuit de la Sarthe",
  source_url: "https://en.wikipedia.org/wiki/Circuit_de_la_Sarthe",
  image_url:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Circuit_de_la_Sarthe_track_map.svg/640px-Circuit_de_la_Sarthe_track_map.svg.png",
  data_source: "Wikipedia / Wikimedia",
  source_status: "sample",
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

export async function fetchCircuitReport(): Promise<CircuitReport> {
  try {
    return await request<CircuitReport>("/api/circuits/report/latest");
  } catch {
    return DEMO_CIRCUIT_REPORT;
  }
}

export async function createCircuitReport(
  location: string,
  raceContext?: string,
): Promise<CircuitReport> {
  return request<CircuitReport>("/api/circuits/report", {
    method: "POST",
    body: JSON.stringify({ location, raceContext }),
  });
}
