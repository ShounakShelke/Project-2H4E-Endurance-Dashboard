import { useEffect, useMemo, useState } from "react";

export type Car = {
  no: string;
  team: string;
  driver: string;
  car: string;
  manufacturer: string;
  cls: "Hypercar" | "LMP2" | "GT3" | "GT4";
  laps: number;
  gap: string;
  last: string;
  best: string;
  pits: number;
  tireAge: number;
  stint: number;
  tire: "S" | "M" | "H" | "I" | "W";
  state: "RUN" | "PIT" | "OUT" | "DNF";
  posDelta: number;
};

const BASE_CARS: Car[] = [
  {
    no: "7",
    team: "Toyota Gazoo Racing",
    driver: "M. Conway",
    car: "GR010 Hybrid",
    manufacturer: "Toyota",
    cls: "Hypercar",
    laps: 184,
    gap: "-",
    last: "3:24.118",
    best: "3:22.847",
    pits: 6,
    tireAge: 14,
    stint: 22,
    tire: "M",
    state: "RUN",
    posDelta: 0,
  },
  {
    no: "8",
    team: "Toyota Gazoo Racing",
    driver: "S. Buemi",
    car: "GR010 Hybrid",
    manufacturer: "Toyota",
    cls: "Hypercar",
    laps: 184,
    gap: "+4.812",
    last: "3:24.302",
    best: "3:22.991",
    pits: 6,
    tireAge: 16,
    stint: 24,
    tire: "M",
    state: "RUN",
    posDelta: 1,
  },
  {
    no: "6",
    team: "Porsche Penske Motorsport",
    driver: "K. Estre",
    car: "963",
    manufacturer: "Porsche",
    cls: "Hypercar",
    laps: 184,
    gap: "+12.408",
    last: "3:23.901",
    best: "3:22.612",
    pits: 5,
    tireAge: 9,
    stint: 18,
    tire: "S",
    state: "RUN",
    posDelta: 2,
  },
  {
    no: "51",
    team: "Ferrari AF Corse",
    driver: "A. Pier Guidi",
    car: "499P",
    manufacturer: "Ferrari",
    cls: "Hypercar",
    laps: 184,
    gap: "+18.224",
    last: "3:24.501",
    best: "3:23.118",
    pits: 6,
    tireAge: 18,
    stint: 26,
    tire: "M",
    state: "RUN",
    posDelta: -1,
  },
  {
    no: "2",
    team: "Cadillac Racing",
    driver: "E. Bamber",
    car: "V-Series.R",
    manufacturer: "Cadillac",
    cls: "Hypercar",
    laps: 183,
    gap: "+1L",
    last: "3:25.012",
    best: "3:23.402",
    pits: 6,
    tireAge: 22,
    stint: 28,
    tire: "H",
    state: "PIT",
    posDelta: -2,
  },
  {
    no: "5",
    team: "Porsche Penske Motorsport",
    driver: "M. Campbell",
    car: "963",
    manufacturer: "Porsche",
    cls: "Hypercar",
    laps: 183,
    gap: "+1L",
    last: "3:24.812",
    best: "3:22.998",
    pits: 5,
    tireAge: 11,
    stint: 19,
    tire: "M",
    state: "RUN",
    posDelta: 0,
  },
  {
    no: "93",
    team: "Peugeot TotalEnergies",
    driver: "P. di Resta",
    car: "9X8",
    manufacturer: "Peugeot",
    cls: "Hypercar",
    laps: 183,
    gap: "+1L",
    last: "3:25.221",
    best: "3:23.882",
    pits: 7,
    tireAge: 5,
    stint: 8,
    tire: "S",
    state: "OUT",
    posDelta: 3,
  },
  {
    no: "23",
    team: "United Autosports",
    driver: "O. Jarvis",
    car: "Oreca 07",
    manufacturer: "Oreca",
    cls: "LMP2",
    laps: 178,
    gap: "+6L",
    last: "3:31.401",
    best: "3:29.118",
    pits: 7,
    tireAge: 12,
    stint: 20,
    tire: "M",
    state: "RUN",
    posDelta: 0,
  },
  {
    no: "92",
    team: "Manthey PureRxcing",
    driver: "A. Malykhin",
    car: "911 GT3 R",
    manufacturer: "Porsche",
    cls: "GT3",
    laps: 171,
    gap: "+13L",
    last: "3:48.221",
    best: "3:45.901",
    pits: 8,
    tireAge: 19,
    stint: 24,
    tire: "H",
    state: "RUN",
    posDelta: 1,
  },
  {
    no: "33",
    team: "TF Sport",
    driver: "B. Keating",
    car: "Corvette Z06",
    manufacturer: "Corvette",
    cls: "GT3",
    laps: 171,
    gap: "+13L",
    last: "3:48.612",
    best: "3:46.011",
    pits: 8,
    tireAge: 8,
    stint: 14,
    tire: "M",
    state: "RUN",
    posDelta: -1,
  },
  {
    no: "777",
    team: "D'Station Racing",
    driver: "C. Eastwood",
    car: "Vantage AMR",
    manufacturer: "Aston",
    cls: "GT3",
    laps: 170,
    gap: "+14L",
    last: "3:49.118",
    best: "3:46.402",
    pits: 9,
    tireAge: 21,
    stint: 26,
    tire: "H",
    state: "RUN",
    posDelta: 0,
  },
  {
    no: "27",
    team: "Heart of Racing",
    driver: "R. Gunn",
    car: "Vantage AMR",
    manufacturer: "Aston",
    cls: "GT3",
    laps: 170,
    gap: "+14L",
    last: "3:49.401",
    best: "3:46.788",
    pits: 8,
    tireAge: 13,
    stint: 22,
    tire: "M",
    state: "RUN",
    posDelta: 0,
  },
  {
    no: "31",
    team: "WRT",
    driver: "F. Habsburg",
    car: "Oreca 07",
    manufacturer: "Oreca",
    cls: "LMP2",
    laps: 178,
    gap: "+6L",
    last: "3:31.811",
    best: "3:29.322",
    pits: 7,
    tireAge: 17,
    stint: 23,
    tire: "M",
    state: "RUN",
    posDelta: 4,
  },
  {
    no: "48",
    team: "Alpine Endurance",
    driver: "M. Schumacher",
    car: "A424",
    manufacturer: "Alpine",
    cls: "Hypercar",
    laps: 183,
    gap: "+1L",
    last: "3:25.702",
    best: "3:23.990",
    pits: 6,
    tireAge: 10,
    stint: 16,
    tire: "M",
    state: "RUN",
    posDelta: 2,
  },
  {
    no: "50",
    team: "Ferrari AF Corse",
    driver: "N. Nielsen",
    car: "499P",
    manufacturer: "Ferrari",
    cls: "Hypercar",
    laps: 183,
    gap: "+1L",
    last: "3:25.119",
    best: "3:23.256",
    pits: 6,
    tireAge: 15,
    stint: 21,
    tire: "M",
    state: "RUN",
    posDelta: -3,
  },
];

const GENERATED_TEAMS = [
  ["12", "Jota Sport", "W. Stevens", "963", "Porsche", "Hypercar"],
  ["35", "Alpine Endurance", "C. Milesi", "A424", "Alpine", "Hypercar"],
  ["38", "Hertz Team Jota", "J. Button", "963", "Porsche", "Hypercar"],
  ["4", "Floyd Vanwall", "T. Dillmann", "Vandervell 680", "Vanwall", "Hypercar"],
  ["10", "Vector Sport", "G. Aubry", "Oreca 07", "Oreca", "LMP2"],
  ["14", "AO by TF", "L. Hyett", "Oreca 07", "Oreca", "LMP2"],
  ["18", "IDEC Sport", "P. Lafargue", "Oreca 07", "Oreca", "LMP2"],
  ["22", "United Autosports", "P. Hanson", "Oreca 07", "Oreca", "LMP2"],
  ["34", "Inter Europol", "J. Smiechowski", "Oreca 07", "Oreca", "LMP2"],
  ["45", "CrowdStrike APR", "G. Kurtz", "Oreca 07", "Oreca", "LMP2"],
  ["54", "AF Corse", "T. Flohr", "296 GT3", "Ferrari", "GT3"],
  ["55", "Spirit of Race", "D. Rigon", "296 GT3", "Ferrari", "GT3"],
  ["60", "Iron Lynx", "M. Cressoni", "Huracan GT3", "Lamborghini", "GT3"],
  ["63", "Iron Lynx", "M. Bortolotti", "Huracan GT3", "Lamborghini", "GT3"],
  ["66", "JMW Motorsport", "G. Petrobelli", "296 GT3", "Ferrari", "GT3"],
  ["70", "Inception Racing", "B. Iribe", "720S GT3", "McLaren", "GT3"],
  ["77", "Proton Competition", "R. Ried", "Mustang GT3", "Ford", "GT3"],
  ["81", "TF Sport", "T. Van Rompuy", "Corvette Z06", "Corvette", "GT3"],
  ["85", "Iron Dames", "S. Bovy", "Huracan GT3", "Lamborghini", "GT3"],
  ["88", "Proton Competition", "G. Roda", "Mustang GT3", "Ford", "GT3"],
  ["91", "Manthey EMA", "R. Lietz", "911 GT3 R", "Porsche", "GT3"],
  ["95", "United Autosports", "M. Cottingham", "720S GT3", "McLaren", "GT3"],
  ["98", "Northwest AMR", "P. Dalla Lana", "Vantage AMR", "Aston", "GT3"],
  ["99", "Rowe Racing", "P. Eng", "M4 GT3", "BMW", "GT3"],
  ["101", "Walkenhorst", "J. Krohn", "M4 GT3", "BMW", "GT3"],
  ["111", "JP Motorsport", "P. Krupinski", "720S GT3", "McLaren", "GT3"],
  ["118", "Kessel Racing", "T. Kimura", "296 GT3", "Ferrari", "GT3"],
  ["123", "Car Collection", "P. Kaffer", "R8 LMS", "Audi", "GT3"],
  ["129", "GetSpeed", "L. Stolz", "AMG GT3", "Mercedes", "GT3"],
  ["130", "Mercedes-AMG Team", "M. Engel", "AMG GT3", "Mercedes", "GT3"],
  ["188", "Garage 59", "A. West", "720S GT3", "McLaren", "GT3"],
  ["222", "Team WRT", "D. Vanthoor", "M4 GT3", "BMW", "GT3"],
  ["311", "Whelen Cadillac", "P. Derani", "V-Series.R", "Cadillac", "Hypercar"],
  ["333", "Riley Motorsports", "F. Fraga", "AMG GT3", "Mercedes", "GT3"],
  ["404", "Toyota Reserve", "R. Hirakawa", "GR010 Hybrid", "Toyota", "Hypercar"],
  ["911", "Manthey Racing", "L. Heinrich", "911 GT3 R", "Porsche", "GT3"],
] as const;

const EXTRA_CARS: Car[] = GENERATED_TEAMS.map((item, i) => {
  const [no, team, driver, car, manufacturer, cls] = item;
  const classOffset = cls === "Hypercar" ? 0 : cls === "LMP2" ? 6 : cls === "GT4" ? 18 : 13;
  const laps = 184 - classOffset - Math.floor(i / 6);
  const seconds = 22 + classOffset * 1.5 + (i % 9) * 0.33;
  const bestSeconds = seconds - 1.4;
  const tireCycle = ["S", "M", "H", "M", "I"] as const;
  const stateCycle = ["RUN", "RUN", "RUN", "RUN", "PIT", "OUT"] as const;
  const toLap = (base: number) => `3:${base.toFixed(3).padStart(6, "0")}`;
  return {
    no,
    team,
    driver,
    car,
    manufacturer,
    cls,
    laps,
    gap: `+${Math.max(1, 184 - laps)}L`,
    last: toLap(seconds + 2.1),
    best: toLap(bestSeconds),
    pits: 5 + (i % 5),
    tireAge: 5 + ((i * 3) % 31),
    stint: 8 + ((i * 4) % 28),
    tire: tireCycle[i % tireCycle.length],
    state: stateCycle[i % stateCycle.length],
    posDelta: (i % 7) - 3,
  };
});

const CARS: Car[] = [...BASE_CARS, ...EXTRA_CARS];

export type RaceEvent = {
  t: string;
  kind: "OVERTAKE" | "PIT" | "FASTEST" | "FLAG" | "INCIDENT" | "STRATEGY";
  msg: string;
};

export const SEED_EVENTS: RaceEvent[] = [
  {
    t: "14:32:18",
    kind: "FASTEST",
    msg: "#6 Estre sets fastest lap: 3:22.612 with sector two best.",
  },
  {
    t: "14:31:42",
    kind: "OVERTAKE",
    msg: "#8 Buemi clears #51 Pier Guidi before Mulsanne braking.",
  },
  {
    t: "14:30:55",
    kind: "PIT",
    msg: "#2 Cadillac enters pit lane for fuel, tires, and driver change.",
  },
  { t: "14:29:08", kind: "STRATEGY", msg: "AI: undercut window opens for #51 in two laps." },
  { t: "14:27:31", kind: "FLAG", msg: "Full-course yellow cleared. Sector six returns to green." },
  { t: "14:25:12", kind: "INCIDENT", msg: "#93 Peugeot runs wide at Tertre Rouge and continues." },
  { t: "14:23:45", kind: "FASTEST", msg: "#92 Malykhin sets GT3 class best at 3:45.901." },
  { t: "14:21:02", kind: "PIT", msg: "#5 Porsche stop complete in 23.4 seconds." },
];

export type AIAlert = {
  level: "info" | "warn" | "crit";
  title: string;
  msg: string;
  confidence: number;
};

export const AI_ALERTS: AIAlert[] = [
  {
    level: "crit",
    title: "Undercut Window #7",
    msg: "Pit within two laps to clear traffic before the #6 stop. Net gain estimate is +6.4s.",
    confidence: 0.87,
  },
  {
    level: "warn",
    title: "Tire Degradation #51",
    msg: "Rear-left thermal stress is climbing. Pace loss projects to 0.28s per lap over the next four laps.",
    confidence: 0.79,
  },
  {
    level: "warn",
    title: "Fuel Margin #8",
    msg: "Current burn projects empty in 11 laps. Save mode 3 is recommended for four laps.",
    confidence: 0.92,
  },
  {
    level: "info",
    title: "Clean Air #6",
    msg: "Gap to traffic is greater than 18s for the next three laps. Push mode can be used.",
    confidence: 0.95,
  },
  {
    level: "info",
    title: "Rival Pit #911",
    msg: "Car #911 is likely to pit within three laps based on stint length pattern.",
    confidence: 0.74,
  },
];

export function useTick(ms = 1500) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}

export function useCars() {
  const [cars, setCars] = useState<Car[]>(CARS);
  const [flashId, setFlash] = useState<string | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      setCars((prev) => {
        const next = prev.map((c) => ({ ...c }));
        const i = Math.floor(Math.random() * next.length);
        const base = 3 * 60 + 22 + Math.random() * 7;
        const mins = Math.floor(base / 60);
        const secs = (base - mins * 60).toFixed(3);
        next[i].last = `${mins}:${secs.padStart(6, "0")}`;
        next[i].tireAge = Math.min(40, next[i].tireAge + (Math.random() > 0.35 ? 1 : 0));
        setFlash(next[i].no);
        return next;
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return { cars, flashId };
}

export function useLiveSeries(points = 40, base = 3 * 60 + 23) {
  const seed = useMemo(
    () =>
      Array.from({ length: points }, (_, i) => ({
        lap: i + 1,
        car: base + Math.sin(i / 4) * 0.6 + Math.random() * 0.4,
        rival: base + Math.sin(i / 3.5 + 1) * 0.7 + Math.random() * 0.4,
        delta: 0,
      })).map((d) => ({ ...d, delta: +(d.car - d.rival).toFixed(3) })),
    [base, points],
  );
  const [data, setData] = useState(seed);
  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const lap = last.lap + 1;
        const car = base + Math.sin(lap / 4) * 0.6 + Math.random() * 0.6;
        const rival = base + Math.sin(lap / 3.5 + 1) * 0.7 + Math.random() * 0.6;
        return [...prev.slice(1), { lap, car, rival, delta: +(car - rival).toFixed(3) }];
      });
    }, 1800);
    return () => clearInterval(id);
  }, [base]);
  return data;
}

export const TIRE_DEG = Array.from({ length: 30 }, (_, i) => ({
  lap: i + 1,
  soft: 0 + i * 0.09 + (i > 15 ? (i - 15) * 0.08 : 0),
  medium: 0 + i * 0.055 + (i > 22 ? (i - 22) * 0.06 : 0),
  hard: 0 + i * 0.035 + (i > 28 ? (i - 28) * 0.05 : 0),
}));

export const STINT_SEGMENTS = [
  {
    car: "#7",
    segs: [
      { from: 0, to: 28, c: "M" },
      { from: 28, to: 54, c: "M" },
      { from: 54, to: 82, c: "S" },
      { from: 82, to: 110, c: "H" },
      { from: 110, to: 132, c: "M" },
      { from: 132, to: 162, c: "M" },
      { from: 162, to: 184, c: "M" },
    ],
  },
  {
    car: "#8",
    segs: [
      { from: 0, to: 26, c: "M" },
      { from: 26, to: 52, c: "M" },
      { from: 52, to: 78, c: "M" },
      { from: 78, to: 106, c: "H" },
      { from: 106, to: 132, c: "M" },
      { from: 132, to: 160, c: "M" },
      { from: 160, to: 184, c: "M" },
    ],
  },
  {
    car: "#6",
    segs: [
      { from: 0, to: 30, c: "S" },
      { from: 30, to: 58, c: "M" },
      { from: 58, to: 88, c: "M" },
      { from: 88, to: 118, c: "H" },
      { from: 118, to: 148, c: "M" },
      { from: 148, to: 184, c: "S" },
    ],
  },
  {
    car: "#51",
    segs: [
      { from: 0, to: 27, c: "M" },
      { from: 27, to: 54, c: "M" },
      { from: 54, to: 84, c: "S" },
      { from: 84, to: 110, c: "H" },
      { from: 110, to: 138, c: "M" },
      { from: 138, to: 166, c: "M" },
      { from: 166, to: 184, c: "M" },
    ],
  },
  {
    car: "#2",
    segs: [
      { from: 0, to: 24, c: "M" },
      { from: 24, to: 50, c: "M" },
      { from: 50, to: 76, c: "S" },
      { from: 76, to: 104, c: "H" },
      { from: 104, to: 130, c: "H" },
      { from: 130, to: 158, c: "M" },
      { from: 158, to: 183, c: "H" },
    ],
  },
];

export const SECTOR_DATA = [
  { car: "#7", s1: 28.412, s2: 41.118, s3: 34.588, ideal: 103.802 },
  { car: "#8", s1: 28.501, s2: 41.302, s3: 34.501, ideal: 103.998 },
  { car: "#6", s1: 28.301, s2: 41.011, s3: 34.412, ideal: 103.612 },
  { car: "#51", s1: 28.522, s2: 41.408, s3: 34.611, ideal: 104.218 },
];

export const RIVAL_RADAR = [
  { axis: "Pace", you: 92, rival: 88 },
  { axis: "Consistency", you: 88, rival: 91 },
  { axis: "Tire mgmt", you: 84, rival: 79 },
  { axis: "Traffic", you: 90, rival: 82 },
  { axis: "Pit exec", you: 95, rival: 87 },
  { axis: "Fuel", you: 86, rival: 90 },
];
