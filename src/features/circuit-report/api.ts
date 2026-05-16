import { projectApiBase } from "@/lib/apiBase";

export type CircuitImageCandidate = {
  title?: string;
  url: string;
  mime?: string;
  reason?: string;
};

export type CircuitReport = {
  id?: number;
  location: string;
  race_context?: string;
  overview: string;
  overtaking_zones: string;
  tire_fuel_notes: string;
  risk_areas: string;
  recommendations: string;
  source_title?: string;
  source_url?: string;
  image_url?: string;
  image_status?: string;
  image_candidates?: CircuitImageCandidate[];
  image_index?: number;
  image_reason?: string;
  data_source?: string;
  source_status?: string;
  google_source_title?: string;
  google_source_url?: string;
  google_source_snippet?: string;
  google_status?: string;
  created_at?: string;
};

const API_BASE = projectApiBase();

export const DEMO_CIRCUIT_REPORT: CircuitReport = {
  location: "Spa-Francorchamps",
  race_context: "sample endurance race",
  overview:
    "Wikipedia sample: Circuit de Spa-Francorchamps is a Belgian motorsport circuit known for fast elevation changes, long acceleration zones, and classic endurance racing pressure points including Eau Rouge, Raidillon, Kemmel, and Blanchimont.",
  overtaking_zones:
    "Primary overtaking is built around the Kemmel straight into Les Combes, plus pit-cycle positioning before Bruxelles and late-stint traffic around the Bus Stop chicane.",
  tire_fuel_notes:
    "Elevation and high-speed loading punish tire temperature spikes. Fuel targets should protect long full-throttle climbs while keeping enough margin for safety-car restarts.",
  risk_areas:
    "Eau Rouge/Raidillon commitment, wet-weather grip changes, cold tires after pit exit, and GT traffic through fast direction changes are priority risk areas.",
  recommendations:
    "Use clean-air release before committing to an undercut, protect rear tires over the first two laps of each stint, and keep the driver informed about traffic before Kemmel.",
  source_title: "Circuit de Spa-Francorchamps",
  source_url: "https://en.wikipedia.org/wiki/Circuit_de_Spa-Francorchamps",
  image_url:
    "https://upload.wikimedia.org/wikipedia/commons/6/69/2022_F1_CourseLayout_Belgium.svg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
  image_status: "circuit-image",
  image_candidates: [
    {
      title: "2022 F1 CourseLayout Belgium.svg",
      url: "https://upload.wikimedia.org/wikipedia/commons/6/69/2022_F1_CourseLayout_Belgium.svg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
      mime: "image/svg+xml",
      reason: "Sample circuit image: Spa-Francorchamps course layout.",
    },
    {
      title: "Spa-Francorchamps 1947 layout.svg",
      url: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Spa-Francorchamps_1947_layout.svg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
      mime: "image/svg+xml",
      reason: "Sample circuit image: historical Spa-Francorchamps layout.",
    },
    {
      title: "F1 circuits 2014-2018 - Circuit de Spa-Francorchamps (version 2).svg",
      url: "https://upload.wikimedia.org/wikipedia/commons/c/cf/F1_circuits_2014-2018_-_Circuit_de_Spa-Francorchamps_%28version_2%29.svg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
      mime: "image/svg+xml",
      reason: "Sample circuit image: modern Spa-Francorchamps track map.",
    },
  ],
  image_index: 0,
  image_reason: "Sample circuit image: Spa-Francorchamps course layout.",
  data_source: "Wikipedia / Wikimedia",
  source_status: "sample",
  google_source_title: "Google search: Spa-Francorchamps endurance strategy",
  google_source_url:
    "https://www.google.com/search?q=Spa-Francorchamps%20racing%20circuit%20endurance",
  google_source_snippet:
    "Google API fallback link for additional public circuit and race-context research.",
  google_status: "search-link",
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

export async function fetchCircuitReport(): Promise<CircuitReport> {
  try {
    const report = await request<CircuitReport>("/api/circuits/report/latest");
    return hasSourceFields(report)
      ? report
      : await createClientCircuitReport(report.location || DEMO_CIRCUIT_REPORT.location);
  } catch {
    return DEMO_CIRCUIT_REPORT;
  }
}

export async function createCircuitReport(
  location: string,
  raceContext?: string,
): Promise<CircuitReport> {
  const report = await request<CircuitReport>("/api/circuits/report", {
    method: "POST",
    body: JSON.stringify({ location, raceContext }),
  });
  return hasSourceFields(report) ? report : await createClientCircuitReport(location, raceContext);
}

export async function changeCircuitImage(
  location: string,
  currentImageUrl?: string,
): Promise<CircuitReport> {
  return request<CircuitReport>("/api/circuits/report/change-image", {
    method: "POST",
    body: JSON.stringify({ location, currentImageUrl }),
  });
}

function hasSourceFields(report: CircuitReport): boolean {
  return Boolean(report.source_status && report.source_url);
}

async function createClientCircuitReport(
  location: string,
  raceContext = "Project 2H4E race intelligence",
): Promise<CircuitReport> {
  const cleanLocation = location.trim() || DEMO_CIRCUIT_REPORT.location;
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${cleanLocation} racing circuit endurance`,
  )}`;
  try {
    const searchParams = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: `${cleanLocation} racing circuit motorsport`,
      format: "json",
      utf8: "1",
      srlimit: "1",
      origin: "*",
    });
    const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?${searchParams}`);
    if (!searchResponse.ok) {
      throw new Error("Wikipedia search unavailable");
    }
    const searchData = await searchResponse.json();
    const page = searchData.query?.search?.[0];
    if (!page?.title) {
      throw new Error("No Wikipedia circuit result");
    }
    const summaryResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`,
    );
    if (!summaryResponse.ok) {
      throw new Error("Wikipedia summary unavailable");
    }
    const summary = await summaryResponse.json();
    const extract = String(summary.extract || "")
      .replace(/\s+/g, " ")
      .trim();
    const lower = extract.toLowerCase();
    const rawImageUrl = summary.originalimage?.source || summary.thumbnail?.source || "";
    const imageUrl = isCircuitImageUrl(rawImageUrl) ? rawImageUrl : "";
    const sourceUrl = summary.content_urls?.desktop?.page || "";
    const sourceTitle = summary.title || cleanLocation;
    return {
      location: cleanLocation,
      race_context: raceContext,
      overview: extract
        ? `Wikipedia source: ${extract}`
        : `${sourceTitle} returned a public Wikipedia result with limited summary text.`,
      overtaking_zones: lower.includes("street circuit")
        ? "Use pit timing and restart positioning first. On-track passing should be reserved for the clearest heavy braking references."
        : "Plan overtakes around the longest acceleration zones and the following braking phase. Traffic clearing before the pit window is more valuable than a low-percentage move.",
      tire_fuel_notes:
        lower.includes("elevation") || lower.includes("hill")
          ? "Elevation changes increase traction demand and fuel sensitivity. Protect rear tires on loaded exits and lift early before high-energy braking zones."
          : "Control tire temperature during the opening laps of each stint, then release pace once degradation stabilizes. Use lift-and-coast before major braking references.",
      risk_areas:
        "Watch pit exit, multi-class closing speeds, cold tires on out laps, local yellows, surface change, and weather evolution.",
      recommendations:
        "Use this source-backed circuit context as the baseline, then let live telemetry confirm degradation, traffic windows, and pit timing.",
      source_title: sourceTitle,
      source_url: sourceUrl,
      image_url: imageUrl,
      image_status: imageUrl ? "circuit-image" : "no-circuit-image",
      image_candidates: imageUrl
        ? [
            {
              title: rawImageUrl.split("/").pop(),
              url: imageUrl,
              reason: "Browser fallback accepted a circuit-like Wikipedia image filename.",
            },
          ]
        : [],
      image_index: 0,
      image_reason: imageUrl
        ? "Browser fallback accepted a circuit-like Wikipedia image filename."
        : "Browser fallback rejected the Wikipedia image because it did not look like a circuit layout.",
      data_source: "Wikipedia / Wikimedia + Google search link",
      source_status: "live",
      google_source_title: "Google circuit search",
      google_source_url: googleUrl,
      google_source_snippet:
        "Google API keys are not configured in the browser, so this is a direct source-search link.",
      google_status: "search-link",
    };
  } catch {
    return {
      ...DEMO_CIRCUIT_REPORT,
      location: cleanLocation,
      race_context: raceContext,
      overview: `Live Wikipedia lookup was unavailable for ${cleanLocation}. This fallback is labeled so the report is not presented as a real sourced article.`,
      source_title: cleanLocation,
      source_url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanLocation)}`,
      image_url: "",
      image_status: "no-circuit-image",
      image_candidates: [],
      image_index: 0,
      image_reason: "Live source lookup failed before a circuit image could be validated.",
      data_source: "Wikipedia lookup fallback + Google search link",
      source_status: "fallback",
      google_source_title: "Google circuit search",
      google_source_url: googleUrl,
      google_source_snippet:
        "Open this Google search link for additional public circuit references when API keys are not configured.",
      google_status: "search-link",
    };
  }
}

function isCircuitImageUrl(url: string): boolean {
  const lower = decodeURIComponent(url || "")
    .toLowerCase()
    .replace(/[_-]/g, " ");
  if (!lower) return false;
  if (
    ["logo", "icon", "seal", "poster", "portrait", "podium", "car", "flag", "badge"].some((word) =>
      lower.includes(word),
    )
  ) {
    return false;
  }
  return [
    "circuit",
    "track",
    "layout",
    "map",
    "course",
    "nordschleife",
    "grand prix",
    "route",
  ].some((word) => lower.includes(word));
}
