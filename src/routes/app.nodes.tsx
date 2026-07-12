import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Cpu, MemoryStick, Signal, Router, Users, Boxes, RotateCw, Ban, ShieldCheck, Power } from "lucide-react";
import { motion } from "motion/react";
import { C } from "../app/tokens";
import { Card, Pill, StatusDot } from "../app/components/primitives";
import { NODES, type EdgeNode } from "../app/data";

export const Route = createFileRoute("/app/nodes")({
  component: Nodes,
});

function Nodes() {
  const [toast, setToast] = useState<string | null>(null);
  const act = (name: string, node: EdgeNode) => { setToast(`${name} → ${node.id} · simulated`); setTimeout(() => setToast(null), 2000); };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
            <StatusDot status="healthy" /> Fleet Management
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Edge Node Management</h1>
          <p className="mt-1 text-sm" style={{ color: C.text2 }}>24 Raspberry Pi edge nodes deployed across Terminal 2.</p>
        </div>
        <div className="flex gap-2">
          <Pill tone="success">{NODES.filter(n => n.status === "healthy").length} Healthy</Pill>
          <Pill tone="warn">{NODES.filter(n => n.status === "degraded").length} Degraded</Pill>
          <Pill tone="danger">{NODES.filter(n => n.status === "offline").length} Offline</Pill>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {NODES.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
            <Card interactive>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold">{n.id}</span>
                    <Pill tone={n.status === "healthy" ? "success" : n.status === "degraded" ? "warn" : "danger"}>{n.status}</Pill>
                    {n.role === "coordinator" && <Pill tone="info">Coordinator</Pill>}
                  </div>
                  <div className="text-xs" style={{ color: C.text2 }}>{n.zone} · {n.name}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Meter icon={Cpu} l="CPU" v={n.cpu} tone={C.secondary} />
                <Meter icon={MemoryStick} l="MEM" v={n.mem} tone={C.accent} />
                <Meter icon={Signal} l="Signal" v={n.signal} tone={C.primary} />
                <Stat icon={Router} l="Latency" v={`${n.latencyMs}ms`} />
                <Stat icon={Users} l="Neighbors" v={String(n.neighbors.length)} />
                <Stat icon={Boxes} l="Containers" v={String(n.containers)} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <SmallBtn icon={RotateCw} label="Restart" onClick={() => act("restartNode", n)} />
                <SmallBtn icon={Ban} label="Drain" onClick={() => act("drainNode", n)} />
                <SmallBtn icon={ShieldCheck} label="Promote" onClick={() => act("promoteCoordinator", n)} />
                <SmallBtn icon={Power} label="Isolate" onClick={() => act("isolateNode", n)} danger />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {toast && (
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg"
                    style={{ background: C.text }}>
          {toast}
        </motion.div>
      )}
    </div>
  );
}

function Meter({ icon: Icon, l, v, tone }: { icon: any; l: string; v: number; tone: string }) {
  return (
    <div className="rounded-lg p-2" style={{ background: C.surface2 }}>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>
        <span className="flex items-center gap-1"><Icon className="h-3 w-3" />{l}</span><span>{v}%</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full" style={{ background: "#fff" }}>
        <motion.div className="h-full" style={{ background: tone }} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}
function Stat({ icon: Icon, l, v }: { icon: any; l: string; v: string }) {
  return (
    <div className="rounded-lg p-2" style={{ background: C.surface2 }}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.text2 }}><Icon className="h-3 w-3" />{l}</div>
      <div className="text-sm font-bold">{v}</div>
    </div>
  );
}
function SmallBtn({ icon: Icon, label, onClick, danger }: { icon: any; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition hover:brightness-95"
            style={{ background: danger ? C.dangerSoft : C.surface2, color: danger ? C.danger : C.text }}>
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}
