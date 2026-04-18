import { useState, ReactNode } from 'react';

// ── Collapsible section ─────────────────────────────────────────────────────
export function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <div className="section-header" onClick={() => setOpen(o => !o)}>
        <span>{open ? '▾' : '▸'}</span>
        <span>{title}</span>
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

// ── Single labeled number input ─────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: number | string;
  onChange: (v: string) => void;
  type?: 'number' | 'text' | 'color';
  step?: number;
  min?: number;
}

export function Field({ label, value, onChange, type = 'number', step = 0.01, min }: FieldProps) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <input
        className="field-input"
        type={type}
        value={value}
        step={step}
        min={min}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ── X / Y / Z triple field ──────────────────────────────────────────────────
interface Vec3FieldProps {
  label: string;
  x: number; y: number; z?: number;
  onX: (v: string) => void;
  onY: (v: string) => void;
  onZ?: (v: string) => void;
  step?: number;
}

export function Vec3Field({ label, x, y, z, onX, onY, onZ, step = 0.01 }: Vec3FieldProps) {
  return (
    <div className="field-row-3col">
      <label>{label}</label>
      <input className="field-input" type="number" value={x} step={step} onChange={e => onX(e.target.value)} title="X" />
      <input className="field-input" type="number" value={y} step={step} onChange={e => onY(e.target.value)} title="Y" />
      {onZ !== undefined && z !== undefined && (
        <input className="field-input" type="number" value={z} step={step} onChange={e => onZ(e.target.value)} title="Z" />
      )}
    </div>
  );
}

// ── X / Y double field ──────────────────────────────────────────────────────
interface Vec2FieldProps { label: string; x: number; y: number; onX: (v: string) => void; onY: (v: string) => void; step?: number; }
export function Vec2Field({ label, x, y, onX, onY, step = 0.01 }: Vec2FieldProps) {
  return (
    <div className="field-row-3col" style={{ gridTemplateColumns: '60px 1fr 1fr' }}>
      <label>{label}</label>
      <input className="field-input" type="number" value={x} step={step} onChange={e => onX(e.target.value)} title="X" />
      <input className="field-input" type="number" value={y} step={step} onChange={e => onY(e.target.value)} title="Y" />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export const num = (v: string | number, fallback = 0) => {
  const n = parseFloat(String(v));
  return isNaN(n) ? fallback : n;
};
