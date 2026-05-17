import { projectApiBase } from "@/lib/apiBase";

export type LiveTimingSector = {
  sector: number;
  speed?: number | string | null;
  time?: string | number | null;
  speed_status?: string | null;
  time_status?: string | null;
};

export type LiveTimingRow = {
  position?: number | string | null;
  position_change?: number | string | null;
  car_no: string;
  state?: string;
  class_name?: string;
  rank?: number | string | null;
  dynamic_rank?: number | string | null;
  class_rank?: number | string | null;
  driver?: string;
  team?: string;
  laps?: number | string;
  gap?: string;
  last_lap?: string;
  last_lap_status?: string;
  fastest_lap?: string;
  fastest_lap_status?: string;
  pit_count?: number | string;
  vehicle?: string;
  sectors?: LiveTimingSector[];
  lap_data_url?: string | null;
};

export type LiveTimingSnapshot = {
  source: string | null;
  event_id: string | null;
  status: "blank" | "live" | "error" | string;
  message: string;
  session?: string | null;
  track?: string | null;
  event_name?: string | null;
  cup?: string | null;
  heat?: string | null;
  heat_type?: string | null;
  time_of_day?: string | number | null;
  track_state?: Record<string, unknown> | null;
  standings: LiveTimingRow[];
  received_at?: string | null;
};

const API_BASE = projectApiBase();

export const EMPTY_LIVE_TIMING: LiveTimingSnapshot = {
  source: null,
  event_id: null,
  status: "blank",
  message: "Waiting for live timing source.",
  standings: [],
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

export async function setLiveTimingSource(url: string): Promise<LiveTimingSnapshot> {
  return request<LiveTimingSnapshot>("/api/live-timing/source", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function getLiveTimingStatus(): Promise<LiveTimingSnapshot> {
  return request<LiveTimingSnapshot>("/api/live-timing/status");
}

export async function clearLiveTimingSource(): Promise<LiveTimingSnapshot> {
  return request<LiveTimingSnapshot>("/api/live-timing/clear", { method: "POST" });
}
