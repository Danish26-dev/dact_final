/* Vertical timeline showing a container's lifecycle stages, derived
   entirely from the engine. */

import { CheckCircle2, Circle } from "lucide-react";
import { C } from "../tokens";
import { CONTAINER_STAGES, STAGE_LABEL, type SimContainer } from "../sim-engine";

export function ContainerTimeline({ container }: { container: SimContainer }) {
  const currentIdx = CONTAINER_STAGES.indexOf(container.stage);
  return (
    <div className="rounded-xl p-3" style={{ background: C.surface2, border: `1px solid ${C.borderSoft}` }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.text2 }}>Container</div>
          <div className="text-sm font-mono font-bold" style={{ color: C.secondary }}>{container.id}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px]" style={{ color: C.text2 }}>{container.origin} → {container.destination}</div>
          <div className="text-[10px] font-semibold" style={{ color: C.text }}>{container.cargo} · {container.size}</div>
        </div>
      </div>
      <ol className="space-y-1.5">
        {CONTAINER_STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const now = i === currentIdx;
          const entry = container.history.find((h) => h.stage === stage);
          return (
            <li key={stage} className="flex items-start gap-2 text-[11px]">
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: C.primary }} />
              ) : now ? (
                <span className="relative inline-flex h-3.5 w-3.5 shrink-0 mt-0.5">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping" style={{ background: C.accent }} />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full" style={{ background: C.accent }} />
                </span>
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: C.text3 }} />
              )}
              <div className="flex-1">
                <div className="font-semibold" style={{ color: done || now ? C.text : C.text3 }}>{STAGE_LABEL[stage]}</div>
                {entry && <div className="text-[10px]" style={{ color: C.text2 }}>{entry.note}</div>}
              </div>
              {entry && (
                <span className="text-[10px] font-mono shrink-0" style={{ color: C.text3 }}>
                  {new Date(entry.ts).toLocaleTimeString("en-IN", { hour12: false })}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
