import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity, AlertTriangle, CheckCircle2, Play,
  RefreshCw, Server, ShieldCheck, Sparkles, Timer,
  Waves, Wifi, WifiOff, X, ChevronRight, Zap,
} from "lucide-react";
import { C } from "./tokens";

/* --------------------------------------------------------------------------
 * Global simulation state — drives the entire presentation experience.
 * ------------------------------------------------------------------------ */

export type SimPhase =
  | "normal"
  | "detecting"      // heartbeat starting to fail
  | "incident"       // TOS marked offline, banner shown
  | "recovering"     // AI mission timeline running
  | "operating-tzc"  // temporary coordinator active
  | "restoring"      // TOS coming back
  | "recovered";     // green again, TZC stepping down

interface SimState {
  phase: SimPhase;
  tosHeartbeat: number;   // 0..100, healthy near 100
  tosAckTimeouts: number;
  meshHealth: number;     // %
  throughputEpm: number;  // events/min
  queueContainers: number;
  recoveryStep: number;   // 0..RECOVERY_STEPS.length
  tzcNodeId: string | null;
  demoRunning: boolean;
  demoStepIndex: number;
  timelineTs: number;     // ms into current cycle (for replay bar)
  history: { t: number; phase: SimPhase; label: string }[];
}

interface SimApi extends SimState {
  simulateFailure: () => void;
  restoreTos: () => void;
  startDemo: () => void;
  stopDemo: () => void;
  nextDemoStep: () => void;
  setSpotlight: (s: SpotlightId | null) => void;
  spotlight: SpotlightId | null;
}

export type SpotlightId =
  | "status-bar" | "tos-card" | "port-twin" | "event-feed"
  | "recovery" | "hardware" | "impact" | "latency" | "timeline";

const SimContext = createContext<SimApi | null>(null);

export const RECOVERY_STEPS = [
  "Heartbeat Failure Detected",
  "Consecutive ACK Timeout",
  "Collect Node Health",
  "Collect Zone Metrics",
  "Evaluate Mesh Topology",
  "Execute Tool Calls",
  "Temporary Coordinator Selected",
  "Mesh Reconfigured",
  "Operations Restored",
] as const;

const DEMO_STEPS: { id: SpotlightId | "none"; title: string; caption: string; ms: number; onEnter?: (api: SimApi) => void }[] = [
  { id: "status-bar", title: "1 · Normal Operations", caption: "18,000+ container events per minute stream through the mesh. Zero conflicts, all zones synchronized.", ms: 8000 },
  { id: "tos-card",   title: "2 · TOS Failure",       caption: "The Terminal Operating System stops acknowledging heartbeats. In a legacy port, everything halts here.", ms: 9000, onEnter: (a) => a.simulateFailure() },
  { id: "recovery",   title: "3 · Heartbeat Timeout", caption: "DACT detects three missed ACKs in under 200ms — no operator intervention required.", ms: 8000 },
  { id: "recovery",   title: "4 · Agent Activation",  caption: "A small language model reasons over live node & zone metrics to plan the recovery.", ms: 10000 },
  { id: "port-twin",  title: "5 · Coordinator Election", caption: "One healthy edge Pi is promoted to Temporary Zone Coordinator. Watch it glow orange.", ms: 9000 },
  { id: "port-twin",  title: "6 · Mesh Rerouting",    caption: "Packets stop trying to reach the TOS and reroute through the TZC. Container movement never pauses.", ms: 9000 },
  { id: "impact",     title: "7 · Continuous Operations", caption: "Throughput holds. The queue stays under 30 containers instead of growing past 400.", ms: 8000 },
  { id: "tos-card",   title: "8 · TOS Recovery",      caption: "The TOS comes back online. The TZC gracefully hands authority back and steps down.", ms: 8000, onEnter: (a) => a.restoreTos() },
  { id: "impact",     title: "9 · Business Impact",   caption: "Autonomous recovery in under one second, zero manual escalation, minutes of downtime avoided.", ms: 9000 },
];

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<SimPhase>("normal");
  const [tosHeartbeat, setTosHeartbeat] = useState(98);
  const [tosAckTimeouts, setTosAckTimeouts] = useState(0);
  const [meshHealth, setMeshHealth] = useState(99);
  const [throughputEpm, setThroughputEpm] = useState(18426);
  const [queueContainers, setQueueContainers] = useState(26);
  const [recoveryStep, setRecoveryStep] = useState(0);
  const [tzcNodeId, setTzcNodeId] = useState<string | null>(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [timelineTs, setTimelineTs] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightId | null>(null);
  const [history, setHistory] = useState<{ t: number; phase: SimPhase; label: string }[]>([
    { t: Date.now() - 240000, phase: "normal", label: "08:00 · Normal Operations" },
  ]);

  const timersRef = useRef<number[]>([]);
  const clearTimers = () => { timersRef.current.forEach((t) => clearTimeout(t)); timersRef.current = []; };
  const schedule = (fn: () => void, ms: number) => { timersRef.current.push(window.setTimeout(fn, ms)); };

  // Live jitter for KPIs
  useEffect(() => {
    const iv = window.setInterval(() => {
      setTimelineTs((t) => (t + 1) % 300);
      if (phase === "normal" || phase === "recovered") {
        setThroughputEpm(18000 + Math.floor(Math.random() * 900));
        setMeshHealth(98 + Math.random() * 1.6);
        setTosHeartbeat(96 + Math.random() * 4);
        setQueueContainers(20 + Math.floor(Math.random() * 12));
      } else if (phase === "detecting" || phase === "incident") {
        setThroughputEpm((v) => Math.max(15000, v - 120));
        setMeshHealth((v) => Math.max(88, v - 0.3));
      } else if (phase === "operating-tzc") {
        setThroughputEpm(17000 + Math.floor(Math.random() * 800));
        setQueueContainers(24 + Math.floor(Math.random() * 6));
        setMeshHealth(96 + Math.random() * 1.5);
      } else if (phase === "restoring") {
        setMeshHealth((v) => Math.min(99, v + 0.4));
        setTosHeartbeat((v) => Math.min(99, v + 3));
      }
    }, 900);
    return () => window.clearInterval(iv);
  }, [phase]);

  const pushHistory = useCallback((label: string, ph: SimPhase) => {
    setHistory((h) => [...h.slice(-9), { t: Date.now(), phase: ph, label }]);
  }, []);

  const simulateFailure = useCallback(() => {
    if (phase !== "normal" && phase !== "recovered") return;
    clearTimers();
    setPhase("detecting");
    setTosAckTimeouts(0);
    pushHistory(`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · TOS Failure`, "detecting");

    // heartbeat decay
    [90, 65, 30, 8, 0].forEach((v, i) => schedule(() => setTosHeartbeat(v), 400 + i * 500));
    [1, 2, 3].forEach((n, i) => schedule(() => setTosAckTimeouts(n), 900 + i * 700));

    schedule(() => {
      setPhase("incident");
      pushHistory(`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Recovery Triggered`, "incident");
    }, 3200);

    // start recovery
    schedule(() => {
      setPhase("recovering");
      setRecoveryStep(0);
    }, 3600);

    for (let i = 0; i < RECOVERY_STEPS.length; i++) {
      schedule(() => setRecoveryStep(i + 1), 3800 + i * 500);
    }
    schedule(() => {
      setTzcNodeId("RPI-1012");
      pushHistory(`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Coordinator Elected`, "operating-tzc");
    }, 3800 + 6 * 500);
    schedule(() => setPhase("operating-tzc"), 3800 + RECOVERY_STEPS.length * 500 + 400);
  }, [phase, pushHistory]);

  const restoreTos = useCallback(() => {
    if (phase !== "operating-tzc" && phase !== "incident") return;
    clearTimers();
    setPhase("restoring");
    pushHistory(`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · TOS Restoring`, "restoring");
    [40, 70, 92, 99].forEach((v, i) => schedule(() => setTosHeartbeat(v), 400 + i * 500));
    schedule(() => setTosAckTimeouts(0), 800);
    schedule(() => {
      setTzcNodeId(null);
      setPhase("recovered");
      pushHistory(`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Operations Restored`, "recovered");
    }, 2400);
    schedule(() => setPhase("normal"), 4500);
  }, [phase, pushHistory]);

  /* -------- Demo mode driver -------- */
  const demoTimerRef = useRef<number | null>(null);
  const runDemoStep = useCallback((idx: number, apiSnapshot: () => SimApi) => {
    if (idx >= DEMO_STEPS.length) {
      setDemoRunning(false);
      setSpotlight(null);
      return;
    }
    const step = DEMO_STEPS[idx];
    setDemoStepIndex(idx);
    setSpotlight(step.id === "none" ? null : (step.id as SpotlightId));
    step.onEnter?.(apiSnapshot());
    demoTimerRef.current = window.setTimeout(() => runDemoStep(idx + 1, apiSnapshot), step.ms);
  }, []);

  const apiRef = useRef<SimApi>(null as any);

  const startDemo = useCallback(() => {
    if (demoTimerRef.current) window.clearTimeout(demoTimerRef.current);
    // reset to normal
    clearTimers();
    setPhase("normal");
    setTosHeartbeat(98);
    setTosAckTimeouts(0);
    setTzcNodeId(null);
    setRecoveryStep(0);
    setDemoRunning(true);
    setTimeout(() => runDemoStep(0, () => apiRef.current), 300);
  }, [runDemoStep]);

  const stopDemo = useCallback(() => {
    if (demoTimerRef.current) window.clearTimeout(demoTimerRef.current);
    setDemoRunning(false);
    setSpotlight(null);
  }, []);

  const nextDemoStep = useCallback(() => {
    if (!demoRunning) return;
    if (demoTimerRef.current) window.clearTimeout(demoTimerRef.current);
    runDemoStep(demoStepIndex + 1, () => apiRef.current);
  }, [demoRunning, demoStepIndex, runDemoStep]);

  useEffect(() => () => { clearTimers(); if (demoTimerRef.current) window.clearTimeout(demoTimerRef.current); }, []);

  const api: SimApi = {
    phase, tosHeartbeat, tosAckTimeouts, meshHealth, throughputEpm, queueContainers,
    recoveryStep, tzcNodeId, demoRunning, demoStepIndex, timelineTs, history,
    simulateFailure, restoreTos, startDemo, stopDemo, nextDemoStep, spotlight, setSpotlight,
  };
  apiRef.current = api;

  return <SimContext.Provider value={api}>{children}</SimContext.Provider>;
}

export function useSim() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error("useSim must be used inside SimulationProvider");
  return ctx;
}

/* --------------------------------------------------------------------------
 * Overlay components
 * ------------------------------------------------------------------------ */

const phaseColor = (p: SimPhase) =>
  p === "normal" || p === "recovered" ? C.primary :
  p === "detecting" ? C.warning :
  p === "incident" || p === "recovering" ? C.danger :
  p === "operating-tzc" ? C.accent :
  p === "restoring" ? C.secondary : C.text2;

const phaseLabel = (p: SimPhase) =>
  p === "normal" ? "NORMAL OPERATIONS" :
  p === "detecting" ? "HEARTBEAT DEGRADED" :
  p === "incident" ? "INCIDENT DETECTED" :
  p === "recovering" ? "AI RECOVERY IN PROGRESS" :
  p === "operating-tzc" ? "OPERATING ON TEMPORARY COORDINATOR" :
  p === "restoring" ? "RESTORING TOS" :
  "OPERATIONS RESTORED";

export function LiveStatusStrip() {
  const { phase, tosHeartbeat, meshHealth, throughputEpm, spotlight } = useSim();
  const active = spotlight === "status-bar";
  const bg = phase === "normal" || phase === "recovered" ? C.primarySoft :
    phase === "detecting" ? C.warningSoft :
    phase === "incident" || phase === "recovering" ? C.dangerSoft :
    phase === "operating-tzc" ? C.accentSoft : C.secondarySoft;
  const color = phaseColor(phase);
  return (
    <motion.div
      layout
      animate={{
        boxShadow: active ? `0 0 0 4px ${color}55, 0 20px 40px -20px ${color}80` : "0 0 0 0 rgba(0,0,0,0)",
      }}
      className="relative flex flex-wrap items-center gap-3 rounded-xl px-3 py-2"
      style={{ background: bg, border: `1px solid ${color}33` }}
    >
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 0 4px ${color}22` }}
        />
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>
          {phaseLabel(phase)}
        </span>
      </div>
      <span className="hidden md:inline text-[10px]" style={{ color: C.text3 }}>·</span>
      <MiniStat label="TOS" value={phase === "incident" || phase === "recovering" || phase === "operating-tzc" ? "OFFLINE" : phase === "detecting" ? "DEGRADED" : "ONLINE"}
        tone={phase === "incident" || phase === "recovering" || phase === "operating-tzc" ? "bad" : phase === "detecting" ? "warn" : "good"} />
      <MiniStat label="Mesh" value={`${meshHealth.toFixed(1)}%`} tone={meshHealth > 96 ? "good" : "warn"} />
      <MiniStat label="Throughput" value={`${throughputEpm.toLocaleString()} evt/min`} tone="info" />
      <MiniStat label="Sync" value={phase === "operating-tzc" ? "REROUTED" : phase === "recovering" ? "CONVERGING" : "HEALTHY"}
        tone={phase === "operating-tzc" ? "warn" : phase === "recovering" ? "warn" : "good"} />
      <div className="ml-auto flex items-center gap-1 text-[10px] font-semibold" style={{ color: C.text2 }}>
        <Waves className="h-3 w-3" /> heartbeat {Math.round(tosHeartbeat)}%
      </div>
    </motion.div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "bad" | "info" }) {
  const c = tone === "good" ? C.primary : tone === "warn" ? C.warning : tone === "bad" ? C.danger : C.secondary;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.text3 }}>{label}</span>
      <span className="text-[11px] font-bold" style={{ color: c }}>{value}</span>
    </div>
  );
}

/* ---------- TOS Status Card (top-right floating) ---------- */
export function TosStatusCard() {
  const { phase, tosHeartbeat, tosAckTimeouts, tzcNodeId, spotlight } = useSim();
  const offline = phase === "incident" || phase === "recovering" || phase === "operating-tzc";
  const color = offline ? C.danger : phase === "detecting" ? C.warning : C.primary;
  const active = spotlight === "tos-card";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{
        opacity: 1, y: 0,
        boxShadow: active
          ? `0 0 0 4px ${color}55, 0 30px 60px -20px ${color}70`
          : "0 12px 30px -18px rgba(15,23,42,0.25), 0 1px 2px rgba(15,23,42,0.06)",
      }}
      className="fixed right-6 top-24 z-40 w-[280px] overflow-hidden rounded-2xl bg-white"
      style={{ border: `1px solid ${color}33` }}
    >
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: offline ? C.dangerSoft : phase === "detecting" ? C.warningSoft : C.primarySoft }}>
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4" style={{ color }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>Terminal Operating System</span>
        </div>
        <span className="text-[10px] font-bold" style={{ color }}>{offline ? "OFFLINE" : phase === "detecting" ? "DEGRADED" : "ONLINE"}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 text-[11px]">
        <Kv label="Heartbeat">
          <div className="flex items-center gap-1">
            {offline ? (
              <>
                <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} className="text-[13px] font-bold" style={{ color: C.danger }}>×</motion.span>
                <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="text-[13px] font-bold" style={{ color: C.danger }}>×</motion.span>
                <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="text-[13px] font-bold" style={{ color: C.danger }}>×</motion.span>
              </>
            ) : (
              <motion.span animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 1.1, repeat: Infinity }} className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
            )}
            <span className="ml-1 font-semibold" style={{ color: C.text }}>{Math.round(tosHeartbeat)}%</span>
          </div>
        </Kv>
        <Kv label="ACK Timeouts">
          <span className="font-bold" style={{ color: tosAckTimeouts > 0 ? C.danger : C.primary }}>{tosAckTimeouts}</span>
        </Kv>
        <Kv label="Connectivity">
          {offline ? <WifiOff className="h-3.5 w-3.5" style={{ color: C.danger }} /> : <Wifi className="h-3.5 w-3.5" style={{ color: C.primary }} />}
        </Kv>
        <Kv label="Coordinator">
          <span className="font-bold" style={{ color: tzcNodeId ? C.accent : C.text }}>{tzcNodeId ?? "TOS-PRIMARY"}</span>
        </Kv>
      </div>
    </motion.div>
  );
}

function Kv({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md px-2 py-1.5" style={{ background: C.surface2 }}>
      <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.text3 }}>{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

/* ---------- Command dock (bottom-right floating buttons) ---------- */
export function CommandDock() {
  const { phase, simulateFailure, restoreTos, startDemo, stopDemo, demoRunning, nextDemoStep } = useSim();
  const canFail = phase === "normal" || phase === "recovered";
  const canRestore = phase === "operating-tzc" || phase === "incident";
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {demoRunning ? (
        <>
          <button
            onClick={nextDemoStep}
            className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
            style={{ background: C.secondary, boxShadow: `0 20px 40px -12px ${C.secondary}90` }}
          >
            <ChevronRight className="h-4 w-4" /> Next Step
          </button>
          <button
            onClick={stopDemo}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold shadow"
            style={{ border: `1px solid ${C.borderSoft}`, color: C.text }}
          >
            <X className="h-3.5 w-3.5" /> End Demo
          </button>
        </>
      ) : (
        <>
          <motion.button
            whileHover={{ scale: canFail ? 1.05 : 1 }}
            disabled={!canFail}
            onClick={simulateFailure}
            className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-40"
            style={{ background: C.danger, boxShadow: `0 20px 40px -12px ${C.danger}80` }}
          >
            <AlertTriangle className="h-4 w-4" /> Simulate TOS Failure
          </motion.button>
          <motion.button
            whileHover={{ scale: canRestore ? 1.05 : 1 }}
            disabled={!canRestore}
            onClick={restoreTos}
            className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-40"
            style={{ background: C.primary, boxShadow: `0 20px 40px -12px ${C.primary}80` }}
          >
            <RefreshCw className="h-4 w-4" /> Restore TOS
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={startDemo}
            className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg"
            style={{ background: C.secondary, boxShadow: `0 20px 40px -12px ${C.secondary}90` }}
          >
            <Play className="h-4 w-4" /> Demo Mode
          </motion.button>
        </>
      )}
    </div>
  );
}

/* ---------- Incident banner ---------- */
export function IncidentBanner() {
  const { phase } = useSim();
  const show = phase === "incident" || phase === "recovering" || phase === "operating-tzc";
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="flex items-center gap-3 rounded-xl px-4 py-2.5"
          style={{ background: phase === "operating-tzc" ? C.accentSoft : C.dangerSoft, border: `1px solid ${phase === "operating-tzc" ? "#FFCC80" : "#FFCDD2"}` }}
        >
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <AlertTriangle className="h-4 w-4" style={{ color: phase === "operating-tzc" ? C.accent : C.danger }} />
          </motion.span>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: phase === "operating-tzc" ? C.accent : C.danger }}>
              {phase === "operating-tzc" ? "Operating on Temporary Coordinator" : "Incident Detected"}
            </div>
            <div className="text-xs" style={{ color: C.text }}>
              {phase === "operating-tzc"
                ? "Zone coordinator RPI-1012 is orchestrating operations. Container movement is uninterrupted."
                : "Terminal Operating System unreachable. DACT edge mesh is executing autonomous recovery."}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- AI Recovery mission timeline (slides in) ---------- */
export function RecoveryPanel() {
  const { phase, recoveryStep, spotlight } = useSim();
  const show = phase === "recovering" || phase === "operating-tzc" || phase === "restoring";
  const active = spotlight === "recovery";
  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{
            x: 0, opacity: 1,
            boxShadow: active
              ? `0 0 0 4px ${C.secondary}55, 0 30px 60px -20px ${C.secondary}80`
              : "0 30px 60px -30px rgba(15,23,42,0.35), 0 1px 2px rgba(15,23,42,0.06)",
          }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          className="fixed right-6 top-[220px] z-40 w-[340px] overflow-hidden rounded-2xl bg-white"
          style={{ border: `1px solid ${C.borderSoft}` }}
        >
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: C.secondarySoft, borderBottom: `1px solid ${C.borderSoft}` }}>
            <Sparkles className="h-4 w-4" style={{ color: C.secondary }} />
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.secondaryDark }}>Emergency Recovery Mission</div>
          </div>
          <ul className="p-3">
            {RECOVERY_STEPS.map((s, i) => {
              const done = i < recoveryStep;
              const now = i === recoveryStep - 1 && (phase === "recovering");
              return (
                <li key={s} className="flex items-center gap-2 py-1.5 text-[12px]">
                  <motion.span
                    initial={false}
                    animate={{ scale: now ? [1, 1.25, 1] : 1 }}
                    transition={{ duration: 0.8, repeat: now ? Infinity : 0 }}
                    className="grid h-4 w-4 place-items-center rounded-full"
                    style={{ background: done ? C.primary : C.surface3, color: "#fff" }}
                  >
                    {done ? <CheckCircle2 className="h-3 w-3" /> : null}
                  </motion.span>
                  <span className="font-medium" style={{ color: done ? C.text : C.text3 }}>{s}</span>
                </li>
              );
            })}
          </ul>
          <div className="px-4 pb-3 text-[10px]" style={{ color: C.text3 }}>
            Total recovery decision ≈ 563ms · container movement never blocked
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ---------- Latency panel (top-right, below TOS) ---------- */
export function LatencyPanel() {
  const { phase, spotlight } = useSim();
  const active = spotlight === "latency";
  return (
    <motion.div
      layout
      animate={{ boxShadow: active ? `0 0 0 4px ${C.secondary}55` : "0 20px 40px -20px rgba(15,23,42,0.25)" }}
      className="fixed right-6 top-[380px] z-30 hidden w-[280px] overflow-hidden rounded-2xl bg-white 2xl:block"
      style={{ border: `1px solid ${C.borderSoft}` }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: C.surface2, borderBottom: `1px solid ${C.borderSoft}` }}>
        <Timer className="h-4 w-4" style={{ color: C.text }} />
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.text }}>Live Latency</div>
      </div>
      <div className="p-3 text-[11px]">
        <LatencyRow label="Container Event" ms={18} tone={C.primary} />
        <LatencyRow label="Vector Clock Merge" ms={2} tone={C.primary} />
        <LatencyRow label="Local Ledger" ms={1} tone={C.primary} />
        <LatencyRow label="Mesh Sync" ms={12} tone={C.primary} />
        <div className="mt-1 flex justify-between border-t pt-1 text-[11px] font-bold" style={{ borderColor: C.borderSoft }}>
          <span style={{ color: C.text }}>Total (data path)</span>
          <span style={{ color: C.primary }}>≈ 33 ms</span>
        </div>
        {(phase === "recovering" || phase === "operating-tzc") && (
          <>
            <div className="mt-3 mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.accent }}>Recovery Path</div>
            <LatencyRow label="Node Metrics" ms={80} tone={C.accent} />
            <LatencyRow label="SLM Reasoning" ms={420} tone={C.accent} />
            <LatencyRow label="Tool Execution" ms={35} tone={C.accent} />
            <LatencyRow label="Coordinator Election" ms={28} tone={C.accent} />
            <div className="mt-1 flex justify-between border-t pt-1 text-[11px] font-bold" style={{ borderColor: C.borderSoft }}>
              <span style={{ color: C.text }}>Total decision</span>
              <span style={{ color: C.accent }}>≈ 563 ms</span>
            </div>
          </>
        )}
        <p className="mt-2 rounded-md px-2 py-1.5 text-[10px]" style={{ background: C.primarySoft, color: C.primaryDark }}>
          <Zap className="mb-0.5 mr-1 inline h-2.5 w-2.5" />
          Container movement never waits for AI. Recovery runs outside the critical path.
        </p>
      </div>
    </motion.div>
  );
}
function LatencyRow({ label, ms, tone }: { label: string; ms: number; tone: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-[11px]">
      <span style={{ color: C.text2 }}>{label}</span>
      <span className="font-bold tabular-nums" style={{ color: tone }}>{ms} ms</span>
    </div>
  );
}

/* ---------- Demo overlay (dim + caption) ---------- */
export function DemoOverlay() {
  const { demoRunning, demoStepIndex, stopDemo } = useSim();
  if (!demoRunning) return null;
  const step = DEMO_STEPS[demoStepIndex] ?? DEMO_STEPS[DEMO_STEPS.length - 1];
  return (
    <>
      {/* Dim vignette */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-20"
        style={{ background: "radial-gradient(ellipse at center, rgba(15,23,42,0) 0%, rgba(15,23,42,0.28) 100%)" }}
      />
      {/* Caption bar */}
      <motion.div
        key={demoStepIndex}
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="fixed left-1/2 top-4 z-[60] w-[min(680px,92vw)] -translate-x-1/2 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-2xl"
        style={{ boxShadow: "0 30px 60px -20px rgba(15,23,42,0.6)" }}
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5" style={{ color: "#60A5FA" }} />
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">DACT · Guided Demo</div>
            <div className="text-sm font-bold leading-tight">{step.title}</div>
            <div className="mt-0.5 text-xs text-slate-300">{step.caption}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] font-semibold text-slate-400">{demoStepIndex + 1} / {DEMO_STEPS.length}</div>
            <button onClick={stopDemo} className="rounded p-1 hover:bg-slate-800"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            key={`p-${demoStepIndex}`}
            initial={{ width: "0%" }} animate={{ width: "100%" }}
            transition={{ duration: (step.ms) / 1000, ease: "linear" }}
            className="h-full"
            style={{ background: "linear-gradient(90deg,#60A5FA,#34D399)" }}
          />
        </div>
      </motion.div>
    </>
  );
}
