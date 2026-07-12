import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Play,
  Cpu,
  Radio,
  Boxes,
  Truck,
  Warehouse,
  Container,
  ScanLine,
  Network,
  ShieldCheck,
  Activity,
  Server,
  Brain,
  Layers,
  CheckCircle2,
  Ship,
  Anchor,
  Gauge,
  LineChart,
  Route as RouteIcon,
  Radar,
  ChevronRight,
  Signal,
  Zap,
} from "lucide-react";
import logoAsset from "../assets/dact_logo.png.asset.json";
import { LandingStory } from "../app/landing-story";

export const Route = createFileRoute("/")({
  component: Landing,
});

/* ---------- Design tokens ---------- */
const C = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surface2: "#F1F5F9",
  border: "#CBD5E1",
  borderSoft: "#E2E8F0",
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  secondary: "#1565C0",
  secondaryDark: "#0D47A1",
  accent: "#F57C00",
  warning: "#F9A825",
  critical: "#C62828",
  text: "#1E293B",
  text2: "#64748B",
  text3: "#94A3B8",
};

/* ---------- Primitives ---------- */

function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl bg-white ${className}`}
      style={{
        border: `1px solid ${C.borderSoft}`,
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, tone = "secondary" }: { children: React.ReactNode; tone?: "primary" | "secondary" | "accent" }) {
  const map = {
    primary: { bg: "#E8F5E9", fg: C.primary },
    secondary: { bg: "#E3F2FD", fg: C.secondary },
    accent: { bg: "#FFF3E0", fg: C.accent },
  }[tone];
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
      style={{ background: map.bg, color: map.fg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: map.fg }}
      />
      {children}
    </div>
  );
}

function BtnPrimary({ children, href = "#" }: { children: React.ReactNode; href?: string }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
      style={{
        background: C.primary,
        boxShadow: "0 8px 20px -8px rgba(46,125,50,0.55)",
      }}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </a>
  );
}

function BtnSecondary({ children, href = "#" }: { children: React.ReactNode; href?: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold transition hover:bg-slate-50"
      style={{ color: C.secondary, border: `1.5px solid ${C.secondary}` }}
    >
      {children}
    </a>
  );
}

/* ---------- NAV ---------- */

function Nav() {
  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto mt-4 max-w-7xl px-4">
        <div
          className="flex items-center justify-between rounded-2xl bg-white/85 px-5 py-3 backdrop-blur-xl"
          style={{
            border: `1px solid ${C.borderSoft}`,
            boxShadow: "0 4px 20px -8px rgba(15,23,42,0.08)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <img src={logoAsset.url} alt="DACT" className="h-9 w-9 rounded-xl object-cover" />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight" style={{ color: C.text }}>DACT</span>
              <span className="text-[10px] font-medium" style={{ color: C.text2 }}>Port Intelligence</span>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: C.text2 }}>
            <a href="#platform" className="hover:text-slate-900">Platform</a>
            <a href="#solution" className="hover:text-slate-900">Solution</a>
            <a href="#tech" className="hover:text-slate-900">Technology</a>
            <a href="#demo" className="hover:text-slate-900">Live Twin</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/app"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold sm:inline-flex"
              style={{ color: C.secondary, border: `1.5px solid ${C.borderSoft}` }}
            >
              Request Demo
            </Link>
            <Link
              to="/app"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: C.primary }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- SMART PORT DIGITAL TWIN (SVG scene) ---------- */

function PortTwin() {
  // Viewbox 800x560
  // Nodes
  const nodes = [
    { id: "ship", x: 90, y: 170, label: "Cargo Ship", icon: Ship },
    { id: "crane", x: 230, y: 200, label: "Quay Crane", icon: Boxes },
    { id: "yard", x: 410, y: 300, label: "Container Yard", icon: Container },
    { id: "warehouse", x: 640, y: 200, label: "Warehouse", icon: Warehouse },
    { id: "gate", x: 700, y: 400, label: "Smart Gate", icon: ScanLine },
  ];
  const [hover, setHover] = useState<string | null>(null);
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const links: [string, string][] = [
    ["ship", "crane"],
    ["crane", "yard"],
    ["yard", "warehouse"],
    ["yard", "gate"],
    ["warehouse", "gate"],
    ["crane", "warehouse"],
  ];

  return (
    <div className="relative aspect-[8/5.6] w-full">
      {/* Background panel */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)",
          border: `1px solid ${C.borderSoft}`,
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04), 0 24px 60px -30px rgba(21,101,192,0.25)",
        }}
      />

      {/* Header chips */}
      <div className="absolute left-5 top-5 z-10 flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold"
          style={{ color: C.primary, border: `1px solid #C8E6C9` }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: C.primary }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: C.primary }} />
          </span>
          Digital Twin · Live
        </div>
        <div
          className="hidden items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold sm:flex"
          style={{ color: C.secondary, border: `1px solid #BBDEFB` }}
        >
          <Signal className="h-3 w-3" /> Mesh 6 nodes
        </div>
      </div>
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
        <div
          className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold tabular-nums"
          style={{ color: C.text2, border: `1px solid ${C.borderSoft}` }}
        >
          PORT-01 · Rotterdam
        </div>
      </div>

      <svg viewBox="0 0 800 560" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="water" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#DBEAFE" />
            <stop offset="1" stopColor="#BFDBFE" />
          </linearGradient>
          <linearGradient id="quay" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#F1F5F9" />
            <stop offset="1" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="meshLine" x1="0" x2="1">
            <stop offset="0" stopColor={C.secondary} stopOpacity="0.8" />
            <stop offset="1" stopColor={C.primary} stopOpacity="0.8" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.08" />
          </filter>
          <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#CBD5E1" opacity="0.5" />
          </pattern>
        </defs>

        {/* Background dot grid */}
        <rect width="800" height="560" fill="url(#dots)" opacity="0.5" />

        {/* Sea */}
        <path d="M0 260 Q 200 240 400 260 T 800 260 L 800 0 L 0 0 Z" fill="url(#water)" opacity="0.55" />
        {/* animated wave */}
        <motion.path
          d="M0 258 Q 100 250 200 258 T 400 258 T 600 258 T 800 258"
          stroke="#93C5FD"
          strokeWidth="1"
          fill="none"
          opacity="0.7"
          animate={{ d: [
            "M0 258 Q 100 250 200 258 T 400 258 T 600 258 T 800 258",
            "M0 258 Q 100 266 200 258 T 400 258 T 600 258 T 800 258",
            "M0 258 Q 100 250 200 258 T 400 258 T 600 258 T 800 258",
          ] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Quay */}
        <rect x="0" y="260" width="800" height="20" fill="url(#quay)" />
        <line x1="0" y1="280" x2="800" y2="280" stroke={C.border} strokeWidth="1" />

        {/* Ground / yard */}
        <rect x="0" y="280" width="800" height="280" fill="#F8FAFC" />

        {/* Yard grid slots */}
        <g opacity="0.9">
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => (
              <rect
                key={`${r}-${c}`}
                x={310 + c * 26}
                y={320 + r * 20}
                width="22"
                height="14"
                rx="2"
                fill="#FFFFFF"
                stroke={C.borderSoft}
              />
            ))
          )}
        </g>

        {/* Cargo ship */}
        <g transform="translate(30, 180)">
          <motion.g
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* hull */}
            <path
              d="M0 40 L160 40 L145 65 L15 65 Z"
              fill="#1E293B"
            />
            <rect x="20" y="20" width="80" height="22" fill="#334155" />
            <rect x="105" y="10" width="45" height="32" fill="#475569" />
            <rect x="118" y="18" width="8" height="8" fill="#F8FAFC" />
            <rect x="132" y="18" width="8" height="8" fill="#F8FAFC" />
            {/* stacked containers on deck */}
            {[
              { x: 24, y: 8, c: C.primary },
              { x: 46, y: 8, c: C.secondary },
              { x: 68, y: 8, c: C.accent },
              { x: 24, y: -6, c: C.secondary },
              { x: 46, y: -6, c: C.primary },
            ].map((b, i) => (
              <rect key={i} x={b.x} y={b.y} width="20" height="12" fill={b.c} stroke="#0F172A" strokeOpacity="0.2" />
            ))}
          </motion.g>
        </g>

        {/* Quay crane */}
        <g transform="translate(200, 120)">
          {/* legs */}
          <line x1="10" y1="30" x2="10" y2="160" stroke="#475569" strokeWidth="4" />
          <line x1="120" y1="30" x2="120" y2="160" stroke="#475569" strokeWidth="4" />
          {/* boom (rotates) */}
          <motion.g
            style={{ originX: "65px", originY: "30px" }}
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect x="-30" y="26" width="190" height="8" fill="#334155" />
            {/* trolley + cable */}
            <motion.g
              animate={{ x: [0, 60, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <rect x="-10" y="30" width="20" height="6" fill="#1E293B" />
              <line x1="0" y1="36" x2="0" y2="70" stroke="#64748B" strokeWidth="1" />
              <motion.rect
                x="-10"
                y="70"
                width="20"
                height="12"
                fill={C.accent}
                animate={{ y: [70, 90, 70] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>
          </motion.g>
          {/* cabin */}
          <rect x="55" y="40" width="22" height="14" fill="#F8FAFC" stroke="#475569" />
        </g>

        {/* Warehouse */}
        <g transform="translate(600, 300)">
          <rect x="0" y="0" width="150" height="80" fill="#FFFFFF" stroke={C.border} filter="url(#softShadow)" />
          <path d="M0 0 L75 -20 L150 0 Z" fill="#CBD5E1" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={10 + i * 35} y="50" width="25" height="30" fill={C.surface2} stroke={C.borderSoft} />
          ))}
          <text x="75" y="70" textAnchor="middle" fontSize="9" fontWeight="700" fill={C.text2}>WAREHOUSE</text>
        </g>

        {/* Smart gate */}
        <g transform="translate(660, 430)">
          <rect x="0" y="0" width="80" height="60" fill="#FFFFFF" stroke={C.border} filter="url(#softShadow)" />
          <rect x="10" y="10" width="60" height="18" fill={C.secondary} opacity="0.15" />
          <ScanLineSvg x={30} y={12} />
          <text x="40" y="50" textAnchor="middle" fontSize="9" fontWeight="700" fill={C.text2}>SMART GATE</text>
        </g>

        {/* Road */}
        <path
          d="M280 340 L280 460 L 660 460"
          stroke="#CBD5E1"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M280 340 L280 460 L 660 460"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeDasharray="6 8"
          fill="none"
        />

        {/* Terminal truck moving between yard and gate */}
        <motion.g
          animate={{
            offsetDistance: ["0%", "100%", "0%"],
          }}
          style={{
            offsetPath: "path('M280 340 L280 460 L 660 460')",
            offsetRotate: "0deg",
          } as React.CSSProperties}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <g transform="translate(-16,-8)">
            <rect x="0" y="0" width="20" height="12" rx="2" fill={C.secondary} />
            <rect x="20" y="2" width="12" height="10" rx="1" fill="#1E293B" />
            <circle cx="6" cy="14" r="2.5" fill="#0F172A" />
            <circle cx="16" cy="14" r="2.5" fill="#0F172A" />
            <circle cx="26" cy="14" r="2.5" fill="#0F172A" />
          </g>
        </motion.g>

        {/* Yard: containers with subtle movement */}
        {[
          { x: 316, y: 306, c: C.primary },
          { x: 344, y: 306, c: C.secondary },
          { x: 372, y: 306, c: C.accent },
          { x: 400, y: 306, c: C.primary },
          { x: 428, y: 306, c: C.secondary },
        ].map((b, i) => (
          <motion.rect
            key={i}
            x={b.x}
            y={b.y}
            width="24"
            height="12"
            fill={b.c}
            stroke="#0F172A"
            strokeOpacity="0.15"
            animate={{ y: [b.y, b.y - 2, b.y] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* Container transfer animation (from crane -> yard) */}
        <motion.rect
          width="22"
          height="12"
          rx="1.5"
          fill={C.primary}
          stroke="#0F172A"
          strokeOpacity="0.2"
          animate={{
            x: [220, 260, 320, 380],
            y: [190, 260, 300, 306],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* MESH LINKS between logical nodes */}
        {links.map(([a, b], i) => {
          const na = nodeById[a];
          const nb = nodeById[b];
          return (
            <g key={`${a}-${b}`}>
              <line
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke="url(#meshLine)"
                strokeWidth="1.2"
                opacity="0.35"
                strokeDasharray="2 4"
              />
              <motion.line
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={C.secondary}
                strokeWidth="1.5"
                strokeDasharray="4 10"
                opacity="0.7"
                animate={{ strokeDashoffset: [0, -28] }}
                transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "linear" }}
              />
              {/* Pulse packet */}
              <motion.circle
                r="3"
                fill={C.primary}
                animate={{
                  cx: [na.x, nb.x],
                  cy: [na.y, nb.y],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              />
            </g>
          );
        })}
      </svg>

      {/* Node chips (HTML overlays with Pi icons) */}
      {nodes.map((n, i) => {
        const Icon = n.icon;
        const active = hover === n.id;
        return (
          <div
            key={n.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(n.x / 800) * 100}%`, top: `${(n.y / 560) * 100}%` }}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
          >
            <motion.div
              className="relative grid cursor-pointer place-items-center rounded-xl bg-white"
              style={{
                width: 44,
                height: 44,
                border: `1.5px solid ${active ? C.primary : C.borderSoft}`,
                boxShadow: active
                  ? "0 10px 24px -8px rgba(46,125,50,0.35)"
                  : "0 4px 12px -4px rgba(15,23,42,0.12)",
              }}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon className="h-5 w-5" style={{ color: C.secondary }} strokeWidth={1.8} />
              {/* Raspberry Pi indicator */}
              <span
                className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-md"
                style={{ background: C.primary }}
                title="Raspberry Pi edge node"
              >
                <Cpu className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
              </span>
              {/* Comm pulse when hovered */}
              {active && (
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{ border: `2px solid ${C.primary}` }}
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </motion.div>
            <div
              className="mt-1.5 whitespace-nowrap text-center text-[10px] font-semibold"
              style={{ color: active ? C.text : C.text2 }}
            >
              {n.label}
            </div>
          </div>
        );
      })}

      {/* Footer stats */}
      <div className="absolute bottom-4 left-5 right-5 z-10 flex items-center justify-between text-[10px] font-medium" style={{ color: C.text2 }}>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: C.primary }} /> Container move</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: C.secondary }} /> Mesh pulse</span>
        </div>
        <span className="tabular-nums">Throughput 342 TEU/hr · Latency 42 ms</span>
      </div>
    </div>
  );
}

function ScanLineSvg({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 20}, ${y})`}>
      <rect x="0" y="0" width="40" height="14" fill="#FFFFFF" stroke={C.border} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={4 + i * 6} y="2" width="2" height="10" fill={C.text} />
      ))}
    </g>
  );
}

/* ---------- HERO ---------- */

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)" }}>
      {/* subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(203,213,225,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(203,213,225,.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <Eyebrow tone="secondary">DACT · Enterprise Port Intelligence</Eyebrow>
          <h1
            className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl"
            style={{ color: C.text }}
          >
            AI-powered decentralized container logistics for modern ports.
          </h1>
          <p className="mt-6 max-w-xl text-lg" style={{ color: C.text2 }}>
            DACT unifies terminals, vessels and inland networks into a single
            resilient mesh — so cargo keeps moving, even when the central
            network doesn't.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <BtnPrimary href="#solution">Explore the Platform</BtnPrimary>
            <BtnSecondary href="#demo">
              <Play className="h-4 w-4" /> Watch Live Twin
            </BtnSecondary>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t pt-6" style={{ borderColor: C.borderSoft }}>
            {[
              { k: "99.99%", v: "Operational uptime" },
              { k: "42 ms", v: "Edge decision latency" },
              { k: "6.4×", v: "Faster gate clearance" },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-2xl font-bold tabular-nums" style={{ color: C.text }}>{s.k}</div>
                <div className="mt-1 text-xs font-medium" style={{ color: C.text2 }}>{s.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium" style={{ color: C.text3 }}>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" style={{ color: C.primary }} /> ISO 27001 posture</span>
            <span className="inline-flex items-center gap-1.5"><Cpu className="h-4 w-4" style={{ color: C.primary }} /> Edge AI at every asset</span>
            <span className="inline-flex items-center gap-1.5"><Radio className="h-4 w-4" style={{ color: C.primary }} /> Autonomous mesh</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }}>
          <PortTwin />
        </motion.div>
      </div>

      {/* Logo strip */}
      <div className="relative mx-auto mt-20 max-w-6xl px-6">
        <div className="text-center text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: C.text3 }}>
          Modeled on operations at leading global terminals
        </div>
        <div className="mt-6 grid grid-cols-2 items-center gap-8 opacity-80 sm:grid-cols-3 md:grid-cols-6">
          {["Rotterdam", "Hamburg", "Singapore", "Antwerp", "Los Angeles", "Jebel Ali"].map((n) => (
            <div key={n} className="text-center text-sm font-semibold tracking-wide" style={{ color: C.text2 }}>
              {n}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- PROBLEM SECTION ---------- */

function ProblemSection() {
  const [phase, setPhase] = useState<"ok" | "down">("ok");
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p === "ok" ? "down" : "ok")), 3600);
    return () => clearInterval(t);
  }, []);

  const steps = [
    { icon: Ship, label: "Vessel" },
    { icon: Boxes, label: "Crane" },
    { icon: Truck, label: "Yard Truck" },
    { icon: ScanLine, label: "Gate" },
    { icon: Warehouse, label: "Warehouse" },
    { icon: Server, label: "Central TOS" },
  ];

  return (
    <section id="platform" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow tone="accent">The Problem</Eyebrow>
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl" style={{ color: C.text }}>
              Modern terminals fail the moment the network does.
            </h2>
            <p className="mt-5 text-lg" style={{ color: C.text2 }}>
              Global ports still route every scan, gate event and crane
              movement through a single Terminal Operating System. When that
              link degrades — even briefly — cargo movement halts, dwell time
              explodes, and demurrage costs cascade across the supply chain.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { t: "Single point of failure", d: "Central TOS outages freeze the entire terminal." },
                { t: "High-latency decisions", d: "Cloud round-trips slow every gate & crane action." },
                { t: "No offline continuity", d: "Assets stop coordinating without connectivity." },
              ].map((f) => (
                <li key={f.t} className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: "#FFF3E0", color: C.accent }}>
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: C.text }}>{f.t}</div>
                    <div className="text-sm" style={{ color: C.text2 }}>{f.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Card className="p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.text2 }}>
                Legacy Port Workflow
              </div>
              <AnimatePresence mode="wait">
                {phase === "down" ? (
                  <motion.div
                    key="down"
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: "#FFEBEE", color: C.critical }}
                  >
                    <Activity className="h-3 w-3" /> TOS Link Lost
                  </motion.div>
                ) : (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: "#E8F5E9", color: C.primary }}
                  >
                    <CheckCircle2 className="h-3 w-3" /> Online
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const frozen = phase === "down" && i > 1;
                return (
                  <div key={s.label} className="flex items-center gap-2">
                    <motion.div
                      className="grid h-14 w-14 place-items-center rounded-2xl bg-white"
                      style={{
                        border: `1.5px solid ${frozen ? "#FFCDD2" : C.borderSoft}`,
                        boxShadow: frozen
                          ? "0 6px 16px -8px rgba(198,40,40,0.25)"
                          : "0 4px 12px -6px rgba(15,23,42,0.1)",
                      }}
                      animate={frozen ? { opacity: [1, 0.55, 1] } : { y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Icon className="h-6 w-6" style={{ color: frozen ? C.critical : C.secondary }} strokeWidth={1.7} />
                    </motion.div>
                    {i < steps.length - 1 && (
                      <ChevronRight className="h-4 w-4" style={{ color: frozen ? C.critical : C.text3 }} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-xl p-4" style={{ background: C.surface2 }}>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { k: "$18k", v: "Cost per idle hour" },
                  { k: "27%", v: "Terminals reporting outages" },
                  { k: "3.4 hr", v: "Avg. incident recovery" },
                ].map((m) => (
                  <div key={m.v}>
                    <div className="text-lg font-bold tabular-nums" style={{ color: C.critical }}>{m.k}</div>
                    <div className="text-[11px] font-medium" style={{ color: C.text2 }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ---------- SOLUTION ---------- */

function SolutionSection() {
  const features = [
    { icon: Network, title: "Autonomous Mesh Fabric", desc: "Every asset — crane, gate, truck, container — becomes a self-healing edge node coordinating peer-to-peer." },
    { icon: Brain, title: "Edge AI Decisioning", desc: "Onboard inference plans yard moves and gate approvals locally in under 50 ms." },
    { icon: ShieldCheck, title: "Offline-First Continuity", desc: "Operations continue seamlessly during TOS or WAN outages, syncing when links restore." },
    { icon: Layers, title: "Digital Twin Layer", desc: "A live twin of every terminal, container and route — auditable end to end." },
    { icon: RouteIcon, title: "Adaptive Routing", desc: "Truck and yard equipment routes recalculate in real time as conditions change." },
    { icon: LineChart, title: "Operational Analytics", desc: "Enterprise-grade KPIs across throughput, dwell, and asset utilization." },
  ];
  return (
    <section id="solution" className="relative py-24" style={{ background: C.surface2 }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tone="primary">The Platform</Eyebrow>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl" style={{ color: C.text }}>
            A resilient, decentralized operating fabric for global terminals.
          </h2>
          <p className="mt-5 text-lg" style={{ color: C.text2 }}>
            DACT replaces the fragile hub-and-spoke terminal stack with a
            distributed mesh of intelligent edge nodes — engineered for
            continuous operations.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <Card className="h-full p-6 transition hover:-translate-y-1" style={{}}>
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl"
                    style={{ background: "#E3F2FD", color: C.secondary }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight" style={{ color: C.text }}>{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.text2 }}>{f.desc}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- TECH ARCHITECTURE ---------- */

function TechSection() {
  const layers = [
    {
      tag: "L4 · Enterprise",
      title: "Analytics & Control Plane",
      desc: "Fleet dashboards, KPI streams, compliance and audit logs surfaced to operators and executives.",
      icon: Gauge,
      color: C.secondary,
    },
    {
      tag: "L3 · Coordination",
      title: "Distributed Consensus",
      desc: "CRDT-based state replication across nodes with eventual convergence to central TOS.",
      icon: Network,
      color: C.primary,
    },
    {
      tag: "L2 · Edge AI",
      title: "On-Device Inference",
      desc: "Vision, OCR and routing models running on Raspberry Pi class nodes at every asset.",
      icon: Brain,
      color: C.accent,
    },
    {
      tag: "L1 · Mesh Transport",
      title: "Autonomous Radio Mesh",
      desc: "LoRa + Wi-Fi HaLow fallback with self-healing peer discovery and encrypted transport.",
      icon: Radar,
      color: C.secondary,
    },
  ];
  return (
    <section id="tech" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <Eyebrow tone="secondary">Architecture</Eyebrow>
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl" style={{ color: C.text }}>
              Four layers. One resilient fabric.
            </h2>
            <p className="mt-5 text-lg" style={{ color: C.text2 }}>
              DACT is engineered as a layered enterprise platform — from
              autonomous radio transport at the pier up to executive analytics
              in the boardroom.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { k: "Node runtime", v: "Rust · WASM" },
                { k: "Transport", v: "LoRa · HaLow · 5G" },
                { k: "AI inference", v: "TFLite · ONNX" },
                { k: "Consensus", v: "CRDT · Raft fallback" },
              ].map((s) => (
                <div key={s.k} className="rounded-xl bg-white p-4" style={{ border: `1px solid ${C.borderSoft}` }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.text3 }}>{s.k}</div>
                  <div className="mt-1 text-sm font-semibold" style={{ color: C.text }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {layers.map((l, i) => {
              const Icon = l.icon;
              return (
                <motion.div
                  key={l.title}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                >
                  <Card className="flex items-start gap-5 p-5">
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
                      style={{ background: `${l.color}15`, color: l.color }}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: l.color }}>{l.tag}</div>
                      <h3 className="mt-1 text-base font-semibold" style={{ color: C.text }}>{l.title}</h3>
                      <p className="mt-1 text-sm" style={{ color: C.text2 }}>{l.desc}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- LIVE TWIN / DEMO ---------- */

function DemoSection() {
  const events = useMemo(
    () => [
      { t: "14:02:11", n: "Crane-03", e: "Container MSKU-874210 lifted", tone: C.primary },
      { t: "14:02:13", n: "Truck-11", e: "Route updated · Yard B → Gate 4", tone: C.secondary },
      { t: "14:02:15", n: "Gate-04", e: "OCR confirmed · ETA 42s", tone: C.secondary },
      { t: "14:02:18", n: "Mesh", e: "Node WAN-Gateway degraded · rerouted", tone: C.accent },
      { t: "14:02:22", n: "Warehouse", e: "Slot A-14 reserved", tone: C.primary },
      { t: "14:02:26", n: "Consensus", e: "State replicated across 6 peers", tone: C.secondary },
    ],
    []
  );
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % events.length), 1800);
    return () => clearInterval(t);
  }, [events.length]);

  return (
    <section id="demo" className="relative py-24" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tone="primary">Live Digital Twin</Eyebrow>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl" style={{ color: C.text }}>
            See the terminal think in real time.
          </h2>
          <p className="mt-5 text-lg" style={{ color: C.text2 }}>
            Every event across every asset — streamed from the mesh, reconciled
            at the edge, presented as a single operational pane of glass.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card className="p-3">
            <PortTwin />
          </Card>

          <Card className="flex flex-col p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold" style={{ color: C.text }}>Operations Feed</div>
              <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "#E8F5E9", color: C.primary }}>
                <Zap className="h-3 w-3" /> Streaming
              </div>
            </div>

            <div className="mt-5 flex-1 space-y-2 overflow-hidden">
              {events.map((ev, i) => {
                const active = i === idx;
                return (
                  <motion.div
                    key={ev.t}
                    animate={{
                      opacity: active ? 1 : 0.55,
                      x: active ? 0 : 0,
                    }}
                    className="rounded-xl px-3 py-2.5"
                    style={{
                      background: active ? "#F1F5F9" : "transparent",
                      border: `1px solid ${active ? C.borderSoft : "transparent"}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums" style={{ color: C.text3 }}>
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: ev.tone }}
                        />
                        {ev.t}
                      </div>
                      <div className="text-[11px] font-semibold" style={{ color: ev.tone }}>{ev.n}</div>
                    </div>
                    <div className="mt-1 text-sm" style={{ color: C.text }}>{ev.e}</div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-5" style={{ borderColor: C.borderSoft }}>
              {[
                { k: "342", v: "TEU / hr" },
                { k: "6", v: "Active peers" },
                { k: "0", v: "Failed writes" },
              ].map((s) => (
                <div key={s.v} className="rounded-xl p-3 text-center" style={{ background: C.surface2 }}>
                  <div className="text-lg font-bold tabular-nums" style={{ color: C.text }}>{s.k}</div>
                  <div className="text-[11px] font-medium" style={{ color: C.text2 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */

function CTASection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="relative overflow-hidden rounded-3xl p-10 md:p-16"
          style={{
            background: `linear-gradient(135deg, ${C.secondaryDark} 0%, ${C.secondary} 55%, ${C.primary} 100%)`,
            boxShadow: "0 30px 60px -30px rgba(21,101,192,0.5)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse at 70% 40%, black 30%, transparent 75%)",
            }}
          />
          <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Ready for enterprise pilots
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
                Bring autonomous resilience to your terminal.
              </h2>
              <p className="mt-4 max-w-xl text-white/80">
                Deploy DACT alongside your existing TOS in weeks. Prove uptime
                and throughput gains on a single berth before scaling across
                the port.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold hover:brightness-95"
                style={{ color: C.secondaryDark }}
              >
                Book Enterprise Demo <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Download Whitepaper
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FOOTER ---------- */

function Footer() {
  return (
    <footer className="border-t py-12" style={{ borderColor: C.borderSoft }}>
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2.5">
          <img src={logoAsset.url} alt="DACT" className="h-9 w-9 rounded-xl object-cover" />
          <div>
            <div className="text-sm font-bold" style={{ color: C.text }}>DACT</div>
            <div className="text-[11px]" style={{ color: C.text2 }}>Decentralized Autonomous Container Tracking</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-medium" style={{ color: C.text2 }}>
          <a href="#platform" className="hover:text-slate-900">Platform</a>
          <a href="#solution" className="hover:text-slate-900">Solution</a>
          <a href="#tech" className="hover:text-slate-900">Architecture</a>
          <a href="#demo" className="hover:text-slate-900">Live Twin</a>
        </div>
        <div className="text-xs" style={{ color: C.text3 }}>
          © 2026 DACT · Built for modern ports.
        </div>
      </div>
    </footer>
  );
}

/* ---------- PAGE ---------- */

function Landing() {
  return (
    <div style={{ background: C.bg, color: C.text }}>
      <Nav />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <TechSection />
        <DemoSection />
        <LandingStory />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
