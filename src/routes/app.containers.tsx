import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Search } from "lucide-react";
import { C } from "../app/tokens";
import { Card, Pill, StatusDot } from "../app/components/primitives";
import { useEngine, STAGE_LABEL } from "../app/sim-engine";
import { ContainerTimeline } from "../app/components/ContainerTimeline";

export const Route = createFileRoute("/app/containers")({
  component: Containers,
});

function Containers() {
  const { containers } = useEngine();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const selected = sel ? containers.find((c) => c.id === sel) : null;

  const filtered = containers.filter((c) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return c.id.toLowerCase().includes(s) || (c.truckId ?? "").toLowerCase().includes(s) ||
      c.cargo.toLowerCase().includes(s) || c.destination.toLowerCase().includes(s) ||
      c.stage.toLowerCase().includes(s);
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
          <StatusDot status="healthy" /> Container Intelligence
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Live Container Registry</h1>
        <p className="mt-1 text-sm" style={{ color: C.text2 }}>
          {containers.length} containers currently tracked by the simulation engine · click any row for full lifecycle timeline
        </p>
      </div>

      <Card className="!p-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: C.surface2 }}>
          <Search className="h-4 w-4" style={{ color: C.text2 }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search container ID, truck, cargo, stage…"
                 className="w-full bg-transparent text-sm outline-none" />
          {q && <button onClick={() => setQ("")} className="rounded p-1 hover:bg-white"><X className="h-3 w-3" /></button>}
        </div>
      </Card>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead style={{ background: C.surface2, color: C.text2 }}>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3">Container</th><th className="p-3">Stage</th><th className="p-3">Cargo</th>
                <th className="p-3">Route</th><th className="p-3">Truck</th><th className="p-3">Yard</th>
                <th className="p-3">Age</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.slice(0, 50).map((c) => (
                  <motion.tr key={c.id}
                    layout
                    initial={{ opacity: 0, backgroundColor: "#FFFDE7" }}
                    animate={{ opacity: 1, backgroundColor: "#FFFFFF" }}
                    onClick={() => setSel(c.id)}
                    className="cursor-pointer border-t hover:bg-slate-50"
                    style={{ borderColor: C.borderSoft }}>
                    <td className="p-3 font-mono font-semibold" style={{ color: C.secondary }}>{c.id}</td>
                    <td className="p-3">
                      <Pill tone={c.stage === "completed" ? "success" : c.stage === "loaded_on_vessel" ? "success" : c.stage === "moving" ? "info" : "neutral"}>
                        {STAGE_LABEL[c.stage]}
                      </Pill>
                    </td>
                    <td className="p-3">{c.cargo}</td>
                    <td className="p-3 text-xs" style={{ color: C.text2 }}>{c.origin} → {c.destination}</td>
                    <td className="p-3 font-mono text-xs">{c.truckId ?? "—"}</td>
                    <td className="p-3 text-xs">{c.yard ?? "—"}</td>
                    <td className="p-3 text-xs" style={{ color: C.text2 }}>
                      {Math.round((Date.now() - c.createdAt) / 1000)}s
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-xs" style={{ color: C.text3 }}>
                  waiting for containers…
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {selected && (
          <motion.aside initial={{ x: 500, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 500, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 240, damping: 28 }}
                        className="fixed right-0 top-0 z-50 h-screen w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
                        style={{ borderLeft: `1px solid ${C.borderSoft}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>Container</div>
                <div className="text-xl font-mono font-bold" style={{ color: C.secondary }}>{selected.id}</div>
              </div>
              <button onClick={() => setSel(null)} className="rounded p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>

            <ContainerTimeline container={selected} />

            <div className="mt-4 rounded-xl p-3" style={{ background: C.primarySoft, border: `1px solid #C8E6C9` }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.primaryDark }}>Sync</div>
              <div className="mt-1 text-xs" style={{ color: C.primaryDark }}>
                {selected.history.length} state transitions · last synced {new Date(selected.history.at(-1)?.ts ?? Date.now()).toLocaleTimeString("en-IN", { hour12: false })}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
