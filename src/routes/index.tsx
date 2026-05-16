import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AIEngineer,
  EventFeed,
  FuelStrategy,
  Leaderboard,
  LeftSidebar,
  LiveGapChart,
  PitWindow,
  RivalRadar,
  SectorComparison,
  StintTimeline,
  StrategyPrediction,
  Ticker,
  TireStrategy,
  TopBar,
} from "@/components/command/panels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project 2H4E - Race Engineering Command Center" },
      {
        name: "description",
        content:
          "Realtime endurance racing telemetry, pit strategy, AI race engineer, and command center for WEC, Le Mans, Daytona, and N24.",
      },
      { property: "og:title", content: "Project 2H4E - Race Engineering Command Center" },
      {
        property: "og:description",
        content:
          "Pit-wall software with live timing, tire engineering, fuel strategy, AI recommendations, and rival analysis.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [cls, setCls] = useState("All");
  const [manufacturer, setManufacturer] = useState("All");
  const [driver, setDriver] = useState("#7 Conway");
  const [tire, setTire] = useState("All");

  return (
    <main className="min-h-screen w-full p-2 command-bg">
      <h1 className="sr-only">Project 2H4E - Race Engineering Command Center</h1>

      <div className="flex flex-col gap-2">
        <TopBar />
        <Ticker />

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12 lg:col-span-2">
            <LeftSidebar
              cls={cls}
              setCls={setCls}
              manufacturer={manufacturer}
              setManufacturer={setManufacturer}
              driver={driver}
              setDriver={setDriver}
              tire={tire}
              setTire={setTire}
            />
          </div>

          <div className="col-span-12 lg:col-span-10 grid grid-cols-1 xl:grid-cols-3 gap-2">
            <div className="xl:col-span-2">
              <LiveGapChart />
            </div>
            <StrategyPrediction />
            <div className="xl:col-span-3">
              <StintTimeline />
            </div>
          </div>
        </div>

        <Leaderboard cls={cls} manufacturer={manufacturer} tire={tire} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          <TireStrategy />
          <FuelStrategy />
          <SectorComparison />
          <RivalRadar />
        </div>

        <PitWindow />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
          <AIEngineer />
          <EventFeed />
        </div>

        <footer className="text-[10px] uppercase text-muted-foreground text-center py-2">
          Project 2H4E | Race Engineering Command Center | WS LIVE | v2.4.0
        </footer>
      </div>
    </main>
  );
}
