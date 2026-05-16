import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Brain,
  ChevronRight,
  CircleDot,
  Cloud,
  Droplet,
  Flag,
  Fuel,
  Gauge,
  Radio,
  Signal,
  Target,
  Thermometer,
  Timer,
  TrendingDown,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AI_ALERTS,
  RIVAL_RADAR,
  SECTOR_DATA,
  SEED_EVENTS,
  STINT_SEGMENTS,
  TIRE_DEG,
  useCars,
  useLiveSeries,
  useTick,
  type Car,
} from "./data";

/* ────────────────────────────────────────────────────────────────────────── */

function StatPill({
  label,
  value,
  accent = "text-foreground",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/40 border border-border">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn("font-mono-tele text-sm font-semibold", accent)}>{value}</span>
    </div>
  );
}

function PanelHeader({
  title,
  sub,
  accent,
}: {
  title: string;
  sub?: string;
  accent?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/30">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan live-dot" />
        <h3 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-foreground/90">
          {title}
        </h3>
        {sub && <span className="text-[10px] text-muted-foreground font-mono-tele">{sub}</span>}
      </div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        {accent}
      </div>
    </div>
  );
}

/* ── TOP BAR ──────────────────────────────────────────────────────────────── */

export function TopBar() {
  const [sampleOpen, setSampleOpen] = useState(false);
  const tick = useTick(1000);
  const elapsed = useMemo(() => {
    const total = 14 * 3600 + 32 * 60 + 18 + tick;
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [tick]);

  return (
    <div className="panel panel-glow scanline">
      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
        <div className="flex items-center gap-3 pr-4 border-r border-border">
          <div className="h-9 w-9 rounded-md bg-gradient-to-br from-primary to-[color:var(--neon-blue)] grid place-items-center glow-cyan">
            <Gauge className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Project 2H4E
            </div>
            <div className="text-sm font-semibold leading-tight">
              Race Engineering Command Center
            </div>
          </div>
        </div>

        <StatPill
          icon={<Timer className="h-3.5 w-3.5" />}
          label="Race"
          value={elapsed}
          accent="text-cyan"
        />
        <StatPill icon={<Flag className="h-3.5 w-3.5" />} label="Lap" value={`184 / 372`} />
        <StatPill
          icon={<CircleDot className="h-3.5 w-3.5 text-green-sector" />}
          label="Track"
          value={<span className="text-green-sector">GREEN</span>}
        />
        <StatPill
          icon={<AlertTriangle className="h-3.5 w-3.5 text-yellow-sector" />}
          label="SC"
          value={<span className="text-muted-foreground">CLEAR</span>}
        />
        <StatPill icon={<Cloud className="h-3.5 w-3.5" />} label="Weather" value="18°C · Dry" />
        <StatPill icon={<Thermometer className="h-3.5 w-3.5" />} label="Track" value="32°C" />
        <StatPill icon={<Wind className="h-3.5 w-3.5" />} label="Wind" value="6 kph NW" />

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/40 border border-border">
            <Signal className="h-3.5 w-3.5 text-green-sector" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">WS</span>
            <span className="font-mono-tele text-xs text-green-sector">LIVE</span>
            <span className="h-1.5 w-1.5 rounded-full bg-green-sector live-dot" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/40 border border-border">
            <Radio className="h-3.5 w-3.5 text-cyan" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Refresh
            </span>
            <span className="font-mono-tele text-xs">1.0 Hz</span>
          </div>
          <button
            onClick={() => setSampleOpen((value) => !value)}
            className="flex items-center gap-2 rounded-md border border-primary bg-primary px-3 py-1.5 text-[10px] font-bold uppercase text-primary-foreground transition-colors hover:bg-primary/80"
          >
            <Zap className="h-3.5 w-3.5" />
            Test Live Data
          </button>
        </div>
      </div>
      {sampleOpen && (
        <div className="border-t border-border bg-background/80 px-5 py-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              ["Telemetry", "#7 speed 307.4 kph | brake 18%"],
              ["Strategy", "L186 pit call | +6.4s undercut"],
              ["AI Alert", "Fuel margin critical | 91%"],
              ["Rival", "#911 pit likely within 3 laps"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border bg-secondary/30 p-2">
                <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
                <div className="mt-1 text-xs font-semibold text-foreground">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── LEFT SIDEBAR ────────────────────────────────────────────────────────── */

const CLASSES = ["All", "Hypercar", "LMP2", "GT3", "GT4"] as const;
const COMPOUNDS = [
  { c: "All", label: "All", color: "bg-foreground" },
  { c: "S", label: "Soft", color: "bg-red-racing" },
  { c: "M", label: "Medium", color: "bg-yellow-sector" },
  { c: "H", label: "Hard", color: "bg-foreground/80" },
  { c: "I", label: "Inter", color: "bg-green-sector" },
  { c: "W", label: "Wet", color: "bg-red-racing" },
] as const;

export function LeftSidebar({
  cls,
  setCls,
  manufacturer,
  setManufacturer,
  driver,
  setDriver,
  tire,
  setTire,
}: {
  cls: string;
  setCls: (s: string) => void;
  manufacturer: string;
  setManufacturer: (s: string) => void;
  driver: string;
  setDriver: (s: string) => void;
  tire: string;
  setTire: (s: string) => void;
}) {
  const manufacturers = [
    "All",
    "Toyota",
    "Porsche",
    "Ferrari",
    "Cadillac",
    "Peugeot",
    "Alpine",
    "Aston",
    "Corvette",
    "Oreca",
    "BMW",
    "Mercedes",
    "McLaren",
    "Lamborghini",
    "Ford",
  ];
  const drivers = [
    "#7 Conway",
    "#8 Buemi",
    "#6 Estre",
    "#51 Pier Guidi",
    "#2 Bamber",
    "#5 Campbell",
  ];

  return (
    <aside className="panel panel-glow flex flex-col gap-4 p-4 h-full">
      <Section label="Class">
        <div className="grid grid-cols-3 gap-1.5">
          {CLASSES.map((c) => (
            <button
              key={c}
              onClick={() => setCls(c)}
              className={cn(
                "px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border transition-colors",
                cls === c
                  ? "bg-primary text-primary-foreground border-primary glow-cyan"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Manufacturer">
        <select
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm font-mono-tele focus:border-primary focus:outline-none"
        >
          {manufacturers.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Section>

      <Section label="Driver focus">
        <div className="flex flex-col gap-1">
          {drivers.map((d) => (
            <button
              key={d}
              onClick={() => setDriver(d)}
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs border transition-colors text-left",
                driver === d
                  ? "border-primary bg-primary/10 text-cyan"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40",
              )}
            >
              <span className="font-mono-tele">{d}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            </button>
          ))}
        </div>
      </Section>

      <Section label="Compound">
        <div className="grid grid-cols-3 gap-1.5">
          {COMPOUNDS.map((c) => (
            <button
              key={c.c}
              onClick={() => setTire(c.c)}
              className={cn(
                "h-9 rounded-md grid place-items-center text-[10px] font-bold border transition-all",
                tire === c.c
                  ? "border-primary scale-105"
                  : "border-border opacity-60 hover:opacity-100",
              )}
            >
              <span
                className={cn(
                  "min-h-5 min-w-5 px-1 rounded-full grid place-items-center text-background",
                  c.color,
                )}
              >
                {c.c}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section label="Battles" expanded>
        <div className="space-y-2">
          {[
            { p1: "#7 Conway", p2: "#8 Buemi", delta: "0.412", lap: 184 },
            { p1: "#6 Estre", p2: "#51 Pier Guidi", delta: "1.218", lap: 184 },
            { p1: "#92 Malykhin", p2: "#33 Keating", delta: "0.087", lap: 171 },
          ].map((b, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-background/40 p-2.5 hover:border-primary/60 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono-tele">{b.p1}</span>
                <span className="text-cyan font-mono-tele font-bold">{b.delta}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                <span className="font-mono-tele">vs {b.p2}</span>
                <span className="font-mono-tele">L{b.lap}</span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-[color:var(--racing-red)]"
                  style={{ width: `${Math.max(8, 100 - parseFloat(b.delta) * 50)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </aside>
  );
}

function Section({
  label,
  children,
  expanded,
}: {
  label: string;
  children: React.ReactNode;
  expanded?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
          {label}
        </span>
        {expanded && <span className="text-[9px] text-cyan font-mono-tele">LIVE</span>}
      </div>
      {children}
    </div>
  );
}

/* ── LEADERBOARD ─────────────────────────────────────────────────────────── */

const TIRE_COLOR: Record<string, string> = {
  S: "bg-red-racing text-background",
  M: "bg-yellow-sector text-background",
  H: "bg-foreground text-background",
  I: "bg-green-sector text-background",
  W: "bg-red-racing text-background",
};

const STATE_COLOR: Record<Car["state"], string> = {
  RUN: "text-green-sector",
  PIT: "text-purple-sector",
  OUT: "text-yellow-sector",
  DNF: "text-red-racing",
};

export function Leaderboard({
  cls,
  manufacturer,
  tire,
}: {
  cls: string;
  manufacturer: string;
  tire: string;
}) {
  const [limit, setLimit] = useState<15 | 30 | 50 | "all">(15);
  const { cars, flashId } = useCars();
  const filtered = cars.filter(
    (c) =>
      (cls === "All" || c.cls === cls) &&
      (manufacturer === "All" || c.manufacturer === manufacturer) &&
      (tire === "All" || c.tire === tire),
  );
  const visible = limit === "all" ? filtered : filtered.slice(0, limit);
  return (
    <div className="panel live-timing-panel">
      <PanelHeader
        title="Live Timing"
        sub={`top ${visible.length} / ${filtered.length} cars`}
        accent={
          <div className="flex items-center gap-1">
            {[15, 30, 50, "all" as const].map((value) => (
              <button
                key={value}
                onClick={() => setLimit(value)}
                className={cn(
                  "rounded border px-2 py-1 text-[10px] uppercase transition-colors",
                  limit === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "all" ? "All" : value}
              </button>
            ))}
          </div>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono-tele">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              {[
                "#",
                "No",
                "Team / Driver",
                "Cls",
                "Laps",
                "Gap",
                "Last",
                "Best",
                "Pit",
                "Tire",
                "Age",
                "Stint",
                "St",
              ].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((c, i) => (
              <tr
                key={c.no}
                className={cn(
                  "border-b border-border/50 hover:bg-secondary/40 transition-colors",
                  flashId === c.no && "flash",
                )}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{i + 1}</span>
                    {c.posDelta > 0 && <TrendingUp className="h-3 w-3 text-green-sector" />}
                    {c.posDelta < 0 && <TrendingDown className="h-3 w-3 text-red-racing" />}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-block min-w-[2.4rem] text-center px-1.5 py-0.5 rounded bg-secondary border border-border font-bold">
                    {c.no}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="font-semibold text-foreground">{c.driver}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {c.team} | {c.car}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-cyan border border-primary/30">
                    {c.cls}
                  </span>
                </td>
                <td className="px-3 py-2">{c.laps}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.gap}</td>
                <td className="px-3 py-2 text-cyan">{c.last}</td>
                <td className="px-3 py-2 text-purple-sector">{c.best}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.pits}</td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "inline-grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                      TIRE_COLOR[c.tire],
                    )}
                  >
                    {c.tire}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span>{c.tireAge}</span>
                    <div className="h-1 w-12 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full",
                          c.tireAge > 25
                            ? "bg-red-racing"
                            : c.tireAge > 15
                              ? "bg-yellow-sector"
                              : "bg-green-sector",
                        )}
                        style={{ width: `${Math.min(100, (c.tireAge / 35) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{c.stint}</td>
                <td className={cn("px-3 py-2 font-bold", STATE_COLOR[c.state])}>{c.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── LIVE GAP CHART ──────────────────────────────────────────────────────── */

const tooltipStyle = {
  contentStyle: {
    background: "oklch(0.12 0 0)",
    border: "1px solid oklch(0.30 0 0)",
    borderRadius: 6,
    fontSize: 11,
    fontFamily: "Google Sans, Arial, Helvetica, sans-serif",
  },
  labelStyle: { color: "var(--neon-cyan)" },
  itemStyle: { color: "white" },
};

export function LiveGapChart() {
  const data = useLiveSeries();
  return (
    <div className="panel h-full">
      <PanelHeader
        title="Live Pace · #7 vs #8 (rival)"
        sub="lap time (s)"
        accent={<span className="text-cyan">Δ {data[data.length - 1].delta.toFixed(3)}s</span>}
      />
      <div className="p-3 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--racing-red)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--racing-red)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.30 0 0)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="lap"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 0.3", "dataMax + 0.3"]}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip {...tooltipStyle} />
            <Area
              type="monotone"
              dataKey="car"
              stroke="var(--neon-cyan)"
              strokeWidth={2}
              fill="url(#g1)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="rival"
              stroke="var(--racing-red)"
              strokeWidth={2}
              fill="url(#g2)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── STRATEGY PREDICTION ─────────────────────────────────────────────────── */

export function StrategyPrediction() {
  return (
    <div className="panel panel-glow">
      <PanelHeader
        title="Strategy Engine"
        sub="optimal window"
        accent={<span className="text-cyan">AI</span>}
      />
      <div className="p-4 grid grid-cols-2 gap-3">
        <Metric
          label="Pit Window"
          value="L186 – L189"
          accent="text-cyan"
          sub="3 laps"
          icon={<Target className="h-3.5 w-3.5" />}
        />
        <Metric
          label="Undercut Gain"
          value="+6.4s"
          accent="text-green-sector"
          sub="vs #6 Porsche"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <Metric
          label="Overcut Risk"
          value="−2.1s"
          accent="text-red-racing"
          sub="traffic +3s"
          icon={<TrendingDown className="h-3.5 w-3.5" />}
        />
        <Metric
          label="Clean Air"
          value="18.4s"
          accent="text-foreground"
          sub="3 laps"
          icon={<Wind className="h-3.5 w-3.5" />}
        />
      </div>
      <div className="px-4 pb-4">
        <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-cyan shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-cyan">Recommendation</div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Box car <span className="text-foreground font-semibold">#7</span> in{" "}
                <span className="text-foreground font-semibold">L186</span> for Medium compound. Net
                position gain projected <span className="text-green-sector">+1 place</span> after
                rival cycle.
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Confidence value={0.87} />
                <button className="ml-auto text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-primary text-primary-foreground font-bold glow-cyan">
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  sub,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={cn("text-xl font-mono-tele font-bold mt-1", accent)}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Confidence({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Conf</span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-[color:var(--neon-blue)]"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-[10px] font-mono-tele text-cyan">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

/* ── STINT TIMELINE ──────────────────────────────────────────────────────── */

const COMPOUND_BG: Record<string, string> = {
  S: "bg-red-racing",
  M: "bg-yellow-sector",
  H: "bg-foreground/80",
  I: "bg-green-sector",
  W: "bg-red-racing",
};

export function StintTimeline() {
  const maxLap = 200;
  return (
    <div className="panel">
      <PanelHeader
        title="Stint Timeline"
        sub="lap progression"
        accent={
          <>
            <span className="bg-red-racing/80 inline-block h-2 w-2 rounded-full" /> S{" "}
            <span className="bg-yellow-sector/80 inline-block h-2 w-2 rounded-full ml-2" /> M{" "}
            <span className="bg-foreground/80 inline-block h-2 w-2 rounded-full ml-2" /> H
          </>
        }
      />
      <div className="p-4 space-y-3">
        {STINT_SEGMENTS.map((s) => (
          <div key={s.car} className="flex items-center gap-3">
            <div className="w-10 text-xs font-mono-tele font-bold">{s.car}</div>
            <div className="flex-1 relative h-6 rounded bg-background/60 border border-border overflow-hidden">
              {s.segs.map((seg, i) => (
                <div
                  key={i}
                  className={cn("absolute top-0 bottom-0", COMPOUND_BG[seg.c])}
                  style={{
                    left: `${(seg.from / maxLap) * 100}%`,
                    width: `${((seg.to - seg.from) / maxLap) * 100}%`,
                    opacity: 0.75,
                    borderRight: "1px solid oklch(0.12 0 0)",
                  }}
                  title={`${seg.c} · L${seg.from}-L${seg.to}`}
                />
              ))}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-cyan glow-cyan"
                style={{ left: `${(184 / maxLap) * 100}%` }}
              />
            </div>
            <div className="w-12 text-right text-[10px] font-mono-tele text-muted-foreground">
              L{s.segs[s.segs.length - 1].to}
            </div>
          </div>
        ))}
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono-tele pl-12 pr-14">
          <span>L0</span>
          <span>L50</span>
          <span>L100</span>
          <span>L150</span>
          <span>L200</span>
        </div>
      </div>
    </div>
  );
}

/* ── EVENT FEED ──────────────────────────────────────────────────────────── */

const KIND_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  OVERTAKE: { dot: "bg-cyan", text: "text-cyan", label: "OVERTAKE" },
  PIT: { dot: "bg-purple-sector", text: "text-purple-sector", label: "PIT" },
  FASTEST: { dot: "bg-yellow-sector", text: "text-yellow-sector", label: "FASTEST" },
  FLAG: { dot: "bg-yellow-sector", text: "text-yellow-sector", label: "FLAG" },
  INCIDENT: { dot: "bg-red-racing", text: "text-red-racing", label: "INCIDENT" },
  STRATEGY: {
    dot: "bg-[color:var(--neon-blue)]",
    text: "text-[color:var(--neon-blue)]",
    label: "STRATEGY",
  },
};

export function EventFeed() {
  return (
    <div className="panel h-full flex flex-col">
      <PanelHeader
        title="Live Event Feed"
        sub="all classes"
        accent={
          <span className="text-cyan flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan live-dot" />
            STREAMING
          </span>
        }
      />
      <div className="flex-1 overflow-y-auto max-h-[420px]">
        {SEED_EVENTS.map((e, i) => {
          const s = KIND_STYLE[e.kind];
          return (
            <div
              key={i}
              className="px-4 py-2.5 border-b border-border/40 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", s.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-[10px] uppercase tracking-widest font-bold", s.text)}>
                      {s.label}
                    </span>
                    <span className="font-mono-tele text-[10px] text-muted-foreground">{e.t}</span>
                  </div>
                  <p className="text-xs text-foreground/90 mt-0.5 leading-snug">{e.msg}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── AI ENGINEER ─────────────────────────────────────────────────────────── */

const LEVEL_STYLE: Record<
  string,
  { border: string; text: string; bg: string; icon: React.ReactNode }
> = {
  crit: {
    border: "border-red-racing/60",
    text: "text-red-racing",
    bg: "bg-red-racing/10",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  warn: {
    border: "border-yellow-sector/60",
    text: "text-yellow-sector",
    bg: "bg-yellow-sector/10",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  info: {
    border: "border-primary/60",
    text: "text-cyan",
    bg: "bg-primary/5",
    icon: <Brain className="h-3.5 w-3.5" />,
  },
};

export function AIEngineer() {
  return (
    <div className="panel">
      <PanelHeader
        title="AI Race Engineer"
        sub="recommendations"
        accent={<span className="text-cyan">5 active</span>}
      />
      <div className="p-3 space-y-2 max-h-[360px] overflow-y-auto">
        {AI_ALERTS.map((a, i) => {
          const s = LEVEL_STYLE[a.level];
          return (
            <div key={i} className={cn("rounded-md border p-3", s.border, s.bg)}>
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold",
                    s.text,
                  )}
                >
                  {s.icon}
                  {a.title}
                </div>
                <span className="text-[10px] font-mono-tele text-muted-foreground">
                  {(a.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-foreground/85 mt-1.5 leading-snug">{a.msg}</p>
              <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    "h-full",
                    a.level === "crit"
                      ? "bg-red-racing"
                      : a.level === "warn"
                        ? "bg-yellow-sector"
                        : "bg-cyan",
                  )}
                  style={{ width: `${a.confidence * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── TIRE & FUEL ─────────────────────────────────────────────────────────── */

export function TireStrategy() {
  return (
    <div className="panel">
      <PanelHeader
        title="Tire Engineering"
        sub="#7 GR010"
        accent={<span className="text-yellow-sector">MEDIUM · 14 laps</span>}
      />
      <div className="p-4 grid grid-cols-3 gap-3">
        <Metric
          label="Age"
          value="14"
          sub="laps"
          accent="text-yellow-sector"
          icon={<Droplet className="h-3.5 w-3.5" />}
        />
        <Metric
          label="Life left"
          value="62%"
          sub="est."
          accent="text-green-sector"
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <Metric
          label="Pace loss"
          value="0.18s"
          sub="per lap"
          accent="text-red-racing"
          icon={<TrendingDown className="h-3.5 w-3.5" />}
        />
      </div>
      <div className="px-3 pb-3 h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={TIRE_DEG} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="oklch(0.30 0 0)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="lap"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `+${v.toFixed(1)}s`}
            />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine
              x={14}
              stroke="var(--neon-cyan)"
              strokeDasharray="3 3"
              label={{ value: "NOW", fill: "var(--neon-cyan)", fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="soft"
              stroke="var(--racing-red)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="medium"
              stroke="var(--sector-yellow)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="hard"
              stroke="var(--color-foreground)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function FuelStrategy() {
  const tick = useTick(2000);
  const burn = 3.42 + Math.sin(tick / 4) * 0.04;
  const remaining = 11 - (tick % 5);
  return (
    <div className="panel">
      <PanelHeader
        title="Fuel Strategy"
        sub="#7 GR010"
        accent={<span className="text-yellow-sector">SAVE MODE 2</span>}
      />
      <div className="p-4 grid grid-cols-2 gap-3">
        <Metric
          label="Burn"
          value={`${burn.toFixed(2)}`}
          sub="kg/lap"
          accent="text-cyan"
          icon={<Fuel className="h-3.5 w-3.5" />}
        />
        <Metric
          label="Laps left"
          value={`${Math.max(remaining, 6)}`}
          sub="estimated"
          accent="text-yellow-sector"
          icon={<Timer className="h-3.5 w-3.5" />}
        />
        <Metric label="Target" value="L186" sub="optimal stop" accent="text-foreground" />
        <Metric label="Margin" value="0.8L" sub="safety" accent="text-red-racing" />
      </div>
      <div className="px-4 pb-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Tank</div>
        <div className="h-3 rounded-full bg-background/60 border border-border overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[color:var(--racing-red)] via-[color:var(--sector-yellow)] to-[color:var(--neon-cyan)]"
            style={{ width: "38%" }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono-tele text-muted-foreground mt-1">
          <span>E</span>
          <span>38%</span>
          <span>F</span>
        </div>
      </div>
    </div>
  );
}

/* ── SECTORS / DEG CHARTS / RADAR ────────────────────────────────────────── */

export function SectorComparison() {
  return (
    <div className="panel">
      <PanelHeader title="Sector Comparison" sub="best · all classes" />
      <div className="p-3 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={SECTOR_DATA} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="oklch(0.30 0 0)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="car"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[27, 42]}
            />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="s1" stackId="a" fill="var(--neon-cyan)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="s2" stackId="a" fill="var(--sector-yellow)" />
            <Bar dataKey="s3" stackId="a" fill="var(--sector-purple)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RivalRadar() {
  return (
    <div className="panel">
      <PanelHeader
        title="Rival Analysis"
        sub="#7 vs #6 Porsche"
        accent={<span className="text-cyan">SCORE 89 / 86</span>}
      />
      <div className="p-3 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={RIVAL_RADAR}>
            <PolarGrid stroke="oklch(0.30 0 0)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            />
            <Radar
              dataKey="you"
              stroke="var(--neon-cyan)"
              fill="var(--neon-cyan)"
              fillOpacity={0.3}
            />
            <Radar
              dataKey="rival"
              stroke="var(--racing-red)"
              fill="var(--racing-red)"
              fillOpacity={0.2}
            />
            <Tooltip {...tooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── PIT WINDOW VISUALIZER ───────────────────────────────────────────────── */

export function PitWindow() {
  const cars = [
    { car: "#7", window: [186, 189], optimal: 187 },
    { car: "#8", window: [184, 188], optimal: 186 },
    { car: "#6", window: [188, 192], optimal: 190 },
    { car: "#51", window: [185, 190], optimal: 187 },
    { car: "#2", window: [183, 184], optimal: 183 },
  ];
  const min = 180,
    max = 196;
  const w = max - min;
  return (
    <div className="panel">
      <PanelHeader
        title="Pit Window Visualizer"
        sub="next 16 laps"
        accent={<span className="text-cyan">L184 NOW</span>}
      />
      <div className="p-4 space-y-2.5">
        {cars.map((c) => (
          <div key={c.car} className="flex items-center gap-3">
            <div className="w-10 text-xs font-mono-tele font-bold">{c.car}</div>
            <div className="flex-1 relative h-5 rounded bg-background/60 border border-border">
              <div
                className="absolute top-0 bottom-0 bg-primary/30 border-x border-primary"
                style={{
                  left: `${((c.window[0] - min) / w) * 100}%`,
                  width: `${((c.window[1] - c.window[0]) / w) * 100}%`,
                }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan glow-cyan"
                style={{ left: `${((c.optimal - min) / w) * 100}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-px bg-yellow-sector"
                style={{ left: `${((184 - min) / w) * 100}%` }}
              />
            </div>
            <div className="w-16 text-right text-[10px] font-mono-tele text-cyan">L{c.optimal}</div>
          </div>
        ))}
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono-tele pl-12 pr-20 pt-1">
          <span>L180</span>
          <span>L184</span>
          <span>L188</span>
          <span>L192</span>
          <span>L196</span>
        </div>
      </div>
    </div>
  );
}

/* ── TICKER ──────────────────────────────────────────────────────────────── */

export function Ticker() {
  const items = [
    "FCY CLEARED · SECTOR 6",
    "#6 PORSCHE FASTEST LAP 3:22.612",
    "#2 CADILLAC PIT IN — DRIVER CHANGE",
    "UNDERCUT WINDOW OPEN · #7",
    "TIRE TEMP NOMINAL · #8",
    "FUEL MARGIN CRITICAL · #51",
    "RAIN PROBABILITY 12% · NEXT HOUR",
    "TRACK TEMP 32°C · STABLE",
  ];
  const seq = [...items, ...items];
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center">
        <div className="px-3 py-2 bg-red-racing text-background text-[10px] font-bold uppercase tracking-widest shrink-0">
          RACE CONTROL
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div className="flex gap-8 whitespace-nowrap py-2 ticker">
            {seq.map((s, i) => (
              <span key={i} className="text-xs font-mono-tele text-muted-foreground">
                <span className="text-cyan mr-2">◆</span>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
