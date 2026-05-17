import { useEffect, useMemo, useState } from "react";
import { Bot, Captions, Clock, Radio, Send, X } from "lucide-react";
import {
  clearCommentarySources,
  DEMO_LIVE_INTELLIGENCE,
  EMPTY_LIVE_INTELLIGENCE,
  makeClientCommentarySnapshot,
  setCommentarySources,
  summarizeNow,
  type LiveIntelligenceSnapshot,
} from "./api";
import type { LiveTimingSnapshot } from "@/features/race-data/liveTimingApi";

function modeLabel(mode: string) {
  if (mode === "blank") return "Waiting";
  return mode === "demo-fallback" || mode === "demo" ? "Demo fallback" : "Connected";
}

function splitLinks(value: string) {
  return value
    .split(/[\s,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function conciseTimelineDetail(detail: string) {
  if (!detail.includes("Commentary source connected:")) return detail;
  return "Broadcast metadata is connected. Use live timing for confirmed gaps, pit calls, and incidents until captions become available.";
}

function timelineLapLoss(row: Record<string, unknown>) {
  const parse = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    const clean = String(value).replace("+", "");
    const parts = clean.split(":").map(Number);
    if (parts.some((part) => Number.isNaN(part))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return Number.isFinite(parts[0]) ? parts[0] : null;
  };
  const last = parse(row.last_lap);
  const best = parse(row.fastest_lap);
  return last !== null && best !== null ? Math.max(0, last - best) : 0;
}

function timelineGapLabel(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "unknown gap";
  if (/lap/i.test(text)) return `lap-status separation (${text.replace(/-/g, "").trim()})`;
  return `${text} timed gap`;
}

function timingTimelineEvents(liveTiming?: LiveTimingSnapshot) {
  const rows = liveTiming?.standings || [];
  const leader = rows[0];
  if (!leader) return [];
  const leaderLaps = String(leader.laps || "");
  const sameLap = rows
    .slice(1)
    .find((row) => String(row.laps || "") === leaderLaps && !/lap/i.test(String(row.gap || "")));
  return [
    {
      id: -1,
      title: `Timing-confirmed leader #${leader.car_no}`,
      event_type: "timing",
      car_no: `#${leader.car_no}`,
      detail: `${leader.driver || leader.team || "Leader"} leads on lap ${leader.laps || "-"} with ${timelineLapLoss(
        leader as unknown as Record<string, unknown>,
      ).toFixed(2)}s last-vs-best loss and ${leader.pit_count || "0"} stops.`,
    },
    {
      id: -2,
      title: sameLap ? `Same-lap pressure #${sameLap.car_no}` : "No direct same-lap pressure",
      event_type: "analysis",
      car_no: sameLap ? `#${sameLap.car_no}` : null,
      detail: sameLap
        ? `Closest same-lap car is ${timelineGapLabel(sameLap.gap)}; use this for pit-cover decisions.`
        : "Top visible rivals are separated by lap status or unknown gaps, so do not present them as direct attack pressure.",
    },
  ];
}

export function LiveIntelligencePanel({
  onUpdate,
  sampleVersion = 0,
  clearVersion = 0,
}: {
  onUpdate: (snapshot: LiveIntelligenceSnapshot) => void;
  sampleVersion?: number;
  clearVersion?: number;
}) {
  const [urlInput, setUrlInput] = useState("");
  const [snapshot, setSnapshot] = useState<LiveIntelligenceSnapshot>(EMPTY_LIVE_INTELLIGENCE);
  const [status, setStatus] = useState("Waiting for commentary links");
  const latest = snapshot.summaries[0];
  const entities = useMemo(
    () =>
      Array.from(
        new Map(
          snapshot.entities.map((entity) => [
            `${entity.entity_type}:${entity.label}`.toLowerCase(),
            entity,
          ]),
        ).values(),
      ).slice(0, 10),
    [snapshot.entities],
  );
  const sourceLinks = useMemo(
    () =>
      (snapshot.sources?.length ? snapshot.sources : snapshot.source ? [snapshot.source] : [])
        .map((source) => String(source.url || ""))
        .filter(Boolean),
    [snapshot.source, snapshot.sources],
  );

  useEffect(() => {
    if (sampleVersion > 0) {
      setUrlInput(String(DEMO_LIVE_INTELLIGENCE.source?.url || ""));
      setSnapshot(DEMO_LIVE_INTELLIGENCE);
      onUpdate(DEMO_LIVE_INTELLIGENCE);
      setStatus("Full sample intelligence loaded");
    }
  }, [onUpdate, sampleVersion]);

  useEffect(() => {
    if (clearVersion > 0) {
      setUrlInput("");
      setSnapshot(EMPTY_LIVE_INTELLIGENCE);
      onUpdate(EMPTY_LIVE_INTELLIGENCE);
      setStatus("Waiting for commentary links");
    }
  }, [clearVersion, onUpdate]);

  async function connectSources() {
    const urls = splitLinks(urlInput);
    if (!urls.length) {
      setStatus("Add at least one commentary link");
      return;
    }
    setStatus("Connecting");
    try {
      const response = await setCommentarySources(urls);
      const usesNonSampleSource = urls.some((url) => !url.includes("project2h4e-demo"));
      const returnedDemoFallback =
        response.mode === "demo-fallback" ||
        response.summaries.some(
          (summary) => summary.provider === "demo" && summary.status === "demo",
        );
      const data =
        usesNonSampleSource && returnedDemoFallback ? makeClientCommentarySnapshot(urls) : response;
      setSnapshot(data);
      onUpdate(data);
      setStatus("Connected");
    } catch {
      const data = makeClientCommentarySnapshot(urls);
      setSnapshot(data);
      onUpdate(data);
      setStatus("Connected with browser metadata");
    }
  }

  async function forceSummary() {
    setStatus("Summarizing");
    try {
      const data = await summarizeNow();
      setSnapshot(data);
      onUpdate(data);
      setStatus("Summary updated");
    } catch {
      setSnapshot(DEMO_LIVE_INTELLIGENCE);
      onUpdate(DEMO_LIVE_INTELLIGENCE);
      setStatus("Demo summary shown");
    }
  }

  async function removeSource(url: string) {
    const remaining = sourceLinks.filter((item) => item !== url);
    setUrlInput(remaining.join("\n"));
    if (!remaining.length) {
      await clearSources();
      return;
    }
    const data = await setCommentarySources(remaining);
    setSnapshot(data);
    onUpdate(data);
  }

  async function clearSources() {
    setUrlInput("");
    try {
      const data = await clearCommentarySources();
      setSnapshot(data);
      onUpdate(data);
    } catch {
      setSnapshot(EMPTY_LIVE_INTELLIGENCE);
      onUpdate(EMPTY_LIVE_INTELLIGENCE);
    }
    setStatus("Waiting for commentary links");
  }

  return (
    <section className="ops-panel p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="ops-label flex items-center gap-2">
            <Captions className="h-3.5 w-3.5 text-red-racing" />
            Race Commentary Intelligence
          </div>
          <h2 className="mt-1 text-lg font-semibold">Multi-source race commentary summary</h2>
        </div>
        <div className="rounded border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
          {modeLabel(snapshot.mode)}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <textarea
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="Paste commentary or video links, one per line"
          className="min-h-10 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button onClick={connectSources} className="ops-button">
          <Radio className="h-4 w-4" />
          Connect
        </button>
        <button onClick={forceSummary} className="ops-button-secondary">
          <Send className="h-4 w-4" />
          Summarize Now
        </button>
        <button onClick={clearSources} className="ops-button-secondary">
          Clear Sources
        </button>
      </div>

      {sourceLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {sourceLinks.map((link) => (
            <button
              key={link}
              onClick={() => void removeSource(link)}
              className="inline-flex max-w-full items-center gap-2 rounded border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground"
            >
              <span className="max-w-[260px] truncate">{link}</span>
              <X className="h-3 w-3 text-red-racing" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-md border border-border bg-background/70 p-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Every {Math.round((snapshot.poll_interval_seconds || 300) / 60)} min
          </span>
          <span>{status}</span>
        </div>
        {latest ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{latest.summary}</p>
            {entities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {entities.map((entity) => (
                  <span
                    key={`${entity.entity_type}-${entity.label}`}
                    className="rounded border border-border bg-background px-2 py-1 text-[10px] uppercase text-muted-foreground"
                  >
                    {entity.entity_type}:{" "}
                    <span className="font-semibold text-foreground">{entity.label}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Bot className="h-3.5 w-3.5 text-red-racing" />
              Provider: {latest.provider || "demo"} | Confidence:{" "}
              {Math.round((latest.confidence || 0.72) * 100)}%
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            No commentary source connected. Add links or load the full sample to generate race
            intelligence.
          </p>
        )}
      </div>
    </section>
  );
}

export function IntelligenceTimeline({
  snapshot,
  liveTiming,
}: {
  snapshot: LiveIntelligenceSnapshot;
  liveTiming?: LiveTimingSnapshot;
}) {
  const timingEvents = timingTimelineEvents(liveTiming);
  const events = [...timingEvents, ...snapshot.timeline].slice(0, 8);
  return (
    <section className="ops-panel p-3">
      <div className="ops-label">Intelligence Timeline</div>
      <div className="mt-3 grid gap-2">
        {events.length === 0 && (
          <div className="rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
            Timeline is empty until commentary intelligence is connected or sample data is loaded.
          </div>
        )}
        {events.map((event) => (
          <article key={event.id} className="timeline-row">
            <div className="timeline-pin" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{event.title}</h3>
                <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {event.event_type}
                </span>
                {event.car_no && (
                  <span className="text-[11px] text-red-racing">{event.car_no}</span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {conciseTimelineDetail(event.detail)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function EntityMentionCards({ snapshot }: { snapshot: LiveIntelligenceSnapshot }) {
  const entities = Array.from(
    new Map(
      snapshot.entities.map((entity) => [
        `${entity.entity_type}:${entity.label}`.toLowerCase(),
        entity,
      ]),
    ).values(),
  );
  return (
    <section className="ops-panel p-3">
      <div className="ops-label">Cars and Teams Mentioned</div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {entities.length === 0 && (
          <div className="col-span-full rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
            No cars or teams detected yet.
          </div>
        )}
        {entities.map((entity, index) => (
          <div key={`${entity.label}-${index}`} className="mention-card">
            <div className="text-[10px] uppercase text-muted-foreground">{entity.entity_type}</div>
            <div className="mt-1 text-base font-semibold">{entity.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
