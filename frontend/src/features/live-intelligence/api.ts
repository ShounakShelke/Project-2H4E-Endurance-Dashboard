export type LiveEntity = {
  entity_type: string;
  label: string;
  context: string;
};

import { projectApiBase } from "@/lib/apiBase";

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
  sources?: Array<Record<string, unknown>>;
  summaries: RaceSummary[];
  entities: LiveEntity[];
  timeline: TimelineEvent[];
  mode: string;
  poll_interval_seconds?: number;
};

const API_BASE = projectApiBase();

export const EMPTY_LIVE_INTELLIGENCE: LiveIntelligenceSnapshot = {
  source: null,
  sources: [],
  mode: "blank",
  poll_interval_seconds: 300,
  summaries: [],
  entities: [],
  timeline: [],
};

export const DEMO_LIVE_INTELLIGENCE: LiveIntelligenceSnapshot = {
  source: {
    url: "https://www.youtube.com/watch?v=project2h4e-demo",
    video_id: "project2h4e-demo",
    status: "demo",
  },
  sources: [
    {
      url: "https://www.youtube.com/watch?v=project2h4e-demo",
      source_type: "youtube",
      status: "demo",
      title: "Project 2H4E sample commentary",
    },
  ],
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
    return await request<LiveIntelligenceSnapshot>("/api/commentary/summaries");
  } catch {
    return EMPTY_LIVE_INTELLIGENCE;
  }
}

export async function setYouTubeSource(url: string): Promise<LiveIntelligenceSnapshot> {
  return request<LiveIntelligenceSnapshot>("/api/live-source/youtube", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function setCommentarySources(urls: string[]): Promise<LiveIntelligenceSnapshot> {
  return request<LiveIntelligenceSnapshot>("/api/commentary/sources", {
    method: "POST",
    body: JSON.stringify({ urls }),
  });
}

export async function summarizeNow(): Promise<LiveIntelligenceSnapshot> {
  return request<LiveIntelligenceSnapshot>("/api/commentary/summarize-now", { method: "POST" });
}

export async function clearCommentarySources(): Promise<LiveIntelligenceSnapshot> {
  return request<LiveIntelligenceSnapshot>("/api/commentary/clear", { method: "POST" });
}

export function makeClientCommentarySnapshot(urls: string[]): LiveIntelligenceSnapshot {
  const now = new Date().toISOString();
  const cleanUrls = urls.map((url) => url.trim()).filter(Boolean);
  const primaryUrl = cleanUrls[0] || "submitted commentary source";
  const summary = `Broadcast Context: ${primaryUrl} is connected as a race commentary source. Likely Race Focus: use this source for race context while live timing confirms leaders, gaps, pit calls, and incidents. Mentioned Cars: not exposed by browser metadata. Strategy Relevance: backend extraction is unavailable in this session, so configure the backend or Groq key for richer caption and event extraction. Confidence: medium.`;
  return {
    source: cleanUrls.length
      ? {
          url: primaryUrl,
          source_type:
            primaryUrl.includes("youtube") || primaryUrl.includes("youtu.be")
              ? "youtube"
              : "web-commentary",
          status: "active",
          title: "Browser commentary source",
        }
      : null,
    sources: cleanUrls.map((url) => ({
      url,
      source_type:
        url.includes("youtube") || url.includes("youtu.be") ? "youtube" : "web-commentary",
      status: "active",
      title: "Browser commentary source",
    })),
    mode: "live",
    poll_interval_seconds: 300,
    summaries: [
      {
        id: Date.now(),
        summary,
        provider: "browser-source",
        confidence: 0.62,
        status: "source-connected",
        created_at: now,
        url: primaryUrl,
      },
    ],
    entities: [{ entity_type: "topic", label: "Commentary Source", context: summary }],
    timeline: [
      {
        id: Date.now(),
        source: "race-commentary",
        event_type: "source",
        title: "Broadcast context connected",
        detail:
          "Commentary source is connected; use live timing for confirmed gaps, pit calls, and incidents until captions are available.",
        severity: "info",
        created_at: now,
      },
    ],
  };
}
