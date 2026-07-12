import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import {
  Radio, Wifi, WifiOff, Cloud, CloudOff, ArrowDown, Truck, ConstructionIcon,
  DoorOpen, ScanLine, Thermometer, Activity, AlertTriangle, RefreshCw,
  CheckCircle2, Zap, Terminal, Send, Inbox, Signal,
} from "lucide-react";
import { C } from "../app/tokens";
import { Card, StatusDot, Pill } from "../app/components/primitives";
import {
  GatewayProvider, useGateway, HHMMSS,
  type MeshNode,
} from "../app/gateway-state";

export const Route = createFileRoute("/app/gateway")({
  component: () => (
    <GatewayProvider>
      <GatewayPage />
    </GatewayProvider>
  ),
});

function GatewayPage() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Header />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-5"><GatewayStatusCard /></div>
        <div className="col-span-12 xl:col-span-7"><PacketForwardingCard /></div>
        <div className="col-span-12 xl:col-span-7"><ConnectedNodesCard /></div>
        <div className="col-span-12 xl:col-span-5"><QueueCard /></div>
        <div className="col-span-12"><SimulationControls /></div>
        <div className="col-span-12"><GatewayLogs /></div>
      </div>
    </div>
  );
}

function Header() {
  const { gatewayName, role, missionControlOnline } = useGateway();
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
        <StatusDot status={missionControlOnline ? "healthy" : "degraded"} /> Mesh Gateway · {gatewayName}
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ color: C.text }}>
        📡 Mesh Gateway
      </h1>
      <p className="mt-1 text-sm" style={{ color: C.text2 }}>
        Bridging offline field assets to Mission Control ·{" "}
        <span className="font-semibold" style={{ color: role === "temporary-coordinator" ? C.accent : C.primary }}>
          {role === "temporary-coordinator" ? "Operating as Temporary Zone Coordinator" : "Normal Gateway Operation"}
        </span>
      </p>
    </div>
  );
}

/* ---------------- Section 1: Gateway Status ---------------- */

function GatewayStatusCard() {
  const g = useGateway();
  const tzc = g.role === "temporary-coordinator";
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>Gateway Status</div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-bold" style={{ color: C.primary }}>
            <StatusDot status="healthy" /> ONLINE
          </div>
        </div>
        <motion.div
          animate={tzc ? { boxShadow: [`0 0 0 0 ${C.accent}55`, `0 0 0 12px ${C.accent}00`] } : {}}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="grid h-12 w-12 place-items-center rounded-xl"
          style={{ background: tzc ? C.accentSoft : C.primarySoft, color: tzc ? C.accent : C.primary }}
        >
          <Radio className="h-6 w-6" />
        </motion.div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatField label="Gateway Name" value={g.gatewayName} />
        <StatField label="Current Role">
          <AnimatePresence mode="wait">
            <motion.div
              key={g.role}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-1.5 text-sm font-bold"
              style={{ color: tzc ? C.accent : C.text }}
            >
              {tzc ? "Temporary Zone Coordinator" : "Gateway"}
            </motion.div>
          </AnimatePresence>
        </StatField>
      </div>

      {tzc && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold"
          style={{ background: C.accentSoft, color: C.accent, border: `1px dashed ${C.accent}` }}
        >
          Gateway <ArrowDown className="h-3.5 w-3.5" /> Temporary Zone Coordinator
        </motion.div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <LinkField label="Internet" ok={g.missionControlOnline} okLabel="Connected" badLabel="Disconnected" okIcon={Cloud} badIcon={CloudOff} />
        <LinkField label="Mesh" ok={g.meshConnected} okLabel="Connected" badLabel="Down" okIcon={Wifi} badIcon={WifiOff} />
        <StatField label="Last Heartbeat">
          <LiveHeartbeat ts={g.lastHeartbeat} />
        </StatField>
        <StatField label="Gateway Latency" value={`${g.latencyMs} ms`} />
        <StatField
          label="Forward Success Rate"
          value={`${g.forwardSuccessRate}%`}
          valueColor={g.forwardSuccessRate === 100 ? C.primary : C.danger}
        />
        <StatField label="Queue Depth" value={String(g.queue.length)} valueColor={g.queue.length ? C.warning : C.text} />
      </div>
    </Card>
  );
}

function StatField({ label, value, children, valueColor }: { label: string; value?: string; children?: React.ReactNode; valueColor?: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: C.surface2, border: `1px solid ${C.borderSoft}` }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>{label}</div>
      {children ?? <div className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: valueColor ?? C.text }}>{value}</div>}
    </div>
  );
}

function LinkField({ label, ok, okLabel, badLabel, okIcon: OkI, badIcon: BadI }: { label: string; ok: boolean; okLabel: string; badLabel: string; okIcon: any; badIcon: any }) {
  const Icon = ok ? OkI : BadI;
  return (
    <div className="rounded-lg p-3" style={{ background: C.surface2, border: `1px solid ${C.borderSoft}` }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>{label}</div>
      <div className="mt-0.5 flex items-center gap-1.5 text-sm font-bold" style={{ color: ok ? C.primary : C.danger }}>
        <Icon className="h-3.5 w-3.5" /> {ok ? okLabel : badLabel}
      </div>
    </div>
  );
}

function LiveHeartbeat({ ts }: { ts: number }) {
  return (
    <div className="mt-0.5 flex items-center gap-1.5 text-sm font-bold" style={{ color: C.primary }}>
      <motion.span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: C.primary }}
        animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      />
      Live · {HHMMSS(ts)}
    </div>
  );
}

/* ---------------- Section 2: Connected Nodes ---------------- */

const NODE_ICON: Record<MeshNode["kind"], any> = {
  truck: Truck, crane: ConstructionIcon, gate: DoorOpen, rfid: ScanLine, reefer: Thermometer,
};

function ConnectedNodesCard() {
  const { connectedNodes } = useGateway();
  return (
    <Card className="h-full" padded={false}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <div>
          <h2 className="text-base font-bold" style={{ color: C.text }}>Connected Mesh Nodes</h2>
          <p className="text-xs" style={{ color: C.text2 }}>{connectedNodes.length} peers · offline-first assets bridged through {`MONIKA`}</p>
        </div>
        <Pill tone="success">All Peers Healthy</Pill>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {connectedNodes.map(n => <NodeCard key={n.id} node={n} />)}
      </div>
    </Card>
  );
}

function NodeCard({ node }: { node: MeshNode }) {
  const Icon = NODE_ICON[node.kind];
  const secondsAgo = Math.max(1, Math.round((Date.now() - node.lastEventAt) / 1000));
  return (
    <motion.div
      animate={{ boxShadow: [`0 0 0 0 ${C.secondary}00`, `0 0 0 4px ${C.secondary}18`, `0 0 0 0 ${C.secondary}00`] }}
      transition={{ repeat: Infinity, duration: 3.2, delay: Math.random() * 2 }}
      className="rounded-xl p-3"
      style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: C.secondarySoft, color: C.secondary }}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: C.text }}>{node.name}</div>
            <div className="text-[10px] font-mono" style={{ color: C.text3 }}>{node.id}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: C.primary }}>
          <StatusDot status="healthy" /> Online
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
        <MiniStat label="Internet" value="✕" color={C.danger} />
        <MiniStat label="Mesh" value="✓" color={C.primary} />
        <MiniStat label="Packets" value={String(node.packets)} />
        <MiniStat label="Last" value={`${secondsAgo}s`} />
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] font-semibold" style={{ color: C.text2 }}>
          <span className="flex items-center gap-1"><Signal className="h-3 w-3" /> Signal</span>
          <span>{Math.round(node.signal)}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: C.surface3 }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: node.signal > 75 ? C.primary : node.signal > 55 ? C.warning : C.danger }}
            animate={{ width: `${node.signal}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-md px-1.5 py-1 text-center" style={{ background: C.surface2 }}>
      <div className="text-[9px] font-semibold uppercase" style={{ color: C.text3 }}>{label}</div>
      <div className="text-xs font-bold tabular-nums" style={{ color: color ?? C.text }}>{value}</div>
    </div>
  );
}

/* ---------------- Section 3: Packet Forwarding ---------------- */

function PacketForwardingCard() {
  const { packets, missionControlOnline, history, queue } = useGateway();
  const latest = missionControlOnline ? history[0] : queue[queue.length - 1];
  return (
    <Card className="h-full" padded={false}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <div>
          <h2 className="text-base font-bold" style={{ color: C.text }}>Real-Time Packet Forwarding</h2>
          <p className="text-xs" style={{ color: C.text2 }}>Every field event streams through the gateway</p>
        </div>
        <Pill tone={missionControlOnline ? "info" : "warn"}>
          {missionControlOnline ? "Forwarding → Mission Control" : "Buffering → Gateway Queue"}
        </Pill>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-[1fr,1.4fr]">
        <PacketPipeline packets={packets} toQueue={!missionControlOnline} />
        <div className="rounded-xl p-4" style={{ background: C.surface2, border: `1px solid ${C.borderSoft}` }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>Latest Packet</div>
          {latest ? (
            <div className="mt-2 space-y-2 text-sm">
              <Row k="Container" v={latest.container} mono />
              <Row k="Event" v={latest.kind} />
              <Row k="Time" v={HHMMSS(latest.ts)} mono />
              <Row k="Status">
                <Pill tone={latest.status === "forwarded" || latest.status === "acked" ? "success" : "warn"}>
                  {latest.status.toUpperCase()}
                </Pill>
              </Row>
              <Row k="Node" v={latest.nodeId} mono />
            </div>
          ) : (
            <div className="mt-6 text-center text-xs" style={{ color: C.text3 }}>Awaiting first event…</div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Row({ k, v, mono, children }: { k: string; v?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>{k}</span>
      {children ?? <span className={`text-sm font-bold ${mono ? "font-mono" : ""}`} style={{ color: C.text }}>{v}</span>}
    </div>
  );
}

function PacketPipeline({ packets, toQueue }: { packets: { id: string; to: string }[]; toQueue: boolean }) {
  return (
    <div className="relative flex flex-col items-center gap-2 py-2">
      <PipelineNode icon={Truck} label="Field Node" tone={C.secondary} />
      <PipelineTrack packets={packets} toQueue={toQueue} segment="in" />
      <PipelineNode icon={Radio} label="MONIKA Gateway" tone={toQueue ? C.accent : C.primary} highlight />
      <PipelineTrack packets={packets} toQueue={toQueue} segment="out" />
      <AnimatePresence mode="wait">
        {toQueue ? (
          <motion.div key="q" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PipelineNode icon={Inbox} label="Gateway Queue" tone={C.warning} />
          </motion.div>
        ) : (
          <motion.div key="mc" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PipelineNode icon={Send} label="Mission Control" tone={C.primary} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PipelineNode({ icon: Icon, label, tone, highlight }: { icon: any; label: string; tone: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={{ background: highlight ? `${tone}12` : C.surface, border: `1px solid ${highlight ? tone : C.borderSoft}` }}>
      <div className="grid h-7 w-7 place-items-center rounded-md" style={{ background: `${tone}18`, color: tone }}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs font-bold" style={{ color: C.text }}>{label}</span>
    </div>
  );
}

function PipelineTrack({ packets, toQueue, segment }: { packets: { id: string; to: string }[]; toQueue: boolean; segment: "in" | "out" }) {
  const color = segment === "out" && toQueue ? C.warning : C.secondary;
  return (
    <div className="relative h-10 w-1">
      <div className="absolute inset-0 mx-auto w-[2px] rounded-full" style={{ background: C.surface3 }} />
      <AnimatePresence>
        {packets.slice(-6).map((p) => (
          <motion.span
            key={`${p.id}-${segment}`}
            initial={{ y: segment === "in" ? -6 : 20, opacity: 0, scale: 0.6 }}
            animate={{ y: segment === "in" ? 40 : 46, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="absolute left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Section 4: Queue ---------------- */

function QueueCard() {
  const { queue, syncing, syncTotal, syncDone } = useGateway();
  return (
    <Card className="h-full" padded={false}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <div>
          <h2 className="text-base font-bold" style={{ color: C.text }}>Gateway Queue</h2>
          <p className="text-xs" style={{ color: C.text2 }}>Durable buffer active during Mission Control outages</p>
        </div>
        <Pill tone={queue.length ? "warn" : "success"}>
          Queue Length: {queue.length}
        </Pill>
      </div>

      {syncing && (
        <div className="px-5 py-3" style={{ background: C.primarySoft, borderBottom: `1px solid ${C.borderSoft}` }}>
          <div className="flex items-center justify-between text-xs font-bold" style={{ color: C.primaryDark }}>
            <span className="flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Uploading queued events…</span>
            <span className="tabular-nums">{syncDone}/{syncTotal}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "white" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: C.primary }}
              animate={{ width: `${syncTotal ? (syncDone / syncTotal) * 100 : 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="max-h-[360px] overflow-y-auto p-4">
        {queue.length === 0 && !syncing && (
          <div className="grid place-items-center py-10 text-center">
            <CheckCircle2 className="h-8 w-8" style={{ color: C.primary }} />
            <div className="mt-2 text-sm font-bold" style={{ color: C.text }}>Queue empty</div>
            <div className="text-xs" style={{ color: C.text2 }}>All events forwarded in real time</div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {queue.map((ev, i) => (
            <motion.div
              key={ev.id}
              layout
              initial={{ opacity: 0, x: 12, backgroundColor: C.primarySoft }}
              animate={{ opacity: 1, x: 0, backgroundColor: C.warningSoft }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.35 }}
              className="mb-2 flex items-center justify-between gap-2 rounded-lg p-2.5"
              style={{ background: C.warningSoft, border: `1px solid ${C.warning}55` }}
            >
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold tabular-nums" style={{ background: "white", color: C.warning }}>{i + 1}</span>
                <div>
                  <div className="text-xs font-bold font-mono" style={{ color: C.text }}>{ev.container}</div>
                  <div className="text-[10px]" style={{ color: C.text2 }}>{ev.kind} · {ev.nodeId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono" style={{ color: C.text2 }}>{HHMMSS(ev.ts)}</div>
                <div className="text-[10px] font-semibold" style={{ color: C.text3 }}>retries {ev.retries}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}

/* ---------------- Simulation Controls ---------------- */

function SimulationControls() {
  const { emitEvent, simulateTosFailure, restoreTos, missionControlOnline } = useGateway();
  const buttons: { label: string; kind: string; nodeKind: MeshNode["kind"] }[] = [
    { label: "Receive Container Event", kind: "Container Loaded", nodeKind: "crane" },
    { label: "Receive RFID Scan",       kind: "RFID Scan",        nodeKind: "rfid" },
    { label: "Receive Crane Update",    kind: "Crane Update",     nodeKind: "crane" },
    { label: "Receive Truck Update",    kind: "Truck Update",     nodeKind: "truck" },
    { label: "Receive Gate Exit",       kind: "Gate Exit",        nodeKind: "gate" },
  ];
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <div>
          <h2 className="text-base font-bold" style={{ color: C.text }}>Simulation Controls</h2>
          <p className="text-xs" style={{ color: C.text2 }}>Inject synthetic events and outages to walk the gateway through its lifecycle</p>
        </div>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr,auto]">
        <div className="flex flex-wrap gap-2">
          {buttons.map(b => (
            <button
              key={b.label}
              onClick={() => emitEvent(b.kind, b.nodeKind)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: C.secondarySoft, color: C.secondaryDark, border: `1px solid ${C.secondary}44` }}
            >
              <Zap className="h-3.5 w-3.5" /> {b.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {missionControlOnline ? (
            <button
              onClick={simulateTosFailure}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
              style={{ background: C.danger, boxShadow: `0 8px 24px -8px ${C.danger}88` }}
            >
              <AlertTriangle className="h-4 w-4" /> 🚨 Simulate TOS Failure
            </button>
          ) : (
            <button
              onClick={restoreTos}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
              style={{ background: C.primary, boxShadow: `0 8px 24px -8px ${C.primary}88` }}
            >
              <RefreshCw className="h-4 w-4" /> Restore TOS
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ---------------- Bottom: Live Logs ---------------- */

function GatewayLogs() {
  const { logs } = useGateway();
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [logs]);
  const color = (l: string) =>
    l === "critical" ? C.danger : l === "warn" ? C.warning : l === "success" ? C.primary : C.secondary;
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" style={{ color: C.text2 }} />
          <h2 className="text-base font-bold" style={{ color: C.text }}>Live Gateway Logs</h2>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: C.text2 }}>
          <Activity className="h-3.5 w-3.5" /> Streaming · {logs.length} entries
        </span>
      </div>
      <div
        ref={ref}
        className="max-h-[320px] overflow-y-auto p-3 font-mono text-[12px]"
        style={{ background: "#0F172A" }}
      >
        <AnimatePresence initial={false}>
          {logs.map(l => (
            <motion.div
              key={l.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-1 grid grid-cols-[auto,auto,1fr] items-start gap-3 rounded px-2 py-1"
              style={{ color: "#E2E8F0" }}
            >
              <span style={{ color: "#64748B" }}>{HHMMSS(l.ts)}</span>
              <span className="font-bold uppercase text-[10px] tracking-wider" style={{ color: color(l.level) }}>
                {l.level}
              </span>
              <span>{l.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
