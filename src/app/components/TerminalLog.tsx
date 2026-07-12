/* Chronological live log — reads from the Simulation Engine's activityLog. */

import { AnimatePresence, motion } from "motion/react";
import { Terminal } from "lucide-react";
import { C } from "../tokens";
import { useEngine } from "../sim-engine";

export function TerminalLog({ max = 12, height = 320 }: { max?: number; height?: number }) {
  const { activityLog } = useEngine();
  const items = activityLog.slice(0, max);
  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background: "#0B1220", border: `1px solid ${C.borderSoft}`, boxShadow: "0 1px 2px rgba(15,23,42,0.05)" }}>
      <div className="flex items-center justify-between px-3 py-2"
           style={{ background: "#0F1A2E", borderBottom: "1px solid #1E293B" }}>
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5" style={{ color: "#60A5FA" }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#93C5FD" }}>
            Live Terminal Log
          </span>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">streaming</span>
      </div>
      <div className="overflow-y-auto p-2 font-mono text-[11px] leading-relaxed" style={{ maxHeight: height }}>
        <AnimatePresence initial={false}>
          {items.length === 0 && (
            <div className="text-slate-500 p-2">waiting for events…</div>
          )}
          {items.map((e) => {
            const color = e.severity === "critical" ? "#F87171" :
                          e.severity === "warn" ? "#FBBF24" :
                          e.severity === "success" ? "#34D399" : "#93C5FD";
            const t = new Date(e.ts).toLocaleTimeString("en-IN", { hour12: false });
            return (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-2 py-0.5"
              >
                <span className="text-slate-500 shrink-0">{t}</span>
                <span className="shrink-0 font-bold" style={{ color }}>[{e.kind}]</span>
                <span className="text-slate-200">{e.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
