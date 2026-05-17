import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Download,
  ExternalLink,
  Flag,
  Fuel,
  Link2,
  Radio,
  Thermometer,
  Timer,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CircuitReportPanel } from "@/features/circuit-report/CircuitReportPanel";
import {
  IntelligenceTimeline,
  LiveIntelligencePanel,
} from "@/features/live-intelligence/LiveIntelligencePanel";
import {
  AI_ALERTS,
  SEED_EVENTS,
  TIRE_DEG,
  useCars,
  useLiveSeries,
  useTick,
} from "@/features/race-data/raceData";
import {
  DEMO_LIVE_INTELLIGENCE,
  EMPTY_LIVE_INTELLIGENCE,
  type LiveIntelligenceSnapshot,
} from "@/features/live-intelligence/api";
import {
  clearLiveTimingSource,
  EMPTY_LIVE_TIMING,
  getLiveTimingStatus,
  setLiveTimingSource,
  type LiveTimingRow,
  type LiveTimingSnapshot,
} from "@/features/race-data/liveTimingApi";
import { DEMO_CIRCUIT_REPORT, type CircuitReport } from "@/features/circuit-report/api";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  contentStyle: {
    background: "oklch(0.12 0 0)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--foreground)",
    fontSize: 11,
  },
  labelStyle: { color: "var(--foreground)" },
};

const SAMPLE_TELEMETRY_URL = "wss://sample.project2h4e.local/telemetry/live";

function circuitTimeZone(location?: string | null) {
  const normalized = (location || "").toLowerCase();
  if (normalized.includes("n\u00fcrburgring") || normalized.includes("nurburgring")) {
    return "Europe/Berlin";
  }
  if (normalized.includes("spa")) return "Europe/Brussels";
  if (normalized.includes("lemans") || normalized.includes("sarthe")) return "Europe/Paris";
  if (normalized.includes("daytona") || normalized.includes("sebring")) return "America/New_York";
  if (normalized.includes("fuji")) return "Asia/Tokyo";
  return "UTC";
}

function formatClock(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

function formatTimingClock(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  const seconds = numeric > 86400 ? Math.floor(numeric / 1000) % 86400 : Math.floor(numeric);
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function StatusChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "red" | "green" | "yellow";
}) {
  return (
    <div className="status-chip">
      <span>{label}</span>
      <strong
        className={cn(
          tone === "red" && "text-red-racing",
          tone === "green" && "text-green-sector",
          tone === "yellow" && "text-yellow-sector",
        )}
      >
        {value}
      </strong>
    </div>
  );
}

function HeaderBar({ circuitReport }: { circuitReport: CircuitReport | null }) {
  useTick(1000);
  const now = new Date();
  const trackTimeZone = circuitReport ? circuitTimeZone(circuitReport.location) : null;

  return (
    <header className="ops-topbar">
      <div>
        <h1>Project 2H4E</h1>
        <div className="ops-label mt-1">
          Shounak Shelke | Live race intelligence and telemetry operations
        </div>
      </div>
      <div className="topbar-actions">
        <div className="topbar-credit">Created with ❤️ By Shounak Shelke</div>
        <div className="topbar-time-group">
          <span className="readonly-time-chip" aria-disabled="true">
            <span>Your Time</span>
            <strong>{formatClock(now)}</strong>
          </span>
          {circuitReport && trackTimeZone && (
            <span className="readonly-time-chip" aria-disabled="true">
              <span>Track Time</span>
              <strong>{`${formatClock(now, trackTimeZone)} ${trackTimeZone.replace("Europe/", "")}`}</strong>
            </span>
          )}
        </div>
        <button className="ops-button print-hide" onClick={() => window.print()}>
          <Download className="h-4 w-4" />
          Print PDF
        </button>
      </div>
    </header>
  );
}

function TelemetrySourceBar({
  telemetryUrl,
  onApplyTelemetryUrl,
  onLoadFullSample,
  onClearAll,
  liveTiming,
}: {
  telemetryUrl: string;
  onApplyTelemetryUrl: (value: string) => Promise<void>;
  onLoadFullSample: () => void;
  onClearAll: () => void;
  liveTiming: LiveTimingSnapshot;
}) {
  const [draft, setDraft] = useState(telemetryUrl);
  const [status, setStatus] = useState("Waiting for telemetry source");

  async function applyTelemetryLink() {
    const clean = draft.trim();
    if (!clean) {
      onClearAll();
      setStatus("Waiting for telemetry source");
      return;
    }
    setStatus("Scraping live timing source");
    await onApplyTelemetryUrl(clean);
  }

  function useSampleTelemetryLink() {
    setDraft(SAMPLE_TELEMETRY_URL);
    void onApplyTelemetryUrl(SAMPLE_TELEMETRY_URL);
    setStatus("Sample telemetry link applied to all dashboard modules");
  }

  function clearTelemetryLink() {
    setDraft("");
    onClearAll();
    setStatus("Waiting for telemetry source");
  }

  function loadFullSample() {
    setDraft(SAMPLE_TELEMETRY_URL);
    onLoadFullSample();
    setStatus("Full sample data loaded across all dashboard modules");
  }

  return (
    <section className="source-bar print-hide">
      <div className="source-bar-title">
        <Link2 className="h-4 w-4 text-red-racing" />
        <div>
          <div className="ops-label">Telemetry Source Link</div>
          <div className="text-xs text-muted-foreground">
            Paste your telemetry stream, API, websocket, or data feed URL here.
          </div>
        </div>
      </div>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Paste telemetry link for all dashboard features"
        className="source-input"
      />
      <div className="source-actions">
        <button onClick={applyTelemetryLink} className="ops-button">
          Apply
        </button>
        <button onClick={useSampleTelemetryLink} className="ops-button-secondary">
          Use Sample Link
        </button>
        <button onClick={loadFullSample} className="ops-button-secondary">
          Load Full Sample
        </button>
        <button onClick={clearTelemetryLink} className="ops-button-secondary">
          Clear
        </button>
      </div>
      <div className="source-status">{status}</div>
      {liveTiming.source && (
        <div className="source-status">
          {liveTiming.status === "live"
            ? `Live timing loaded: ${liveTiming.event_name || "event"} at ${liveTiming.track || "track"}`
            : liveTiming.message}
        </div>
      )}
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
      {children}
    </div>
  );
}

type SampleCar = ReturnType<typeof useCars>["cars"][number];

type ComparisonSector = {
  label: string;
  speed: string;
  time: string;
};

type ComparisonCar = {
  id: string;
  position: string;
  carNo: string;
  driver: string;
  team: string;
  className: string;
  rank: string;
  laps: string;
  gap: string;
  lastLap: string;
  fastestLap: string;
  pitCount: string;
  vehicle: string;
  sectors: ComparisonSector[];
  lapDataUrl?: string | null;
};

function displayValue(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function timeToSeconds(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const clean = value.trim().replace("+", "");
  const parts = clean.split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part))) {
    const numeric = Number(clean);
    return Number.isFinite(numeric) ? numeric : null;
  }
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? null;
}

function numericValue(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function signedDelta(a: number | null, b: number | null, suffix = "") {
  if (a === null || b === null) return "Insufficient data";
  const diff = b - a;
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toFixed(3)}${suffix}`;
}

function normalizeLiveRow(row: LiveTimingRow, index: number): ComparisonCar {
  return {
    id: `live-${row.car_no}-${index}`,
    position: displayValue(row.position, String(index + 1)),
    carNo: displayValue(row.car_no),
    driver: displayValue(row.driver || row.team),
    team: displayValue(row.team || row.vehicle),
    className: displayValue(row.class_name),
    rank: displayValue(row.class_rank || row.rank || row.dynamic_rank),
    laps: displayValue(row.laps),
    gap: displayValue(row.gap),
    lastLap: displayValue(row.last_lap),
    fastestLap: displayValue(row.fastest_lap),
    pitCount: displayValue(row.pit_count, "0"),
    vehicle: displayValue(row.vehicle),
    sectors: (row.sectors || []).map((sector) => ({
      label: `S${sector.sector}`,
      speed: displayValue(sector.speed),
      time: displayValue(sector.time),
    })),
    lapDataUrl: row.lap_data_url,
  };
}

function normalizeSampleCar(car: SampleCar, index: number): ComparisonCar {
  return {
    id: `sample-${car.no}`,
    position: String(index + 1),
    carNo: car.no,
    driver: car.driver,
    team: car.team,
    className: car.cls,
    rank: String(index + 1),
    laps: String(car.laps),
    gap: index === 0 ? "Leader" : `+${(index * 21.7).toFixed(1)}s`,
    lastLap: car.last,
    fastestLap: car.best,
    pitCount: String(car.pits),
    vehicle: `${car.manufacturer} ${car.car}`,
    sectors: [
      { label: "S1", speed: `${282 - index}`, time: "1:41.2" },
      { label: "S2", speed: `${263 - index}`, time: "1:58.4" },
      { label: "S3", speed: `${271 - index}`, time: "1:45.9" },
    ],
    lapDataUrl: null,
  };
}

function consistencyScore(car: ComparisonCar) {
  const lap = timeToSeconds(car.lastLap);
  const best = timeToSeconds(car.fastestLap);
  if (lap !== null && best !== null && lap > 0) {
    return Math.max(45, Math.min(99, Math.round(100 - Math.abs(lap - best) * 1.8)));
  }
  return Math.max(52, 88 - Number(car.position || 0));
}

function engineeringRisk(car: ComparisonCar) {
  const position = numericValue(car.position) ?? 99;
  const pits = numericValue(car.pitCount) ?? 0;
  if (position <= 3 && pits <= 1) return "High strategic exposure";
  if (position <= 10) return "Medium traffic and class threat";
  return "Manage traffic, protect stint rhythm";
}

function trackStateValue(liveTiming: LiveTimingSnapshot) {
  return String(
    liveTiming.track_state?.track_status ||
      liveTiming.track_state?.status ||
      liveTiming.track_state?.state ||
      "",
  ).trim();
}

type ConclusionRow = {
  label: string;
  value: number;
  rival?: number;
  note?: string;
  detail?: string;
};

function gapInfo(value?: string | number | null) {
  const clean = displayValue(value, "").trim();
  if (!clean) return { kind: "unknown" as const, seconds: null, label: "unknown gap" };
  if (/lap/i.test(clean)) {
    const lap = clean.match(/(\d+)/)?.[1];
    return {
      kind: "lap" as const,
      seconds: null,
      label: lap ? `lap-status separation at lap ${lap}` : "lap-status separation",
    };
  }
  const seconds = timeToSeconds(clean);
  return {
    kind: seconds !== null ? ("time" as const) : ("unknown" as const),
    seconds,
    label: seconds !== null ? `${seconds.toFixed(1)}s timed gap` : clean,
  };
}

function sameLapRival(rows: LiveTimingRow[]) {
  const leader = rows[0];
  if (!leader) return null;
  const leaderLaps = numericValue(leader.laps);
  return (
    rows
      .slice(1)
      .map((row) => ({ row, gap: gapInfo(row.gap) }))
      .filter(({ row, gap }) => numericValue(row.laps) === leaderLaps && gap.kind === "time")
      .sort((a, b) => (a.gap.seconds ?? 99999) - (b.gap.seconds ?? 99999))[0] || null
  );
}

function normalizedLapLoss(rows: LiveTimingRow[], row: LiveTimingRow) {
  const losses = rows
    .slice(0, 10)
    .map(lapLoss)
    .filter((value) => Number.isFinite(value));
  if (!losses.length) return 0;
  const min = Math.min(...losses);
  const max = Math.max(...losses);
  if (max === min) return 0.35;
  return (lapLoss(row) - min) / (max - min);
}

function gapRisk(row: LiveTimingRow, index: number) {
  const gap = gapInfo(row.gap);
  if (gap.kind === "time" && gap.seconds !== null) {
    return Math.max(4, Math.min(22, 22 - gap.seconds / 18));
  }
  if (gap.kind === "lap") return Math.max(3, 13 - index);
  return Math.max(5, 16 - index);
}

function lapLoss(row: LiveTimingRow) {
  const last = timeToSeconds(row.last_lap);
  const best = timeToSeconds(row.fastest_lap);
  if (last === null || best === null) return 0;
  return Math.max(0, last - best);
}

function buildPressureRows(rows: LiveTimingRow[]): ConclusionRow[] {
  return rows
    .slice(0, 10)
    .filter((row) => row.car_no)
    .map((row, index) => {
      const classRank = numericValue(row.class_rank || row.rank) ?? index + 1;
      const pits = numericValue(row.pit_count) ?? 0;
      const laps = numericValue(row.laps) ?? 0;
      const stintPhase = (laps % 30) / 30;
      const lossFactor = normalizedLapLoss(rows, row);
      const positionFactor = Math.max(0, 22 - index * 1.6);
      const classFactor = Math.max(0, 18 - classRank * 2.2);
      const pitFactor = Math.max(0, 12 - Math.abs((pits % 3) - 1) * 4);
      const pressure = Math.max(
        8,
        Math.min(
          100,
          22 +
            positionFactor +
            classFactor +
            gapRisk(row, index) +
            pitFactor +
            stintPhase * 10 -
            lossFactor * 18,
        ),
      );
      return {
        label: `#${row.car_no || index + 1}`,
        value: Number(pressure.toFixed(1)),
        note: `${displayValue(row.driver || row.team)} pressure ${pressure.toFixed(0)}%`,
        detail: `${gapInfo(row.gap).label}; class rank ${displayValue(row.class_rank || row.rank)}; ${displayValue(row.pit_count, "0")} stops.`,
      };
    });
}

function buildSamplePressureRows(cars: SampleCar[]): ConclusionRow[] {
  return cars.slice(0, 10).map((car, index) => ({
    label: `#${car.no}`,
    value: Math.max(25, 88 - index * 5 - car.pits * 1.5),
    note: `${car.team} pressure window`,
  }));
}

function buildPaceDeltaRows(rows: LiveTimingRow[]): ConclusionRow[] {
  return rows.slice(0, 10).map((row, index) => ({
    label: `#${row.car_no || index + 1}`,
    value: Number(lapLoss(row).toFixed(2)),
    note: `${displayValue(row.last_lap)} vs ${displayValue(row.fastest_lap)}`,
    detail: `${displayValue(row.driver || row.team)} is losing ${lapLoss(row).toFixed(2)}s versus best lap.`,
  }));
}

function buildSamplePaceDeltaRows(cars: SampleCar[]): ConclusionRow[] {
  return cars.slice(0, 10).map((car, index) => {
    const loss = (timeToSeconds(car.last) ?? 0) - (timeToSeconds(car.best) ?? 0);
    return {
      label: `#${car.no}`,
      value: Number(Math.max(0.05, loss + index * 0.07).toFixed(2)),
      note: `${car.driver} visible pace loss`,
    };
  });
}

function buildPitExposureRows(rows: LiveTimingRow[]): ConclusionRow[] {
  return rows.slice(0, 10).map((row, index) => {
    const pits = numericValue(row.pit_count) ?? 0;
    const laps = numericValue(row.laps) ?? 0;
    const stintAge = laps % 30;
    return {
      label: `#${row.car_no || index + 1}`,
      value: Number((pits * 5 + stintAge / 2).toFixed(1)),
      rival: pits,
      note: `${displayValue(row.pit_count, "0")} stops, stint phase ${stintAge.toFixed(0)}`,
      detail: `${displayValue(row.driver || row.team)} has ${displayValue(row.pit_count, "0")} stops and stint phase ${stintAge.toFixed(0)} of 30.`,
    };
  });
}

function buildSamplePitExposureRows(cars: SampleCar[]): ConclusionRow[] {
  return cars.slice(0, 10).map((car) => ({
    label: `#${car.no}`,
    value: car.pits * 6 + (car.laps % 30) / 2,
    rival: car.pits,
    note: `${car.pits} stops`,
  }));
}

function buildClassThreatRows(rows: LiveTimingRow[]): ConclusionRow[] {
  return rows.slice(0, 10).map((row, index) => {
    const rank = numericValue(row.class_rank || row.rank) ?? index + 1;
    const threat = Math.max(5, Math.min(100, 92 - rank * 8 + gapRisk(row, index)));
    return {
      label: `#${row.car_no || index + 1}`,
      value: Number(threat.toFixed(1)),
      note: `${displayValue(row.class_name, "class")} rank ${displayValue(row.class_rank || row.rank)}`,
      detail: `${displayValue(row.class_name, "class")} rank ${displayValue(row.class_rank || row.rank)} with ${gapInfo(row.gap).label}.`,
    };
  });
}

function buildSampleClassThreatRows(cars: SampleCar[]): ConclusionRow[] {
  return cars.slice(0, 10).map((car, index) => ({
    label: `#${car.no}`,
    value: Math.max(15, 95 - index * 7),
    note: `${car.cls} threat`,
  }));
}

function explainConclusionChart(title: string, rows: ConclusionRow[]) {
  if (!rows.length) {
    return `${title} is waiting for live timing rows.`;
  }
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const second = sorted[1];
  const average = rows.reduce((total, row) => total + row.value, 0) / rows.length;
  if (title === "Top 10 Pace Delta") {
    return `${top.label} has the largest visible last-vs-best loss at ${top.value.toFixed(
      2,
    )}s. Top-10 average loss is ${average.toFixed(
      2,
    )}s, so this chart highlights cars that need tire management or traffic relief.`;
  }
  if (title === "Pit Exposure") {
    return `${top.label} carries the highest pit-cycle exposure score at ${top.value.toFixed(
      1,
    )}. ${top.detail || top.note || ""} Use this with lap status before committing to undercut or cover calls.`;
  }
  if (title === "Class Threat") {
    return `${top.label} is the strongest class-pressure marker at ${top.value.toFixed(
      1,
    )}. ${second ? `${second.label} is next at ${second.value.toFixed(1)}.` : ""} This is class/rank pressure, not raw overall pace.`;
  }
  return `${top.label} leads the pressure model at ${top.value.toFixed(
    1,
  )}. ${top.detail || top.note || ""} Average pressure is ${average.toFixed(1)} across visible cars.`;
}

function timingConclusion(rows: LiveTimingRow[]) {
  const leader = rows[0];
  if (!leader) return null;
  const rival = sameLapRival(rows);
  const leaderLoss = lapLoss(leader);
  const leaderLine = `Timing confirms #${leader.car_no} ${displayValue(
    leader.driver || leader.team,
  )} leading on lap ${displayValue(leader.laps)} with ${leaderLoss.toFixed(
    2,
  )}s last-vs-best loss and ${displayValue(leader.pit_count, "0")} stops.`;
  if (!rival) {
    return `${leaderLine} No immediate same-lap pressure is visible in the current top group; lap-status gaps should not be shown as direct attack pressure.`;
  }
  return `${leaderLine} Closest same-lap rival is #${rival.row.car_no} at ${
    rival.gap.label
  }, so monitor traffic release before pit-cover decisions.`;
}

function buildTimingSeries(rows: LiveTimingRow[]) {
  return rows.slice(0, 30).map((row, index) => {
    const last = timeToSeconds(row.last_lap) ?? 0;
    const best = timeToSeconds(row.fastest_lap) ?? last;
    return {
      lap: displayValue(row.position, String(index + 1)),
      car: Number(last.toFixed(3)),
      rival: Number(best.toFixed(3)),
    };
  });
}

function buildTelemetrySeries(rows: LiveTimingRow[]) {
  const leader = rows[0];
  const rival = rows[1];
  if (!leader) return [];
  const sectors = leader.sectors?.length ? leader.sectors : [];
  if (sectors.length) {
    return sectors.map((sector, index) => ({
      lap: `S${sector.sector || index + 1}`,
      car: numericValue(sector.speed) ?? timeToSeconds(sector.time) ?? 0,
      rival:
        numericValue(rival?.sectors?.[index]?.speed) ??
        timeToSeconds(rival?.sectors?.[index]?.time) ??
        numericValue(sector.speed) ??
        0,
    }));
  }
  return rows.slice(0, 12).map((row, index) => ({
    lap: displayValue(row.position, String(index + 1)),
    car: timeToSeconds(row.last_lap) ?? index + 1,
    rival: timeToSeconds(row.fastest_lap) ?? index + 1,
  }));
}

function telemetryConclusion(rows: LiveTimingRow[], sampleMode: boolean) {
  if (sampleMode) {
    return "Sample telemetry shows the leader holding speed while the rival trace is more volatile. The strategy read is to avoid unnecessary attack laps and preserve the next pit window.";
  }
  const leader = rows[0];
  const rival = rows[1];
  if (!leader) {
    return "Telemetry conclusion is waiting for a live timing source.";
  }
  const leaderLoss = lapLoss(leader);
  const rivalLoss = rival ? lapLoss(rival) : null;
  const fastestSector = leader.sectors
    ?.map((sector) => numericValue(sector.speed))
    .filter((value): value is number => value !== null)
    .sort((a, b) => b - a)[0];
  const pressure =
    rival && rivalLoss !== null && rivalLoss < leaderLoss
      ? `#${rival.car_no} is showing cleaner pace than the leader on the latest visible lap.`
      : "Leader pace is stable against the nearest visible rival.";
  return `${pressure} #${leader.car_no} last-vs-best loss is ${leaderLoss.toFixed(
    2,
  )}s${fastestSector ? ` with peak exposed sector speed ${fastestSector.toFixed(1)} kph` : ""}.`;
}

function liveStrategyMetrics(rows: LiveTimingRow[]) {
  const leader = rows[0];
  const chaser = rows[1];
  if (!leader) return null;
  const laps = numericValue(leader.laps) ?? 0;
  const pitCount = numericValue(leader.pit_count) ?? 0;
  const lastLap = timeToSeconds(leader.last_lap);
  const bestLap = timeToSeconds(leader.fastest_lap);
  const lapDelta = lastLap !== null && bestLap !== null ? Math.max(0, lastLap - bestLap) : 0;
  const tireScore = Math.max(42, Math.min(99, Math.round(94 - lapDelta * 4 - pitCount * 1.5)));
  const stintRemainder = Math.max(1, 30 - (laps % 30 || 30));
  const gapSeconds = numericValue(chaser?.gap);
  return {
    tireStatus: `${tireScore}%`,
    fuelMargin: `${Math.max(0.4, stintRemainder * 0.09).toFixed(1)}L`,
    pitWindow: `L${Math.max(laps + 1, laps + stintRemainder - 2)}`,
    traffic: gapSeconds !== null && gapSeconds < 8 ? "Pressure" : "Clear",
  };
}

function commentaryTeaser(summary?: string) {
  if (!summary) return "";
  if (summary.includes("Commentary source connected:")) {
    return "Broadcast metadata is connected; use live timing for confirmed gaps, pit calls, and incidents until captions become available.";
  }
  const strategy = summary.match(/Strategy Relevance:\s*([^.]+\.)/i)?.[1];
  if (strategy) return strategy.trim();
  const focus = summary.match(/Likely Race Focus:\s*([^.]+\.)/i)?.[1];
  if (focus) return focus.trim();
  return summary.split(/(?<=[.!?])\s+/)[0].slice(0, 240);
}

function dedupeByMessage<T extends { msg: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.msg.replace(/\s+/g, " ").trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function weatherChipValue(report: CircuitReport | null, sampleMode: boolean) {
  if (report?.weather_source_status === "live" && report.weather_summary) {
    const temp =
      typeof report.weather_temperature_c === "number"
        ? `${report.weather_temperature_c.toFixed(1)}C`
        : "";
    return `${temp} ${report.weather_condition || ""}`.trim() || report.weather_summary;
  }
  if (sampleMode) return report?.weather_summary || "18C dry";
  if (report) return "Weather unavailable";
  return "Awaiting circuit location";
}

function conclusionCards(rows: LiveTimingRow[], summary: string | undefined, sampleMode: boolean) {
  if (sampleMode) {
    return [
      {
        title: "Pressure call",
        detail: "#7 controls the race, but #6 has enough pace to force pit-cover decisions.",
      },
      {
        title: "Pit cycle",
        detail: "Top-three sample cars are inside the decision window; avoid stacking traffic.",
      },
      {
        title: "Broadcast read",
        detail: "Sample commentary points to tire protection and clean-air release.",
      },
    ];
  }
  const leader = rows[0];
  const chaser = rows[1];
  const cards = [];
  if (leader) {
    cards.push({
      title: `Leader #${leader.car_no}`,
      detail: `${displayValue(leader.driver || leader.team)} has ${lapLoss(leader).toFixed(
        2,
      )}s lap-loss versus best, ${displayValue(leader.pit_count, "0")} stops, and ${displayValue(
        leader.class_name,
        "class",
      )} class context on lap ${displayValue(leader.laps)}.`,
    });
  }
  const rival = sameLapRival(rows);
  if (rival) {
    cards.push({
      title: `Same-lap pressure #${rival.row.car_no}`,
      detail: `${displayValue(rival.row.driver || rival.row.team)} is ${rival.gap.label}; compare pit overlap and traffic release before covering.`,
    });
  } else if (leader && chaser) {
    cards.push({
      title: "No direct same-lap attack",
      detail: `Nearest visible car #${chaser.car_no} is ${
        gapInfo(chaser.gap).label
      }. Treat that as lap-status context, not immediate overtake pressure.`,
    });
  }
  if (summary) {
    cards.push({ title: "Commentary read", detail: commentaryTeaser(summary) });
  }
  return cards.slice(0, 3);
}

function liveTireDegradation(rows: LiveTimingRow[]) {
  return rows.slice(0, 30).map((row, index) => {
    const last = timeToSeconds(row.last_lap);
    const best = timeToSeconds(row.fastest_lap);
    const loss = last !== null && best !== null ? Math.max(0, last - best) : index * 0.08;
    const pits = numericValue(row.pit_count) ?? 0;
    return {
      lap: numericValue(row.laps) ?? index + 1,
      soft: Number((loss + pits * 0.12).toFixed(2)),
      medium: Number((loss * 0.72 + pits * 0.08).toFixed(2)),
      hard: Number((loss * 0.48 + pits * 0.05).toFixed(2)),
    };
  });
}

function liveTimingEvents(rows: LiveTimingRow[]) {
  const leader = rows[0];
  if (!leader) return [];
  const events = [
    {
      t: "LIVE",
      kind: "LEADER",
      msg: `#${leader.car_no} leads ${leader.class_name || "overall"} on lap ${displayValue(leader.laps)} with last lap ${displayValue(leader.last_lap)}.`,
    },
  ];
  const rival = sameLapRival(rows);
  if (rival) {
    events.push({
      t: "LIVE",
      kind: "PRESSURE",
      msg: `Closest same-lap pressure is #${rival.row.car_no} at ${rival.gap.label} with best lap ${displayValue(rival.row.fastest_lap)}.`,
    });
  } else if (rows[1]) {
    events.push({
      t: "LIVE",
      kind: "LAP STATUS",
      msg: `#${rows[1].car_no} is shown as ${gapInfo(rows[1].gap).label}; do not treat this as immediate attack pressure.`,
    });
  }
  const pitWatch = rows.find((row) => numericValue(row.pit_count) !== null);
  if (pitWatch) {
    events.push({
      t: "LIVE",
      kind: "PIT",
      msg: `#${pitWatch.car_no} pit-count data is active at ${displayValue(pitWatch.pit_count, "0")} stops.`,
    });
  }
  return events;
}

function liveEngineerAlerts(rows: LiveTimingRow[], latestSummary?: string) {
  const leader = rows[0];
  const alerts: { title: string; msg: string }[] = [];
  if (latestSummary) {
    alerts.push({
      title: "Broadcast context",
      msg: `${commentaryTeaser(latestSummary)} Live timing remains the source of truth for race conclusions.`,
    });
  }
  if (leader) {
    alerts.push({
      title: `Leader watch #${leader.car_no}`,
      msg: `${displayValue(leader.driver || leader.team)} leads on lap ${displayValue(
        leader.laps,
      )}. Last lap ${displayValue(leader.last_lap)} vs best ${displayValue(
        leader.fastest_lap,
      )} gives ${lapLoss(leader).toFixed(2)}s loss with ${displayValue(
        leader.pit_count,
        "0",
      )} stops.`,
    });
  }
  const rival = sameLapRival(rows);
  if (rival) {
    alerts.push({
      title: "Rival pressure",
      msg: `Closest same-lap rival #${rival.row.car_no} is ${rival.gap.label}. Monitor pit overlap and traffic release.`,
    });
  } else if (leader && rows[1]) {
    alerts.push({
      title: "Rival pressure",
      msg: `No immediate same-lap pressure detected. #${rows[1].car_no} is ${
        gapInfo(rows[1].gap).label
      }, so avoid presenting it as a direct attack.`,
    });
  }
  return alerts.slice(0, 4);
}

function explainTireCurve(
  data: { soft: number; medium: number; hard: number }[],
  sampleMode: boolean,
  rows: LiveTimingRow[] = [],
) {
  if (!data.length) {
    return "No tire degradation explanation is available until telemetry or sample data provides lap and pace-loss values.";
  }
  const first = data[0];
  const last = data[data.length - 1];
  const softRise = last.soft - first.soft;
  const mediumRise = last.medium - first.medium;
  const hardRise = last.hard - first.hard;
  const highest =
    softRise >= mediumRise && softRise >= hardRise
      ? "soft"
      : mediumRise >= hardRise
        ? "medium"
        : "hard";
  const source = sampleMode ? "Sample AI read" : "Source-driven AI read";
  if (!sampleMode && rows.length) {
    const leader = rows[0];
    const leaderLoss = lapLoss(leader);
    const losses = rows
      .slice(0, 10)
      .map(lapLoss)
      .filter((value) => Number.isFinite(value));
    const averageLoss = losses.length
      ? losses.reduce((total, value) => total + value, 0) / losses.length
      : 0;
    const comparison =
      leaderLoss <= averageLoss
        ? `Leader #${leader.car_no} is managing tires better than the top-10 average by ${(averageLoss - leaderLoss).toFixed(2)}s of lap-loss.`
        : `Leader #${leader.car_no} is losing ${(leaderLoss - averageLoss).toFixed(2)}s more than the top-10 average, so the lead car needs tire protection or a shorter stint.`;
    return `${source}: ${comparison} The modelled ${highest} curve is rising fastest, with soft +${softRise.toFixed(
      2,
    )}s, medium +${mediumRise.toFixed(2)}s, and hard +${hardRise.toFixed(
      2,
    )}s across the visible window. Use the next pit window if this loss keeps accelerating.`;
  }
  return `${source}: ${highest} degradation is rising fastest. Soft trend is ${softRise.toFixed(
    2,
  )}s, medium is ${mediumRise.toFixed(2)}s, and hard is ${hardRise.toFixed(
    2,
  )}s across the visible window. Strategy should protect the fastest-rising compound first, avoid unnecessary attack laps, and use the next pit window if lap-loss acceleration continues.`;
}

function ComparisonStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="comparison-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CarDetailCard({ car, label }: { car: ComparisonCar; label: string }) {
  return (
    <div className="comparison-card">
      <div className="ops-label">{label}</div>
      <h3 className="mt-1 text-xl font-semibold text-red-racing">#{car.carNo}</h3>
      <div className="mt-1 text-sm font-semibold">{car.driver}</div>
      <div className="text-xs text-muted-foreground">{car.team}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <ComparisonStat label="Position" value={car.position} />
        <ComparisonStat label="Class" value={car.className} />
        <ComparisonStat label="Rank" value={car.rank} />
        <ComparisonStat label="Laps" value={car.laps} />
        <ComparisonStat label="Gap" value={car.gap} />
        <ComparisonStat label="Pit Count" value={car.pitCount} />
        <ComparisonStat label="Last Lap" value={car.lastLap} />
        <ComparisonStat label="Fastest Lap" value={car.fastestLap} />
      </div>
      <div className="mt-3 rounded border border-border bg-background/60 p-2 text-xs text-muted-foreground">
        Vehicle: {car.vehicle}
      </div>
      {car.lapDataUrl && (
        <a
          href={car.lapDataUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-red-racing"
        >
          Lap data
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function StandingsComparisonDialog({
  pair,
  open,
  onOpenChange,
}: {
  pair: [ComparisonCar, ComparisonCar] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!pair) return null;
  const [carA, carB] = pair;
  const lapDelta = signedDelta(timeToSeconds(carA.lastLap), timeToSeconds(carB.lastLap), "s");
  const bestDelta = signedDelta(
    timeToSeconds(carA.fastestLap),
    timeToSeconds(carB.fastestLap),
    "s",
  );
  const pitDelta = signedDelta(numericValue(carA.pitCount), numericValue(carB.pitCount));
  const gapDelta = signedDelta(numericValue(carA.position), numericValue(carB.position), " pos");
  const allSectorLabels = Array.from(
    new Set([
      ...carA.sectors.map((sector) => sector.label),
      ...carB.sectors.map((sector) => sector.label),
    ]),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-auto border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>
            #{carA.carNo} vs #{carB.carNo} Race Comparison
          </DialogTitle>
          <DialogDescription>
            Full standing, lap, sector and race-engineering comparison from the active data source.
          </DialogDescription>
        </DialogHeader>
        <div className="comparison-grid">
          <CarDetailCard car={carA} label="Selected Car A" />
          <CarDetailCard car={carB} label="Selected Car B" />
        </div>
        <div className="comparison-dashboard">
          <div className="ops-label">Performance Delta Dashboard</div>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <ComparisonStat label="Position Delta" value={gapDelta} />
            <ComparisonStat label="Last-Lap Delta" value={lapDelta} />
            <ComparisonStat label="Fastest-Lap Delta" value={bestDelta} />
            <ComparisonStat label="Pit Delta" value={pitDelta} />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {allSectorLabels.length ? (
              allSectorLabels.map((label) => {
                const sectorA = carA.sectors.find((sector) => sector.label === label);
                const sectorB = carB.sectors.find((sector) => sector.label === label);
                return (
                  <div key={label} className="comparison-sector">
                    <strong>{label}</strong>
                    <span>
                      #{carA.carNo}: {sectorA?.time || "-"} / {sectorA?.speed || "-"}
                    </span>
                    <span>
                      #{carB.carNo}: {sectorB?.time || "-"} / {sectorB?.speed || "-"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground">
                Sector timing is not exposed by this source yet.
              </div>
            )}
          </div>
        </div>
        <div className="comparison-dashboard">
          <div className="ops-label">Race Engineering Dashboard</div>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <ComparisonStat label={`#${carA.carNo} Threat`} value={engineeringRisk(carA)} />
            <ComparisonStat label={`#${carB.carNo} Threat`} value={engineeringRisk(carB)} />
            <ComparisonStat
              label={`#${carA.carNo} Consistency`}
              value={`${consistencyScore(carA)}%`}
            />
            <ComparisonStat
              label={`#${carB.carNo} Consistency`}
              value={`${consistencyScore(carB)}%`}
            />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="engineer-call">
              <strong>Stint and pit implication</strong>
              <p>
                {Number(carA.pitCount) === Number(carB.pitCount)
                  ? "Both cars show similar pit count exposure, so lap-time stability and traffic release decide the next strategy call."
                  : "Different pit counts indicate offset strategy. Protect clean-air release and monitor undercut exposure on the next stop."}
              </p>
            </div>
            <div className="engineer-call">
              <strong>Class/rank pressure</strong>
              <p>
                {carA.className === carB.className
                  ? "Same-class comparison: prioritize gap control, pit overlap risk, and direct defensive calls."
                  : "Cross-class comparison: treat closing speed and traffic timing as the primary risk."}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LiveStandings({
  active,
  liveTiming,
  sampleMode,
}: {
  active: boolean;
  liveTiming: LiveTimingSnapshot;
  sampleMode: boolean;
}) {
  const { cars, flashId } = useCars();
  const [limit, setLimit] = useState<15 | 30 | 50 | "all">(15);
  const [selected, setSelected] = useState<ComparisonCar | null>(null);
  const [comparisonPair, setComparisonPair] = useState<[ComparisonCar, ComparisonCar] | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const liveRows = liveTiming.status === "live" ? liveTiming.standings : [];
  const visible = limit === "all" ? cars : cars.slice(0, limit);
  const visibleLiveRows = limit === "all" ? liveRows : liveRows.slice(0, limit);

  function chooseRow(row: ComparisonCar) {
    if (selected?.id === row.id) {
      setSelected(null);
      return;
    }
    if (!selected) {
      setSelected(row);
      return;
    }
    setComparisonPair([selected, row]);
    setComparisonOpen(true);
  }

  function closeComparison(open: boolean) {
    setComparisonOpen(open);
    if (!open) {
      setSelected(null);
      setComparisonPair(null);
    }
  }

  return (
    <section className="ops-panel left-standings">
      <div className="panel-pad border-b border-border">
        <div className="ops-label">Live Standings</div>
        <div className="mt-2 flex gap-1">
          {[15, 30, 50, "all" as const].map((value) => (
            <button
              key={value}
              onClick={() => setLimit(value)}
              className={cn("mini-toggle", limit === value && "mini-toggle-active")}
            >
              {value === "all" ? "All" : value}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-[650px] overflow-auto">
        {active && visibleLiveRows.length > 0 ? (
          <table className="min-w-[980px] w-full text-left text-xs">
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Pos</th>
                <th className="px-2 py-2">Car</th>
                <th className="px-2 py-2">Class</th>
                <th className="px-2 py-2">Driver</th>
                <th className="px-2 py-2">Team</th>
                <th className="px-2 py-2">Vehicle</th>
                <th className="px-2 py-2">Lap</th>
                <th className="px-2 py-2">Gap</th>
                <th className="px-2 py-2">Last</th>
                <th className="px-2 py-2">Best</th>
                <th className="px-2 py-2">Pit</th>
                <th className="px-2 py-2">Rank</th>
              </tr>
            </thead>
            <tbody>
              {visibleLiveRows.map((row, index) => {
                const compareRow = normalizeLiveRow(row, index);
                return (
                  <tr
                    key={`${row.car_no}-${index}`}
                    className={cn(
                      "standings-row",
                      selected?.id === compareRow.id && "standings-row-selected",
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => chooseRow(compareRow)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") chooseRow(compareRow);
                    }}
                  >
                    <td className="px-2 py-2 font-semibold">{row.position || index + 1}</td>
                    <td className="px-2 py-2">
                      <div className="font-semibold text-red-racing">#{row.car_no}</div>
                    </td>
                    <td className="px-2 py-2">{row.class_name || "-"}</td>
                    <td className="px-2 py-2">{row.driver || row.team || "-"}</td>
                    <td className="px-2 py-2">{row.team || "-"}</td>
                    <td className="px-2 py-2">{row.vehicle || "-"}</td>
                    <td className="px-2 py-2">{row.laps}</td>
                    <td className="px-2 py-2">{row.gap || "-"}</td>
                    <td className="px-2 py-2">{row.last_lap || "-"}</td>
                    <td className="px-2 py-2">{row.fastest_lap || "-"}</td>
                    <td className="px-2 py-2">{row.pit_count ?? "-"}</td>
                    <td className="px-2 py-2">{row.class_rank || row.rank || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : active && sampleMode ? (
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Pos</th>
                <th className="px-2 py-2">Car</th>
                <th className="px-2 py-2">Class</th>
                <th className="px-2 py-2">Driver</th>
                <th className="px-2 py-2">Team</th>
                <th className="px-2 py-2">Vehicle</th>
                <th className="px-2 py-2">Lap</th>
                <th className="px-2 py-2">Gap</th>
                <th className="px-2 py-2">Last</th>
                <th className="px-2 py-2">Best</th>
                <th className="px-2 py-2">Pit</th>
                <th className="px-2 py-2">Rank</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((car, index) => {
                const compareRow = normalizeSampleCar(car, index);
                return (
                  <tr
                    key={car.no}
                    className={cn(
                      "standings-row",
                      flashId === car.no && "flash",
                      selected?.id === compareRow.id && "standings-row-selected",
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => chooseRow(compareRow)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") chooseRow(compareRow);
                    }}
                  >
                    <td className="px-2 py-2 font-semibold">{index + 1}</td>
                    <td className="px-2 py-2">
                      <div className="font-semibold text-red-racing">#{car.no}</div>
                    </td>
                    <td className="px-2 py-2">{car.cls}</td>
                    <td className="px-2 py-2">{car.driver}</td>
                    <td className="px-2 py-2">{car.team}</td>
                    <td className="px-2 py-2">{`${car.manufacturer} ${car.car}`}</td>
                    <td className="px-2 py-2">{car.laps}</td>
                    <td className="px-2 py-2">
                      {index === 0 ? "Leader" : `+${(index * 21.7).toFixed(1)}s`}
                    </td>
                    <td className="px-2 py-2">{car.last}</td>
                    <td className="px-2 py-2">{car.best}</td>
                    <td className="px-2 py-2">{car.pits}</td>
                    <td className="px-2 py-2">{index + 1}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-3">
            <EmptyState>
              Standings are blank until sample data or live telemetry is loaded.
            </EmptyState>
          </div>
        )}
      </div>
      {selected && (
        <div className="border-t border-border p-2 text-[11px] text-muted-foreground">
          Selected #{selected.carNo}. Choose a second different row to compare.
        </div>
      )}
      <StandingsComparisonDialog
        pair={comparisonPair}
        open={comparisonOpen}
        onOpenChange={closeComparison}
      />
    </section>
  );
}

function EngineeringCorePanel({
  intelligence,
  active,
  liveTiming,
  sampleMode,
  circuitReport,
}: {
  intelligence: LiveIntelligenceSnapshot;
  active: boolean;
  liveTiming: LiveTimingSnapshot;
  sampleMode: boolean;
  circuitReport: CircuitReport | null;
}) {
  const tick = useTick(1000);
  const { cars } = useCars();
  const pressureRows = sampleMode
    ? buildSamplePressureRows(cars)
    : buildPressureRows(liveTiming.standings);
  const paceDeltaRows = sampleMode
    ? buildSamplePaceDeltaRows(cars)
    : buildPaceDeltaRows(liveTiming.standings);
  const pitExposureRows = sampleMode
    ? buildSamplePitExposureRows(cars)
    : buildPitExposureRows(liveTiming.standings);
  const classThreatRows = sampleMode
    ? buildSampleClassThreatRows(cars)
    : buildClassThreatRows(liveTiming.standings);
  const operationsClock = useMemo(() => {
    const fromSource = formatTimingClock(liveTiming.time_of_day);
    if (fromSource) return fromSource;
    if (!sampleMode) return "Awaiting source";
    const total = 14 * 3600 + 32 * 60 + 35 + tick;
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [liveTiming.time_of_day, sampleMode, tick]);
  const leader = liveTiming.standings[0];
  const chaser = sameLapRival(liveTiming.standings)?.row || liveTiming.standings[1];
  const latestSummary = intelligence.summaries[0]?.summary;
  const cards = conclusionCards(liveTiming.standings, latestSummary, sampleMode);
  const liveTrackState = trackStateValue(liveTiming);
  const operationChips = [
    { label: "Race", value: operationsClock },
    {
      label: "Lap",
      value: leader?.laps ? `${leader.laps}` : sampleMode ? "184 / 372" : "Awaiting",
    },
    {
      label: "Track",
      value: liveTiming.track || (sampleMode ? "GREEN" : "Awaiting"),
      tone: "green" as const,
    },
    { label: "SC", value: liveTrackState || (sampleMode ? "CLEAR" : "Awaiting") },
    {
      label: "Weather",
      value: weatherChipValue(circuitReport, sampleMode),
    },
  ];
  return (
    <section className="ops-panel engineering-core">
      <div className="panel-pad border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="ops-label">Operations Core</div>
            <h2 className="mt-1 text-2xl font-semibold">Live timing, strategy and risk desk</h2>
          </div>
          <div className="rounded border border-border bg-background px-3 py-2 text-right">
            <div className="ops-label">Data state</div>
            <div className={cn("text-sm font-semibold", active && "text-green-sector")}>
              {active ? "Active" : "Blank"}
            </div>
          </div>
        </div>
        {liveTiming.status === "live" && (
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
            <div>Event: {liveTiming.event_name || "Live timing event"}</div>
            <div>Track: {liveTiming.track || "Unknown"}</div>
            <div>Session: {liveTiming.heat || liveTiming.session || "Active"}</div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {operationChips.map((chip) => (
            <StatusChip key={chip.label} label={chip.label} value={chip.value} tone={chip.tone} />
          ))}
        </div>
      </div>
      {active ? (
        <>
          <div className="grid gap-3 p-3 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-md border border-border bg-background/60 p-3">
              <div className="ops-label">Race Pressure Index</div>
              {pressureRows.length ? (
                <>
                  <div className="mt-3 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pressureRows}>
                        <CartesianGrid
                          stroke="var(--border)"
                          strokeDasharray="2 4"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="value" fill="var(--racing-red)" isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {explainConclusionChart("Race Pressure Index", pressureRows)}
                  </p>
                </>
              ) : (
                <div className="mt-3">
                  <EmptyState>Race Pressure Index is waiting for timing rows.</EmptyState>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Metric
                icon={<Timer className="h-4 w-4" />}
                label="Leader"
                value={leader ? `#${leader.car_no}` : sampleMode ? "L186-190" : "Awaiting"}
                tone="red"
              />
              <Metric
                icon={<Fuel className="h-4 w-4" />}
                label="Closest same-lap"
                value={
                  chaser
                    ? `#${chaser.car_no} ${gapInfo(chaser.gap).label}`
                    : sampleMode
                      ? "+0.8L"
                      : "Awaiting"
                }
                tone="yellow"
              />
              <Metric
                icon={<Thermometer className="h-4 w-4" />}
                label="Last lap"
                value={leader?.last_lap || (sampleMode ? "62%" : "Awaiting")}
                tone="green"
              />
              <Metric
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Risk watch"
                value={leader?.state || (sampleMode ? "Traffic" : "Awaiting")}
              />
            </div>
          </div>
          <div className="grid gap-3 px-3 pb-3">
            <ConclusionChartTile title="Top 10 Pace Delta" rows={paceDeltaRows} />
            <ConclusionChartTile title="Pit Exposure" rows={pitExposureRows} />
            <ConclusionChartTile title="Class Threat" rows={classThreatRows} />
          </div>
          <div className="grid gap-2 px-3 pb-3 md:grid-cols-3">
            {cards.map((card) => (
              <div key={card.title} className="engineer-call">
                <strong>{card.title}</strong>
                <p>{card.detail}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="p-3">
          <EmptyState>
            Operations core is blank. Load full sample or connect live telemetry/commentary to
            start.
          </EmptyState>
        </div>
      )}
    </section>
  );
}

function TelemetryStack({
  telemetryUrl,
  sampleVersion,
  clearVersion,
  active,
  liveTiming,
  sampleMode,
  onCircuitReportChange,
}: {
  telemetryUrl: string;
  sampleVersion: number;
  clearVersion: number;
  active: boolean;
  liveTiming: LiveTimingSnapshot;
  sampleMode: boolean;
  onCircuitReportChange: (report: CircuitReport | null) => void;
}) {
  const sampleData = useLiveSeries(32);
  const data = sampleMode ? sampleData : buildTelemetrySeries(liveTiming.standings);
  const leader = liveTiming.standings[0];
  const topSpeed = leader?.sectors?.find((sector) => sector.speed)?.speed;
  const strategy = sampleMode
    ? { tireStatus: "62%", fuelMargin: "0.8L", pitWindow: "L186", traffic: "Clear" }
    : liveStrategyMetrics(liveTiming.standings);
  const conclusion = telemetryConclusion(liveTiming.standings, sampleMode);
  return (
    <aside className="right-stack">
      <section className="ops-panel p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="ops-label">Live Telemetry</div>
            <div className="mt-1 max-w-[260px] truncate text-[11px] text-muted-foreground">
              Source: {telemetryUrl || "no telemetry source"}
            </div>
          </div>
          <Radio className="h-4 w-4 text-red-racing" />
        </div>
        {active ? (
          <>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <StatusChip
                label="Speed"
                value={topSpeed ? String(topSpeed) : sampleMode ? "307" : "Awaiting"}
                tone="red"
              />
              <StatusChip
                label="Best"
                value={leader?.fastest_lap || (sampleMode ? "4" : "Awaiting")}
                tone="yellow"
              />
              <StatusChip
                label="Pit"
                value={
                  leader?.pit_count ? String(leader.pit_count) : sampleMode ? "18%" : "Awaiting"
                }
              />
            </div>
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="lap" hide />
                  <YAxis hide domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                  <Tooltip {...tooltipStyle} />
                  <Area
                    dataKey="car"
                    stroke="var(--foreground)"
                    fill="var(--foreground)"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Area
                    dataKey="rival"
                    stroke="var(--racing-red)"
                    fill="var(--racing-red)"
                    fillOpacity={0.18}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="engineer-call mt-3">
              <strong>Telemetry conclusion</strong>
              <p>{conclusion}</p>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <EmptyState>
              Telemetry is blank until a source is applied or sample data is loaded.
            </EmptyState>
          </div>
        )}
      </section>
      <section className="ops-panel p-3">
        <div className="ops-label">Strategy Impact</div>
        {active && strategy ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric
              icon={<Thermometer className="h-4 w-4" />}
              label="Tire status"
              value={strategy.tireStatus}
              tone="green"
            />
            <Metric
              icon={<Fuel className="h-4 w-4" />}
              label="Fuel margin"
              value={strategy.fuelMargin}
              tone="yellow"
            />
            <Metric
              icon={<Timer className="h-4 w-4" />}
              label="Pit window"
              value={strategy.pitWindow}
              tone="red"
            />
            <Metric
              icon={<Activity className="h-4 w-4" />}
              label="Traffic"
              value={strategy.traffic}
            />
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState>Strategy impact is waiting for telemetry or sample data.</EmptyState>
          </div>
        )}
      </section>
      <CircuitReportPanel
        sampleVersion={sampleVersion}
        clearVersion={clearVersion}
        onReportChange={onCircuitReportChange}
      />
    </aside>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "neutral" | "red" | "green" | "yellow";
}) {
  return (
    <div className="metric-box">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <strong
        className={cn(
          "mt-1 block text-lg",
          tone === "red" && "text-red-racing",
          tone === "green" && "text-green-sector",
          tone === "yellow" && "text-yellow-sector",
        )}
      >
        {value}
      </strong>
    </div>
  );
}

function RaceControlFeed({
  intelligence,
  liveTiming,
  sampleMode,
}: {
  intelligence: LiveIntelligenceSnapshot;
  liveTiming: LiveTimingSnapshot;
  sampleMode: boolean;
}) {
  const liveEvents = intelligence.timeline.slice(0, 4).map((event) => ({
    t: "LIVE",
    kind: event.event_type?.toUpperCase() || "INTEL",
    msg: event.detail || event.title,
  }));
  const timingEvents = liveTimingEvents(liveTiming.standings);
  const events = dedupeByMessage([
    ...liveEvents,
    ...timingEvents,
    ...(sampleMode && liveEvents.length ? SEED_EVENTS : []),
  ]).slice(0, 8);
  return (
    <section className="ops-panel p-3">
      <div className="ops-label flex items-center gap-2">
        <Flag className="h-3.5 w-3.5 text-red-racing" />
        Live Event Feed
      </div>
      <div className="mt-3 grid gap-2">
        {events.length === 0 && (
          <EmptyState>Event feed is blank until sample or commentary data runs.</EmptyState>
        )}
        {events.map((event, index) => (
          <div key={`${event.t}-${index}`} className="event-line">
            <span className="event-kind">{event.kind}</span>
            <p>{event.msg}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AIEngineerPanel({
  intelligence,
  liveTiming,
  sampleMode,
}: {
  intelligence: LiveIntelligenceSnapshot;
  liveTiming: LiveTimingSnapshot;
  sampleMode: boolean;
}) {
  const latest = intelligence.summaries[0]?.summary;
  const alerts = sampleMode
    ? AI_ALERTS.slice(0, 3)
    : liveEngineerAlerts(liveTiming.standings, latest);
  const active = alerts.length > 0;
  return (
    <section className="ops-panel p-3">
      <div className="ops-label flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-red-racing" />
        AI Race Engineer
      </div>
      <div className="mt-3 grid gap-2">
        {!active && <EmptyState>AI engineer alerts are blank until data is loaded.</EmptyState>}
        {active &&
          alerts.map((alert) => (
            <div key={alert.title} className="engineer-call">
              <strong>{alert.title}</strong>
              <p>{alert.msg}</p>
            </div>
          ))}
        {latest && !alerts.some((alert) => alert.title === "Broadcast intelligence") && (
          <div className="engineer-call border-red-racing/50">
            <strong>Broadcast intelligence</strong>
            <p>{latest}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function TireDegradationStrip({
  active,
  liveTiming,
  sampleMode,
}: {
  active: boolean;
  liveTiming: LiveTimingSnapshot;
  sampleMode: boolean;
}) {
  const tireData = sampleMode ? TIRE_DEG : liveTireDegradation(liveTiming.standings);
  const explanation = explainTireCurve(tireData, sampleMode, liveTiming.standings);
  return (
    <section className="ops-panel p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="ops-label">Tire Degradation Curve</div>
        {active && tireData.length > 0 && (
          <div className="rounded border border-border bg-background px-2 py-1 text-[10px] uppercase text-muted-foreground">
            AI explanation
          </div>
        )}
      </div>
      {active && tireData.length > 0 ? (
        <>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tireData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="lap" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Line
                  dataKey="soft"
                  stroke="var(--racing-red)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="medium"
                  stroke="var(--sector-yellow)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="hard"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="engineer-call mt-3">
            <strong>AI tire read</strong>
            <p>{explanation}</p>
          </div>
        </>
      ) : (
        <div className="mt-3">
          <EmptyState>
            Tire degradation chart is blank until sample or telemetry data runs.
          </EmptyState>
        </div>
      )}
    </section>
  );
}

function ConclusionChartTile({ title, rows }: { title: string; rows: ConclusionRow[] }) {
  const explanation = explainConclusionChart(title, rows);
  return (
    <div className="analysis-tile">
      <div className="ops-label">{title}</div>
      {rows.length ? (
        <div className="analysis-chart-grid">
          <div className="analysis-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill="var(--foreground)" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="analysis-explain">
            <strong>Conclusion</strong>
            <p>{explanation}</p>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <EmptyState>{title} is waiting for timing rows.</EmptyState>
        </div>
      )}
    </div>
  );
}

export function RaceCommandCenter() {
  const [intelligence, setIntelligence] =
    useState<LiveIntelligenceSnapshot>(EMPTY_LIVE_INTELLIGENCE);
  const [liveTiming, setLiveTiming] = useState<LiveTimingSnapshot>(EMPTY_LIVE_TIMING);
  const [circuitReport, setCircuitReport] = useState<CircuitReport | null>(null);
  const [telemetryUrl, setTelemetryUrl] = useState("");
  const [sampleVersion, setSampleVersion] = useState(0);
  const [clearVersion, setClearVersion] = useState(0);
  const [sampleMode, setSampleMode] = useState(false);
  const handleIntelligenceUpdate = useCallback((snapshot: LiveIntelligenceSnapshot) => {
    setIntelligence(snapshot);
  }, []);
  const loadFullSample = useCallback(() => {
    setTelemetryUrl(SAMPLE_TELEMETRY_URL);
    setLiveTiming(EMPTY_LIVE_TIMING);
    setCircuitReport(DEMO_CIRCUIT_REPORT);
    setIntelligence(DEMO_LIVE_INTELLIGENCE);
    setSampleMode(true);
    setSampleVersion((version) => version + 1);
  }, []);
  const clearAll = useCallback(() => {
    setTelemetryUrl("");
    void clearLiveTimingSource();
    setLiveTiming(EMPTY_LIVE_TIMING);
    setCircuitReport(null);
    setIntelligence(EMPTY_LIVE_INTELLIGENCE);
    setSampleMode(false);
    setClearVersion((version) => version + 1);
  }, []);
  const applyTelemetryUrl = useCallback(async (value: string) => {
    setTelemetryUrl(value);
    if (value === SAMPLE_TELEMETRY_URL) {
      setLiveTiming(EMPTY_LIVE_TIMING);
      setSampleMode(false);
      return;
    }
    try {
      const snapshot = await setLiveTimingSource(value);
      setLiveTiming(snapshot);
      setSampleMode(false);
    } catch (error) {
      setLiveTiming({
        ...EMPTY_LIVE_TIMING,
        source: value,
        status: "error",
        message: error instanceof Error ? error.message : "Live timing scrape failed.",
      });
      setSampleMode(false);
    }
  }, []);
  useEffect(() => {
    if (!telemetryUrl || telemetryUrl === SAMPLE_TELEMETRY_URL || sampleMode) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const snapshot = await getLiveTimingStatus();
        if (!cancelled && snapshot.source === telemetryUrl) {
          setLiveTiming(snapshot);
        }
      } catch {
        // Keep the last good timing snapshot visible; the backend exposes errors on the next good response.
      }
    };
    const id = window.setInterval(() => void refresh(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sampleMode, telemetryUrl]);
  const dashboardActive = Boolean(
    sampleMode ||
    liveTiming.status === "live" ||
    intelligence.summaries.length ||
    intelligence.timeline.length ||
    circuitReport,
  );
  const telemetryActive = sampleMode || liveTiming.status === "live";

  return (
    <main className="ops-shell">
      <HeaderBar circuitReport={circuitReport} />
      <TelemetrySourceBar
        telemetryUrl={telemetryUrl}
        onApplyTelemetryUrl={applyTelemetryUrl}
        onLoadFullSample={loadFullSample}
        onClearAll={clearAll}
        liveTiming={liveTiming}
      />
      <LiveStandings active={dashboardActive} liveTiming={liveTiming} sampleMode={sampleMode} />
      <div className="ops-layout">
        <EngineeringCorePanel
          intelligence={intelligence}
          active={dashboardActive}
          liveTiming={liveTiming}
          sampleMode={sampleMode}
          circuitReport={circuitReport}
        />
        <TelemetryStack
          telemetryUrl={telemetryUrl}
          sampleVersion={sampleVersion}
          clearVersion={clearVersion}
          active={telemetryActive}
          liveTiming={liveTiming}
          sampleMode={sampleMode}
          onCircuitReportChange={setCircuitReport}
        />
      </div>
      <div className="ops-bottom-grid">
        <LiveIntelligencePanel
          onUpdate={handleIntelligenceUpdate}
          sampleVersion={sampleVersion}
          clearVersion={clearVersion}
        />
        <RaceControlFeed
          intelligence={intelligence}
          liveTiming={liveTiming}
          sampleMode={sampleMode}
        />
      </div>
      <div className="ops-bottom-grid">
        <AIEngineerPanel
          intelligence={intelligence}
          liveTiming={liveTiming}
          sampleMode={sampleMode}
        />
        <IntelligenceTimeline snapshot={intelligence} liveTiming={liveTiming} />
      </div>
      <TireDegradationStrip
        active={telemetryActive}
        liveTiming={liveTiming}
        sampleMode={sampleMode}
      />
      <footer className="py-4 text-center text-[10px] uppercase leading-relaxed text-muted-foreground">
        <div>Shounak Shelke @May2026</div>
        <div>Project 2H4E Endurance Dashboard</div>
        <div>
          Specially Made for NLS, GT-World, LeMans, Spa, and all types of 4-24 hours Endurance
          series Formats
        </div>
      </footer>
    </main>
  );
}
