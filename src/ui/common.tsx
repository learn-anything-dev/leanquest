import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { formatShort, parseDate } from '../core/dates';
import type { WeightPoint } from '../core/progress';

export function Card({ children, title, right }: { children: ComponentChildren; title?: string; right?: ComponentChildren }) {
  return (
    <section class="card">
      {title && (
        <div class="row between" style="margin-bottom:6px">
          <h2 style="margin:0">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Bar({ value, max, tone }: { value: number; max: number; tone?: 'warn' | 'bad' }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div class={`bar ${tone ?? ''}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemax={Math.round(max)}>
      <i style={`width:${pct}%`} />
    </div>
  );
}

export function Ring({ value, max, label, sub }: { value: number; max: number; label: string; sub: string }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const over = value > max * 1.05;
  return (
    <div class="ring">
      <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
        <circle cx="75" cy="75" r={r} fill="none" stroke="var(--line)" stroke-width="14" />
        <circle cx="75" cy="75" r={r} fill="none" stroke={over ? 'var(--warn)' : 'var(--brand)'} stroke-width="14" stroke-linecap="round" stroke-dasharray={c} stroke-dashoffset={c * (1 - frac)} />
      </svg>
      <div class="mid">
        <b>{label}</b>
        <span>{sub}</span>
      </div>
    </div>
  );
}

export function Chips<T extends string>({ options, value, onChange, multi }: {
  options: { id: T; label: string }[];
  value: T | T[];
  onChange: (v: T) => void;
  multi?: boolean;
}) {
  const on = (id: T) => (multi ? (value as T[]).includes(id) : value === id);
  return (
    <div class="chips" role={multi ? 'group' : 'radiogroup'}>
      {options.map((o) => (
        <button type="button" key={o.id} class={`chip ${on(o.id) ? 'on' : ''}`} aria-pressed={on(o.id)} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  return msg ? <div class="toast" role="status">{msg}</div> : null;
}

export function useToast(): [string | null, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2200);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg];
}

export function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const bits = ['🎉', '⭐', '💚', '✨', '🏅'];
  return (
    <div class="confetti" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <i key={i} style={`left:${(i * 37) % 100}%;animation-delay:${(i % 9) * 0.12}s`}>{bits[i % bits.length]}</i>
      ))}
    </div>
  );
}

/** Weight chart: raw weigh-ins as dots, trend line, and the plan's projected path. */
export function WeightChart({ raw, trend, plan, goalKg }: { raw: WeightPoint[]; trend: WeightPoint[]; plan: WeightPoint[]; goalKg: number }) {
  const all = [...raw, ...trend, ...plan];
  if (!all.length) return null;
  const W = 560;
  const H = 220;
  const pad = { l: 38, r: 10, t: 10, b: 24 };
  const xs = all.map((p) => parseDate(p.date).getTime());
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs, x0 + 86400000);
  const ys = [...all.map((p) => p.kg), goalKg];
  const y0 = Math.floor(Math.min(...ys) - 0.5);
  const y1 = Math.ceil(Math.max(...ys) + 0.5);
  const X = (d: string) => pad.l + ((parseDate(d).getTime() - x0) / (x1 - x0)) * (W - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - (v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  const path = (pts: WeightPoint[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)},${Y(p.kg).toFixed(1)}`).join(' ');
  const ticks = [y0, y0 + (y1 - y0) / 2, y1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Weight chart: your weigh-ins, your trend and the plan">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={Y(t)} y2={Y(t)} stroke="var(--line)" />
          <text x={pad.l - 4} y={Y(t) + 4} text-anchor="end" font-size="11" fill="var(--muted)">{t.toFixed(0)}</text>
        </g>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={Y(goalKg)} y2={Y(goalKg)} stroke="var(--warn)" stroke-dasharray="4 4" />
      <text x={W - pad.r} y={Y(goalKg) - 4} text-anchor="end" font-size="11" fill="var(--warn)">goal {goalKg} kg</text>
      {plan.length > 1 && <path d={path(plan)} fill="none" stroke="var(--info)" stroke-width="2" stroke-dasharray="6 4" />}
      {raw.map((p) => <circle key={p.date} cx={X(p.date)} cy={Y(p.kg)} r="3" fill="var(--muted)" opacity=".6" />)}
      {trend.length > 1 && <path d={path(trend)} fill="none" stroke="var(--brand)" stroke-width="3" />}
      <text x={pad.l} y={H - 6} font-size="11" fill="var(--muted)">{formatShort(all.reduce((a, p) => (p.date < a ? p.date : a), all[0].date))}</text>
      <text x={W - pad.r} y={H - 6} text-anchor="end" font-size="11" fill="var(--muted)">{formatShort(all.reduce((a, p) => (p.date > a ? p.date : a), all[0].date))}</text>
    </svg>
  );
}

export const kgFmt = (kg: number, units: 'metric' | 'imperial') => (units === 'imperial' ? `${(kg * 2.20462).toFixed(1)} lb` : `${kg.toFixed(1)} kg`);
