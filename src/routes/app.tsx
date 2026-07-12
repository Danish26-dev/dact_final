import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Anchor, Network, Container as ContainerIcon, AlertOctagon,
  BrainCircuit, History, LineChart as LineChartIcon, Server, Settings as SettingsIcon,
  Bell, ChevronsLeft, ChevronsRight, Activity, LogOut, Radio,
} from "lucide-react";
import { C } from "../app/tokens";
import { NAV, makeEvent, type OperationalEvent } from "../app/data";
import {
  SimulationProvider, LiveStatusStrip, CommandDock, IncidentBanner,
} from "../app/simulation";
import { EngineProvider, useEngine } from "../app/sim-engine";
import { Play, Square } from "lucide-react";

import logoAsset from "../assets/dact_logo.png.asset.json";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

const ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  port: Anchor,
  mesh: Network,
  gateway: Radio,
  container: ContainerIcon,
  alert: AlertOctagon,
  brain: BrainCircuit,
  replay: History,
  chart: LineChartIcon,
  server: Server,
  settings: SettingsIcon,
};

function AppLayout() {
  return (
    <SimulationProvider>
      <EngineProvider>
        <AppLayoutInner />
      </EngineProvider>
    </SimulationProvider>
  );
}

function DemoBanner() {
  const { demoRunning, demoLabel, demoProgress, startDemo, stopDemo } = useEngine();
  return (
    <div className="flex items-center gap-3">
      {demoRunning ? (
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow"
             style={{ background: "linear-gradient(90deg,#1565C0,#2E7D32)" }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="max-w-[280px] truncate">{demoLabel}</span>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-white/30">
            <div className="h-full bg-white transition-all" style={{ width: `${Math.min(100, demoProgress * 100)}%` }} />
          </div>
          <button onClick={stopDemo} className="ml-1 rounded p-0.5 hover:bg-white/20">
            <Square className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button onClick={startDemo}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105"
          style={{ background: "linear-gradient(90deg,#1565C0,#2E7D32)", boxShadow: "0 10px 25px -8px rgba(21,101,192,0.55)" }}>
          <Play className="h-3.5 w-3.5" /> Start 90s Demo
        </button>
      )}
    </div>
  );
}

function AppLayoutInner() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: r => r.location.pathname });
  const navigate = useNavigate();
  const [events, setEvents] = useState<OperationalEvent[]>(() => Array.from({ length: 10 }, makeEvent));
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setEvents(evs => [makeEvent(), ...evs].slice(0, 60)), 2200);
    const c = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(i); clearInterval(c); };
  }, []);

  return (
    <div className="flex min-h-screen w-full" style={{ background: C.bg, color: C.text }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 248 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="sticky top-0 hidden h-screen flex-col md:flex"
        style={{ background: "#FFFFFF", borderRight: `1px solid ${C.borderSoft}` }}
      >
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
          <img src={logoAsset.url} alt="DACT" className="h-9 w-9 rounded-lg" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="flex flex-col leading-tight"
              >
                <span className="text-sm font-bold" style={{ color: C.text }}>DACT</span>
                <span className="text-[10px] font-medium" style={{ color: C.text2 }}>Port Operations</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            const active = (item as { exact?: boolean }).exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  color: active ? C.primaryDark : C.text2,
                  background: active ? C.primarySoft : "transparent",
                }}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r"
                    style={{ background: C.primary }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed(v => !v)}
          className="m-2 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold hover:bg-slate-50"
          style={{ color: C.text2, border: `1px solid ${C.borderSoft}` }}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
        </button>
      </motion.aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.borderSoft}` }}>
          <div className="min-w-0 flex-1">
            <LiveStatusStrip />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: C.text2 }}>
            <DemoBanner />
            <span className="hidden md:inline whitespace-nowrap">{now.toLocaleString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" })} IST</span>
            <button className="relative rounded-lg p-2 hover:bg-slate-100">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: C.accent }} />
            </button>
            <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ border: `1px solid ${C.borderSoft}` }}>
              <div className="grid h-7 w-7 place-items-center rounded-md text-xs font-bold text-white" style={{ background: C.secondary }}>PN</div>
              <div className="hidden flex-col leading-tight lg:flex">
                <span className="text-xs font-semibold" style={{ color: C.text }}>Priya Nair</span>
                <span className="text-[10px]" style={{ color: C.text2 }}>Ops Manager · JNPA</span>
              </div>
            </div>
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-red-50"
              style={{ border: `1px solid ${C.borderSoft}`, color: C.danger }}
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Log out</span>
            </button>
          </div>
        </header>

        <main className="flex min-w-0 flex-1 gap-6 p-6 pb-24">
          <div className="min-w-0 flex-1">
            <div className="mb-4">
              <IncidentBanner />
            </div>
            <Outlet />
          </div>

          {/* Right context panel — live feed */}
          <aside className="hidden w-[320px] shrink-0 xl:block">
            <div className="sticky top-[72px]">
              <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${C.borderSoft}`, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" style={{ color: C.secondary }} />
                    <h3 className="text-sm font-bold" style={{ color: C.text }}>Live Operational Feed</h3>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>Streaming</span>
                </div>
                <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {events.map((e) => (
                      <motion.div
                        key={e.id}
                        layout
                        initial={{ opacity: 0, y: -8, backgroundColor: "#FFFDE7" }}
                        animate={{ opacity: 1, y: 0, backgroundColor: "#FFFFFF" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-2 rounded-lg p-2.5"
                        style={{ border: `1px solid ${C.borderSoft}` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: e.severity === "critical" ? C.danger : e.severity === "warn" ? C.warning : e.severity === "success" ? C.primary : C.secondary }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.text2 }}>{e.kind.replace(/-/g, " ")}</span>
                          </div>
                          <span className="text-[10px]" style={{ color: C.text3 }}>{new Date(e.ts).toLocaleTimeString("en-IN", { hour12: false })}</span>
                        </div>
                        <p className="mt-1 text-xs" style={{ color: C.text }}>{e.message}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>

      <CommandDock />
    </div>
  );
}
