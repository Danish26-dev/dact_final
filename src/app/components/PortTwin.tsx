import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { C } from "../tokens";
import { NODES } from "../data";

interface Props {
  height?: number;
  partition?: boolean;
  onSelectAsset?: (a: { kind: string; id: string }) => void;
}

// A stylized top-down smart-port digital twin: berths, ships, cranes,
// yard blocks, warehouses, gates, moving trucks/containers, mesh links.
export function PortTwin({ height = 520, partition = false, onSelectAsset }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(t => (t + 1) % 10_000), 1200);
    return () => clearInterval(i);
  }, []);

  // Choose a subset of edges for mesh links (nearest neighbors)
  const edges = useMemo(() => {
    const out: { a: string; b: string; ax: number; ay: number; bx: number; by: number }[] = [];
    for (const n of NODES) {
      for (const nb of n.neighbors) {
        if (n.id < nb) {
          const m = NODES.find(x => x.id === nb);
          if (m) out.push({ a: n.id, b: m.id, ax: n.x, ay: n.y, bx: m.x, by: m.y });
        }
      }
    }
    return out;
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height, background: "linear-gradient(180deg,#EEF4FB 0%, #E7EFF7 100%)", border: `1px solid ${C.borderSoft}` }}>
      {/* Water */}
      <div className="absolute inset-x-0 top-0" style={{ height: "22%", background: "linear-gradient(180deg,#CFE1F1,#BBD3E8)" }}>
        {/* ripples */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-x-0"
            style={{ top: `${20 + i * 22}%`, height: 1, background: "rgba(21,101,192,0.18)" }}
            animate={{ x: [0, 40, 0] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Quay line */}
      <div className="absolute inset-x-0" style={{ top: "22%", height: 6, background: C.text2 }} />

      {/* Ships */}
      <motion.g />
      <Ship x="6%" progress={0.72} name="MSC Gülsün" onClick={() => onSelectAsset?.({ kind: "ship", id: "IMO9811000" })} />
      <Ship x="46%" progress={0.34} name="Ever Ace" onClick={() => onSelectAsset?.({ kind: "ship", id: "IMO9893890" })} />

      {/* Berth labels */}
      <Label x="8%" y="24%">BERTH A</Label>
      <Label x="48%" y="24%">BERTH B</Label>

      {/* Quay cranes (STS) */}
      {[10, 22, 34, 50, 62, 74].map((x, i) => (
        <Crane key={i} x={`${x}%`} active={i % 2 === 0} onClick={() => onSelectAsset?.({ kind: "crane", id: `CRN-${String(i+1).padStart(2,"0")}` })} />
      ))}

      {/* Yard blocks */}
      <YardBlock x="4%" y="42%" w="30%" h="22%" label="YARD N1" />
      <YardBlock x="36%" y="42%" w="26%" h="22%" label="YARD N2" partition={partition} />
      <YardBlock x="64%" y="42%" w="32%" h="22%" label="YARD S1" />

      {/* Warehouse + Rail head */}
      <Building x="4%" y="70%" w="24%" h="18%" label="WAREHOUSE" />
      <Building x="30%" y="70%" w="30%" h="18%" label="RAIL HEAD" tone="rail" />
      <Building x="62%" y="70%" w="18%" h="18%" label="GATE WEST" tone="gate" />
      <Building x="82%" y="70%" w="14%" h="18%" label="GATE EAST" tone="gate" />

      {/* Roads */}
      <div className="absolute" style={{ left: 0, right: 0, top: "66%", height: 8, background: "#94A3B8" }} />
      <div className="absolute" style={{ left: 0, right: 0, top: "88%", height: 8, background: "#94A3B8" }} />
      {/* Road dashes */}
      {[68.5, 90.5].map((top, i) => (
        <div key={i} className="absolute inset-x-0 flex justify-between px-4" style={{ top: `${top}%` }}>
          {Array.from({ length: 40 }).map((_, k) => (
            <div key={k} style={{ width: 10, height: 2, background: "#F8FAFC" }} />
          ))}
        </div>
      ))}

      {/* Trucks moving on roads */}
      {Array.from({ length: 6 }).map((_, i) => (
        <MovingTruck key={i} lane={i % 2 === 0 ? "top" : "bottom"} delay={i * 1.4} onClick={() => onSelectAsset?.({ kind: "truck", id: `TRK-${200 + i * 7}` })} />
      ))}

      {/* Containers moving along the yard */}
      {Array.from({ length: 4 }).map((_, i) => (
        <MovingContainer key={i} y={`${46 + i * 4}%`} delay={i * 2.1} />
      ))}

      {/* Mesh overlay (SVG absolute) */}
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ pointerEvents: "none" }}>
        <defs>
          <linearGradient id="mesh-line" x1="0" x2="1">
            <stop offset="0%" stopColor={C.secondary} stopOpacity="0.55" />
            <stop offset="100%" stopColor={C.primary} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {edges.map((e, i) => {
          const broken = partition && ((e.ax > 36 && e.ax < 62) !== (e.bx > 36 && e.bx < 62));
          if (broken) return null;
          return (
            <line
              key={i}
              x1={e.ax} y1={e.ay} x2={e.bx} y2={e.by}
              stroke="url(#mesh-line)"
              strokeWidth="0.18"
              strokeDasharray="0.8 0.6"
              opacity={0.7}
            />
          );
        })}
        {/* animated packets */}
        {edges.slice(0, 14).map((e, i) => {
          const key = `${e.a}-${e.b}-${i}`;
          const broken = partition && ((e.ax > 36 && e.ax < 62) !== (e.bx > 36 && e.bx < 62));
          if (broken) return null;
          return (
            <motion.circle
              key={key}
              r="0.45"
              fill={C.accent}
              initial={{ cx: e.ax, cy: e.ay, opacity: 0 }}
              animate={{ cx: [e.ax, e.bx, e.ax], cy: [e.ay, e.by, e.ay], opacity: [0, 1, 0] }}
              transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: (i % 6) * 0.4, ease: "easeInOut" }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
        {NODES.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelectAsset?.({ kind: "node", id: n.id })}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${n.x}%`, top: `${n.y}%`,
              width: n.role === "coordinator" ? 14 : 10,
              height: n.role === "coordinator" ? 14 : 10,
              background: n.status === "offline" ? C.danger : n.status === "degraded" ? C.warning : n.role === "coordinator" ? C.primary : C.secondary,
              border: "2px solid white",
              boxShadow: `0 0 0 2px ${n.role === "coordinator" ? "rgba(46,125,50,0.35)" : "rgba(21,101,192,0.28)"}`,
              pointerEvents: "auto",
              cursor: "pointer",
            }}
            title={`${n.id} • ${n.zone} • ${n.role}`}
          >
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: n.role === "coordinator" ? "rgba(46,125,50,0.35)" : "rgba(21,101,192,0.30)" }}
              animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
              transition={{ duration: 2.2 + (parseInt(n.id.slice(-2), 10) % 6) * 0.2, repeat: Infinity, ease: "easeOut" }}
            />
          </button>
        ))}
      </div>

      {/* Partition banner */}
      {partition && (
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute left-4 top-4 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: C.dangerSoft, color: C.danger, border: `1px solid #FFCDD2` }}>
            NETWORK PARTITION — Yard N2 isolated
        </motion.div>
      )}

      {/* Compass */}
      <div className="absolute right-4 top-4 rounded-lg bg-white/85 backdrop-blur px-2.5 py-1.5 text-[10px] font-bold tracking-widest" style={{ color: C.text2, border: `1px solid ${C.borderSoft}` }}>
        N ↑
      </div>
    </div>
  );
}

function Label({ x, y, children }: { x: string; y: string; children: React.ReactNode }) {
  return (
    <div className="absolute text-[10px] font-bold tracking-widest" style={{ left: x, top: y, color: C.text2 }}>
      {children}
    </div>
  );
}

function Ship({ x, progress, name, onClick }: { x: string; progress: number; name: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="absolute -translate-y-1/2 group" style={{ left: x, top: "14%", pointerEvents: "auto" }}>
      <svg width="180" height="42" viewBox="0 0 180 42">
        <rect x="4" y="6" width="172" height="14" rx="2" fill="#1E293B" />
        {/* container rows */}
        {Array.from({ length: 18 }).map((_, i) => (
          <rect key={i} x={8 + i * 9} y="1" width="7" height="6" fill={["#1565C0","#F57C00","#2E7D32","#C62828"][i % 4]} opacity="0.85" />
        ))}
        <polygon points="176,6 200,13 176,20" fill="#0F172A" />
      </svg>
      <div className="mt-1 text-[10px] font-semibold" style={{ color: C.text }}>{name} · {Math.round(progress * 100)}% unloaded</div>
    </button>
  );
}

function Crane({ x, active, onClick }: { x: string; active: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="absolute" style={{ left: x, top: "22%", transform: "translate(-50%, -100%)" }}>
      <svg width="60" height="120" viewBox="0 0 60 120">
        <rect x="6" y="20" width="4" height="90" fill={C.text} />
        <rect x="50" y="20" width="4" height="90" fill={C.text} />
        <rect x="0" y="14" width="60" height="6" fill={C.text} />
        <motion.rect
          x="26" y="16" width="8" height="6"
          fill={C.accent}
          animate={active ? { x: [4, 46, 4] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <line x1="30" y1="22" x2="30" y2="60" stroke={C.text2} strokeWidth="1" />
        <rect x="26" y="60" width="8" height="6" fill="#1565C0" />
      </svg>
    </button>
  );
}

function YardBlock({ x, y, w, h, label, partition }: { x: string; y: string; w: string; h: string; label: string; partition?: boolean }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      <div className="relative h-full w-full rounded-md" style={{ background: partition ? "#FEE2E2" : "#DDE7F1", border: `1px dashed ${partition ? C.danger : C.border}` }}>
        <div className="absolute inset-1 grid grid-cols-8 grid-rows-4 gap-[2px]">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} style={{ background: ["#1565C0","#2E7D32","#F57C00","#64748B","#0D47A1","#F9A825"][i % 6], opacity: 0.85, borderRadius: 2 }} />
          ))}
        </div>
        <div className="absolute left-2 top-1 text-[10px] font-bold tracking-widest" style={{ color: partition ? C.danger : C.text }}>{label}</div>
      </div>
    </div>
  );
}

function Building({ x, y, w, h, label, tone }: { x: string; y: string; w: string; h: string; label: string; tone?: "rail" | "gate" }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      <div className="relative h-full w-full rounded-md" style={{ background: tone === "rail" ? "#E2E8F0" : tone === "gate" ? "#FEF3C7" : "#FFFFFF", border: `1px solid ${C.border}` }}>
        <div className="absolute left-2 top-1 text-[10px] font-bold tracking-widest" style={{ color: C.text2 }}>{label}</div>
        {tone === "rail" && (
          <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1">
            <div style={{ height: 2, background: C.text2 }} />
            <div style={{ height: 2, background: C.text2 }} />
          </div>
        )}
      </div>
    </div>
  );
}

function MovingTruck({ lane, delay, onClick }: { lane: "top" | "bottom"; delay: number; onClick?: () => void }) {
  const top = lane === "top" ? "65%" : "87%";
  return (
    <motion.button
      onClick={onClick}
      className="absolute"
      style={{ top, left: 0, pointerEvents: "auto" }}
      initial={{ x: "-6vw" }}
      animate={{ x: ["-6vw", "108vw"] }}
      transition={{ duration: 22, repeat: Infinity, ease: "linear", delay }}
    >
      <svg width="42" height="18" viewBox="0 0 42 18">
        <rect x="0" y="4" width="26" height="10" rx="1" fill="#1565C0" />
        <rect x="26" y="1" width="14" height="13" rx="1" fill="#0D47A1" />
        <circle cx="6" cy="16" r="2" fill="#0F172A" />
        <circle cx="20" cy="16" r="2" fill="#0F172A" />
        <circle cx="34" cy="16" r="2" fill="#0F172A" />
      </svg>
    </motion.button>
  );
}

function MovingContainer({ y, delay }: { y: string; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-sm"
      style={{ top: y, left: 0, width: 12, height: 6, background: C.accent, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
      initial={{ x: "4vw" }}
      animate={{ x: ["4vw", "92vw"] }}
      transition={{ duration: 38, repeat: Infinity, ease: "linear", delay }}
    />
  );
}
