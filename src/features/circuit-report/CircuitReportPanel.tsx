import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Search } from "lucide-react";
import {
  changeCircuitImage,
  createCircuitReport,
  DEMO_CIRCUIT_REPORT,
  type CircuitReport,
} from "./api";

export function CircuitReportPanel({
  sampleVersion = 0,
  clearVersion = 0,
  onReportChange,
}: {
  sampleVersion?: number;
  clearVersion?: number;
  onReportChange?: (report: CircuitReport | null) => void;
}) {
  const [location, setLocation] = useState("Spa-Francorchamps");
  const [report, setReport] = useState<CircuitReport | null>(null);
  const [status, setStatus] = useState("Waiting for circuit location");
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (sampleVersion > 0) {
      setLocation("Spa-Francorchamps");
      setReport(DEMO_CIRCUIT_REPORT);
      onReportChange?.(DEMO_CIRCUIT_REPORT);
      setStatus("Full sample circuit report loaded");
      setZoom(1);
    }
  }, [onReportChange, sampleVersion]);

  useEffect(() => {
    if (clearVersion > 0) {
      setLocation("Spa-Francorchamps");
      setReport(null);
      onReportChange?.(null);
      setStatus("Waiting for circuit location");
      setZoom(1);
    }
  }, [clearVersion, onReportChange]);

  async function generateReport() {
    setStatus("Building live Wikipedia report");
    try {
      const liveReport = await createCircuitReport(location, "Project 2H4E race intelligence");
      setReport(liveReport);
      onReportChange?.(liveReport);
      setZoom(1);
      setStatus(
        liveReport.source_status === "live"
          ? "Live Wikipedia circuit report loaded"
          : "Fallback shown while live source retries",
      );
    } catch {
      const fallbackReport = { ...DEMO_CIRCUIT_REPORT, location };
      setReport(fallbackReport);
      onReportChange?.(fallbackReport);
      setStatus("Sample report shown");
      setZoom(1);
    }
  }

  async function rotateCircuitImage() {
    if (!report) return;
    setStatus("Requesting next backend-approved circuit image");
    try {
      const updatedReport = await changeCircuitImage(report.location || location, report.image_url);
      setReport(updatedReport);
      onReportChange?.(updatedReport);
      setZoom(1);
      setStatus(
        updatedReport.image_url
          ? "Circuit image changed"
          : "No backend-approved circuit image found",
      );
    } catch {
      const candidates = report.image_candidates || [];
      if (candidates.length > 1) {
        const currentIndex = candidates.findIndex(
          (candidate) => candidate.url === report.image_url,
        );
        const nextIndex = (currentIndex + 1) % candidates.length;
        const nextCandidate = candidates[nextIndex];
        const localReport = {
          ...report,
          image_url: nextCandidate.url,
          image_index: nextIndex,
          image_status: "circuit-image",
          image_reason: nextCandidate.reason || "Local sample circuit image candidate.",
        };
        setReport(localReport);
        onReportChange?.(localReport);
        setZoom(1);
        setStatus("Circuit image changed from local sample candidates");
        return;
      }
      setStatus("No alternate circuit image is available from backend or sample candidates");
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
          <h2 className="mt-1 text-lg font-semibold">{report?.location || "No circuit loaded"}</h2>
        </div>
        <div className="rounded border border-border bg-background px-2 py-1 text-[10px] uppercase text-muted-foreground">
          {report?.data_source || "Waiting"}
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
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setZoom((value) => Math.min(2.5, Number((value + 0.15).toFixed(2))))}
          className="mini-toggle"
          disabled={!report?.image_url}
        >
          Zoom In
        </button>
        <button
          onClick={() => setZoom((value) => Math.max(1, Number((value - 0.15).toFixed(2))))}
          className="mini-toggle"
          disabled={!report?.image_url}
        >
          Zoom Out
        </button>
        <button onClick={() => setZoom(1)} className="mini-toggle" disabled={!report?.image_url}>
          Reset
        </button>
        <button onClick={rotateCircuitImage} className="mini-toggle" disabled={!report}>
          Change Image
        </button>
      </div>
      <div className="mt-3 circuit-source-image">
        {report?.image_url ? (
          <img
            src={report.image_url}
            alt={`${report.location} from ${report.data_source}`}
            style={{ transform: `scale(${zoom})` }}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
            Circuit image is blank until sample data is loaded or a source-backed circuit report is
            built.
          </div>
        )}
      </div>
      {report?.image_reason && (
        <div className="mt-2 text-[10px] uppercase text-muted-foreground">
          {report.image_status || "image"}: {report.image_reason}
        </div>
      )}
      {report?.source_url && (
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
      {report?.google_source_url && (
        <a
          href={report.google_source_url}
          target="_blank"
          rel="noreferrer"
          className="ml-3 mt-2 inline-flex items-center gap-1 text-[11px] text-red-racing"
        >
          Google: {report.google_source_title || "circuit context"}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
      <div className="mt-3 grid gap-2">
        {report ? (
          [
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
          ))
        ) : (
          <div className="rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
            No circuit report loaded.
          </div>
        )}
      </div>
    </section>
  );
}
