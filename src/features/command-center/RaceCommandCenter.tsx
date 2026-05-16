import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Download,
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
import { CircuitReportPanel } from "@/features/circuit-report/CircuitReportPanel";
import {
  EntityMentionCards,
  IntelligenceTimeline,
  LiveIntelligencePanel,
} from "@/features/live-intelligence/LiveIntelligencePanel";
import {
  AI_ALERTS,
  ALL_CARS,
  RACE_STATUS,
  SEED_EVENTS,
  TIRE_DEG,
  useCars,
  useLiveSeries,
  useTick,
} from "@/features/race-data/raceData";
import {
  DEMO_LIVE_INTELLIGENCE,
  type LiveIntelligenceSnapshot,
} from "@/features/live-intelligence/api";
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

function HeaderBar() {
  const tick = useTick(1000);
  const clock = useMemo(() => {
    const total = 14 * 3600 + 32 * 60 + 35 + tick;
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [tick]);

  return (
    <header className="ops-topbar">
      <div>
        <h1>Project 2H4E</h1>
        <div className="ops-label mt-1">
          Shounak Shelke | Live race intelligence and telemetry operations
        </div>
      </div>
      <div className="status-row">
        <StatusChip label="Race" value={clock} />
        <StatusChip label="Lap" value={RACE_STATUS.lap} />
        <StatusChip label="Track" value={RACE_STATUS.track} tone="green" />
        <StatusChip label="SC" value={RACE_STATUS.safetyCar} />
        <StatusChip label="Weather" value={RACE_STATUS.weather} />
      </div>
      <button className="ops-button print-hide" onClick={() => window.print()}>
        <Download className="h-4 w-4" />
        Print PDF
      </button>
    </header>
  );
}

function TelemetrySourceBar({
  telemetryUrl,
  setTelemetryUrl,
  onLoadFullSample,
}: {
  telemetryUrl: string;
  setTelemetryUrl: (value: string) => void;
  onLoadFullSample: () => void;
}) {
  const [draft, setDraft] = useState(telemetryUrl);
  const [status, setStatus] = useState("Waiting for telemetry source");

  function applyTelemetryLink() {
    const clean = draft.trim();
    setTelemetryUrl(clean);
    setStatus(
      clean ? "Telemetry link applied to all dashboard modules" : "Waiting for telemetry source",
    );
  }

  function useSampleTelemetryLink() {
    setDraft(SAMPLE_TELEMETRY_URL);
    setTelemetryUrl(SAMPLE_TELEMETRY_URL);
    setStatus("Sample telemetry link applied to all dashboard modules");
  }

  function clearTelemetryLink() {
    setDraft("");
    setTelemetryUrl("");
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
    </section>
  );
}

function LiveStandings() {
  const { cars, flashId } = useCars();
  const [limit, setLimit] = useState<15 | 30 | 50 | "all">(15);
  const visible = limit === "all" ? cars : cars.slice(0, limit);
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
            {visible.map((car, index) => (
              <tr key={car.no} className={cn("standings-row", flashId === car.no && "flash")}>
                <td className="px-2 py-2 font-semibold">{index + 1}</td>
                <td className="px-2 py-2">
                  <div className="font-semibold text-red-racing">#{car.no}</div>
                  <div className="text-[10px] text-muted-foreground">{car.manufacturer}</div>
                </td>
                <td className="px-2 py-2">{car.laps}</td>
                <td className="px-2 py-2">{car.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EngineeringCorePanel({ intelligence }: { intelligence: LiveIntelligenceSnapshot }) {
  const pace = useLiveSeries(42);
  const liveEvents = intelligence.timeline.slice(0, 3);
  return (
    <section className="ops-panel engineering-core">
      <div className="panel-pad border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="ops-label">Operations Core</div>
            <h2 className="mt-1 text-2xl font-semibold">Live timing, strategy and risk desk</h2>
          </div>
          <div className="rounded border border-border bg-background px-3 py-2 text-right">
            <div className="ops-label">Sample state</div>
            <div className="text-sm font-semibold text-green-sector">Ready for full-page demo</div>
          </div>
        </div>
      </div>
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
            label="Optimal pit window"
            value="L186-190"
            tone="red"
          />
          <Metric
            icon={<Fuel className="h-4 w-4" />}
            label="Fuel target"
            value="+0.8L"
            tone="yellow"
          />
          <Metric
            icon={<Thermometer className="h-4 w-4" />}
            label="Tire life"
            value="62%"
            tone="green"
          />
          <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Risk watch" value="Traffic" />
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
    </section>
  );
}

function TelemetryStack({
  telemetryUrl,
  sampleVersion,
}: {
  telemetryUrl: string;
  sampleVersion: number;
}) {
  const data = useLiveSeries(32);
  return (
    <aside className="right-stack">
      <section className="ops-panel p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="ops-label">Live Telemetry</div>
            <div className="mt-1 max-w-[260px] truncate text-[11px] text-muted-foreground">
              Source: {telemetryUrl || "demo telemetry stream"}
            </div>
          </div>
          <Radio className="h-4 w-4 text-red-racing" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <StatusChip label="Speed" value="307" tone="red" />
          <StatusChip label="Gear" value="4" tone="yellow" />
          <StatusChip label="Brake" value="18%" />
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
      </section>
      <section className="ops-panel p-3">
        <div className="ops-label">Strategy Impact</div>
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
          <Metric icon={<Timer className="h-4 w-4" />} label="Pit window" value="L186" tone="red" />
          <Metric icon={<Activity className="h-4 w-4" />} label="Traffic" value="Clear" />
        </div>
      </section>
      <CircuitReportPanel sampleVersion={sampleVersion} />
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
  const events = [...liveEvents, ...SEED_EVENTS].slice(0, 8);
  return (
    <section className="ops-panel p-3">
      <div className="ops-label flex items-center gap-2">
        <Flag className="h-3.5 w-3.5 text-red-racing" />
        Live Event Feed
      </div>
      <div className="mt-3 grid gap-2">
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
  return (
    <section className="ops-panel p-3">
      <div className="ops-label flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-red-racing" />
        AI Race Engineer
      </div>
      <div className="mt-3 grid gap-2">
        {AI_ALERTS.slice(0, 3).map((alert) => (
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

function TireDegradationStrip() {
  return (
    <section className="ops-panel p-3">
      <div className="ops-label">Tire Degradation Curve</div>
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
    </section>
  );
}

export function RaceCommandCenter() {
  const [intelligence, setIntelligence] =
    useState<LiveIntelligenceSnapshot>(DEMO_LIVE_INTELLIGENCE);
  const [telemetryUrl, setTelemetryUrl] = useState("");
  const [sampleVersion, setSampleVersion] = useState(0);
  const handleIntelligenceUpdate = useCallback((snapshot: LiveIntelligenceSnapshot) => {
    setIntelligence(snapshot);
  }, []);
  const loadFullSample = useCallback(() => {
    setTelemetryUrl(SAMPLE_TELEMETRY_URL);
    setIntelligence(DEMO_LIVE_INTELLIGENCE);
    setSampleVersion((version) => version + 1);
  }, []);

  return (
    <main className="ops-shell">
      <HeaderBar />
      <TelemetrySourceBar
        telemetryUrl={telemetryUrl}
        setTelemetryUrl={setTelemetryUrl}
        onLoadFullSample={loadFullSample}
      />
      <div className="ops-layout">
        <LiveStandings />
        <EngineeringCorePanel intelligence={intelligence} />
        <TelemetryStack telemetryUrl={telemetryUrl} sampleVersion={sampleVersion} />
      </div>
      <div className="ops-bottom-grid">
        <LiveIntelligencePanel onUpdate={handleIntelligenceUpdate} sampleVersion={sampleVersion} />
        <RaceControlFeed intelligence={intelligence} />
      </div>
      <div className="ops-bottom-grid">
        <AIEngineerPanel intelligence={intelligence} />
        <IntelligenceTimeline snapshot={intelligence} />
      </div>
      <EntityMentionCards snapshot={intelligence} />
      <TireDegradationStrip />
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
