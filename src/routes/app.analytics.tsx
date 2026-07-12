import { createFileRoute } from "@tanstack/react-router";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line, Legend } from "recharts";
import { C } from "../app/tokens";
import { Card, StatusDot } from "../app/components/primitives";
import { throughputSeries, meshHealthSeries, zoneUtilization, conflictTrend } from "../app/data";

export const Route = createFileRoute("/app/analytics")({
  component: Analytics,
});

function Analytics() {
  const th = throughputSeries();
  const mh = meshHealthSeries();
  const zu = zoneUtilization();
  const ct = conflictTrend();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>
          <StatusDot status="healthy" /> Operational Analytics
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Terminal Performance</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-bold">Throughput (last 24h)</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={th} margin={{ left: -12, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={C.secondary} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: C.text2 }} />
                <YAxis tick={{ fontSize: 10, fill: C.text2 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.borderSoft}` }} />
                <Area dataKey="teu" stroke={C.secondary} fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-bold">Container Flow (Gate In / Out)</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={th}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: C.text2 }} />
                <YAxis tick={{ fontSize: 10, fill: C.text2 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.borderSoft}` }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gateIn" fill={C.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="gateOut" fill={C.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-bold">Zone Utilization</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={zu} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} />
                <XAxis type="number" tick={{ fontSize: 10, fill: C.text2 }} />
                <YAxis dataKey="zone" type="category" tick={{ fontSize: 10, fill: C.text2 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.borderSoft}` }} />
                <Bar dataKey="utilization" fill={C.secondary} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-bold">Mesh Health (last 30 min)</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={mh}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: C.text2 }} />
                <YAxis tick={{ fontSize: 10, fill: C.text2 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.borderSoft}` }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="latency" stroke={C.secondary} strokeWidth={2} dot={false} />
                <Line dataKey="quality" stroke={C.primary} strokeWidth={2} dot={false} />
                <Line dataKey="loss" stroke={C.danger} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <h3 className="mb-3 text-sm font-bold">Conflict Trends (last 14 days)</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={ct}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.text2 }} />
                <YAxis tick={{ fontSize: 10, fill: C.text2 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.borderSoft}` }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="detected" fill={C.warning} radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill={C.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
