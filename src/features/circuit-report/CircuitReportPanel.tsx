import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Search } from "lucide-react";
import {
  createCircuitReport,
  DEMO_CIRCUIT_REPORT,
  fetchCircuitReport,
  type CircuitReport,
} from "./api";

export function CircuitReportPanel({ sampleVersion = 0 }: { sampleVersion?: number }) {
  const [location, setLocation] = useState("Circuit de la Sarthe");
  const [report, setReport] = useState<CircuitReport>(DEMO_CIRCUIT_REPORT);
  const [status, setStatus] = useState("Wikipedia ready");

  useEffect(() => {
    fetchCircuitReport().then(setReport);
  }, []);

  useEffect(() => {
    if (sampleVersion > 0) {
      setLocation("Circuit de la Sarthe");
      setReport(DEMO_CIRCUIT_REPORT);
      setStatus("Full sample circuit report loaded");
    }
  }, [sampleVersion]);

  async function generateReport() {
    setStatus("Building live Wikipedia report");
    try {
      const liveReport = await createCircuitReport(location, "Project 2H4E race intelligence");
      setReport(liveReport);
      setStatus(
        liveReport.source_status === "live"
          ? "Live Wikipedia circuit report loaded"
          : "Fallback shown while live source retries",
      );
    } catch {
      setReport({ ...DEMO_CIRCUIT_REPORT, location });
      setStatus("Sample report shown");
    }
  }

  return (
    <section className="ops-panel p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="ops-label flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-red-racing" />
            Circuit Report
          </div>
          <h2 className="mt-1 text-lg font-semibold">{report.location}</h2>
        </div>
        <div className="rounded border border-border bg-background px-2 py-1 text-[10px] uppercase text-muted-foreground">
          {report.data_source || "Wikipedia / Wikimedia"}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Enter circuit or place"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <button onClick={generateReport} className="ops-button">
          <Search className="h-4 w-4" />
          Build
        </button>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">{status}</div>
      <div className="mt-3 circuit-source-image">
        {report.image_url ? (
          <img src={report.image_url} alt={`${report.location} from ${report.data_source}`} />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
            No public circuit image was returned by the live source. Rebuild with a more specific
            circuit name.
          </div>
        )}
      </div>
      {report.source_url && (
        <a
          href={report.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11px] text-red-racing"
        >
          Source: {report.source_title || report.location}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
      <div className="mt-3 grid gap-2">
        {[
          ["Overview", report.overview],
          ["Overtaking", report.overtaking_zones],
          ["Tire/Fuel", report.tire_fuel_notes],
          ["Risks", report.risk_areas],
          ["Engineer Call", report.recommendations],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-border bg-background/60 p-2">
            <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
            <p className="mt-1 text-xs leading-relaxed text-foreground/85">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
