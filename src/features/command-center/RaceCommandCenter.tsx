import { useCallback, useMemo, useState } from "react";
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
  EntityMentionCards,
  IntelligenceTimeline,
  LiveIntelligencePanel,
} from "@/features/live-intelligence/LiveIntelligencePanel";
import {
  AI_ALERTS,
  RACE_STATUS,
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
}: {
  active: boolean;
  liveTiming: LiveTimingSnapshot;
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
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Pos</th>
                <th className="px-2 py-2">Car</th>
                <th className="px-2 py-2">Driver</th>
                <th className="px-2 py-2">Lap</th>
                <th className="px-2 py-2">Gap</th>
                <th className="px-2 py-2">Last</th>
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
                      <div className="text-[10px] text-muted-foreground">{row.vehicle}</div>
                    </td>
                    <td className="px-2 py-2">{row.driver || row.team || "-"}</td>
                    <td className="px-2 py-2">{row.laps}</td>
                    <td className="px-2 py-2">{row.gap || "-"}</td>
                    <td className="px-2 py-2">{row.last_lap || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : active ? (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Pos</th>
                <th className="px-2 py-2">Car</th>
                <th className="px-2 py-2">Lap</th>
                <th className="px-2 py-2">Last</th>
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
                      <div className="text-[10px] text-muted-foreground">{car.manufacturer}</div>
                    </td>
                    <td className="px-2 py-2">{car.laps}</td>
                    <td className="px-2 py-2">{car.last}</td>
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
}: {
  intelligence: LiveIntelligenceSnapshot;
  active: boolean;
  liveTiming: LiveTimingSnapshot;
}) {
  const tick = useTick(1000);
  const operationsClock = useMemo(() => {
    const fromSource = formatTimingClock(liveTiming.time_of_day);
    if (fromSource) return fromSource;
    const total = 14 * 3600 + 32 * 60 + 35 + tick;
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [liveTiming.time_of_day, tick]);
  const pace = useLiveSeries(42);
  const liveEvents = intelligence.timeline.slice(0, 3);
  const leader = liveTiming.standings[0];
  const chaser = liveTiming.standings[1];
  const liveTrackState =
    String(liveTiming.track_state?.track_status || liveTiming.track_state?.status || "").trim() ||
    RACE_STATUS.safetyCar;
  const operationChips = [
    { label: "Race", value: operationsClock },
    { label: "Lap", value: leader?.laps ? `${leader.laps}` : RACE_STATUS.lap },
    { label: "Track", value: liveTiming.track || RACE_STATUS.track, tone: "green" as const },
    { label: "SC", value: liveTrackState },
    {
      label: "Weather",
      value: liveTiming.status === "live" ? "Awaiting weather" : RACE_STATUS.weather,
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
              <div className="ops-label">Gap Evolution</div>
              <div className="mt-3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pace}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="lap" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                    <Tooltip {...tooltipStyle} />
                    <Area
                      dataKey="car"
                      stroke="var(--foreground)"
                      fill="var(--foreground)"
                      fillOpacity={0.1}
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
            </div>
            <div className="grid gap-2">
              <Metric
                icon={<Timer className="h-4 w-4" />}
                label="Leader"
                value={leader ? `#${leader.car_no}` : "L186-190"}
                tone="red"
              />
              <Metric
                icon={<Fuel className="h-4 w-4" />}
                label="Gap to P2"
                value={chaser?.gap || "+0.8L"}
                tone="yellow"
              />
              <Metric
                icon={<Thermometer className="h-4 w-4" />}
                label="Last lap"
                value={leader?.last_lap || "62%"}
                tone="green"
              />
              <Metric
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Risk watch"
                value={leader?.state || "Traffic"}
              />
            </div>
          </div>
          <div className="grid gap-2 px-3 pb-3 md:grid-cols-3">
            {liveEvents.map((event) => (
              <div key={event.id} className="engineer-call">
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
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
  onCircuitReportChange,
}: {
  telemetryUrl: string;
  sampleVersion: number;
  clearVersion: number;
  active: boolean;
  liveTiming: LiveTimingSnapshot;
  onCircuitReportChange: (report: CircuitReport | null) => void;
}) {
  const data = useLiveSeries(32);
  const leader = liveTiming.standings[0];
  const topSpeed = leader?.sectors?.find((sector) => sector.speed)?.speed;
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
              <StatusChip label="Speed" value={topSpeed ? String(topSpeed) : "307"} tone="red" />
              <StatusChip label="Best" value={leader?.fastest_lap || "4"} tone="yellow" />
              <StatusChip
                label="Pit"
                value={leader?.pit_count ? String(leader.pit_count) : "18%"}
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
        {active ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric
              icon={<Thermometer className="h-4 w-4" />}
              label="Tire status"
              value="62%"
              tone="green"
            />
            <Metric
              icon={<Fuel className="h-4 w-4" />}
              label="Fuel margin"
              value="0.8L"
              tone="yellow"
            />
            <Metric
              icon={<Timer className="h-4 w-4" />}
              label="Pit window"
              value="L186"
              tone="red"
            />
            <Metric icon={<Activity className="h-4 w-4" />} label="Traffic" value="Clear" />
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

function RaceControlFeed({ intelligence }: { intelligence: LiveIntelligenceSnapshot }) {
  const liveEvents = intelligence.timeline.slice(0, 4).map((event) => ({
    t: "LIVE",
    kind: "STRATEGY",
    msg: `${event.title}: ${event.detail}`,
  }));
  const events = liveEvents.length ? [...liveEvents, ...SEED_EVENTS].slice(0, 8) : [];
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

function AIEngineerPanel({ intelligence }: { intelligence: LiveIntelligenceSnapshot }) {
  const latest = intelligence.summaries[0]?.summary;
  const active = Boolean(latest);
  return (
    <section className="ops-panel p-3">
      <div className="ops-label flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-red-racing" />
        AI Race Engineer
      </div>
      <div className="mt-3 grid gap-2">
        {!active && <EmptyState>AI engineer alerts are blank until data is loaded.</EmptyState>}
        {active &&
          AI_ALERTS.slice(0, 3).map((alert) => (
            <div key={alert.title} className="engineer-call">
              <strong>{alert.title}</strong>
              <p>{alert.msg}</p>
            </div>
          ))}
        {latest && (
          <div className="engineer-call border-red-racing/50">
            <strong>Broadcast intelligence</strong>
            <p>{latest}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function TireDegradationStrip({ active }: { active: boolean }) {
  return (
    <section className="ops-panel p-3">
      <div className="ops-label">Tire Degradation Curve</div>
      {active ? (
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TIRE_DEG}>
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

export function RaceCommandCenter() {
  const [intelligence, setIntelligence] =
    useState<LiveIntelligenceSnapshot>(EMPTY_LIVE_INTELLIGENCE);
  const [liveTiming, setLiveTiming] = useState<LiveTimingSnapshot>(EMPTY_LIVE_TIMING);
  const [circuitReport, setCircuitReport] = useState<CircuitReport | null>(null);
  const [telemetryUrl, setTelemetryUrl] = useState("");
  const [sampleVersion, setSampleVersion] = useState(0);
  const [clearVersion, setClearVersion] = useState(0);
  const handleIntelligenceUpdate = useCallback((snapshot: LiveIntelligenceSnapshot) => {
    setIntelligence(snapshot);
  }, []);
  const loadFullSample = useCallback(() => {
    setTelemetryUrl(SAMPLE_TELEMETRY_URL);
    setLiveTiming(EMPTY_LIVE_TIMING);
    setCircuitReport(DEMO_CIRCUIT_REPORT);
    setIntelligence(DEMO_LIVE_INTELLIGENCE);
    setSampleVersion((version) => version + 1);
  }, []);
  const clearAll = useCallback(() => {
    setTelemetryUrl("");
    void clearLiveTimingSource();
    setLiveTiming(EMPTY_LIVE_TIMING);
    setCircuitReport(null);
    setIntelligence(EMPTY_LIVE_INTELLIGENCE);
    setClearVersion((version) => version + 1);
  }, []);
  const applyTelemetryUrl = useCallback(async (value: string) => {
    setTelemetryUrl(value);
    if (value === SAMPLE_TELEMETRY_URL) {
      setLiveTiming(EMPTY_LIVE_TIMING);
      return;
    }
    try {
      const snapshot = await setLiveTimingSource(value);
      setLiveTiming(snapshot);
    } catch (error) {
      setLiveTiming({
        ...EMPTY_LIVE_TIMING,
        source: value,
        status: "error",
        message: error instanceof Error ? error.message : "Live timing scrape failed.",
      });
    }
  }, []);
  const dashboardActive = Boolean(
    sampleVersion > 0 ||
    liveTiming.status === "live" ||
    intelligence.summaries.length ||
    intelligence.timeline.length,
  );

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
      <div className="ops-layout">
        <LiveStandings active={dashboardActive} liveTiming={liveTiming} />
        <EngineeringCorePanel
          intelligence={intelligence}
          active={dashboardActive}
          liveTiming={liveTiming}
        />
        <TelemetryStack
          telemetryUrl={telemetryUrl}
          sampleVersion={sampleVersion}
          clearVersion={clearVersion}
          active={dashboardActive}
          liveTiming={liveTiming}
          onCircuitReportChange={setCircuitReport}
        />
      </div>
      <div className="ops-bottom-grid">
        <LiveIntelligencePanel
          onUpdate={handleIntelligenceUpdate}
          sampleVersion={sampleVersion}
          clearVersion={clearVersion}
        />
        <RaceControlFeed intelligence={intelligence} />
      </div>
      <div className="ops-bottom-grid">
        <AIEngineerPanel intelligence={intelligence} />
        <IntelligenceTimeline snapshot={intelligence} />
      </div>
      <EntityMentionCards snapshot={intelligence} />
      <TireDegradationStrip active={dashboardActive} />
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
