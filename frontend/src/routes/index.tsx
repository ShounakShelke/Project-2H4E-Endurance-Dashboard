import { createFileRoute } from "@tanstack/react-router";
import { RaceCommandCenter } from "@/features/command-center/RaceCommandCenter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project 2H4E" },
      {
        name: "description",
        content:
          "Realtime motorsport telemetry, race commentary intelligence, circuit reports, strategy timelines, and AI race engineering.",
      },
      { property: "og:title", content: "Project 2H4E" },
      {
        property: "og:description",
        content:
          "A professional race operations dashboard with live summaries, telemetry, circuit strategy, and PDF-ready reporting.",
      },
    ],
  }),
  component: RaceCommandCenter,
});
