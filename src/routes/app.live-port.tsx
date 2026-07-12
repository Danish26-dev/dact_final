import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Boxes, Activity } from "lucide-react";
import { C } from "../app/tokens";
import { Card, Pill, StatusDot } from "../app/components/primitives";
import { LiveTwin } from "../app/components/LiveTwin";
import { TerminalLog } from "../app/components/TerminalLog";
import { ContainerTimeline } from "../app/components/ContainerTimeline";
import { useEngine, STAGE_LABEL } from "../app/sim-engine";

export const Route = createFileRoute("/app/live-port")({
  component: LivePort,
});

function LivePort() {
  const { containers, trucks, cranes, mode, ships } = useEngine();
  const [selId, setSelId] = useState<string | null>(null);
  const selected = selId ? containers.find((c) => c.id === selId) ?? null : null;

  const activeContainers = containers.filter((c) => c.stage !== "completed");
  const movingTrucks = trucks.filter((t) => t.status === "moving").length;
  const liftingCranes = cranes.filter((c) => c.status !== "idle").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
            <StatusDot status={mode === "NORMAL" ? "healthy" : mode === "TOS_FAILURE" ? "degraded" : "healthy"} />
            Live Port · Terminal 2 · {mode}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Operational View</h1>
          <p className="mt-1 text-sm" style={{ color: C.text2 }}>
            Real-time simulation. Every truck, packet and crane cycle is driven by the same event bus that feeds Dashboard, Mesh and Analytics.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Pill tone="success">{ships.length} vessels berthed</Pill>
          <Pill tone="info">{movingTrucks} trucks moving</Pill>
          <Pill tone="warn">{liftingCranes} cranes cycling</Pill>
          <Pill tone={mode === "TOS_FAILURE" ? "danger" : "success"}>
            {mode === "TOS_FAILURE" ? "TZC ACTIVE" : "TOS ONLINE"}
          </Pill>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <Card padded={false}>
          <div className="p-4">
            <LiveTwin height={620} onSelectContainer={(id) => setSelId(id)} />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card padded={false}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4" style={{ color: C.secondary }} />
                <h3 className="text-sm font-bold">Active Containers</h3>
              </div>
              <span className="text-[11px] font-bold" style={{ color: C.text2 }}>{activeContainers.length}</span>
            </div>
            <div className="max-h-[280px] overflow-y-auto p-2">
              <AnimatePresence initial={false}>
                {activeContainers.slice(0, 12).map((c) => (
                  <motion.button
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: -4, backgroundColor: "#FFFDE7" }}
                    animate={{ opacity: 1, y: 0, backgroundColor: "#FFFFFF" }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelId(c.id)}
                    className="mb-1.5 w-full rounded-lg p-2 text-left transition-colors hover:bg-slate-50"
                    style={{ border: `1px solid ${selId === c.id ? C.secondary : C.borderSoft}` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold" style={{ color: C.secondary }}>{c.id}</span>
                      <span className="text-[10px] font-bold" style={{ color: C.accent }}>{STAGE_LABEL[c.stage]}</span>
                    </div>
                    <div className="mt-0.5 text-[10px]" style={{ color: C.text2 }}>
                      {c.origin} → {c.destination} · {c.truckId ?? "—"}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
              {activeContainers.length === 0 && (
                <div className="p-4 text-center text-xs" style={{ color: C.text3 }}>
                  <Activity className="mx-auto mb-1 h-4 w-4" />
                  waiting for events…
                </div>
              )}
            </div>
          </Card>

          <TerminalLog max={10} height={260} />
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed right-6 top-24 z-40 w-[400px] rounded-2xl bg-white p-4 shadow-xl"
            style={{ border: `1px solid ${C.borderSoft}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>Container Lifecycle</div>
              <button onClick={() => setSelId(null)} className="rounded p-1 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <ContainerTimeline container={selected} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
