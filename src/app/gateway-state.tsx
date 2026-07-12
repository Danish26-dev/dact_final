import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------
 * Mesh Gateway (MONIKA) — centralized state.
 * Designed so a real Socket.IO client can later replace the mock
 * generator without touching the UI. All UI reads state via useGateway().
 * ---------------------------------------------------------------- */

export type GatewayRole = "gateway" | "temporary-coordinator";
export type LinkStatus = "connected" | "disconnected";

export interface MeshNode {
  id: string;
  name: string;
  kind: "truck" | "crane" | "gate" | "rfid" | "reefer";
  online: boolean;
  internet: boolean; // node's own uplink (usually false in field)
  mesh: boolean;
  signal: number;    // 0..100
  quality: number;   // 0..100
  packets: number;
  lastEventAt: number;
}

export interface GatewayEvent {
  id: string;
  container: string;
  kind: string;       // Loaded, RFID Scan, Crane Update, Truck Update, Gate Exit
  nodeId: string;
  ts: number;
  status: "forwarded" | "queued" | "syncing" | "acked";
  retries: number;
}

export interface Packet {
  id: string;
  eventId: string;
  from: "node";
  to: "mission-control" | "queue";
  createdAt: number;
  nodeId: string;
}

export interface GatewayLog {
  id: string;
  ts: number;
  level: "info" | "warn" | "critical" | "success";
  message: string;
}

interface GatewayState {
  gatewayName: string;
  role: GatewayRole;
  online: boolean;
  internetConnected: boolean;
  meshConnected: boolean;
  missionControlOnline: boolean;
  lastHeartbeat: number;
  latencyMs: number;
  forwardSuccessRate: number;
  connectedNodes: MeshNode[];
  queue: GatewayEvent[];
  history: GatewayEvent[];     // last N forwarded events
  packets: Packet[];           // in-flight animated packets
  logs: GatewayLog[];
  syncing: boolean;
  syncTotal: number;
  syncDone: number;
}

interface GatewayApi extends GatewayState {
  simulateTosFailure: () => void;
  restoreTos: () => void;
  emitEvent: (kind: string, nodeKind?: MeshNode["kind"]) => void;
}

const GatewayContext = createContext<GatewayApi | null>(null);

const INITIAL_NODES: MeshNode[] = [
  { id: "TRK-01", name: "Truck Node 01", kind: "truck", online: true, internet: false, mesh: true, signal: 88, quality: 94, packets: 134, lastEventAt: Date.now() - 2000 },
  { id: "TRK-02", name: "Truck Node 02", kind: "truck", online: true, internet: false, mesh: true, signal: 76, quality: 87, packets: 98,  lastEventAt: Date.now() - 5000 },
  { id: "CRN-01", name: "Crane Node",    kind: "crane", online: true, internet: false, mesh: true, signal: 92, quality: 96, packets: 289, lastEventAt: Date.now() - 1000 },
  { id: "GATE-W", name: "Gate Node West",kind: "gate",  online: true, internet: false, mesh: true, signal: 84, quality: 91, packets: 92,  lastEventAt: Date.now() - 3000 },
  { id: "RFID-A", name: "RFID Reader A", kind: "rfid",  online: true, internet: false, mesh: true, signal: 71, quality: 82, packets: 61,  lastEventAt: Date.now() - 8000 },
  { id: "REF-03", name: "Reefer Sensor", kind: "reefer",online: true, internet: false, mesh: true, signal: 66, quality: 78, packets: 44,  lastEventAt: Date.now() - 12000 },
];

const CONTAINER_IDS = ["MSCU123456", "MAEU884120", "CMAU771092", "HLXU559034", "ONEU210044", "EGHU998812", "TGHU443210"];
const EVENT_KINDS = ["Container Loaded", "RFID Scan", "Crane Update", "Truck Update", "Gate Exit"];

let idc = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}-${(++idc).toString(36)}`;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const HHMMSS = (ts: number) => new Date(ts).toLocaleTimeString("en-IN", { hour12: false });

const mergeQueueEvents = (current: GatewayEvent[], incoming: GatewayEvent[]) => {
  const byId = new Map<string, GatewayEvent>();
  [...incoming, ...current].forEach((event) => byId.set(event.id, event));
  return Array.from(byId.values()).sort((a, b) => b.ts - a.ts);
};

export function GatewayProvider({ children }: { children: React.ReactNode }) {
  const [gatewayName] = useState("MONIKA");
  const [role, setRole] = useState<GatewayRole>("gateway");
  const [missionControlOnline, setMcOnline] = useState(true);
  const [lastHeartbeat, setLastHeartbeat] = useState(Date.now());
  const [latencyMs, setLatency] = useState(12);
  const [forwardSuccessRate, setSuccess] = useState(100);
  const [connectedNodes, setNodes] = useState<MeshNode[]>(INITIAL_NODES);
  const [queue, setQueue] = useState<GatewayEvent[]>([]);
  const [history, setHistory] = useState<GatewayEvent[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [logs, setLogs] = useState<GatewayLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncTotal, setSyncTotal] = useState(0);
  const [syncDone, setSyncDone] = useState(0);

  const mcOnlineRef = useRef(missionControlOnline);
  useEffect(() => { mcOnlineRef.current = missionControlOnline; }, [missionControlOnline]);

  const addLog = useCallback((level: GatewayLog["level"], message: string) => {
    setLogs(prev => [{ id: nid("log"), ts: Date.now(), level, message }, ...prev].slice(0, 200));
  }, []);

  // seed logs
  useEffect(() => {
    addLog("success", "Gateway MONIKA online — bound to mesh interface wlan0");
    addLog("info", "Peer discovery complete — 6 nodes registered");
    addLog("success", "Mission Control link established (12 ms)");
  }, [addLog]);

  const emitEvent = useCallback((kind?: string, nodeKind?: MeshNode["kind"]) => {
    setNodes(prevNodes => {
      const pool = nodeKind ? prevNodes.filter(n => n.kind === nodeKind) : prevNodes;
      const node = (pool.length ? pool : prevNodes)[Math.floor(Math.random() * (pool.length || prevNodes.length))];
      const container = pick(CONTAINER_IDS);
      const evKind = kind ?? pick(EVENT_KINDS);
      const mcUp = mcOnlineRef.current;
      const ev: GatewayEvent = {
        id: nid("ev"),
        container,
        kind: evKind,
        nodeId: node.id,
        ts: Date.now(),
        status: mcUp ? "forwarded" : "queued",
        retries: 0,
      };
      const packet: Packet = {
        id: nid("pkt"),
        eventId: ev.id,
        from: "node",
        to: mcUp ? "mission-control" : "queue",
        createdAt: Date.now(),
        nodeId: node.id,
      };
      setPackets(p => [...p, packet].slice(-24));
      if (mcUp) {
        setHistory(h => [ev, ...h].slice(0, 40));
        addLog("info", `Container ${container} · ${evKind} received from ${node.id}`);
        addLog("success", `Forwarded → Mission Control · ACK ${Math.round(8 + Math.random() * 10)} ms`);
      } else {
        setQueue(q => [...q, ev]);
        addLog("warn", `MC unreachable — queued ${container} (${evKind}) from ${node.id}`);
      }
      // drop packet after animation completes
      setTimeout(() => setPackets(p => p.filter(x => x.id !== packet.id)), 2600);
      return prevNodes.map(n => n.id === node.id
        ? { ...n, packets: n.packets + 1, lastEventAt: Date.now() }
        : n);
    });
  }, [addLog]);

  // heartbeat + background traffic
  useEffect(() => {
    const hb = setInterval(() => {
      setLastHeartbeat(Date.now());
      setLatency(l => Math.max(6, Math.min(28, l + (Math.random() - 0.5) * 3)));
      setNodes(ns => ns.map(n => ({
        ...n,
        signal: Math.max(40, Math.min(100, n.signal + (Math.random() - 0.5) * 4)),
        quality: Math.max(50, Math.min(100, n.quality + (Math.random() - 0.5) * 3)),
      })));
    }, 1500);
    const traffic = setInterval(() => emitEvent(), 3500);
    return () => { clearInterval(hb); clearInterval(traffic); };
  }, [emitEvent]);

  // Poll the public API queue so events POSTed to
  // /api/public/gateway/queue appear in the UI Queue card.
  useEffect(() => {
    const seen = new Set<string>();
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/public/gateway/queue", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { queue: GatewayEvent[] };
        if (cancelled || !Array.isArray(data.queue)) return;
        const fresh = data.queue.filter(e => !seen.has(e.id));
        if (!fresh.length) return;
        fresh.forEach(e => seen.add(e.id));
        setQueue(q => mergeQueueEvents(q, fresh));
        fresh.forEach(e =>
          addLog("info", `API · queued ${e.container} (${e.kind}) from ${e.nodeId}`)
        );
      } catch {
        /* ignore transient network errors */
      }
    };
    poll();
    const t = setInterval(poll, 1000);

    // Realtime: instant updates when a new row is inserted via the API.
    const channel = supabase
      .channel("gateway_queue_events_rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gateway_queue_events" },
        (payload) => {
          const row = payload.new as {
            id: string;
            container: string;
            kind: string;
            node_id: string;
            event_ts: string;
            status: GatewayEvent["status"];
            retries: number;
          };
          if (seen.has(row.id)) return;
          seen.add(row.id);
          const ev: GatewayEvent = {
            id: row.id,
            container: row.container,
            kind: row.kind,
            nodeId: row.node_id,
            ts: new Date(row.event_ts).getTime(),
            status: row.status,
            retries: row.retries,
          };
          setQueue(q => mergeQueueEvents(q, [ev]));
          addLog("info", `API · queued ${ev.container} (${ev.kind}) from ${ev.nodeId}`);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [addLog]);

  const simulateTosFailure = useCallback(() => {
    setMcOnline(false);
    setRole("temporary-coordinator");
    setSuccess(0);
    addLog("critical", "Gateway timeout — no ACK from Mission Control (3 missed heartbeats)");
    addLog("warn", "Entering Coordinator Mode — role changed to Temporary Zone Coordinator");
    addLog("info", "Queue started · local acknowledgements enabled for edge nodes");
  }, [addLog]);

  const restoreTos = useCallback(async () => {
    setMcOnline(true);
    addLog("success", "Mission Control link restored — beginning queue synchronization");
    setSyncing(true);
    // snapshot queue
    let pending: GatewayEvent[] = [];
    setQueue(q => { pending = q; return q; });
    // small delay so state settles
    await new Promise(r => setTimeout(r, 50));
    setSyncTotal(pending.length);
    setSyncDone(0);
    for (let i = 0; i < pending.length; i++) {
      const ev = pending[i];
      await new Promise(r => setTimeout(r, 260));
      setQueue(q => q.filter(x => x.id !== ev.id));
      setHistory(h => [{ ...ev, status: "acked" as const, retries: ev.retries + 1 }, ...h].slice(0, 40));
      setSyncDone(i + 1);
      addLog("success", `Synced ${ev.container} · ${ev.kind} (${i + 1}/${pending.length})`);
    }
    setSyncing(false);
    setRole("gateway");
    setSuccess(100);
    addLog("success", "Synchronization complete — gateway returned to normal mode");
  }, [addLog]);

  const value = useMemo<GatewayApi>(() => ({
    gatewayName,
    role,
    online: true,
    internetConnected: missionControlOnline,
    meshConnected: true,
    missionControlOnline,
    lastHeartbeat,
    latencyMs: Math.round(latencyMs),
    forwardSuccessRate,
    connectedNodes,
    queue,
    history,
    packets,
    logs,
    syncing,
    syncTotal,
    syncDone,
    simulateTosFailure,
    restoreTos,
    emitEvent,
  }), [gatewayName, role, missionControlOnline, lastHeartbeat, latencyMs, forwardSuccessRate, connectedNodes, queue, history, packets, logs, syncing, syncTotal, syncDone, simulateTosFailure, restoreTos, emitEvent]);

  return <GatewayContext.Provider value={value}>{children}</GatewayContext.Provider>;
}

export function useGateway() {
  const ctx = useContext(GatewayContext);
  if (!ctx) throw new Error("useGateway must be used within GatewayProvider");
  return ctx;
}

export { HHMMSS };
