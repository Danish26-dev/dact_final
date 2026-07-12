import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, CloudRain, Network, Server, Camera, Truck, Ship, Zap, Boxes, Play, Square, Activity } from "lucide-react";
import { C } from "../app/tokens";
import { Card, Pill, StatusDot } from "../app/components/primitives";
import { SCENARIOS } from "../app/data";
import { LiveTwin } from "../app/components/LiveTwin";
import { useEngine } from "../app/sim-engine";

export const Route = createFileRoute("/app/incidents")({
  component: IncidentCenter,
});

const ICONS: Record<string, any> = { shield: ShieldAlert, cloud: CloudRain, network: Network, server: Server, camera: Camera, truck: Truck, ship: Ship, zap: Zap, boxes: Boxes };

function IncidentCenter() {
  const engine = useEngine();
  const {
    activeScenario, scenarioLabel, scenarioProgress, scenarioStartedAt,
    activityLog, disabledTrucks, disabledCranes, spawnPaused, weatherLevel,
    analytics, mode, runScenario, stopScenario,
  } = engine;

  const activeMeta = activeScenario ? SCENARIOS.find((s) => s.id === activeScenario) : null;

  // Timeline = engine events emitted since the scenario started
  const timeline = useMemo(() => {
    if (!scenarioStartedAt) return [];
    return activityLog
      .filter((e) => e.ts >= scenarioStartedAt - 200)
      .slice(0, 40)
      .reverse();
  }, [activityLog, scenarioStartedAt]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
            <StatusDot status={activeScenario ? "degraded" : "healthy"} /> Operational Scenario Simulator
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Incident Center</h1>
          <p className="mt-1 text-sm" style={{ color: C.text2 }}>
            Inject a scenario — trucks, cranes, gateway, packets, and KPIs across the whole app respond in real time.
          </p>
        </div>
        {activeScenario && (
          <button onClick={stopScenario} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ background: C.text }}>
            <Square className="h-4 w-4" /> Stop Simulation
          </button>
        )}
      </div>

      {!activeScenario && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {SCENARIOS.map(s => {
            const Icon = ICONS[s.icon] ?? ShieldAlert;
            return (
              <motion.div key={s.id} whileHover={{ y: -4 }}>
                <Card interactive>
                  <div className="flex items-start justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl"
                         style={{ background: s.severity === "critical" ? C.dangerSoft : C.warningSoft,
                                  color: s.severity === "critical" ? C.danger : C.warning }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Pill tone={s.severity === "critical" ? "danger" : "warn"}>{s.severity}</Pill>
                  </div>
                  <h3 className="mt-4 text-base font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm" style={{ color: C.text2 }}>{s.desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs" style={{ color: C.text2 }}>Est. recovery: <b style={{ color: C.text }}>{s.eta}</b></span>
                    <button onClick={() => runScenario(s.id)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: C.primary }}>
                      <Play className="h-3 w-3" /> Inject
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {activeScenario && activeMeta && (
        <>
          {/* Live impact chips */}
          <div className="flex flex-wrap items-center gap-2">
            <ImpactChip label="Mode" value={mode} tone={mode === "NORMAL" ? "good" : "bad"} />
            <ImpactChip label="Disabled trucks" value={disabledTrucks.length} tone={disabledTrucks.length ? "warn" : "good"} />
            <ImpactChip label="Disabled cranes" value={disabledCranes.length} tone={disabledCranes.length ? "warn" : "good"} />
            <ImpactChip label="Intake" value={spawnPaused ? "PAUSED" : "OPEN"} tone={spawnPaused ? "warn" : "good"} />
            <ImpactChip label="Weather" value={weatherLevel > 0 ? "HEAVY RAIN" : "CLEAR"} tone={weatherLevel > 0 ? "warn" : "good"} />
            <ImpactChip label="Packets fwd" value={analytics.packetsForwarded} tone="info" />
            <ImpactChip label="Queued" value={analytics.packetsQueued} tone={analytics.packetsQueued ? "warn" : "good"} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr,1fr]">
            <Card padded={false}>
              <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: C.dangerSoft, color: C.danger }}>
                    {(() => { const I = ICONS[activeMeta.icon]; return <I className="h-5 w-5" />; })()}
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.danger }}>ACTIVE INCIDENT</div>
                    <div className="text-base font-bold">{activeMeta.title}</div>
                    <div className="text-xs" style={{ color: C.text2 }}>{scenarioLabel || "Initializing…"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest" style={{ color: C.text2 }}>Recovery</div>
                    <div className="text-lg font-bold tabular-nums">{Math.round(scenarioProgress * 100)}%</div>
                  </div>
                  <div className="h-2 w-40 overflow-hidden rounded-full" style={{ background: C.surface2 }}>
                    <motion.div className="h-full" style={{ background: C.primary }} animate={{ width: `${scenarioProgress * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <LiveTwin height={480} />
              </div>
            </Card>

            <Card padded={false}>
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                <div>
                  <h3 className="text-sm font-bold">Live Response Timeline</h3>
                  <p className="text-xs" style={{ color: C.text2 }}>Streamed from simulation engine</p>
                </div>
                <Activity className="h-4 w-4" style={{ color: C.primary }} />
              </div>
              <div className="max-h-[520px] overflow-y-auto p-3">
                {timeline.length === 0 && (
                  <div className="text-xs px-2 py-4" style={{ color: C.text2 }}>Waiting for engine events…</div>
                )}
                <AnimatePresence>
                  {timeline.map((t) => (
                    <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                className="mb-2 flex gap-3 rounded-lg p-3" style={{ background: C.surface2 }}>
                      <span className="inline-block h-2 w-2 shrink-0 translate-y-1.5 rounded-full"
                            style={{ background: t.severity === "critical" ? C.danger : t.severity === "warn" ? C.warning : t.severity === "success" ? C.primary : C.secondary }} />
                      <div className="flex-1">
                        <div className="text-xs font-semibold">{t.message}</div>
                        <div className="text-[10px]" style={{ color: C.text2 }}>
                          {new Date(t.ts).toLocaleTimeString("en-IN", { hour12: false })} · {t.kind}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ImpactChip({ label, value, tone }: { label: string; value: string | number; tone: "good" | "warn" | "bad" | "info" }) {
  const c = tone === "good" ? C.primary : tone === "warn" ? C.warning : tone === "bad" ? C.danger : C.secondary;
  const bg = tone === "good" ? C.primarySoft : tone === "warn" ? C.warningSoft : tone === "bad" ? C.dangerSoft : C.secondarySoft;
  return (
    <div className="flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: bg, color: c, border: `1px solid ${c}33` }}>
      <span className="uppercase tracking-wider opacity-70">{label}</span>
      <span>{value}</span>
    </div>
  );
}
