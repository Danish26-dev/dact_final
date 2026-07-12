import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import { C } from "../app/tokens";
import { Card, Pill, StatusDot } from "../app/components/primitives";
import { NODES } from "../app/data";
import { useEngine, ENGINE_POSITIONS } from "../app/sim-engine";
import { TerminalLog } from "../app/components/TerminalLog";

export const Route = createFileRoute("/app/mesh")({
  component: Mesh,
});

function Mesh() {
  const { packets, mode, analytics, trucks } = useEngine();
  const [hover, setHover] = useState<string | null>(null);

  const edges = useMemo(() => {
    const out: { a: string; b: string; ax: number; ay: number; bx: number; by: number }[] = [];
    for (const n of NODES) for (const nb of n.neighbors) {
      if (n.id < nb) {
        const m = NODES.find(x => x.id === nb);
        if (m) out.push({ a: n.id, b: m.id, ax: n.x, ay: n.y, bx: m.x, by: m.y });
      }
    }
    return out;
  }, []);

  const partition = mode === "TOS_FAILURE";
  const hoveredNode = hover ? NODES.find(n => n.id === hover) : null;

  const stats = {
    latency: analytics.avgLatencyMs.toFixed(1),
    forwarded: analytics.packetsForwarded,
    acked: analytics.packetsAcked,
    queued: analytics.packetsQueued,
    online: NODES.filter(n => n.status === "healthy").length,
    total: NODES.length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
            <StatusDot status={partition ? "degraded" : "healthy"} /> Mesh Topology · {mode}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Decentralized Network</h1>
          <p className="mt-1 text-sm" style={{ color: C.text2 }}>
            Packet flow is driven by real operational events. When the TOS is down, packets stop flowing to Mission Control and reroute to the Gateway queue.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Pill tone={partition ? "danger" : "success"}>{partition ? "TOS OFFLINE" : "TOS ONLINE"}</Pill>
          <Pill tone="info">{trucks.filter(t => t.status === "moving").length} truck nodes moving</Pill>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {[
          { l: "Avg Latency", v: `${stats.latency} ms` },
          { l: "Forwarded", v: stats.forwarded.toString() },
          { l: "ACK Received", v: stats.acked.toString() },
          { l: "Queued", v: stats.queued.toString() },
          { l: "Online Nodes", v: `${stats.online}/${stats.total}` },
          { l: "Mode", v: mode },
        ].map(s => (
          <Card key={s.l} className="!p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>{s.l}</div>
            <div className="mt-1 text-lg font-bold tabular-nums">{s.v}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card padded={false}>
          <div className="relative h-[560px] w-full overflow-hidden rounded-2xl" style={{ background: "radial-gradient(circle at 30% 20%, #EEF4FB, #E2E8F0)" }}>
            <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Static mesh */}
              {edges.map((e, i) => {
                const broken = partition && ((e.ax > 36 && e.ax < 62) !== (e.bx > 36 && e.bx < 62));
                if (broken) return null;
                const highlight = hoveredNode && (e.a === hoveredNode.id || e.b === hoveredNode.id);
                return (
                  <line key={i} x1={e.ax} y1={e.ay} x2={e.bx} y2={e.by}
                        stroke={highlight ? C.accent : C.secondary}
                        strokeWidth={highlight ? "0.35" : "0.14"}
                        opacity={highlight ? 0.9 : 0.35} />
                );
              })}

              {/* Live engine packets — truck → gateway → control */}
              <AnimatePresence>
                {packets.map((p) => {
                  const src = packetSource(p, trucks);
                  const dst = packetDest(p);
                  const color = p.status === "queued" ? C.warning :
                                p.status === "acked" ? C.primary :
                                p.status === "dropped" ? C.danger : C.accent;
                  return (
                    <motion.g key={p.id}>
                      <motion.line
                        x1={src.x} y1={src.y} x2={src.x} y2={src.y}
                        stroke={color} strokeWidth="0.25" strokeDasharray="0.6 0.4" opacity="0.5"
                        animate={{ x2: dst.x, y2: dst.y }}
                        transition={{ duration: 1.4, ease: "easeOut" }}
                      />
                      <motion.circle r="0.9" fill={color}
                        initial={{ cx: src.x, cy: src.y, opacity: 0 }}
                        animate={{ cx: dst.x, cy: dst.y, opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1.6, ease: "easeOut" }} />
                      <motion.text x={src.x + 1} y={src.y - 1} fontSize="1.3" fill={color}
                        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.6 }}>
                        {p.id.split("-")[1]}
                      </motion.text>
                    </motion.g>
                  );
                })}
              </AnimatePresence>
            </svg>

            {/* Gateway */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2"
                 style={{ left: `${ENGINE_POSITIONS.GATEWAY.x}%`, top: `${ENGINE_POSITIONS.GATEWAY.y}%` }}>
              <motion.div
                animate={{ boxShadow: [`0 0 0 0 ${partition ? C.accent : C.secondary}88`, `0 0 0 18px ${partition ? C.accent : C.secondary}00`] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="grid h-12 w-12 place-items-center rounded-xl text-[10px] font-bold text-white"
                style={{ background: partition ? C.accent : C.secondary }}>
                GATEWAY
              </motion.div>
            </div>

            {/* Mission Control */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2"
                 style={{ left: `${ENGINE_POSITIONS.CONTROL.x}%`, top: `${ENGINE_POSITIONS.CONTROL.y}%` }}>
              <div className="grid h-10 w-10 place-items-center rounded-lg text-[9px] font-bold text-white"
                   style={{ background: partition ? C.danger : C.primary, opacity: partition ? 0.4 : 1 }}>
                MISSION<br/>CONTROL
              </div>
            </div>

            {/* Truck nodes — positioned from engine */}
            {trucks.filter((t) => t.status === "moving").map((t) => (
              <div key={t.id} className="absolute -translate-x-1/2 -translate-y-1/2"
                   style={{ left: `${t.x}%`, top: `${t.y}%` }}>
                <motion.div className="grid h-6 w-6 place-items-center rounded-full text-[8px] font-bold text-white"
                  animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ background: t.containerId ? C.accent : C.text2 }}>
                  {t.id.replace("TRK-", "")}
                </motion.div>
              </div>
            ))}

            {/* Static mesh nodes */}
            {NODES.slice(0, 12).map(n => (
              <div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2"
                   style={{ left: `${n.x}%`, top: `${n.y}%` }}
                   onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}>
                <div className="rounded-full"
                  style={{
                    width: 14, height: 14,
                    background: n.status === "offline" ? C.danger : n.status === "degraded" ? C.warning : C.secondary,
                    opacity: 0.7, border: "2px solid white",
                  }} />
              </div>
            ))}

            {partition && (
              <div className="absolute left-4 top-4 rounded-lg px-3 py-1.5 text-xs font-bold"
                   style={{ background: C.accentSoft, color: C.accent, border: "1px solid #FFCC80" }}>
                TZC MODE · Packets routing to Gateway queue instead of Mission Control
              </div>
            )}
          </div>
        </Card>

        <TerminalLog max={16} height={560} />
      </div>
    </div>
  );
}

function packetSource(p: { from: string; containerId?: string }, trucks: any[]) {
  if (p.from === "gateway") return ENGINE_POSITIONS.GATEWAY;
  if (p.from === "control") return ENGINE_POSITIONS.CONTROL;
  const t = trucks.find((tt) => tt.containerId === p.containerId);
  return t ? { x: t.x, y: t.y } : ENGINE_POSITIONS.GATE;
}
function packetDest(p: { to: string; status: string }) {
  if (p.status === "queued" || p.to === "queue") return ENGINE_POSITIONS.GATEWAY;
  if (p.to === "control") return ENGINE_POSITIONS.CONTROL;
  return ENGINE_POSITIONS.GATEWAY;
}
