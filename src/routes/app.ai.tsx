import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrainCircuit, CheckCircle2, Loader2, Wrench, Activity, Zap, Router } from "lucide-react";
import { C } from "../app/tokens";
import { Card, Pill, StatusDot } from "../app/components/primitives";

export const Route = createFileRoute("/app/ai")({
  component: AIOps,
});

const TOOLS = [
  { name: "getZoneHealth()", detail: "Zone N2 quality: 74% (degraded)" },
  { name: "getConflictMetrics()", detail: "12 pending CRDT conflicts on 4 containers" },
  { name: "getCoordinatorStatus()", detail: "5/6 coordinators reachable · RPI-1009 timeout" },
  { name: "getMeshTopology()", detail: "Recomputed 47 edges · 3 dead links" },
  { name: "getPendingMoves()", detail: "34 truck moves queued · avg wait 6.2 min" },
];

const ACTIONS = [
  { name: "promoteCoordinator(RPI-1013)", ok: true },
  { name: "reRouteTraffic(YardN2 → YardS1)", ok: true },
  { name: "resolveConflicts(strategy=LWW)", ok: true },
  { name: "throttleGate(GateWest, 60%)", ok: true },
  { name: "notifyOpsManager()", ok: true },
];

function AIOps() {
  const [tools, setTools] = useState<number>(0);
  const [actions, setActions] = useState<number>(0);
  const [phase, setPhase] = useState<"observe" | "reason" | "act" | "done">("observe");

  useEffect(() => {
    const t: any[] = [];
    TOOLS.forEach((_, i) => t.push(setTimeout(() => setTools(i + 1), 700 + i * 900)));
    t.push(setTimeout(() => setPhase("reason"), 700 + TOOLS.length * 900));
    t.push(setTimeout(() => setPhase("act"), 700 + TOOLS.length * 900 + 1800));
    ACTIONS.forEach((_, i) => t.push(setTimeout(() => setActions(i + 1), 700 + TOOLS.length * 900 + 1800 + i * 700)));
    t.push(setTimeout(() => setPhase("done"), 700 + TOOLS.length * 900 + 1800 + ACTIONS.length * 700 + 500));
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
          <StatusDot status="operating" /> Autonomous Commander
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">AI Operations</h1>
        <p className="mt-1 text-sm" style={{ color: C.text2 }}>The commander observes port state, reasons over failure modes and executes recovery — every step auditable.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Situation + Metrics */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">Current Situation</h3>
            <Pill tone="warn">Anomaly</Pill>
          </div>
          <p className="text-sm" style={{ color: C.text2 }}>Coordinator <b style={{ color: C.text }}>RPI-1009</b> in Yard N2 stopped responding at 14:32 IST. Container flow slowed 22%. Mesh initiated re-election.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Metric l="Impact" v="12 moves" tone={C.warning} />
            <Metric l="SLA Buffer" v="4m 12s" tone={C.primary} />
            <Metric l="Affected Zone" v="Yard N2" tone={C.secondary} />
            <Metric l="Confidence" v="94%" tone={C.primary} />
          </div>
        </Card>

        {/* Reasoning timeline */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">Reasoning Timeline</h3>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>Phase: {phase}</span>
          </div>
          <div className="space-y-2">
            <Phase active={phase !== "observe" || tools === TOOLS.length} label="Observe port state" icon={Activity} />
            <Phase active={["reason", "act", "done"].includes(phase)} label="Diagnose failure mode" icon={BrainCircuit} />
            <Phase active={["act", "done"].includes(phase)} label="Compose recovery strategy" icon={Wrench} />
            <Phase active={phase === "done"} label="Execute & verify" icon={CheckCircle2} />
          </div>
        </Card>

        {/* Metrics */}
        <Card>
          <h3 className="mb-3 text-sm font-bold">Observed Metrics</h3>
          <ul className="space-y-2 text-xs">
            <Bar l="Mesh Quality" v={74} tone={C.warning} />
            <Bar l="Coordinator Uptime" v={83} tone={C.warning} />
            <Bar l="Throughput vs Target" v={78} tone={C.warning} />
            <Bar l="Conflict Resolution Rate" v={96} tone={C.primary} />
            <Bar l="Zone Redundancy" v={100} tone={C.primary} />
          </ul>
        </Card>
      </div>

      {/* Tool calls */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">Tool Calls</h3>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>Streaming</span>
        </div>
        <div className="space-y-2">
          {TOOLS.map((t, i) => {
            const done = i < tools;
            const running = i === tools && phase !== "done";
            return (
              <motion.div key={t.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: done || running ? 1 : 0.4, y: 0 }}
                          className="flex items-center gap-3 rounded-lg p-3" style={{ background: C.surface2, border: `1px solid ${C.borderSoft}` }}>
                <div className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: done ? C.primary : running ? C.secondary : C.text3 }}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Router className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="font-mono text-xs font-bold" style={{ color: C.text }}>{t.name}</div>
                  {done && <div className="text-[11px]" style={{ color: C.text2 }}>{t.detail}</div>}
                </div>
                <Pill tone={done ? "success" : running ? "info" : "neutral"}>{done ? "completed" : running ? "running" : "queued"}</Pill>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Executed actions */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">Executed Actions</h3>
          {phase === "done" && <Pill tone="success">Recovery complete</Pill>}
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <AnimatePresence>
            {ACTIONS.slice(0, actions).map((a, i) => (
              <motion.div key={a.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 rounded-lg p-3" style={{ background: C.primarySoft, border: `1px solid #C8E6C9` }}>
                <Zap className="h-4 w-4" style={{ color: C.primaryDark }} />
                <span className="font-mono text-xs font-semibold" style={{ color: C.primaryDark }}>{a.name}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}

function Phase({ active, label, icon: Icon }: { active: boolean; label: string; icon: any }) {
  return (
    <div className="flex items-center gap-3 rounded-lg p-2" style={{ background: active ? C.primarySoft : C.surface2 }}>
      <div className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ background: active ? C.primary : C.text3 }}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-xs font-semibold" style={{ color: active ? C.primaryDark : C.text2 }}>{label}</span>
    </div>
  );
}
function Metric({ l, v, tone }: { l: string; v: string; tone: string }) {
  return (
    <div className="rounded-lg p-2" style={{ background: C.surface2, borderLeft: `3px solid ${tone}` }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text2 }}>{l}</div>
      <div className="text-sm font-bold">{v}</div>
    </div>
  );
}
function Bar({ l, v, tone }: { l: string; v: number; tone: string }) {
  return (
    <li>
      <div className="flex justify-between text-[11px]"><span style={{ color: C.text2 }}>{l}</span><span className="font-bold">{v}%</span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: C.surface2 }}>
        <motion.div className="h-full" style={{ background: tone }} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 1 }} />
      </div>
    </li>
  );
}
