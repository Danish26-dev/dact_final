import { createFileRoute } from "@tanstack/react-router";
import { C } from "../app/tokens";
import { Card, StatusDot } from "../app/components/primitives";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
          <StatusDot status="healthy" /> Configuration
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-sm font-bold">Terminal</h3>
          <p className="mt-1 text-xs" style={{ color: C.text2 }}>JNPA · Terminal 2 · Nhava Sheva</p>
          <div className="mt-3 space-y-2 text-xs">
            <Row l="Operator" v="Jawaharlal Nehru Port Authority" />
            <Row l="Timezone" v="Asia/Kolkata (UTC+05:30)" />
            <Row l="Berths" v="A, B (8 STS cranes)" />
            <Row l="Yard Blocks" v="N1, N2, S1 (RTG-served)" />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold">Mesh Preferences</h3>
          <div className="mt-3 space-y-3">
            {[
              { l: "Auto-promote coordinators", v: true },
              { l: "CRDT strategy: Last-Writer-Wins", v: true },
              { l: "Isolate degraded nodes after 60s", v: true },
              { l: "Notify ops on partition detection", v: true },
              { l: "Enable predictive re-election", v: false },
            ].map(s => (
              <label key={s.l} className="flex items-center justify-between text-sm">
                <span>{s.l}</span>
                <span className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition ${s.v ? "" : ""}`}
                      style={{ background: s.v ? C.primary : C.border }}>
                  <span className="h-4 w-4 rounded-full bg-white shadow" style={{ transform: s.v ? "translateX(16px)" : "translateX(0)" }} />
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2">
          <h3 className="text-sm font-bold">Team</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {[
              { n: "Priya Nair", r: "Ops Manager" },
              { n: "Rakesh Sharma", r: "Yard Supervisor" },
              { n: "Meera Iyer", r: "Network Engineer" },
              { n: "Arjun Patel", r: "Incident Response" },
            ].map(m => (
              <div key={m.n} className="flex items-center gap-3 rounded-lg p-3" style={{ background: C.surface2 }}>
                <div className="grid h-9 w-9 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: C.secondary }}>{m.n.split(" ").map(x=>x[0]).join("")}</div>
                <div>
                  <div className="text-sm font-semibold">{m.n}</div>
                  <div className="text-xs" style={{ color: C.text2 }}>{m.r}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between border-b py-1 last:border-0" style={{ borderColor: C.borderSoft }}>
      <span style={{ color: C.text2 }}>{l}</span><span className="font-semibold">{v}</span>
    </div>
  );
}
