import { motion, useMotionValue, useTransform, animate, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef } from "react";
import { C, shadow } from "../tokens";

export function Card({
  children,
  className = "",
  interactive = false,
  padded = true,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padded?: boolean;
  style?: React.CSSProperties;
}) {
  const motionProps: HTMLMotionProps<"div"> = interactive
    ? {
        whileHover: { y: -2, boxShadow: shadow.lg },
        transition: { type: "spring", stiffness: 260, damping: 22 },
      }
    : {};

  return (
    <motion.div
      {...motionProps}
      className={`rounded-2xl bg-white ${padded ? "p-5" : ""} ${className}`}
      style={{
        border: `1px solid ${C.borderSoft}`,
        boxShadow: shadow.md,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

export function StatusDot({ status }: { status: "healthy" | "degraded" | "offline" | "operating" | "idle" | "maintenance" | string }) {
  const color =
    status === "healthy" || status === "operating" ? C.primary :
    status === "degraded" || status === "idle" ? C.warning :
    status === "offline" || status === "maintenance" ? C.danger : C.text3;
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: color }} />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "info" | "warn" | "danger";
}) {
  const map = {
    neutral: { bg: C.surface2, fg: C.text2, br: C.borderSoft },
    success: { bg: C.primarySoft, fg: C.primaryDark, br: "#C8E6C9" },
    info:    { bg: C.secondarySoft, fg: C.secondaryDark, br: "#BBDEFB" },
    warn:    { bg: C.warningSoft, fg: "#8B6D00", br: "#FFF59D" },
    danger:  { bg: C.dangerSoft, fg: C.danger, br: "#FFCDD2" },
  }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: map.bg, color: map.fg, border: `1px solid ${map.br}` }}>
      {children}
    </span>
  );
}

export function AnimatedNumber({ value, decimals = 0, prefix = "", suffix = "" }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [value, mv]);
  useEffect(() => {
    const unsub = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsub;
  }, [rounded]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

export function Sparkline({ data, color = C.secondary, height = 36 }: { data: number[]; color?: string; height?: number }) {
  const w = 120;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const areaPts = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#sg-${color})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: C.text }}>{title}</h1>
        {subtitle && <p className="mt-1 text-sm" style={{ color: C.text2 }}>{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
