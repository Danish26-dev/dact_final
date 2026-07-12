/* ------------------------------------------------------------------
 * DACT Simulation Engine
 * ------------------------------------------------------------------
 * A centralized, deterministic, event-driven simulation of a live
 * container terminal. Every UI page subscribes to this engine — nothing
 * generates its own random data. The engine emits typed events that
 * mutate global state and are broadcast through React context.
 *
 * The public surface (useEngine, EngineEvent types) is designed so the
 * engine can be swapped for a real Socket.IO stream from MONIKA/SARTAJ
 * without touching any UI components.
 * ---------------------------------------------------------------- */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { useSim } from "./simulation";

/* ============ TYPES ============ */

export type ContainerStage =
  | "rfid_scanned"
  | "truck_assigned"
  | "loaded"
  | "moving"
  | "in_yard"
  | "waiting"
  | "loaded_on_vessel"
  | "completed";

export const CONTAINER_STAGES: ContainerStage[] = [
  "rfid_scanned", "truck_assigned", "loaded", "moving",
  "in_yard", "waiting", "loaded_on_vessel", "completed",
];

export interface SimContainer {
  id: string;
  stage: ContainerStage;
  origin: string;
  destination: string;
  cargo: string;
  size: "20ft" | "40ft" | "40HC";
  truckId?: string;
  craneId?: string;
  yard?: string;
  createdAt: number;
  history: { stage: ContainerStage; ts: number; note: string }[];
}

export interface SimTruck {
  id: string;
  x: number; y: number;          // current position 0..100
  waypoints: { x: number; y: number; wait?: number; onArrive?: string }[];
  wpIndex: number;
  arrivedAt?: number;             // when the current waypoint was reached
  status: "idle" | "moving" | "loading" | "unloading";
  containerId?: string;
}

export interface SimCrane {
  id: string;
  x: number; y: number;
  status: "idle" | "lifting" | "lowering";
  progress: number;               // 0..1 for animation
  containerId?: string;
  cycles: number;
}

export interface SimShip {
  id: string;
  name: string;
  x: number;
  progress: number;               // 0..1 discharge
  containers: number;
  status: "berthed" | "approaching" | "departing";
}

export type EngineEventKind =
  | "TRUCK_ENTERED" | "RFID_SCANNED" | "CONTAINER_ASSIGNED" | "CONTAINER_LOADED"
  | "CRANE_PICKUP" | "CONTAINER_MOVED" | "PACKET_CREATED" | "PACKET_FORWARDED"
  | "PACKET_ACK" | "TOS_HEARTBEAT" | "TOS_FAILURE" | "COORDINATOR_ELECTED"
  | "EVENT_QUEUED" | "QUEUE_SYNC" | "QUEUE_EMPTY" | "TOS_RECOVERED";

export interface EngineEvent {
  id: string;
  ts: number;
  kind: EngineEventKind;
  message: string;
  containerId?: string;
  truckId?: string;
  craneId?: string;
  severity: "info" | "success" | "warn" | "critical";
}

export interface SimPacket {
  id: string;
  ts: number;
  from: "truck" | "gateway" | "control" | "crane";
  to: "gateway" | "control" | "queue";
  containerId?: string;
  kind: EngineEventKind;
  status: "in-flight" | "acked" | "queued" | "dropped";
  latencyMs: number;
}

export type GatewayMode = "ONLINE" | "FORWARDING" | "WAITING_ACK" | "TZC" | "SYNCING";

export interface EngineAnalytics {
  containersProcessed: number;
  packetsForwarded: number;
  packetsQueued: number;
  packetsAcked: number;
  avgLatencyMs: number;
  throughputPerMin: number;
  perStageCounts: Record<ContainerStage, number>;
}

export interface EngineState {
  mode: "NORMAL" | "TOS_FAILURE" | "RECOVERY";
  gatewayMode: GatewayMode;
  containers: SimContainer[];
  trucks: SimTruck[];
  cranes: SimCrane[];
  ships: SimShip[];
  packets: SimPacket[];
  eventQueue: EngineEvent[];
  activityLog: EngineEvent[];
  analytics: EngineAnalytics;
  demoRunning: boolean;
  demoLabel: string;
  demoProgress: number;
  activeScenario: string | null;
  scenarioLabel: string;
  scenarioProgress: number;
  disabledTrucks: string[];
  disabledCranes: string[];
  spawnPaused: boolean;
  weatherLevel: number;
  scenarioStartedAt: number | null;
}

export interface EngineApi extends EngineState {
  startDemo: () => void;
  stopDemo: () => void;
  triggerFailure: () => void;
  restoreTos: () => void;
  spawnContainer: () => void;
  getContainer: (id: string) => SimContainer | undefined;
  runScenario: (id: string) => void;
  stopScenario: () => void;
}

/* ============ CONSTANTS ============ */

const GATE = { x: 90, y: 90 };
const YARDS = {
  N1: { x: 18, y: 55 },
  N2: { x: 48, y: 55 },
  S1: { x: 80, y: 55 },
} as const;
const BERTHS = [
  { crane: "CRN-01", x: 15, y: 22 },
  { crane: "CRN-02", x: 25, y: 22 },
  { crane: "CRN-03", x: 50, y: 22 },
  { crane: "CRN-04", x: 60, y: 22 },
];
const CONTROL = { x: 50, y: 5 };
const GATEWAY_POS = { x: 50, y: 40 };

const CARGO = ["Electronics", "Textiles", "Auto Parts", "Chemicals", "Machinery", "Consumer Goods", "Pharmaceuticals"];
const ORIGINS = ["Shanghai", "Singapore", "Rotterdam", "Busan", "Antwerp", "Jebel Ali"];
const DESTS = ["Mumbai", "Chennai", "Mundra", "Cochin", "Vizag"];
const OWNERS = ["MSCU", "MAEU", "CMAU", "HLXU", "ONEU", "COSU", "TCLU"];

const TICK_MS = 200;
const TRUCK_SPEED = 0.7;   // percent units per tick

/* ============ HELPERS ============ */

let _uid = 0;
const uid = (p: string) => `${p}-${(++_uid).toString().padStart(5, "0")}`;
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const rint = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const isoId = () => `${pick(OWNERS)}${rint(1000000, 9999999)}`;

/* ============ INITIAL STATE ============ */

function initTrucks(): SimTruck[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `TRK-${(200 + i * 7).toString()}`,
    x: GATE.x, y: GATE.y,
    waypoints: [],
    wpIndex: 0,
    status: "idle" as const,
  }));
}

function initCranes(): SimCrane[] {
  return BERTHS.map((b) => ({
    id: b.crane, x: b.x, y: b.y,
    status: "idle" as const, progress: 0, cycles: 0,
  }));
}

function initShips(): SimShip[] {
  return [
    { id: "IMO9811000", name: "MSC Gülsün", x: 20, progress: 0.42, containers: 148, status: "berthed" },
    { id: "IMO9893890", name: "Ever Ace",   x: 55, progress: 0.28, containers: 96,  status: "berthed" },
  ];
}

const EMPTY_ANALYTICS: EngineAnalytics = {
  containersProcessed: 0,
  packetsForwarded: 0,
  packetsQueued: 0,
  packetsAcked: 0,
  avgLatencyMs: 14,
  throughputPerMin: 0,
  perStageCounts: {
    rfid_scanned: 0, truck_assigned: 0, loaded: 0, moving: 0,
    in_yard: 0, waiting: 0, loaded_on_vessel: 0, completed: 0,
  },
};

/* ============ CONTEXT ============ */

const EngineCtx = createContext<EngineApi | null>(null);
export const useEngine = () => {
  const ctx = useContext(EngineCtx);
  if (!ctx) throw new Error("useEngine must be used inside EngineProvider");
  return ctx;
};

/* ============ PROVIDER ============ */

export function EngineProvider({ children }: { children: React.ReactNode }) {
  // Bridge to legacy SimulationProvider so demo/incident phases stay in sync
  const sim = useSim();

  const [containers, setContainers] = useState<SimContainer[]>([]);
  const [trucks, setTrucks] = useState<SimTruck[]>(initTrucks);
  const [cranes, setCranes] = useState<SimCrane[]>(initCranes);
  // ships state declared below with scenario state
  const [packets, setPackets] = useState<SimPacket[]>([]);
  const [eventQueue, setEventQueue] = useState<EngineEvent[]>([]);
  const [activityLog, setActivityLog] = useState<EngineEvent[]>([]);
  const [analytics, setAnalytics] = useState<EngineAnalytics>(EMPTY_ANALYTICS);
  const [demoLabel, setDemoLabel] = useState("");
  const [demoProgress, setDemoProgress] = useState(0);
  const [ships, setShips] = useState<SimShip[]>(initShips);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [scenarioLabel, setScenarioLabel] = useState("");
  const [scenarioProgress, setScenarioProgress] = useState(0);
  const [scenarioStartedAt, setScenarioStartedAt] = useState<number | null>(null);
  const [disabledTrucks, setDisabledTrucks] = useState<string[]>([]);
  const [disabledCranes, setDisabledCranes] = useState<string[]>([]);
  const [spawnPaused, setSpawnPaused] = useState(false);
  const [weatherLevel, setWeatherLevel] = useState(0);
  // Modifier refs read by tick loops — kept in refs so intervals see latest
  const disabledTrucksRef = useRef<Set<string>>(new Set());
  const disabledCranesRef = useRef<Set<string>>(new Set());
  const spawnPausedRef = useRef(false);
  const truckSpeedMulRef = useRef(1);
  const packetDropRateRef = useRef(0);

  // Derive engine mode from legacy sim phase
  const mode: EngineState["mode"] =
    sim.phase === "operating-tzc" || sim.phase === "incident" ? "TOS_FAILURE" :
    sim.phase === "recovering" || sim.phase === "restoring" ? "RECOVERY" :
    "NORMAL";

  const gatewayMode: GatewayMode =
    mode === "TOS_FAILURE" ? "TZC" :
    mode === "RECOVERY" ? "SYNCING" :
    "FORWARDING";

  const modeRef = useRef(mode);
  modeRef.current = mode;

  /* ---- Event log helper ---- */
  const emit = useCallback((ev: Omit<EngineEvent, "id" | "ts">) => {
    const full: EngineEvent = { ...ev, id: uid("EV"), ts: Date.now() };
    setActivityLog((l) => [full, ...l].slice(0, 100));
    return full;
  }, []);

  /* ---- Packet emission ---- */
  const emitPacket = useCallback((p: Omit<SimPacket, "id" | "ts" | "status" | "latencyMs">) => {
    const currentMode = modeRef.current;
    const dropped = Math.random() < packetDropRateRef.current;
    const queued = !dropped && currentMode === "TOS_FAILURE" && p.to === "control";
    const packet: SimPacket = {
      ...p,
      id: uid("PKT"),
      ts: Date.now(),
      latencyMs: 12 + Math.floor(Math.random() * 18) + Math.round(packetDropRateRef.current * 80),
      status: dropped ? "dropped" : queued ? "queued" : "in-flight",
      to: queued ? "queue" : p.to,
    };
    setPackets((pk) => [...pk, packet].slice(-50));
    setAnalytics((a) => ({
      ...a,
      packetsForwarded: a.packetsForwarded + (dropped || queued ? 0 : 1),
      packetsQueued: a.packetsQueued + (queued ? 1 : 0),
    }));

    if (dropped) {
      // fade out after a moment
      setTimeout(() => setPackets((pk) => pk.filter((x) => x.id !== packet.id)), 1200);
    } else if (queued) {
      setEventQueue((q) => [...q, {
        id: uid("QEV"), ts: Date.now(), kind: p.kind,
        message: `Queued: ${p.kind}${p.containerId ? " · " + p.containerId : ""}`,
        containerId: p.containerId, severity: "warn",
      }]);
    } else {
      setTimeout(() => {
        setPackets((pk) => pk.map((x) => x.id === packet.id ? { ...x, status: "acked" } : x));
        setAnalytics((a) => ({ ...a, packetsAcked: a.packetsAcked + 1 }));
      }, packet.latencyMs + 350);
    }
    return packet;
  }, []);

  /* ---- Container lifecycle ---- */
  const advanceContainer = useCallback((id: string, stage: ContainerStage, note: string, extra?: Partial<SimContainer>) => {
    setContainers((cs) => cs.map((c) => c.id === id ? {
      ...c, ...extra, stage,
      history: [...c.history, { stage, ts: Date.now(), note }],
    } : c));
    setAnalytics((a) => ({
      ...a,
      perStageCounts: { ...a.perStageCounts, [stage]: a.perStageCounts[stage] + 1 },
      containersProcessed: stage === "completed" ? a.containersProcessed + 1 : a.containersProcessed,
    }));
  }, []);

  /* ---- Spawn a container arriving at the gate ---- */
  const spawnContainer = useCallback(() => {
    // find an idle truck
    let assignedTruck: SimTruck | undefined;
    setTrucks((ts) => {
      const idle = ts.find((t) => t.status === "idle" && !t.containerId);
      if (!idle) return ts;
      assignedTruck = idle;
      return ts;
    });
    // second pass to grab reference (React setter closes over prev)
    const idleTruck = trucks.find((t) => t.status === "idle" && !t.containerId);
    if (!idleTruck && !assignedTruck) return;
    const truck = assignedTruck ?? idleTruck!;

    const cid = isoId();
    const yardKeys = Object.keys(YARDS) as (keyof typeof YARDS)[];
    const yardKey = pick(yardKeys);
    const yard = YARDS[yardKey];
    const berth = pick(BERTHS);

    const container: SimContainer = {
      id: cid,
      stage: "rfid_scanned",
      origin: pick(ORIGINS),
      destination: pick(DESTS),
      cargo: pick(CARGO),
      size: pick(["20ft", "40ft", "40HC"] as const),
      truckId: truck.id,
      craneId: berth.crane,
      yard: yardKey,
      createdAt: Date.now(),
      history: [{ stage: "rfid_scanned", ts: Date.now(), note: `RFID scanned at Gate West · assigned to ${truck.id}` }],
    };
    setContainers((cs) => [container, ...cs].slice(0, 60));
    setAnalytics((a) => ({
      ...a,
      perStageCounts: { ...a.perStageCounts, rfid_scanned: a.perStageCounts.rfid_scanned + 1 },
    }));

    emit({ kind: "RFID_SCANNED", severity: "info",
      message: `RFID scanned ${cid} · Gate West`, containerId: cid, truckId: truck.id });
    emitPacket({ from: "truck", to: "gateway", kind: "RFID_SCANNED", containerId: cid });

    // Assign truck route: Gate → Yard → Berth → back to Yard → back to Gate
    const route: SimTruck["waypoints"] = [
      { x: yard.x, y: 68, onArrive: "on-road" },
      { x: yard.x, y: yard.y, wait: 1500, onArrive: "at-yard-loading" },
      { x: berth.x, y: 32, onArrive: "on-road-to-berth" },
      { x: berth.x, y: berth.y + 6, wait: 3000, onArrive: "at-berth" },
      { x: berth.x, y: yard.y, onArrive: "back-to-yard" },
      { x: GATE.x, y: yard.y, onArrive: "on-road-gate" },
      { x: GATE.x, y: GATE.y, onArrive: "at-gate" },
    ];
    setTrucks((ts) => ts.map((t) => t.id === truck.id ? {
      ...t, containerId: cid, waypoints: route, wpIndex: 0, status: "moving",
    } : t));

    // Advance to "truck_assigned" shortly
    setTimeout(() => {
      advanceContainer(cid, "truck_assigned", `Assigned to ${truck.id}`);
      emit({ kind: "CONTAINER_ASSIGNED", severity: "info",
        message: `Container ${cid} assigned to ${truck.id}`, containerId: cid, truckId: truck.id });
      emitPacket({ from: "truck", to: "gateway", kind: "CONTAINER_ASSIGNED", containerId: cid });
    }, 400);
  }, [trucks, emit, emitPacket, advanceContainer]);

  /* ---- Truck movement tick ---- */
  useEffect(() => {
    const iv = window.setInterval(() => {
      // move trucks toward waypoints
      setTrucks((prev) => prev.map((t) => {
        if (t.status !== "moving" || t.wpIndex >= t.waypoints.length) return t;
        if (disabledTrucksRef.current.has(t.id)) return t; // broken/immobilized
        const speed = TRUCK_SPEED * truckSpeedMulRef.current;
        const wp = t.waypoints[t.wpIndex];

        // Waiting at waypoint?
        if (wp.wait && t.arrivedAt && Date.now() - t.arrivedAt < wp.wait) return t;

        const dx = wp.x - t.x, dy = wp.y - t.y;
        const d = Math.hypot(dx, dy);
        if (d < speed) {
          const arrived = { ...t, x: wp.x, y: wp.y, arrivedAt: Date.now() };
          // Handle arrival side-effects (fire once by scheduling)
          const onArrive = wp.onArrive;
          const cid = t.containerId;
          const nextIdx = t.wpIndex + 1;

          queueMicrotask(() => {
            if (cid) {
              if (onArrive === "at-yard-loading") {
                advanceContainer(cid, "loaded", `Loaded onto ${t.id} at yard`);
                emit({ kind: "CONTAINER_LOADED", severity: "success",
                  message: `${cid} loaded onto ${t.id}`, containerId: cid, truckId: t.id });
                emitPacket({ from: "truck", to: "gateway", kind: "CONTAINER_LOADED", containerId: cid });
              } else if (onArrive === "on-road-to-berth") {
                advanceContainer(cid, "moving", `In transit to berth`);
                emit({ kind: "CONTAINER_MOVED", severity: "info",
                  message: `${cid} moving toward berth`, containerId: cid });
              } else if (onArrive === "at-berth") {
                // Trigger crane cycle
                setCranes((cs) => cs.map((c) => c.id === (containers.find((cc) => cc.id === cid)?.craneId ?? "")
                  ? { ...c, status: "lifting", containerId: cid, progress: 0 } : c));
                emit({ kind: "CRANE_PICKUP", severity: "success",
                  message: `Crane lifting ${cid} onto vessel`, containerId: cid });
                emitPacket({ from: "crane", to: "gateway", kind: "CRANE_PICKUP", containerId: cid });

                setTimeout(() => {
                  advanceContainer(cid, "loaded_on_vessel", "Loaded onto vessel");
                  emit({ kind: "CONTAINER_MOVED", severity: "success",
                    message: `${cid} loaded onto vessel`, containerId: cid });
                  emitPacket({ from: "gateway", to: "control", kind: "CONTAINER_MOVED", containerId: cid });
                }, 2500);
                setTimeout(() => {
                  advanceContainer(cid, "completed", "Ship handoff complete");
                  setCranes((cs) => cs.map((c) => c.containerId === cid
                    ? { ...c, status: "idle", containerId: undefined, progress: 0, cycles: c.cycles + 1 } : c));
                  // release truck
                }, 4000);
              } else if (onArrive === "back-to-yard") {
                advanceContainer(cid, "in_yard", "Truck returning to yard");
              } else if (onArrive === "at-gate") {
                setTrucks((ts) => ts.map((x) => x.id === t.id ? {
                  ...x, containerId: undefined, status: "idle", waypoints: [], wpIndex: 0, arrivedAt: undefined,
                } : x));
              }
            }
          });

          if (wp.wait && !arrived.arrivedAt) return arrived;
          if (wp.wait) return arrived; // wait handled next tick
          return { ...arrived, wpIndex: nextIdx, arrivedAt: undefined };
        }

        // Advance if wait expired
        if (wp.wait && t.arrivedAt && Date.now() - t.arrivedAt >= wp.wait) {
          return { ...t, wpIndex: t.wpIndex + 1, arrivedAt: undefined };
        }

        const nx = t.x + (dx / d) * speed;
        const ny = t.y + (dy / d) * speed;
        return { ...t, x: nx, y: ny };
      }));

      // Cranes: advance lift/lower animation (skip disabled)
      setCranes((prev) => prev.map((c) => {
        if (disabledCranesRef.current.has(c.id)) {
          return c.status === "idle" ? c : { ...c, status: "idle", progress: 0, containerId: undefined };
        }
        if (c.status === "idle") return c;
        const next = c.progress + 0.04;
        if (next >= 1) return { ...c, status: "idle", progress: 0 };
        return { ...c, progress: next };
      }));

      // Clean old packets
      setPackets((prev) => prev.filter((p) => Date.now() - p.ts < 4000));
    }, TICK_MS);
    return () => window.clearInterval(iv);
  }, [advanceContainer, emit, emitPacket, containers]);

  /* ---- Throughput per min (rolling) ---- */
  useEffect(() => {
    const iv = window.setInterval(() => {
      setAnalytics((a) => ({
        ...a,
        throughputPerMin: a.perStageCounts.completed * 6,   // approximate over 10s window
        avgLatencyMs: 12 + Math.random() * 6,
      }));
    }, 1500);
    return () => window.clearInterval(iv);
  }, []);

  /* ---- Auto container spawner (only in NORMAL / TOS_FAILURE modes) ---- */
  useEffect(() => {
    const iv = window.setInterval(() => {
      if (spawnPausedRef.current) return;
      spawnContainer();
    }, 4200);
    return () => window.clearInterval(iv);
  }, [spawnContainer]);

  // Spawn a couple initial containers on mount so the UI has content immediately
  const bootRef = useRef(false);
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    setTimeout(() => spawnContainer(), 300);
    setTimeout(() => spawnContainer(), 900);
    setTimeout(() => spawnContainer(), 1600);
  }, [spawnContainer]);

  /* ---- Queue sync on recovery ---- */
  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current === "TOS_FAILURE" && (mode === "RECOVERY" || mode === "NORMAL")) {
      // Sync queued events to control
      const q = eventQueue;
      if (q.length > 0) {
        emit({ kind: "QUEUE_SYNC", severity: "info",
          message: `Synchronizing ${q.length} queued events to Mission Control` });
        q.forEach((qev, i) => {
          setTimeout(() => {
            emitPacket({ from: "gateway", to: "control", kind: qev.kind, containerId: qev.containerId });
          }, i * 200);
        });
        setTimeout(() => {
          setEventQueue([]);
          emit({ kind: "QUEUE_EMPTY", severity: "success",
            message: `Queue drained · Gateway back to forwarding mode` });
        }, q.length * 200 + 400);
      }
    }
    prevMode.current = mode;
  }, [mode, eventQueue, emit, emitPacket]);

  /* ---- Demo timeline (90 seconds) ---- */
  const demoTimersRef = useRef<number[]>([]);
  const clearDemoTimers = () => { demoTimersRef.current.forEach(clearTimeout); demoTimersRef.current = []; };

  const startDemo = useCallback(() => {
    clearDemoTimers();
    setDemoProgress(0);

    const steps: { at: number; label: string; run?: () => void }[] = [
      { at: 0,     label: "1 · Ship berthed · terminal healthy",       run: () => { sim.stopDemo(); } },
      { at: 3000,  label: "2 · Truck TRK-207 entering terminal",       run: () => spawnContainer() },
      { at: 8000,  label: "3 · RFID scan → container assigned",        run: () => spawnContainer() },
      { at: 14000, label: "4 · Truck moving to yard N2",               run: () => spawnContainer() },
      { at: 22000, label: "5 · Crane lifting onto vessel",             },
      { at: 28000, label: "6 · Gateway forwarding to Mission Control", run: () => spawnContainer() },
      { at: 34000, label: "7 · Dashboard updated · analytics live",    },
      { at: 40000, label: "8 · TOS heartbeat lost",                    run: () => sim.simulateFailure() },
      { at: 46000, label: "9 · Coordinator elected · queue starts",    run: () => spawnContainer() },
      { at: 52000, label: "10 · Operations continue locally",          run: () => spawnContainer() },
      { at: 60000, label: "11 · Restoring TOS",                        run: () => sim.restoreTos() },
      { at: 70000, label: "12 · Queued events synchronizing",          },
      { at: 80000, label: "13 · Gateway back to normal forwarding",    },
      { at: 88000, label: "14 · Simulation complete",                  },
    ];

    steps.forEach((s) => {
      demoTimersRef.current.push(window.setTimeout(() => {
        setDemoLabel(s.label);
        setDemoProgress(s.at / 90000);
        s.run?.();
      }, s.at));
    });
    demoTimersRef.current.push(window.setTimeout(() => {
      setDemoLabel("");
      setDemoProgress(0);
    }, 92000));
  }, [sim, spawnContainer]);

  const stopDemo = useCallback(() => {
    clearDemoTimers();
    setDemoLabel("");
    setDemoProgress(0);
  }, []);

  useEffect(() => () => clearDemoTimers(), []);

  /* ---- Bridge controls ---- */
  const triggerFailure = useCallback(() => sim.simulateFailure(), [sim]);
  const restoreTos = useCallback(() => sim.restoreTos(), [sim]);

  const getContainer = useCallback((id: string) => containers.find((c) => c.id === id), [containers]);

  /* ---- Scenario system ---- */
  const scenarioTimersRef = useRef<number[]>([]);
  const clearScenarioTimers = () => { scenarioTimersRef.current.forEach(clearTimeout); scenarioTimersRef.current = []; };

  const resetMods = useCallback(() => {
    disabledTrucksRef.current = new Set();
    disabledCranesRef.current = new Set();
    spawnPausedRef.current = false;
    truckSpeedMulRef.current = 1;
    packetDropRateRef.current = 0;
    setDisabledTrucks([]);
    setDisabledCranes([]);
    setSpawnPaused(false);
    setWeatherLevel(0);
  }, []);

  const stopScenario = useCallback(() => {
    clearScenarioTimers();
    resetMods();
    setActiveScenario(null);
    setScenarioLabel("");
    setScenarioProgress(0);
    setScenarioStartedAt(null);
    setShips(initShips());
  }, [resetMods]);

  const runScenario = useCallback((id: string) => {
    clearScenarioTimers();
    resetMods();
    setActiveScenario(id);
    setScenarioStartedAt(Date.now());
    setScenarioProgress(0);

    // Scenario script builder: each step: {at ms, label, run}
    type Step = { at: number; label: string; run?: () => void };
    let steps: Step[] = [];
    const total = 26000; // ~26s per scenario

    const disableTruck = (tid: string) => {
      disabledTrucksRef.current.add(tid);
      setDisabledTrucks(Array.from(disabledTrucksRef.current));
    };
    const enableTruck = (tid: string) => {
      disabledTrucksRef.current.delete(tid);
      setDisabledTrucks(Array.from(disabledTrucksRef.current));
    };
    const disableCrane = (cid: string) => {
      disabledCranesRef.current.add(cid);
      setDisabledCranes(Array.from(disabledCranesRef.current));
    };
    const enableCrane = (cid: string) => {
      disabledCranesRef.current.delete(cid);
      setDisabledCranes(Array.from(disabledCranesRef.current));
    };

    switch (id) {
      case "cyber":
        steps = [
          { at: 0, label: "Intrusion attempts detected on gateway node", run: () => {
              packetDropRateRef.current = 0.35;
              emit({ kind: "TOS_FAILURE", severity: "critical", message: "Cyber intrusion detected · malicious packets flooding gateway" });
            }},
          { at: 3500, label: "Firewall isolating suspicious traffic", run: () => {
              packetDropRateRef.current = 0.55;
              emit({ kind: "PACKET_FORWARDED", severity: "warn", message: "Firewall dropping 55% of untrusted packets" });
            }},
          { at: 8000, label: "Gateway entering defensive TZC mode", run: () => {
              sim.simulateFailure();
              emit({ kind: "COORDINATOR_ELECTED", severity: "warn", message: "Gateway assuming defensive coordinator role" });
            }},
          { at: 14000, label: "Attacker traffic blocked · signatures updated", run: () => {
              packetDropRateRef.current = 0.15;
              emit({ kind: "QUEUE_SYNC", severity: "info", message: "New WAF signatures deployed to all edge nodes" });
            }},
          { at: 20000, label: "TOS restored · normal forwarding resumed", run: () => {
              packetDropRateRef.current = 0;
              sim.restoreTos();
            }},
          { at: 25000, label: "Cyber incident contained", run: () => {
              emit({ kind: "TOS_RECOVERED", severity: "success", message: "All zones clean · operations fully restored" });
            }},
        ];
        break;

      case "rain":
        steps = [
          { at: 0, label: "Heavy rain detected · OCR degraded", run: () => {
              setWeatherLevel(1); truckSpeedMulRef.current = 0.4;
              emit({ kind: "TOS_HEARTBEAT", severity: "warn", message: "Weather sensors: 42mm/hr · visibility 120m" });
            }},
          { at: 4000, label: "Trucks reducing speed on wet roads", run: () => {
              emit({ kind: "CONTAINER_MOVED", severity: "warn", message: "All trucks limited to 40% cruise speed" });
            }},
          { at: 9000, label: "OCR fallback → manual RFID verification", run: () => {
              emit({ kind: "RFID_SCANNED", severity: "info", message: "Switched Gate West to RFID-only mode" });
            }},
          { at: 16000, label: "Rain easing · resuming normal speed", run: () => {
              truckSpeedMulRef.current = 0.75;
            }},
          { at: 22000, label: "Weather cleared · full operations", run: () => {
              setWeatherLevel(0); truckSpeedMulRef.current = 1;
              emit({ kind: "TOS_RECOVERED", severity: "success", message: "Visibility restored · full throughput resumed" });
            }},
        ];
        break;

      case "partition":
        steps = [
          { at: 0, label: "Yard N2 lost link to primary coordinator", run: () => {
              sim.simulateFailure();
              packetDropRateRef.current = 0.4;
              emit({ kind: "TOS_FAILURE", severity: "critical", message: "Network partition · Yard N2 isolated" });
            }},
          { at: 4000, label: "Gateway acting as TZC for orphaned zone", run: () => {
              emit({ kind: "COORDINATOR_ELECTED", severity: "warn", message: "Gateway elected temporary coordinator for Yard N2" });
            }},
          { at: 10000, label: "Events queuing locally · CRDT log growing", run: () => {
              emit({ kind: "EVENT_QUEUED", severity: "warn", message: "Local queue: 48 events awaiting sync" });
            }},
          { at: 16000, label: "Link restored · reconciling queued events", run: () => {
              packetDropRateRef.current = 0;
              sim.restoreTos();
            }},
          { at: 22000, label: "Partition healed · mesh converged", run: () => {
              emit({ kind: "TOS_RECOVERED", severity: "success", message: "All zones reconnected · zero conflicts" });
            }},
        ];
        break;

      case "coordinator":
        steps = [
          { at: 0, label: "Coordinator RPI-1009 unresponsive", run: () => {
              sim.simulateFailure();
              emit({ kind: "TOS_FAILURE", severity: "critical", message: "Zone coordinator RPI-1009 missed 3 heartbeats" });
            }},
          { at: 4000, label: "Election started · candidates: RPI-1012, RPI-1015", run: () => {
              emit({ kind: "COORDINATOR_ELECTED", severity: "warn", message: "Bully algorithm election in progress" });
            }},
          { at: 9000, label: "RPI-1012 promoted to coordinator", run: () => {
              emit({ kind: "COORDINATOR_ELECTED", severity: "success", message: "RPI-1012 is new zone coordinator" });
            }},
          { at: 15000, label: "Mesh reconfigured · traffic rerouted", },
          { at: 20000, label: "Original node recovered · standby role", run: () => sim.restoreTos() },
          { at: 25000, label: "Coordinator election complete", run: () => emit({ kind: "TOS_RECOVERED", severity: "success", message: "Zone stable under new coordinator" }) },
        ];
        break;

      case "ocr":
        steps = [
          { at: 0, label: "OCR camera cluster at Gate West offline", run: () => {
              spawnPausedRef.current = true; setSpawnPaused(true);
              emit({ kind: "TOS_FAILURE", severity: "warn", message: "Container OCR pipeline down · new arrivals paused" });
            }},
          { at: 5000, label: "Switching to manual gate check", run: () => {
              emit({ kind: "RFID_SCANNED", severity: "info", message: "Manual RFID verification enabled at Gate West" });
            }},
          { at: 10000, label: "Backup OCR node coming online", },
          { at: 16000, label: "OCR restored at 60% capacity", run: () => {
              spawnPausedRef.current = false; setSpawnPaused(false);
              emit({ kind: "RFID_SCANNED", severity: "info", message: "OCR partial recovery · resuming intake" });
            }},
          { at: 22000, label: "Full OCR service restored", run: () => emit({ kind: "TOS_RECOVERED", severity: "success", message: "OCR cluster fully operational" }) },
        ];
        break;

      case "truck":
        steps = [
          { at: 0, label: "TRK-207 breakdown at Berth A access", run: () => {
              const victim = trucks[0]?.id ?? "TRK-207";
              disableTruck(victim);
              emit({ kind: "TOS_FAILURE", severity: "warn", message: `${victim} disabled · blocking access to Berth A` });
            }},
          { at: 4000, label: "Rerouting other trucks via alternate lane", run: () => {
              emit({ kind: "CONTAINER_MOVED", severity: "info", message: "Traffic rerouted around Berth A obstruction" });
            }},
          { at: 12000, label: "Recovery vehicle dispatched", },
          { at: 18000, label: "Truck towed · lane clear", run: () => {
              const victim = trucks[0]?.id ?? "TRK-207";
              enableTruck(victim);
              emit({ kind: "TOS_RECOVERED", severity: "success", message: `${victim} recovered · normal flow resumed` });
            }},
          { at: 24000, label: "Full berth access restored", },
        ];
        break;

      case "vessel":
        steps = [
          { at: 0, label: "MSC Aurora requesting emergency berthing", run: () => {
              setShips((s) => [...s, { id: "IMO9999999", name: "MSC Aurora", x: 78, progress: 0, containers: 220, status: "approaching" }]);
              emit({ kind: "TOS_FAILURE", severity: "warn", message: "Unscheduled vessel · MSC Aurora ETA 8 min" });
            }},
          { at: 5000, label: "Reassigning cranes CRN-03, CRN-04 to Berth C" },
          { at: 10000, label: "MSC Aurora berthed · discharge starting", run: () => {
              setShips((s) => s.map((sh) => sh.id === "IMO9999999" ? { ...sh, x: 72, status: "berthed", progress: 0.1 } : sh));
            }},
          { at: 18000, label: "Discharge in progress · 30% complete", run: () => {
              setShips((s) => s.map((sh) => sh.id === "IMO9999999" ? { ...sh, progress: 0.32 } : sh));
            }},
          { at: 24000, label: "Emergency berthing stable", run: () => emit({ kind: "TOS_RECOVERED", severity: "success", message: "MSC Aurora integrated into schedule" }) },
        ];
        break;

      case "power":
        steps = [
          { at: 0, label: "Substation B offline · 6 RTGs on backup", run: () => {
              disableCrane("CRN-03"); disableCrane("CRN-04");
              emit({ kind: "TOS_FAILURE", severity: "critical", message: "Grid failure · Berth B cranes on UPS" });
            }},
          { at: 5000, label: "UPS holding · crane cycles suspended", run: () => {
              emit({ kind: "CRANE_PICKUP", severity: "warn", message: "CRN-03, CRN-04 idled to preserve battery" });
            }},
          { at: 12000, label: "Generator online · restoring Berth B power" },
          { at: 18000, label: "Cranes back to operation", run: () => {
              enableCrane("CRN-03"); enableCrane("CRN-04");
              emit({ kind: "CRANE_PICKUP", severity: "success", message: "CRN-03, CRN-04 resumed normal cycles" });
            }},
          { at: 24000, label: "Grid restored · fully operational", run: () => emit({ kind: "TOS_RECOVERED", severity: "success", message: "Substation B back on grid" }) },
        ];
        break;

      case "trailer":
        steps = [
          { at: 0, label: "Trailer shortage · 34 moves / 12 trailers", run: () => {
              trucks.slice(3).forEach((t) => disableTruck(t.id));
              emit({ kind: "TOS_FAILURE", severity: "warn", message: "Trailer pool depleted · scheduling backlog" });
            }},
          { at: 5000, label: "Prioritizing reefer & hazmat moves", run: () => {
              emit({ kind: "CONTAINER_ASSIGNED", severity: "info", message: "AI reprioritized queue: reefer/hazmat first" });
            }},
          { at: 12000, label: "External haulers dispatched" },
          { at: 18000, label: "Additional trailers arriving · fleet expanding", run: () => {
              trucks.slice(3, 5).forEach((t) => enableTruck(t.id));
              emit({ kind: "CONTAINER_ASSIGNED", severity: "info", message: "6 additional trailers online" });
            }},
          { at: 24000, label: "Fleet fully restored", run: () => {
              trucks.forEach((t) => enableTruck(t.id));
              emit({ kind: "TOS_RECOVERED", severity: "success", message: "Trailer pool fully replenished" });
            }},
        ];
        break;

      default:
        steps = [{ at: 0, label: "Scenario running", }];
    }

    steps.forEach((s) => {
      scenarioTimersRef.current.push(window.setTimeout(() => {
        setScenarioLabel(s.label);
        setScenarioProgress(Math.min(1, s.at / total));
        s.run?.();
      }, s.at));
    });
    // Progress ticker
    const startedAt = Date.now();
    const progIv = window.setInterval(() => {
      const el = Date.now() - startedAt;
      setScenarioProgress(Math.min(1, el / total));
      if (el >= total + 1500) window.clearInterval(progIv);
    }, 200);
    scenarioTimersRef.current.push(progIv as unknown as number);
    // Auto-clear
    scenarioTimersRef.current.push(window.setTimeout(() => {
      resetMods();
      setScenarioProgress(1);
    }, total + 1000));
  }, [emit, resetMods, sim, trucks]);

  useEffect(() => () => clearScenarioTimers(), []);

  const api = useMemo<EngineApi>(() => ({
    mode, gatewayMode, containers, trucks, cranes, ships, packets,
    eventQueue, activityLog, analytics,
    demoRunning: demoLabel !== "", demoLabel, demoProgress,
    activeScenario, scenarioLabel, scenarioProgress, scenarioStartedAt,
    disabledTrucks, disabledCranes, spawnPaused, weatherLevel,
    startDemo, stopDemo, triggerFailure, restoreTos, spawnContainer, getContainer,
    runScenario, stopScenario,
  }), [mode, gatewayMode, containers, trucks, cranes, ships, packets,
       eventQueue, activityLog, analytics, demoLabel, demoProgress,
       activeScenario, scenarioLabel, scenarioProgress, scenarioStartedAt,
       disabledTrucks, disabledCranes, spawnPaused, weatherLevel,
       startDemo, stopDemo, triggerFailure, restoreTos, spawnContainer, getContainer,
       runScenario, stopScenario]);

  return <EngineCtx.Provider value={api}>{children}</EngineCtx.Provider>;
}

/* ============ HELPERS EXPORTED FOR UI ============ */

export const ENGINE_POSITIONS = { GATE, YARDS, BERTHS, CONTROL, GATEWAY: GATEWAY_POS };

export const STAGE_LABEL: Record<ContainerStage, string> = {
  rfid_scanned: "RFID Scanned",
  truck_assigned: "Truck Assigned",
  loaded: "Loaded",
  moving: "Moving",
  in_yard: "In Yard",
  waiting: "Waiting",
  loaded_on_vessel: "Loaded onto Vessel",
  completed: "Completed",
};
