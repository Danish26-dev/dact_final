/* Live Twin — port canvas that is 100% driven by the Simulation Engine.
   No random animation. Every truck / crane / packet reflects real engine state. */

import { motion, AnimatePresence } from "motion/react";
import { C } from "../tokens";
import { useEngine, ENGINE_POSITIONS } from "../sim-engine";

interface Props {
  height?: number;
  onSelectContainer?: (id: string) => void;
}

export function LiveTwin({ height = 560, onSelectContainer }: Props) {
  const { trucks, cranes, ships, packets, containers, mode } = useEngine();
  const partition = mode === "TOS_FAILURE";

  return (
    <div className="relative w-full overflow-hidden rounded-2xl"
         style={{ height, background: "linear-gradient(180deg,#EEF4FB 0%, #E7EFF7 100%)",
                  border: `1px solid ${C.borderSoft}` }}>

      {/* Water */}
      <div className="absolute inset-x-0 top-0"
           style={{ height: "22%", background: "linear-gradient(180deg,#CFE1F1,#BBD3E8)" }} />
      <div className="absolute inset-x-0" style={{ top: "22%", height: 6, background: C.text2 }} />

      {/* Ships */}
      {ships.map((s) => (
        <div key={s.id} className="absolute" style={{ left: `${s.x - 10}%`, top: "8%" }}>
          <svg width="200" height="46" viewBox="0 0 200 46">
            <rect x="4" y="8" width="180" height="18" rx="2" fill="#1E293B" />
            {Array.from({ length: 20 }).map((_, i) => (
              <rect key={i} x={8 + i * 9} y="2" width="7" height="7"
                    fill={["#1565C0","#F57C00","#2E7D32","#C62828"][i % 4]} opacity="0.85" />
            ))}
            <polygon points="184,8 208,17 184,26" fill="#0F172A" />
          </svg>
          <div className="text-[10px] font-semibold mt-1" style={{ color: C.text }}>
            {s.name} · {Math.round(s.progress * 100)}%
          </div>
        </div>
      ))}

      {/* Labels */}
      <div className="absolute text-[10px] font-bold tracking-widest" style={{ left: "8%", top: "25%", color: C.text2 }}>BERTH A</div>
      <div className="absolute text-[10px] font-bold tracking-widest" style={{ left: "48%", top: "25%", color: C.text2 }}>BERTH B</div>

      {/* Yard blocks */}
      <YardBlock left="6%"  top="45%" w="22%" h="20%" label="YARD N1" />
      <YardBlock left="36%" top="45%" w="22%" h="20%" label="YARD N2" partition={partition} />
      <YardBlock left="68%" top="45%" w="26%" h="20%" label="YARD S1" />

      {/* Buildings row */}
      <Building left="6%"  top="72%" w="22%" h="16%" label="WAREHOUSE" />
      <Building left="30%" top="72%" w="30%" h="16%" label="RAIL HEAD" tone="rail" />
      <Building left="62%" top="72%" w="16%" h="16%" label="GATE WEST" tone="gate" />
      <Building left="80%" top="72%" w="16%" h="16%" label="GATE EAST" tone="gate" />

      {/* Roads */}
      <div className="absolute" style={{ left: 0, right: 0, top: "68%", height: 4, background: "#94A3B8" }} />
      <div className="absolute" style={{ left: 0, right: 0, top: "90%", height: 4, background: "#94A3B8" }} />

      {/* Gateway node */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2"
           style={{ left: `${ENGINE_POSITIONS.GATEWAY.x}%`, top: `${ENGINE_POSITIONS.GATEWAY.y}%` }}>
        <motion.div
          animate={{ boxShadow: [`0 0 0 0 ${C.accent}88`, `0 0 0 14px ${C.accent}00`] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="grid h-9 w-9 place-items-center rounded-lg text-[9px] font-bold text-white"
          style={{ background: partition ? C.accent : C.secondary }}>
          GW
        </motion.div>
        <div className="mt-1 text-center text-[9px] font-bold" style={{ color: C.text2 }}>
          {partition ? "TZC" : "Gateway"}
        </div>
      </div>

      {/* Mission Control node */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2"
           style={{ left: `${ENGINE_POSITIONS.CONTROL.x}%`, top: `${ENGINE_POSITIONS.CONTROL.y}%` }}>
        <div className="grid h-7 w-7 place-items-center rounded-md text-[9px] font-bold text-white"
             style={{ background: partition ? C.danger : C.primary, opacity: partition ? 0.4 : 1 }}>
          MC
        </div>
      </div>

      {/* Packet overlay (SVG) — each packet animates from source → destination */}
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ pointerEvents: "none" }}>
        <AnimatePresence>
          {packets.map((p) => {
            const src = packetSource(p, trucks, cranes);
            const dst = packetDest(p);
            if (!src || !dst) return null;
            const color = p.status === "queued" ? C.warning :
                          p.status === "acked" ? C.primary :
                          p.status === "dropped" ? C.danger : C.accent;
            return (
              <motion.circle
                key={p.id}
                r="0.7"
                fill={color}
                initial={{ cx: src.x, cy: src.y, opacity: 0 }}
                animate={{ cx: dst.x, cy: dst.y, opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: "easeOut" }}
              />
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Cranes */}
      {cranes.map((c) => (
        <div key={c.id} className="absolute -translate-x-1/2 -translate-y-full"
             style={{ left: `${c.x}%`, top: `${c.y}%` }}>
          <svg width="46" height="90" viewBox="0 0 46 90">
            <rect x="4" y="18" width="3" height="68" fill={C.text} />
            <rect x="39" y="18" width="3" height="68" fill={C.text} />
            <rect x="0" y="12" width="46" height="6" fill={C.text} />
            <motion.rect
              x="18" y="14" width="10" height="6"
              fill={C.accent}
              animate={c.status === "lifting" ? { x: [4, 32, 4] } : { x: 18 }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />
            {c.status === "lifting" && (
              <motion.rect x="20" y="20" width="8" height="6" fill="#1565C0"
                animate={{ y: [20, 60, 20] }} transition={{ duration: 2.5, ease: "easeInOut" }} />
            )}
          </svg>
        </div>
      ))}

      {/* Trucks — position from engine */}
      {trucks.map((t) => {
        const c = t.containerId ? containers.find((x) => x.id === t.containerId) : null;
        return (
          <motion.button
            key={t.id}
            onClick={() => c && onSelectContainer?.(c.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            animate={{ scale: t.status === "loading" ? [1, 1.15, 1] : 1 }}
            transition={{ duration: 0.6 }}
            title={c ? `${t.id} · ${c.id}` : t.id}>
            <svg width="34" height="16" viewBox="0 0 34 16">
              <rect x="0" y="4" width="20" height="9" rx="1" fill={t.containerId ? C.accent : C.text2} />
              <rect x="20" y="1" width="12" height="12" rx="1" fill="#0D47A1" />
              <circle cx="5" cy="14" r="1.5" fill="#0F172A" />
              <circle cx="16" cy="14" r="1.5" fill="#0F172A" />
              <circle cx="27" cy="14" r="1.5" fill="#0F172A" />
            </svg>
            <div className="mt-0.5 text-center text-[8px] font-bold" style={{ color: C.text }}>{t.id.replace("TRK-","")}</div>
          </motion.button>
        );
      })}

      {/* Partition banner */}
      {partition && (
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="absolute left-4 top-4 rounded-lg px-3 py-1.5 text-xs font-semibold"
          style={{ background: C.accentSoft, color: C.accent, border: `1px solid #FFCC80` }}>
          TOS OFFLINE — Gateway acting as Temporary Zone Coordinator · events queuing locally
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute right-4 bottom-4 flex items-center gap-3 rounded-lg bg-white/90 px-3 py-1.5 text-[10px] font-semibold shadow"
           style={{ border: `1px solid ${C.borderSoft}` }}>
        <span className="flex items-center gap-1"><Dot color={C.accent} /> Packet</span>
        <span className="flex items-center gap-1"><Dot color={C.primary} /> ACK</span>
        <span className="flex items-center gap-1"><Dot color={C.warning} /> Queued</span>
      </div>
    </div>
  );
}

function packetSource(p: { from: string; containerId?: string }, trucks: any[], cranes: any[]) {
  if (p.from === "gateway") return ENGINE_POSITIONS.GATEWAY;
  if (p.from === "control") return ENGINE_POSITIONS.CONTROL;
  if (p.from === "crane") {
    const c = cranes.find((cc) => cc.containerId === p.containerId);
    return c ? { x: c.x, y: c.y } : ENGINE_POSITIONS.GATEWAY;
  }
  const t = trucks.find((tt) => tt.containerId === p.containerId);
  return t ? { x: t.x, y: t.y } : ENGINE_POSITIONS.GATE;
}
function packetDest(p: { to: string; status: string }) {
  if (p.status === "queued" || p.to === "queue") return ENGINE_POSITIONS.GATEWAY;
  if (p.to === "control") return ENGINE_POSITIONS.CONTROL;
  return ENGINE_POSITIONS.GATEWAY;
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />;
}

function YardBlock({ left, top, w, h, label, partition }: any) {
  return (
    <div className="absolute" style={{ left, top, width: w, height: h }}>
      <div className="relative h-full w-full rounded-md"
           style={{ background: partition ? "#FEE2E2" : "#DDE7F1",
                    border: `1px dashed ${partition ? C.danger : C.border}` }}>
        <div className="absolute inset-1 grid grid-cols-6 grid-rows-3 gap-[2px]">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} style={{ background: ["#1565C0","#2E7D32","#F57C00","#64748B","#0D47A1","#F9A825"][i % 6], opacity: 0.85, borderRadius: 2 }} />
          ))}
        </div>
        <div className="absolute left-2 top-1 text-[10px] font-bold tracking-widest"
             style={{ color: partition ? C.danger : C.text }}>{label}</div>
      </div>
    </div>
  );
}

function Building({ left, top, w, h, label, tone }: any) {
  return (
    <div className="absolute" style={{ left, top, width: w, height: h }}>
      <div className="relative h-full w-full rounded-md"
           style={{ background: tone === "rail" ? "#E2E8F0" : tone === "gate" ? "#FEF3C7" : "#FFFFFF",
                    border: `1px solid ${C.border}` }}>
        <div className="absolute left-2 top-1 text-[10px] font-bold tracking-widest" style={{ color: C.text2 }}>{label}</div>
      </div>
    </div>
  );
}
