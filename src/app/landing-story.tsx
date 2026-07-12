import { motion, AnimatePresence, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Ship, Anchor, Truck, Warehouse, Container as ContainerIcon, ScanLine,
  Server, Radio, ShieldAlert, Activity, Zap, CheckCircle2, XCircle,
  AlertTriangle, Cpu, Network, Timer, GitBranch, Route as RouteIcon,
  Play, RefreshCw, ArrowRight, Rocket, Sparkles, Radar, Layers,
} from "lucide-react";

const C = {
  bg: "#F8FAFC", surface: "#FFFFFF", surface2: "#F1F5F9",
  border: "#CBD5E1", borderSoft: "#E2E8F0",
  primary: "#2E7D32", primaryDark: "#1B5E20",
  secondary: "#1565C0", secondaryDark: "#0D47A1",
  accent: "#F57C00", warning: "#F9A825", critical: "#C62828",
  text: "#1E293B", text2: "#64748B", text3: "#94A3B8",
};

/* ============ shared ============ */
function Eyebrow({ children, tone = "secondary" }: { children: React.ReactNode; tone?: "primary" | "secondary" | "accent" | "critical" }) {
  const map: Record<string, { bg: string; fg: string }> = {
    primary: { bg: "#E8F5E9", fg: C.primary },
    secondary: { bg: "#E3F2FD", fg: C.secondary },
    accent: { bg: "#FFF3E0", fg: C.accent },
    critical: { bg: "#FFEBEE", fg: C.critical },
  };
  const m = map[tone];
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
      style={{ background: m.bg, color: m.fg }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.fg }} />
      {children}
    </div>
  );
}

function SectionHead({ eyebrow, tone, title, subtitle, align = "center" }: {
  eyebrow: string; tone?: "primary" | "secondary" | "accent" | "critical";
  title: string; subtitle?: string; align?: "center" | "left";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}
    >
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl" style={{ color: C.text }}>{title}</h2>
      {subtitle && <p className="mt-4 text-base md:text-lg" style={{ color: C.text2 }}>{subtitle}</p>}
    </motion.div>
  );
}

/* ============ Section 1: Current Problem ============ */
function Section1Problem() {
  const nodes = [
    { icon: Ship, label: "Ship" },
    { icon: Anchor, label: "Crane" },
    { icon: Truck, label: "Truck" },
    { icon: ScanLine, label: "Gate" },
    { icon: Warehouse, label: "Warehouse" },
  ];
  return (
    <section className="relative py-24" style={{ background: C.surface }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="The Reality Today"
          tone="secondary"
          title="Modern Ports Depend on a Single Point of Coordination"
          subtitle="Today's container terminals rely on a centralized Terminal Operating System (TOS). When connectivity to the TOS is lost, container movement slows, visibility decreases, and operations fall back to manual processes."
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8 }}
          className="relative mx-auto mt-16 max-w-5xl rounded-3xl p-8 md:p-12"
          style={{ background: C.surface2, border: `1px solid ${C.borderSoft}` }}
        >
          <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
            {nodes.map((n, i) => (
              <motion.div key={n.label}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4"
                style={{ border: `1px solid ${C.borderSoft}` }}
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl"
                  style={{ background: `${C.secondary}12`, color: C.secondary }}>
                  <n.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold" style={{ color: C.text }}>{n.label}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.primary }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: C.primary }} /> Healthy
                </span>
              </motion.div>
            ))}
          </div>

          {/* Animated flow arrows to TOS */}
          <div className="relative mt-8 h-24">
            <svg viewBox="0 0 800 100" className="h-full w-full">
              {[100, 250, 400, 550, 700].map((x, i) => (
                <g key={i}>
                  <line x1={x} y1="0" x2="400" y2="100" stroke={C.secondary} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.35" />
                  <motion.circle
                    r="3" fill={C.secondary}
                    initial={{ cx: x, cy: 0 }}
                    animate={{ cx: [x, 400], cy: [0, 100] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeIn" }}
                  />
                </g>
              ))}
            </svg>
          </div>

          <div className="mx-auto -mt-2 flex max-w-md flex-col items-center gap-2 rounded-2xl bg-white p-5"
            style={{ border: `2px solid ${C.secondary}`, boxShadow: `0 20px 40px -20px ${C.secondary}60` }}>
            <div className="grid h-14 w-14 place-items-center rounded-xl" style={{ background: C.secondary, color: "white" }}>
              <Server className="h-7 w-7" />
            </div>
            <div className="text-sm font-bold" style={{ color: C.text }}>Terminal Operating System</div>
            <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>Central Authority</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ Section 2: Incident ============ */
function Section2Incident() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 4), 2600);
    return () => clearInterval(t);
  }, []);
  const offline = phase >= 1;
  return (
    <section className="relative overflow-hidden py-24" style={{ background: C.surface2 }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Failure Mode"
          tone="critical"
          title="When the Central System Stops Responding"
          subtitle="Inspired by real disruptions at Indian ports during major cyber incidents — when centralized systems became unavailable, operations had to fall back to manual coordination across every berth."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Cinematic panel */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl p-8 md:p-10"
            style={{ background: "#0F172A", boxShadow: "0 40px 80px -40px rgba(15,23,42,0.6)" }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/70">
                <span className={`h-2 w-2 rounded-full ${offline ? "bg-red-500 animate-pulse" : "bg-emerald-400"}`} />
                {offline ? "TOS OFFLINE" : "TOS ONLINE"}
              </div>
              <div className="text-[10px] font-mono text-white/40">terminal-2 · JNPA</div>
            </div>

            {/* Central TOS */}
            <div className="relative mx-auto grid h-64 place-items-center">
              <motion.div
                animate={offline ? {
                  boxShadow: ["0 0 0 0 rgba(198,40,40,0.6)", "0 0 0 40px rgba(198,40,40,0)"],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="grid h-24 w-24 place-items-center rounded-2xl"
                style={{ background: offline ? C.critical : C.secondary, color: "white" }}
              >
                <Server className="h-10 w-10" />
              </motion.div>

              {/* Assets around */}
              {[
                { a: 0, icon: Ship }, { a: 72, icon: Anchor }, { a: 144, icon: Truck },
                { a: 216, icon: ScanLine }, { a: 288, icon: Warehouse },
              ].map((n, i) => {
                const rad = (n.a * Math.PI) / 180;
                const x = Math.cos(rad) * 140, y = Math.sin(rad) * 90;
                return (
                  <motion.div key={i}
                    className="absolute grid h-10 w-10 place-items-center rounded-xl bg-white/10 backdrop-blur"
                    style={{ x, y, color: offline ? "#FCA5A5" : "#BFDBFE", border: `1px solid ${offline ? "#7F1D1D" : "#1E3A8A"}` }}
                    animate={offline ? { opacity: [1, 0.4, 1] } : {}}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
                  >
                    <n.icon className="h-4 w-4" />
                  </motion.div>
                );
              })}

              {/* Connection lines */}
              <svg className="pointer-events-none absolute inset-0" viewBox="-200 -150 400 300">
                {[0, 72, 144, 216, 288].map((a, i) => {
                  const rad = (a * Math.PI) / 180;
                  const x = Math.cos(rad) * 140, y = Math.sin(rad) * 90;
                  return (
                    <motion.line key={i} x1="0" y1="0" x2={x} y2={y}
                      stroke={offline ? "#7F1D1D" : "#3B82F6"}
                      strokeWidth="1.2" strokeDasharray="3 3"
                      animate={{ opacity: offline ? [0.15, 0.05, 0.15] : [0.35, 0.6, 0.35] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] font-mono text-white/60">
              <span>heartbeat:{" "}
                <span className={offline ? "text-red-400" : "text-emerald-400"}>
                  {offline ? "FAILED" : "OK · 42ms"}
                </span>
              </span>
              <span>ack rate:{" "}
                <span className={offline ? "text-red-400" : "text-emerald-400"}>{offline ? "0%" : "100%"}</span>
              </span>
            </div>
          </motion.div>

          {/* Metrics */}
          <div className="flex flex-col gap-4">
            {[
              { label: "Operations Throughput", value: offline ? "142 TEU/hr" : "342 TEU/hr", delta: offline ? "↓ 58%" : "steady", danger: offline, icon: Activity },
              { label: "Gate Queue Length", value: offline ? "48 trucks" : "6 trucks", delta: offline ? "↑ 700%" : "normal", danger: offline, icon: Truck },
              { label: "Coordination Signal", value: offline ? "Lost" : "Established", delta: offline ? "manual fallback" : "automatic", danger: offline, icon: Radio },
              { label: "Container Movement", value: offline ? "Slowing" : "Continuous", delta: offline ? "backlog forming" : "on-schedule", danger: offline, icon: ContainerIcon },
            ].map((m, i) => (
              <motion.div key={m.label}
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl bg-white p-4"
                style={{ border: `1px solid ${m.danger ? "#FCA5A5" : C.borderSoft}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>
                    <m.icon className="h-3.5 w-3.5" /> {m.label}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: m.danger ? C.critical : C.primary }}>{m.delta}</span>
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: m.danger ? C.critical : C.text }}>
                  {m.value}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ Section 3: Detection ============ */
function Section3Detection() {
  const steps = [
    { label: "Container Event", icon: ContainerIcon, ok: true },
    { label: "Sent to TOS", icon: RouteIcon, ok: true },
    { label: "Waiting for ACK…", icon: Timer, ok: true },
    { label: "No Response", icon: XCircle, ok: false },
    { label: "Heartbeat Failed", icon: AlertTriangle, ok: false },
    { label: "Health Check Failed", icon: ShieldAlert, ok: false },
    { label: "DACT Recovery Triggered", icon: Zap, ok: false, final: true },
  ];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [active, setActive] = useState(-1);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setActive(a => (a + 1) % (steps.length + 2)), 800);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <section className="relative py-24" style={{ background: C.surface }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Detection"
          tone="secondary"
          title="DACT Detects Failure Automatically"
          subtitle="Every edge node continuously watches the TOS. When acknowledgements time out and health checks fail in sequence, recovery is triggered — without human intervention."
        />
        <div ref={ref} className="mx-auto mt-16 grid max-w-5xl gap-3">
          {steps.map((s, i) => {
            const on = i <= active;
            return (
              <motion.div key={s.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: on ? 1 : 0.35, x: on ? 0 : -20 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-4 rounded-2xl bg-white p-4"
                style={{
                  border: `1px solid ${on ? (s.final ? C.accent : s.ok ? C.borderSoft : "#FCD9B4") : C.borderSoft}`,
                  boxShadow: on && s.final ? `0 20px 40px -20px ${C.accent}80` : "none",
                }}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold"
                  style={{ background: on ? (s.final ? C.accent : s.ok ? C.primary : C.warning) : C.surface2, color: on ? "white" : C.text3 }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <s.icon className="h-5 w-5 shrink-0" style={{ color: on ? (s.final ? C.accent : s.ok ? C.primary : C.warning) : C.text3 }} />
                <div className="flex-1 text-sm font-semibold" style={{ color: on ? C.text : C.text3 }}>{s.label}</div>
                {on && (
                  <div className="flex items-center gap-1.5">
                    {i > 0 && i < 4 && (
                      <motion.span initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                        className="text-[10px] font-mono" style={{ color: C.text3 }}>
                        packet · {12 + i * 8}ms
                      </motion.span>
                    )}
                    {s.final ? <Zap className="h-4 w-4" style={{ color: C.accent }} /> : s.ok ?
                      <CheckCircle2 className="h-4 w-4" style={{ color: C.primary }} /> :
                      <AlertTriangle className="h-4 w-4" style={{ color: C.warning }} />}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============ Section 4: Agent Activation ============ */
function Section4Activation() {
  return (
    <section className="relative py-24" style={{ background: C.surface2 }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Boundary of AI"
          tone="primary"
          title="The Agent Activates Only When It Is Needed"
          subtitle="DACT keeps AI out of the critical container path. Deterministic sync runs every event; the agent only wakes up when the TOS fails."
        />

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* Normal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-white p-8"
            style={{ border: `1px solid ${C.borderSoft}` }}
          >
            <div className="flex items-center justify-between">
              <Eyebrow tone="primary">Normal Operations</Eyebrow>
              <CheckCircle2 className="h-5 w-5" style={{ color: C.primary }} />
            </div>
            <div className="mt-6 space-y-3">
              {[
                { icon: ContainerIcon, label: "Container Event", color: C.text },
                { icon: Network, label: "Deterministic Mesh", color: C.primary },
                { icon: Server, label: "TOS", color: C.secondary },
              ].map((s, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: C.surface2 }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                    <span className="text-sm font-semibold" style={{ color: C.text }}>{s.label}</span>
                    <motion.div className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: C.primary }}
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }} />
                  </div>
                  {i < 2 && <div className="ml-6 h-3 w-px" style={{ background: C.border }} />}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
              style={{ background: "#E8F5E9", color: C.primaryDark }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.primary }} />
              Agent dormant · 0 tool calls
            </div>
          </motion.div>

          {/* Emergency */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8"
            style={{ background: "#FFF8ED", border: `1.5px solid ${C.accent}` }}
          >
            <div className="flex items-center justify-between">
              <Eyebrow tone="accent">Emergency Mode</Eyebrow>
              <Zap className="h-5 w-5" style={{ color: C.accent }} />
            </div>
            <div className="mt-6 space-y-3">
              {[
                { icon: XCircle, label: "TOS Offline", color: C.critical },
                { icon: Cpu, label: "Agent Activated", color: C.accent },
                { icon: Sparkles, label: "Recovery Planning", color: C.accent },
              ].map((s, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 rounded-xl bg-white p-3" style={{ border: `1px solid ${C.borderSoft}` }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                    <span className="text-sm font-semibold" style={{ color: C.text }}>{s.label}</span>
                    <motion.div className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: C.accent }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }} />
                  </div>
                  {i < 2 && <div className="ml-6 h-3 w-px" style={{ background: C.accent }} />}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: C.accent, color: "white" }}>
              Activated only after TOS health failures
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-10 max-w-4xl rounded-2xl bg-white p-6 text-center"
          style={{ border: `1px solid ${C.borderSoft}` }}
        >
          <p className="text-sm md:text-base" style={{ color: C.text }}>
            <span className="font-bold">The deterministic synchronization layer continues processing every container event in real time.</span>{" "}
            <span style={{ color: C.text2 }}>
              The orchestration agent is activated only after repeated TOS health check failures.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ Section 5: Coordinator Election ============ */
function Section5Election() {
  const nodes = [
    { id: "truck", label: "Truck", icon: Truck, x: 20, y: 25 },
    { id: "crane", label: "Crane", icon: Anchor, x: 80, y: 20 },
    { id: "gate", label: "Gate", icon: ScanLine, x: 15, y: 78 },
    { id: "warehouse", label: "Warehouse", icon: Warehouse, x: 85, y: 78 },
    { id: "ocr", label: "OCR Station", icon: Radar, x: 50, y: 8 },
  ];
  const leader = { id: "coord", label: "Zone Coordinator", x: 50, y: 50 };
  const tools = [
    "getNodeHealth()", "getZoneLoad()", "getConnectivity()",
    "getPacketLoss()", "getCoordinatorAvailability()",
  ];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setStep(s => Math.min(s + 1, tools.length + 1)), 700);
    return () => clearInterval(t);
  }, [inView]);

  const elected = step > tools.length;

  return (
    <section ref={ref} className="relative py-24" style={{ background: C.surface }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Autonomous Recovery"
          tone="primary"
          title="Electing a Temporary Zone Coordinator"
          subtitle="Instead of waiting for the TOS to recover, DACT temporarily promotes the healthiest edge node to coordinate the local operational zone."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Mesh */}
          <div className="relative aspect-[4/3] rounded-3xl p-6"
            style={{ background: C.surface2, border: `1px solid ${C.borderSoft}` }}>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {nodes.map((n, i) => (
                <motion.line key={i}
                  x1={leader.x} y1={leader.y} x2={n.x} y2={n.y}
                  stroke={elected ? C.primary : C.border}
                  strokeWidth="0.25" strokeDasharray="1 1"
                  animate={elected ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.35 }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </svg>

            {nodes.map((n) => (
              <div key={n.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-2"
                style={{ left: `${n.x}%`, top: `${n.y}%`, border: `1px solid ${C.borderSoft}` }}>
                <div className="flex items-center gap-2 px-1">
                  <n.icon className="h-3.5 w-3.5" style={{ color: C.secondary }} />
                  <span className="text-[10px] font-bold" style={{ color: C.text }}>{n.label}</span>
                </div>
              </div>
            ))}

            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl p-3"
              style={{
                left: `${leader.x}%`, top: `${leader.y}%`,
                background: elected ? C.primary : "white",
                color: elected ? "white" : C.text,
                border: `2px solid ${elected ? C.primary : C.border}`,
                boxShadow: elected ? `0 0 0 8px ${C.primary}20, 0 20px 40px -10px ${C.primary}80` : "none",
              }}
              animate={elected ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <div className="flex items-center gap-2 px-1">
                <Cpu className="h-4 w-4" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {elected ? "Temporary" : "Awaiting"}
                  </span>
                  <span className="text-xs font-bold">Zone Coordinator</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tool calls */}
          <div className="rounded-3xl bg-white p-6" style={{ border: `1px solid ${C.borderSoft}` }}>
            <div className="mb-4 flex items-center justify-between">
              <Eyebrow tone="secondary">Agent Reasoning</Eyebrow>
              <span className="text-[10px] font-mono" style={{ color: C.text3 }}>agent.plan_recovery()</span>
            </div>
            <div className="space-y-2">
              {tools.map((t, i) => {
                const done = step > i;
                return (
                  <motion.div key={t}
                    initial={{ opacity: 0 }} animate={{ opacity: done ? 1 : 0.35 }}
                    className="flex items-center justify-between rounded-xl p-3 font-mono text-xs"
                    style={{ background: done ? "#E8F5E9" : C.surface2, color: done ? C.primaryDark : C.text2 }}>
                    <span>→ {t}</span>
                    {done ? <CheckCircle2 className="h-4 w-4" style={{ color: C.primary }} /> :
                      <div className="h-3 w-3 rounded-full border-2" style={{ borderColor: C.border, borderTopColor: C.secondary }} />}
                  </motion.div>
                );
              })}
            </div>
            <AnimatePresence>
              {elected && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-xl p-4"
                  style={{ background: C.primary, color: "white" }}>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-80">
                    <Sparkles className="h-3 w-3" /> Election Complete
                  </div>
                  <div className="mt-1 text-sm font-semibold">Warehouse-Node-04 promoted to Zone Coordinator</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ Section 6: Operations Continue ============ */
function Section6Continue() {
  return (
    <section className="relative overflow-hidden py-24" style={{ background: C.surface2 }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Continuity"
          tone="primary"
          title="The Port Never Stops"
          subtitle="With a temporary coordinator in place, every asset keeps working. No queues, no manual coordination, no downtime."
        />

        {/* Movement strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 overflow-hidden rounded-3xl bg-white p-6"
          style={{ border: `1px solid ${C.borderSoft}` }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: C.primary }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.text2 }}>Live Yard</span>
            </div>
            <span className="text-[11px] font-mono" style={{ color: C.text3 }}>coordinator: warehouse-04 · tos: offline</span>
          </div>
          <div className="relative h-32 overflow-hidden rounded-2xl" style={{ background: C.surface2 }}>
            {/* road */}
            <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: C.border }} />
            {/* moving trucks */}
            {[0, 1, 2, 3].map(i => (
              <motion.div key={`t${i}`}
                className="absolute -translate-y-1/2"
                style={{ top: "38%" }}
                initial={{ x: "-10%" }} animate={{ x: "110%" }}
                transition={{ duration: 8, delay: i * 2, repeat: Infinity, ease: "linear" }}
              >
                <Truck className="h-6 w-6" style={{ color: C.secondary }} />
              </motion.div>
            ))}
            {/* containers moving */}
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div key={`c${i}`}
                className="absolute h-4 w-8 rounded"
                style={{
                  top: "70%",
                  background: [C.primary, C.secondary, C.accent, C.primary, C.secondary][i],
                }}
                initial={{ x: "110%" }} animate={{ x: "-15%" }}
                transition={{ duration: 12, delay: i * 2.4, repeat: Infinity, ease: "linear" }}
              />
            ))}
            {/* crane arm */}
            <motion.div
              className="absolute left-8 top-2 h-14 w-1"
              style={{ background: C.text2 }}
              animate={{ rotate: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              
            />
          </div>
        </motion.div>

        {/* Comparison */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8"
            style={{ background: "#FEF2F2", border: `1px solid #FECACA` }}
          >
            <Eyebrow tone="critical">Without DACT</Eyebrow>
            <ul className="mt-6 space-y-3">
              {["Operations Paused", "Manual Coordination", "Queue Growth"].map(t => (
                <li key={t} className="flex items-center gap-3 text-sm font-semibold" style={{ color: C.text }}>
                  <XCircle className="h-4 w-4" style={{ color: C.critical }} /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8"
            style={{ background: "#E8F5E9", border: `1px solid ${C.primary}` }}
          >
            <Eyebrow tone="primary">With DACT</Eyebrow>
            <ul className="mt-6 space-y-3">
              {["Continuous Operations", "Local Coordination", "Zero Operational Downtime"].map(t => (
                <li key={t} className="flex items-center gap-3 text-sm font-semibold" style={{ color: C.text }}>
                  <CheckCircle2 className="h-4 w-4" style={{ color: C.primary }} /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============ Section 7: TOS Recovery ============ */
function Section7Recovery() {
  const steps = [
    { icon: Activity, label: "Heartbeat" },
    { icon: CheckCircle2, label: "ACK Received" },
    { icon: Server, label: "TOS Online" },
    { icon: Cpu, label: "Coordinator Steps Down" },
    { icon: GitBranch, label: "Event History Synced" },
    { icon: Rocket, label: "Control Returned to TOS" },
  ];
  return (
    <section className="relative py-24" style={{ background: C.surface }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Handback"
          tone="secondary"
          title="Graceful Return to Normal"
          subtitle="When the TOS heartbeat returns, the temporary coordinator steps down, replays the local event history and hands full control back — with zero manual intervention."
        />
        <div className="relative mx-auto mt-16 max-w-6xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            {steps.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl bg-white p-4 text-center"
                style={{ border: `1px solid ${C.borderSoft}` }}
              >
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl"
                  style={{ background: `${C.primary}12`, color: C.primary }}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-xs font-bold" style={{ color: C.text }}>{s.label}</div>
                <div className="mt-1 font-mono text-[10px]" style={{ color: C.text3 }}>step {i + 1}</div>
                {i < steps.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 md:block" style={{ color: C.border }} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ Section 8: Why an Agent? ============ */
function Section8WhyAgent() {
  return (
    <section className="relative py-24" style={{ background: C.surface2 }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Design Rationale"
          tone="accent"
          title="Why an Agent, Not a Rule Engine"
          subtitle="Rule engines assume the failure modes you already know. Real terminals fail in ways nobody planned for."
        />

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-white p-8"
            style={{ border: `1px solid ${C.borderSoft}` }}
          >
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: C.text3 }}>Traditional</div>
            <div className="mt-1 text-xl font-bold" style={{ color: C.text }}>Rule Engine</div>
            <ul className="mt-6 space-y-3">
              {["Static Rules", "Fixed Conditions", "Limited Adaptability", "Single Variable Decisions"].map(t => (
                <li key={t} className="flex items-center gap-3 text-sm" style={{ color: C.text2 }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.text3 }} /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8"
            style={{
              background: `linear-gradient(135deg, ${C.secondaryDark}, ${C.primary})`,
              color: "white",
              boxShadow: `0 30px 60px -30px ${C.secondaryDark}80`,
            }}
          >
            <div className="text-xs font-bold uppercase tracking-widest opacity-80">DACT</div>
            <div className="mt-1 text-xl font-bold">Autonomous Agent</div>
            <ul className="mt-6 space-y-3">
              {[
                "Triggered only during emergencies",
                "Collects live operational metrics",
                "Evaluates node health",
                "Elects temporary coordinators",
                "Coordinates distributed recovery",
                "Returns control automatically",
              ].map(t => (
                <li key={t} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-12 max-w-4xl rounded-3xl p-8 text-center"
          style={{ background: "white", border: `2px dashed ${C.accent}` }}
        >
          <p className="text-xl font-bold md:text-2xl" style={{ color: C.text }}>
            Correctness remains{" "}
            <span style={{ color: C.primary }}>deterministic</span>. Recovery becomes{" "}
            <span style={{ color: C.accent }}>autonomous</span>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ Section 9: Live Architecture ============ */
function Section9Architecture() {
  const [offline, setOffline] = useState(false);
  const layers = [
    { label: "OCR / RFID Detection", icon: ScanLine, tone: C.secondary },
    { label: "DACT Edge Node", icon: Cpu, tone: C.secondary },
    { label: "Local Event Ledger", icon: Layers, tone: C.secondary },
    { label: "Deterministic Sync Engine", icon: Network, tone: C.primary },
    { label: "libp2p Mesh", icon: Radio, tone: C.primary },
    { label: "Peer Nodes", icon: GitBranch, tone: C.primary },
  ];
  return (
    <section className="relative py-24" style={{ background: C.surface }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Live Architecture"
          tone="secondary"
          title="Every Container, Every Path"
          subtitle="Toggle the TOS offline and watch the architecture reroute through the temporary coordinator — the deterministic sync layer never pauses."
        />

        <div className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-3">
          <span className="text-xs font-semibold" style={{ color: C.text2 }}>TOS ONLINE</span>
          <button
            onClick={() => setOffline(v => !v)}
            className="relative h-8 w-16 rounded-full transition"
            style={{ background: offline ? C.accent : C.primary }}
          >
            <motion.div
              className="absolute top-1 h-6 w-6 rounded-full bg-white shadow"
              animate={{ x: offline ? 34 : 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </button>
          <span className="text-xs font-semibold" style={{ color: offline ? C.accent : C.text3 }}>SIMULATE TOS OFFLINE</span>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-3">
          {layers.map((l, i) => (
            <motion.div key={l.label}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="relative flex items-center gap-4 rounded-2xl bg-white p-4"
              style={{ border: `1px solid ${C.borderSoft}` }}
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${l.tone}12`, color: l.tone }}>
                <l.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 text-sm font-semibold" style={{ color: C.text }}>{l.label}</div>
              <motion.div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ background: C.surface2 }}>
                <motion.div className="h-full w-1/3" style={{ background: l.tone }}
                  animate={{ x: ["-100%", "300%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
              </motion.div>
              <span className="font-mono text-[10px]" style={{ color: C.text3 }}>layer {i + 1}</span>
            </motion.div>
          ))}

          {/* Branch: coordinator vs TOS */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <motion.div className="flex items-center gap-4 rounded-2xl p-4"
              animate={{ opacity: offline ? 1 : 0.5, scale: offline ? 1 : 0.98 }}
              style={{
                background: offline ? C.accent : "white",
                color: offline ? "white" : C.text,
                border: `1px solid ${offline ? C.accent : C.borderSoft}`,
                boxShadow: offline ? `0 20px 40px -20px ${C.accent}80` : "none",
              }}>
              <Cpu className="h-5 w-5" />
              <div className="flex-1">
                <div className="text-sm font-bold">Temporary Zone Coordinator</div>
                <div className="text-[10px] font-mono opacity-70">emergency path</div>
              </div>
              {offline && <Zap className="h-4 w-4" />}
            </motion.div>
            <motion.div className="flex items-center gap-4 rounded-2xl p-4"
              animate={{ opacity: offline ? 0.4 : 1 }}
              style={{
                background: offline ? "white" : C.secondary,
                color: offline ? C.text3 : "white",
                border: `1px solid ${offline ? C.borderSoft : C.secondary}`,
              }}>
              <Server className="h-5 w-5" />
              <div className="flex-1">
                <div className="text-sm font-bold">Terminal Operating System</div>
                <div className="text-[10px] font-mono opacity-70">{offline ? "unavailable" : "primary path"}</div>
              </div>
              {!offline && <CheckCircle2 className="h-4 w-4" />}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ Section 10: Demo CTA ============ */
function Section10DemoCTA() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[32px] p-10 md:p-16"
          style={{
            background: `linear-gradient(135deg, #0F172A 0%, ${C.secondaryDark} 100%)`,
            boxShadow: "0 60px 120px -40px rgba(15,23,42,0.6)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 20%, rgba(46,125,50,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(21,101,192,0.5), transparent 40%)",
            }} />
          <div className="relative text-center">
            <Eyebrow tone="secondary">Interactive Demo</Eyebrow>
            <h2 className="mt-4 text-4xl font-bold text-white md:text-6xl">Experience DACT Live</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
              Inject a real-world operational incident and watch DACT keep the terminal running — end-to-end, in your browser.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a href="/app" className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                style={{ background: C.primary, boxShadow: `0 20px 40px -12px ${C.primary}80` }}>
                <Rocket className="h-4 w-4" /> Launch Mission Control
              </a>
              <a href="/app/incidents" className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                style={{ background: C.accent, boxShadow: `0 20px 40px -12px ${C.accent}80` }}>
                <Zap className="h-4 w-4" /> Simulate TOS Failure
              </a>
              <a href="/app/replay" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
                <RefreshCw className="h-4 w-4" /> Replay Recovery
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ Section 11: Latency Pipeline ============ */
function LatencyStage({ label, ms, tone = C.primary, delay = 0 }: { label: string; ms: string; tone?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay }}
      className="relative flex-1 rounded-2xl bg-white p-4 text-center"
      style={{ border: `1px solid ${C.borderSoft}` }}
    >
      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.text2 }}>{label}</div>
      <div className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{ background: `${tone}15`, color: tone }}>
        <span className="h-1 w-1 rounded-full" style={{ background: tone }} /> {ms}
      </div>
    </motion.div>
  );
}

function Section11Latency() {
  const critical = [
    ["OCR / RFID Detection", "5–20 ms"],
    ["Create Local Event", "<1 ms"],
    ["Vector Clock Update", "1–3 ms"],
    ["Local Event Ledger", "<1 ms"],
    ["libp2p Mesh Broadcast", "5–30 ms"],
    ["Neighbor Sync", "2–5 ms"],
    ["Operation Completed", "≈15–50 ms"],
  ] as const;
  const emergency = [
    ["Heartbeat Detection", "2–5 sec"],
    ["Metric Aggregation", "50–100 ms"],
    ["Local SLM Reasoning", "300–700 ms"],
    ["Tool Execution", "20–50 ms"],
    ["Coordinator Election", "20–40 ms"],
    ["Total Recovery Decision", "400–900 ms"],
  ] as const;

  return (
    <section className="relative py-24" style={{ background: C.surface2 }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Engineering Targets"
          tone="primary"
          title="Real-Time Performance Architecture"
          subtitle="Every operation inside DACT is designed to remain deterministic and ultra-low latency. AI is intentionally kept outside the critical execution path."
        />

        {/* Critical pipeline */}
        <div className="mt-14 rounded-3xl bg-white p-6 md:p-8" style={{ border: `1px solid ${C.borderSoft}` }}>
          <div className="mb-4 flex items-center justify-between">
            <Eyebrow tone="primary">Critical Path · Deterministic</Eyebrow>
            <span className="text-[11px] font-mono" style={{ color: C.text3 }}>end-to-end ≈ 15–50 ms</span>
          </div>
          <div className="relative flex flex-col gap-3 md:flex-row md:items-stretch">
            {critical.map(([l, ms], i) => (
              <LatencyStage key={l} label={l} ms={ms} tone={C.primary} delay={i * 0.08} />
            ))}
            {/* animated packet */}
            <motion.div className="pointer-events-none absolute -bottom-2 h-1.5 w-1.5 rounded-full md:block"
              style={{ background: C.primary, boxShadow: `0 0 12px ${C.primary}` }}
              animate={{ left: ["0%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          </div>
        </div>

        {/* Emergency pipeline */}
        <div className="mt-8 rounded-3xl p-6 md:p-8" style={{ background: "#FFF3E0", border: `1.5px solid ${C.accent}` }}>
          <div className="mb-4 flex items-center justify-between">
            <Eyebrow tone="accent">Emergency Recovery Path · Autonomous</Eyebrow>
            <span className="text-[11px] font-mono" style={{ color: C.text2 }}>total ≈ 400–900 ms</span>
          </div>
          <div className="relative flex flex-col gap-3 md:flex-row">
            {emergency.map(([l, ms], i) => (
              <LatencyStage key={l} label={l} ms={ms} tone={C.accent} delay={i * 0.08} />
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-white p-5" style={{ border: `1px solid ${C.borderSoft}` }}>
            <p className="text-sm" style={{ color: C.text }}>
              <span className="font-bold">This latency does not affect container movement.</span>{" "}
              <span style={{ color: C.text2 }}>
                The deterministic synchronization layer continues processing container events throughout the recovery process. The agent only decides how the distributed system should recover after the TOS becomes unavailable.
              </span>
            </p>
          </div>
        </div>

        {/* Side-by-side badges */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl bg-white p-6" style={{ border: `1px solid ${C.borderSoft}` }}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: C.text2 }}>Normal Container Event</div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#E8F5E9", color: C.primary }}>
                Critical Path
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}>
              OCR <ArrowRight className="h-3 w-3" style={{ color: C.text3 }} /> Mesh Sync <ArrowRight className="h-3 w-3" style={{ color: C.text3 }} /> Completed
            </div>
            <div className="mt-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" style={{ color: C.primary }} />
              <span className="font-mono text-sm" style={{ color: C.primaryDark }}>≈ 15–50 ms</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl p-6" style={{ background: "#FFF8ED", border: `1px solid ${C.accent}` }}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: C.text2 }}>Emergency Recovery</div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: C.accent, color: "white" }}>
                Background Recovery
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}>
              TOS Failure <ArrowRight className="h-3 w-3" style={{ color: C.text3 }} /> Agent <ArrowRight className="h-3 w-3" style={{ color: C.text3 }} /> Election
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: C.accent }} />
              <span className="font-mono text-sm" style={{ color: C.accent }}>≈ 400–900 ms</span>
            </div>
          </motion.div>
        </div>

        {/* Comparison table */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-8 overflow-hidden rounded-3xl bg-white" style={{ border: `1px solid ${C.borderSoft}` }}>
          <div className="grid grid-cols-2 border-b text-xs font-bold uppercase tracking-widest"
            style={{ borderColor: C.borderSoft, color: C.text2 }}>
            <div className="p-4">Traditional Centralized Port</div>
            <div className="p-4" style={{ background: "#E8F5E9", color: C.primaryDark }}>DACT</div>
          </div>
          {[
            ["Wait for TOS Recovery", "Local Operations Continue"],
            ["Manual Supervisor Intervention", "Autonomous Temporary Coordinator"],
            ["Operations Delayed", "Operations Continue"],
            ["Single Point of Failure", "Distributed Mesh Coordination"],
            ["Central Recovery Only", "Edge Recovery + Automatic Handover"],
          ].map(([a, b], i) => (
            <div key={i} className="grid grid-cols-2 border-b text-sm last:border-b-0"
              style={{ borderColor: C.borderSoft }}>
              <div className="flex items-center gap-2 p-4" style={{ color: C.text2 }}>
                <XCircle className="h-4 w-4" style={{ color: C.critical }} /> {a}
              </div>
              <div className="flex items-center gap-2 p-4" style={{ color: C.text, background: "#F1F8F2" }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: C.primary }} /> {b}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Principle */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mx-auto mt-10 max-w-4xl rounded-3xl p-8 text-center"
          style={{ background: `linear-gradient(135deg, ${C.primaryDark}, ${C.secondary})`, color: "white" }}>
          <div className="text-[11px] font-bold uppercase tracking-widest opacity-80">Engineering Principle</div>
          <p className="mt-3 text-lg font-semibold md:text-xl leading-relaxed">
            Correctness is always deterministic <span className="font-mono opacity-90">(≈15–50 ms)</span>.<br />
            Recovery orchestration is autonomous <span className="font-mono opacity-90">(≈400–900 ms)</span> and only activates during TOS failures.<br />
            <span className="text-white/80">Container movement never waits for AI.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ Public export ============ */
export function LandingStory() {
  return (
    <>
      <Section1Problem />
      <Section2Incident />
      <Section3Detection />
      <Section4Activation />
      <Section5Election />
      <Section6Continue />
      <Section7Recovery />
      <Section8WhyAgent />
      <Section9Architecture />
      <Section11Latency />
      <Section10DemoCTA />
    </>
  );
}
