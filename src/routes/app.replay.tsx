import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { motion } from "motion/react";
import { C } from "../app/tokens";
import { Card, Pill, StatusDot } from "../app/components/primitives";
import { PortTwin } from "../app/components/PortTwin";

export const Route = createFileRoute("/app/replay")({
  component: Replay,
});

const REPLAYS = [
  { id: "cyber",      title: "Cyberattack — Feb 14, 2026",     dur: "12m", tone: "danger"  as const },
  { id: "rain",       title: "Heavy Monsoon — Jul 08, 2026",   dur: "48m", tone: "warn"    as const },
  { id: "trailer",    title: "Trailer Crisis — Mar 22, 2026",  dur: "26m", tone: "warn"    as const },
  { id: "partition",  title: "Network Partition — May 03, 2026", dur: "9m",  tone: "danger"  as const },
];

function Replay() {
  const [sel, setSel] = useState(REPLAYS[1]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (n: number) => {
      const dt = (n - last) / 1000; last = n;
      setT(v => (v + dt * 4) % 100);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
          <StatusDot status="operating" /> Replay Center
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Historical Operations Replay</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {REPLAYS.map(r => (
          <button key={r.id} onClick={() => { setSel(r); setT(0); }}
                  className={`rounded-2xl p-4 text-left transition ${sel.id === r.id ? "ring-2" : ""}`}
                  style={{ background: "#fff", border: `1px solid ${C.borderSoft}`, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", ["--tw-ring-color" as any]: C.primary }}>
            <Pill tone={r.tone}>Replay</Pill>
            <h3 className="mt-3 text-sm font-bold">{r.title}</h3>
            <p className="mt-1 text-xs" style={{ color: C.text2 }}>Duration {r.dur}</p>
          </button>
        ))}
      </div>

      <Card padded={false}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>Now Replaying</div>
            <div className="text-base font-bold">{sel.title}</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: C.surface2 }} onClick={() => setT(0)}><SkipBack className="h-4 w-4" /></button>
            <button className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: C.primary }} onClick={() => setPlaying(p => !p)}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: C.surface2 }} onClick={() => setT(99)}><SkipForward className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="p-4">
          <PortTwin height={460} partition={sel.id === "partition" && t < 65} />
        </div>
        <div className="px-4 pb-4">
          <div className="relative h-2 rounded-full" style={{ background: C.surface2 }}>
            <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: C.primary, width: `${t}%` }} />
            {[15, 40, 65, 90].map((m, i) => (
              <div key={i} className="absolute -top-1 h-4 w-0.5" style={{ left: `${m}%`, background: C.text2 }} title={`Milestone ${i + 1}`} />
            ))}
          </div>
          <input type="range" min={0} max={100} value={t} onChange={e => { setT(+e.target.value); setPlaying(false); }} className="mt-2 w-full accent-emerald-700" />
          <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
            <span>T-0</span><span>Impact</span><span>Isolation</span><span>Recovery</span><span>Resolved</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
