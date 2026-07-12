// Deterministic-ish realistic fake data for the DACT operations platform.

export type Zone = "Berth A" | "Berth B" | "Yard N1" | "Yard N2" | "Yard S1" | "Gate West" | "Gate East" | "Rail Head" | "Warehouse";

export interface EdgeNode {
  id: string;
  name: string;
  zone: Zone;
  role: "coordinator" | "peer" | "gateway";
  status: "healthy" | "degraded" | "offline";
  cpu: number;
  mem: number;
  signal: number; // dBm-ish 0-100
  latencyMs: number;
  packetRate: number; // pkts/s
  packetLoss: number; // %
  neighbors: string[];
  containers: number;
  x: number; // 0-100
  y: number; // 0-100
}

export interface ContainerAsset {
  id: string; // ISO 6346 e.g. MSCU7481923
  size: "20ft" | "40ft" | "40HC" | "45HC";
  cargo: string;
  weightKg: number;
  origin: string;
  destination: string;
  handler: string; // truck / crane
  zone: Zone;
  status: "in-yard" | "on-truck" | "on-crane" | "loading" | "gate-out" | "gate-in";
  temperatureC?: number;
  lastSync: string; // ISO
  hazardous?: boolean;
  reefer?: boolean;
}

export interface TruckAsset {
  id: string;
  driver: string;
  status: "moving" | "idle" | "loading" | "queued";
  route: string;
  zone: Zone;
  container?: string;
}

export interface CraneAsset {
  id: string;
  type: "STS" | "RTG" | "RMG";
  berth?: string;
  status: "operating" | "idle" | "maintenance";
  cyclesPerHour: number;
  container?: string;
}

export interface ShipAsset {
  id: string; // IMO
  name: string;
  operator: string;
  eta: string;
  berth: string;
  teu: number;
  progress: number; // 0-100 unload
  status: "berthed" | "approaching" | "departing" | "at-anchor";
}

export interface OperationalEvent {
  id: string;
  ts: string;
  kind:
    | "container-loaded"
    | "truck-assigned"
    | "container-arrived"
    | "mesh-updated"
    | "coordinator-changed"
    | "packet-synced"
    | "conflict-detected"
    | "conflict-resolved"
    | "node-degraded"
    | "gate-in"
    | "gate-out"
    | "crane-cycle";
  message: string;
  severity: "info" | "warn" | "critical" | "success";
  ref?: string;
}

const OPERATORS = ["MSC", "Maersk", "CMA CGM", "Hapag-Lloyd", "ONE", "Evergreen", "COSCO", "HMM", "ZIM"];
const OWNERS = ["MSCU", "MAEU", "CMAU", "HLXU", "ONEU", "EGHU", "COSU", "HMMU", "ZIMU", "TCLU", "TGHU"];
const CARGO = ["Electronics", "Textiles", "Auto Parts", "Chemicals", "Frozen Seafood", "Machinery", "Consumer Goods", "Steel Coils", "Pharmaceuticals", "Grain"];
const ORIGINS = ["Shanghai", "Singapore", "Rotterdam", "Busan", "Antwerp", "Los Angeles", "Hamburg", "Jebel Ali", "Tanger Med", "Colombo"];
const DESTS = ["Mumbai (JNPA)", "Chennai", "Mundra", "Cochin", "Vizag", "Kolkata", "Kandla", "Tuticorin"];
const SHIP_NAMES = ["Ever Ace", "MSC Gülsün", "HMM Algeciras", "Marco Polo", "Madrid Maersk", "OOCL Hong Kong", "CMA CGM Palais Royal", "ONE Innovation", "COSCO Universe"];
const ZONES: Zone[] = ["Berth A", "Berth B", "Yard N1", "Yard N2", "Yard S1", "Gate West", "Gate East", "Rail Head", "Warehouse"];

// Seeded PRNG for stable listings
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260711);
const pick = <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
const rint = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const rfloat = (min: number, max: number) => rng() * (max - min) + min;

// ISO 6346 container id — 4 letters + 7 digits
function isoContainerId() {
  const owner = pick(OWNERS);
  const digits = String(rint(1000000, 9999999));
  return `${owner}${digits}`;
}

export const NODES: EdgeNode[] = Array.from({ length: 24 }, (_, i) => {
  const zone = ZONES[i % ZONES.length];
  const status: EdgeNode["status"] = rng() > 0.92 ? "degraded" : rng() > 0.98 ? "offline" : "healthy";
  return {
    id: `RPI-${String(1001 + i)}`,
    name: `Edge-${String(i + 1).padStart(2, "0")}`,
    zone,
    role: i % 8 === 0 ? "coordinator" : i % 11 === 0 ? "gateway" : "peer",
    status,
    cpu: rint(12, 78),
    mem: rint(30, 82),
    signal: rint(55, 98),
    latencyMs: rint(6, 42),
    packetRate: rint(120, 940),
    packetLoss: rfloat(0, 2.1),
    neighbors: [],
    containers: rint(0, 34),
    x: rfloat(6, 94),
    y: rfloat(8, 92),
  };
});
// Wire neighbors — k-nearest
for (const n of NODES) {
  const dists = NODES.filter(m => m.id !== n.id)
    .map(m => ({ id: m.id, d: Math.hypot(m.x - n.x, m.y - n.y) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(x => x.id);
  n.neighbors = dists;
}

export const CONTAINERS: ContainerAsset[] = Array.from({ length: 48 }, () => {
  const reefer = rng() > 0.85;
  return {
    id: isoContainerId(),
    size: pick(["20ft", "40ft", "40HC", "45HC"] as const),
    cargo: pick(CARGO),
    weightKg: rint(4200, 28800),
    origin: pick(ORIGINS),
    destination: pick(DESTS),
    handler: rng() > 0.5 ? `TRK-${rint(200, 780)}` : `CRN-${rint(1, 12).toString().padStart(2, "0")}`,
    zone: pick(ZONES),
    status: pick(["in-yard", "on-truck", "on-crane", "loading", "gate-out", "gate-in"] as const),
    temperatureC: reefer ? rfloat(-24, 4) : undefined,
    reefer,
    hazardous: rng() > 0.92,
    lastSync: new Date(Date.now() - rint(1, 220) * 1000).toISOString(),
  };
});

export const TRUCKS: TruckAsset[] = Array.from({ length: 22 }, (_, i) => ({
  id: `TRK-${200 + i * 7}`,
  driver: pick(["R. Sharma", "A. Iyer", "M. Khan", "S. Patel", "V. Reddy", "N. Das", "P. Nair", "K. Menon"]),
  status: pick(["moving", "idle", "loading", "queued"] as const),
  route: `${pick(["Berth A", "Berth B", "Gate West"])} → ${pick(["Yard N1", "Yard N2", "Warehouse", "Rail Head"])}`,
  zone: pick(ZONES),
  container: rng() > 0.35 ? isoContainerId() : undefined,
}));

export const CRANES: CraneAsset[] = Array.from({ length: 10 }, (_, i) => ({
  id: `CRN-${String(i + 1).padStart(2, "0")}`,
  type: pick(["STS", "RTG", "RMG"] as const),
  berth: `Berth ${i < 5 ? "A" : "B"}`,
  status: pick(["operating", "idle", "maintenance"] as const),
  cyclesPerHour: rint(18, 34),
  container: rng() > 0.4 ? isoContainerId() : undefined,
}));

export const SHIPS: ShipAsset[] = Array.from({ length: 6 }, (_, i) => ({
  id: `IMO${rint(9000000, 9999999)}`,
  name: SHIP_NAMES[i % SHIP_NAMES.length],
  operator: pick(OPERATORS),
  eta: new Date(Date.now() + rint(-3, 20) * 3600_000).toISOString(),
  berth: i < 2 ? "Berth A" : i < 4 ? "Berth B" : "At Anchor",
  teu: rint(4200, 24000),
  progress: rint(4, 96),
  status: i < 2 ? "berthed" : i < 4 ? "approaching" : "at-anchor",
}));

// Rolling event stream generator
let evId = 0;
export function makeEvent(): OperationalEvent {
  const kinds: OperationalEvent["kind"][] = [
    "container-loaded", "truck-assigned", "container-arrived",
    "mesh-updated", "coordinator-changed", "packet-synced", "node-degraded",
    "conflict-detected", "conflict-resolved", "gate-in", "gate-out", "crane-cycle",
  ];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const container = CONTAINERS[Math.floor(Math.random() * CONTAINERS.length)];
  const node = NODES[Math.floor(Math.random() * NODES.length)];
  const map: Record<OperationalEvent["kind"], { msg: string; sev: OperationalEvent["severity"] }> = {
    "container-loaded":     { msg: `Container ${container.id} loaded onto CRN-${String(1 + Math.floor(Math.random()*10)).padStart(2,"0")}`, sev: "success" },
    "truck-assigned":       { msg: `Truck TRK-${200 + Math.floor(Math.random()*400)} assigned to ${container.id}`, sev: "info" },
    "container-arrived":    { msg: `${container.id} arrived at ${node.zone}`, sev: "success" },
    "mesh-updated":         { msg: `Topology updated near ${node.zone} — ${node.neighbors.length} peers re-linked`, sev: "info" },
    "coordinator-changed":  { msg: `Zone ${node.zone} promoted ${node.id} as coordinator`, sev: "warn" },
    "packet-synced":        { msg: `Delta sync completed with ${node.id} (${node.packetRate} pkts/s)`, sev: "info" },
    "conflict-detected":    { msg: `CRDT conflict on ${container.id} between ${node.id} and ${node.neighbors[0] ?? "peer"}`, sev: "warn" },
    "conflict-resolved":    { msg: `Conflict on ${container.id} resolved via LWW-register`, sev: "success" },
    "gate-in":              { msg: `Gate-in cleared TRK-${200 + Math.floor(Math.random()*400)} carrying ${container.id}`, sev: "info" },
    "gate-out":             { msg: `Gate-out released ${container.id} to ${container.destination}`, sev: "success" },
    "crane-cycle":          { msg: `CRN-${String(1 + Math.floor(Math.random()*10)).padStart(2,"0")} completed cycle #${Math.floor(Math.random()*4000)}`, sev: "info" },
    "node-degraded":        { msg: `${node.id} degraded — signal ${node.signal}, loss ${node.packetLoss.toFixed(2)}%`, sev: "warn" },
  };
  const m = map[kind];
  return {
    id: `EV-${(++evId).toString().padStart(6, "0")}`,
    ts: new Date().toISOString(),
    kind,
    message: m.msg,
    severity: m.sev,
    ref: container.id,
  };
}

// Historical/analytics series
export function throughputSeries(hours = 24) {
  const now = Date.now();
  return Array.from({ length: hours }, (_, i) => {
    const t = new Date(now - (hours - i) * 3600_000);
    const base = 180 + Math.sin(i / 2.4) * 40 + Math.cos(i / 3.1) * 22;
    return {
      time: t.toISOString(),
      hour: t.getHours() + ":00",
      teu: Math.max(80, Math.round(base + rfloat(-18, 22))),
      gateIn: Math.max(40, Math.round(base * 0.55 + rfloat(-10, 12))),
      gateOut: Math.max(40, Math.round(base * 0.48 + rfloat(-10, 12))),
    };
  });
}

export function meshHealthSeries(mins = 30) {
  return Array.from({ length: mins }, (_, i) => ({
    t: `-${mins - i}m`,
    latency: 14 + Math.sin(i / 3) * 4 + rfloat(-1, 2),
    loss: Math.max(0, 0.4 + Math.sin(i / 5) * 0.3 + rfloat(-0.15, 0.25)),
    quality: 92 + Math.cos(i / 4) * 4 + rfloat(-1.5, 1.5),
  }));
}

export function zoneUtilization() {
  return ZONES.map(z => ({
    zone: z,
    utilization: rint(38, 96),
    containers: rint(20, 320),
  }));
}

export function conflictTrend(days = 14) {
  return Array.from({ length: days }, (_, i) => ({
    day: `D-${days - i}`,
    detected: rint(4, 22),
    resolved: rint(4, 22),
  }));
}

export const SCENARIOS = [
  { id: "cyber",        title: "Cyber Attack",             desc: "Coordinated intrusion attempts against gateway nodes", severity: "critical" as const, eta: "4m 20s", icon: "shield" },
  { id: "rain",         title: "Heavy Rain",                desc: "Monsoon downpour — visibility & OCR degraded",         severity: "warn" as const,     eta: "12m",    icon: "cloud" },
  { id: "partition",    title: "Network Partition",         desc: "Yard N2 disconnected from primary coordinator",         severity: "critical" as const, eta: "1m 40s", icon: "network" },
  { id: "coordinator",  title: "Coordinator Failure",       desc: "Zone coordinator RPI-1009 unresponsive",                severity: "critical" as const, eta: "50s",    icon: "server" },
  { id: "ocr",          title: "OCR Failure",               desc: "Container OCR camera cluster offline at Gate West",    severity: "warn" as const,     eta: "6m",     icon: "camera" },
  { id: "truck",        title: "Truck Breakdown",           desc: "TRK-347 blocking access to Berth A",                   severity: "warn" as const,     eta: "18m",    icon: "truck" },
  { id: "vessel",       title: "Unexpected Vessel Arrival", desc: "MSC Aurora requesting emergency berthing",             severity: "warn" as const,     eta: "22m",    icon: "ship" },
  { id: "power",        title: "Power Failure",             desc: "Substation B offline — 6 RTGs on backup",              severity: "critical" as const, eta: "3m",     icon: "zap" },
  { id: "trailer",      title: "Trailer Shortage",          desc: "Only 12 trailers available for 34 pending moves",       severity: "warn" as const,     eta: "35m",    icon: "boxes" },
];

export const NAV = [
  { to: "/app",             label: "Dashboard",             icon: "dashboard",  exact: true },
  { to: "/app/live-port",   label: "Live Port",             icon: "port" },
  { to: "/app/mesh",        label: "Mesh Network",          icon: "mesh" },
  { to: "/app/gateway",     label: "Mesh Gateway",          icon: "gateway" },
  { to: "/app/containers",  label: "Container Intelligence", icon: "container" },
  { to: "/app/incidents",   label: "Incident Center",       icon: "alert" },
  { to: "/app/ai",          label: "AI Operations",         icon: "brain" },
  { to: "/app/replay",      label: "Replay Center",         icon: "replay" },
  { to: "/app/analytics",   label: "Analytics",             icon: "chart" },
  { to: "/app/nodes",       label: "Node Management",       icon: "server" },
  { to: "/app/settings",    label: "Settings",              icon: "settings" },
] as const;
