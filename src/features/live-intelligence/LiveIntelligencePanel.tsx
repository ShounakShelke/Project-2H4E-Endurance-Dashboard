import { useEffect, useState } from "react";
import { Bot, Captions, Clock, Radio, Send } from "lucide-react";
import {
  DEMO_LIVE_INTELLIGENCE,
  fetchLiveIntelligence,
  setYouTubeSource,
  summarizeNow,
  type LiveIntelligenceSnapshot,
} from "./api";

function modeLabel(mode: string) {
  return mode === "demo-fallback" || mode === "demo" ? "Demo fallback" : "Live captions";
}

export function LiveIntelligencePanel({
  onUpdate,
  sampleVersion = 0,
}: {
  onUpdate: (snapshot: LiveIntelligenceSnapshot) => void;
  sampleVersion?: number;
}) {
  const [url, setUrl] = useState("");
  const [snapshot, setSnapshot] = useState<LiveIntelligenceSnapshot>(DEMO_LIVE_INTELLIGENCE);
  const [status, setStatus] = useState("Ready");
  const latest = snapshot.summaries[0];

  useEffect(() => {
    fetchLiveIntelligence().then((data) => {
      setSnapshot(data);
      onUpdate(data);
    });
  }, [onUpdate]);

  useEffect(() => {
    if (sampleVersion > 0) {
      setUrl(String(DEMO_LIVE_INTELLIGENCE.source?.url || ""));
      setSnapshot(DEMO_LIVE_INTELLIGENCE);
      onUpdate(DEMO_LIVE_INTELLIGENCE);
      setStatus("Full sample intelligence loaded");
    }
  }, [onUpdate, sampleVersion]);

  async function connectSource() {
    setStatus("Connecting");
    try {
      const data = await setYouTubeSource(url);
      setSnapshot(data);
      onUpdate(data);
      setStatus("Connected");
    } catch {
      setSnapshot(DEMO_LIVE_INTELLIGENCE);
      onUpdate(DEMO_LIVE_INTELLIGENCE);
      setStatus("Demo fallback active");
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

  return (
    <section className="ops-panel p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="ops-label flex items-center gap-2">
            <Captions className="h-3.5 w-3.5 text-red-racing" />
            Live YouTube Intelligence
          </div>
          <h2 className="mt-1 text-lg font-semibold">Five-minute race summary</h2>
        </div>
        <div className="rounded border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
          {modeLabel(snapshot.mode)}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto]">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste YouTube live URL"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <button onClick={connectSource} className="ops-button">
          <Radio className="h-4 w-4" />
          Connect
        </button>
        <button onClick={forceSummary} className="ops-button-secondary">
          <Send className="h-4 w-4" />
          Summarize Now
        </button>
      </div>

      <div className="mt-3 rounded-md border border-border bg-background/70 p-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Every {Math.round((snapshot.poll_interval_seconds || 300) / 60)} min
          </span>
          <span>{status}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{latest?.summary}</p>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Bot className="h-3.5 w-3.5 text-red-racing" />
          Provider: {latest?.provider || "demo"} | Confidence:{" "}
          {Math.round((latest?.confidence || 0.72) * 100)}%
        </div>
      </div>
    </section>
  );
}

export function IntelligenceTimeline({ snapshot }: { snapshot: LiveIntelligenceSnapshot }) {
  return (
    <section className="ops-panel p-3">
      <div className="ops-label">Intelligence Timeline</div>
      <div className="mt-3 grid gap-2">
        {snapshot.timeline.slice(0, 6).map((event) => (
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
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{event.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function EntityMentionCards({ snapshot }: { snapshot: LiveIntelligenceSnapshot }) {
  const entities = snapshot.entities.slice(0, 8);
  return (
    <section className="ops-panel p-3">
      <div className="ops-label">Cars and Teams Mentioned</div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
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
