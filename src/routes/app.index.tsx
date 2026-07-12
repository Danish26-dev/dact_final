import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Boxes, Truck, Wrench, Radio, ShieldAlert, Activity, Timer, Router, GitMerge, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { C } from "../app/tokens";
import { AnimatedNumber, Card, Sparkline, StatusDot } from "../app/components/primitives";
import { LiveTwin } from "../app/components/LiveTwin";
import { TerminalLog } from "../app/components/TerminalLog";
import { useSim } from "../app/simulation";
import { useEngine } from "../app/sim-engine";
import { useState } from "react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { phase, spotlight } = useSim();
  const engine = useEngine();
  const [selId, setSelId] = useState<string | null>(null);

  const active = engine.containers.filter((c) => c.stage !== "completed").length;
  const moving = engine.trucks.filter((t) => t.status === "moving").length;
  const lifting = engine.cranes.filter((c) => c.status !== "idle").length;
  const meshHealth = engine.mode === "TOS_FAILURE" ? 92 : 98.4;
  const conflictRate = engine.mode === "TOS_FAILURE" ? 1.4 : 0.7;
  const queueSize = engine.eventQueue.length;

  const kpis = [
    { label: "Active Containers", value: active, icon: Boxes, tone: C.secondary,
      spark: engine.activityLog.slice(0, 12).map((_, i) => active - i + Math.sin(i) * 2) },
    { label: "Trucks Moving",     value: moving, icon: Truck, tone: C.primary,
      spark: Array.from({ length: 12 }, (_, i) => Math.max(0, moving + Math.sin(i) * 1)) },
    { label: "Cranes Cycling",    value: lifting, icon: Wrench, tone: C.accent,
      spark: Array.from({ length: 12 }, (_, i) => Math.max(0, lifting + Math.cos(i / 2))) },
    { label: "Mesh Health",       value: meshHealth, decimals: 1, suffix: "%", icon: Radio, tone: C.primary,
      spark: Array.from({ length: 12 }, (_, i) => meshHealth + Math.sin(i / 2)) },
    { label: "Gateway Queue",     value: queueSize, icon: ShieldAlert, tone: queueSize > 0 ? C.warning : C.primary,
      spark: Array.from({ length: 12 }, (_, i) => Math.max(0, queueSize + Math.sin(i))) },
    { label: "Throughput",        value: engine.analytics.containersProcessed, suffix: " completed", icon: Activity, tone: C.secondary,
      spark: Array.from({ length: 12 }, (_, i) => engine.analytics.containersProcessed - i) },
    { label: "Avg Latency",       value: engine.analytics.avgLatencyMs, suffix: " ms", decimals: 1, icon: Timer, tone: C.primary,
      spark: Array.from({ length: 12 }, (_, i) => engine.analytics.avgLatencyMs + Math.sin(i / 2)) },
    { label: "Packets Forwarded", value: engine.analytics.packetsForwarded, icon: Router, tone: C.primary,
      spark: Array.from({ length: 12 }, (_, i) => Math.max(0, engine.analytics.packetsForwarded - i)) },
    { label: "Packets ACKed",     value: engine.analytics.packetsAcked, icon: GitMerge, tone: C.primary,
      spark: Array.from({ length: 12 }, (_, i) => Math.max(0, engine.analytics.packetsAcked - i)) },
  ];

  const isIncident = phase === "incident" || phase === "recovering" || phase === "operating-tzc";

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
          <StatusDot status={isIncident ? "degraded" : "healthy"} /> Mission Control · {engine.mode}
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ color: C.text }}>Good afternoon, Priya.</h1>
        <p className="mt-1 text-sm" style={{ color: C.text2 }}>
          Every metric below is derived from the live simulation engine — each event drives Live Port, Mesh, Gateway and Analytics together.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card interactive className="!p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>{k.label}</div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums" style={{ color: C.text }}>
                      <AnimatedNumber value={k.value} decimals={(k as any).decimals ?? 0} suffix={(k as any).suffix ?? ""} />
                    </span>
                  </div>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${k.tone}15`, color: k.tone }}>
                  <k.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 -mx-1">
                <Sparkline data={k.spark} color={k.tone} height={30} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div style={{
          boxShadow: spotlight === "port-twin" ? `0 0 0 4px ${C.secondary}55, 0 40px 80px -30px ${C.secondary}70` : undefined,
          transition: "box-shadow 300ms",
          borderRadius: 16,
        }}>
          <Card padded={false} className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: C.text }}>Operational Digital Twin</h2>
                <p className="text-xs" style={{ color: C.text2 }}>Live view — every asset carries a DACT edge node</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: C.text2 }}>
                <Legend color={C.primary} label="ACK" />
                <Legend color={C.accent} label="In-flight" />
                <Legend color={C.warning} label="Queued" />
              </div>
            </div>
            <div className="p-4">
              <LiveTwin height={520} onSelectContainer={setSelId} />
            </div>
            {selId && (
              <div className="flex items-center justify-between px-5 py-3 text-xs" style={{ borderTop: `1px solid ${C.borderSoft}`, background: C.surface2, color: C.text2 }}>
                <span><span className="font-bold" style={{ color: C.text }}>Container:</span> {selId} · open Live Port for full lifecycle</span>
                <button onClick={() => setSelId(null)} className="text-xs font-semibold" style={{ color: C.secondary }}>Dismiss</button>
              </div>
            )}
          </Card>
        </div>

        <TerminalLog max={12} height={520} />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
