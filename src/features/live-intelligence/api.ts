export type LiveEntity = {
  entity_type: string;
  label: string;
  context: string;
};

export type RaceSummary = {
  id: number;
  summary: string;
  provider: string;
  confidence: number;
  status: string;
  created_at: string;
  url?: string;
  video_id?: string;
};

export type TimelineEvent = {
  id: number;
  source: string;
  event_type: string;
  title: string;
  detail: string;
  car_no?: string | null;
  team?: string | null;
  severity: string;
  created_at: string;
};

export type LiveIntelligenceSnapshot = {
  source: Record<string, unknown> | null;
  summaries: RaceSummary[];
  entities: LiveEntity[];
  timeline: TimelineEvent[];
  mode: string;
  poll_interval_seconds?: number;
};

const API_BASE = "http://127.0.0.1:8000";

export const DEMO_LIVE_INTELLIGENCE: LiveIntelligenceSnapshot = {
  source: {
    url: "https://www.youtube.com/watch?v=project2h4e-demo",
    video_id: "project2h4e-demo",
    status: "demo",
  },
  mode: "demo-fallback",
  poll_interval_seconds: 300,
  summaries: [
    {
      id: 1,
      summary:
        "Pit strategy is active for #7 Toyota, tire degradation is building on #51 Ferrari, #911 Porsche is trending toward a stop within three laps, and #6 Porsche has clean air for a short push window.",
      provider: "demo",
      confidence: 0.72,
      status: "demo",
      created_at: new Date().toISOString(),
    },
  ],
  entities: [
    { entity_type: "car", label: "#7", context: "Pit strategy active" },
    { entity_type: "team", label: "Toyota", context: "Pit strategy active" },
    { entity_type: "car", label: "#51", context: "Tire degradation building" },
    { entity_type: "team", label: "Ferrari", context: "Tire degradation building" },
    { entity_type: "car", label: "#911", context: "Predicted stop within three laps" },
    { entity_type: "team", label: "Porsche", context: "Clean air push window" },
  ],
  timeline: [
    {
      id: 1,
      source: "live-youtube",
      event_type: "strategy",
      title: "Pit cycle intelligence",
      detail: "Car #7 should cover the #6 Porsche undercut while #911 trends toward a stop.",
      car_no: "#7",
      team: "Toyota",
      severity: "warning",
      created_at: new Date().toISOString(),
    },
  ],
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

export async function fetchLiveIntelligence(): Promise<LiveIntelligenceSnapshot> {
  try {
    return await request<LiveIntelligenceSnapshot>("/api/live-source/summaries");
  } catch {
    return DEMO_LIVE_INTELLIGENCE;
  }
}

export async function setYouTubeSource(url: string): Promise<LiveIntelligenceSnapshot> {
  return request<LiveIntelligenceSnapshot>("/api/live-source/youtube", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function summarizeNow(): Promise<LiveIntelligenceSnapshot> {
  return request<LiveIntelligenceSnapshot>("/api/live-source/summarize-now", { method: "POST" });
}
