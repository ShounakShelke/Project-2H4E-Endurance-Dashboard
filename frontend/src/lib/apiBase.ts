export function projectApiBase() {
  const configured = String(import.meta.env.VITE_PROJECT_2H4E_API_BASE || "").trim();
  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured.replace(/\/$/, "");
  }
  return "http://127.0.0.1:8000";
}
