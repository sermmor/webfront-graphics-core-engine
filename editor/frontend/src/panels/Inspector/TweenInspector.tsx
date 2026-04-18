import { TweenEntry } from '../../types/scene';
import { useEditorStore } from '../../store/editorStore';
import { Section, Field, Vec2Field, num } from './shared';
import { deepClone } from '../../utils/sceneUtils';

interface Props { goName: string; tweenList: TweenEntry[]; }

type TweenKey = 'bezier' | 'bezier-cubic' | 'lagrange' | 'akima-cubic-spline';
const TWEEN_KEYS: TweenKey[] = ['bezier', 'bezier-cubic', 'lagrange', 'akima-cubic-spline'];

export default function TweenInspector({ goName, tweenList }: Props) {
  const { updateComponent } = useEditorStore();

  const update = (idx: number, key: TweenKey, patch: Record<string, unknown>) => {
    const next = deepClone(tweenList);
    const entry = next[idx] as Record<string, unknown>;
    entry[key] = { ...(entry[key] as Record<string, unknown>), ...patch };
    updateComponent(goName, 'tweenList', next);
  };

  return (
    <Section title="Tweens" defaultOpen={false}>
      {tweenList.map((entry, idx) => {
        const key = TWEEN_KEYS.find(k => k in (entry as Record<string, unknown>));
        if (!key) return null;

        const td = (entry as Record<string, unknown>)[key] as Record<string, unknown>;
        const p  = (f: string) => update(idx, key, { [f]: num(String(td[f] ?? 0)) });

        return (
          <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: 6, marginBottom: 6 }}>
            <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>
              {key} #{idx}
            </div>
            <Field label="Total time" value={Number(td.totalTime ?? 0)} step={0.01} onChange={v => update(idx, key, { totalTime: num(v) })} />
            <div className="field-row">
              <label>Option</label>
              <select className="field-input" value={String(td.option ?? 'move')}
                onChange={e => update(idx, key, { option: e.target.value })}>
                {['move','scale','rotate','opacity','callback'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="field-row">
              <label>Acts on GO</label>
              <input className="field-input" type="text" value={String(td.gameObjectNameToAct ?? '')}
                onChange={e => update(idx, key, { gameObjectNameToAct: e.target.value })} />
            </div>
            <Vec2Field label="From"
              x={Number((td.pointInitialState as Record<string,number>)?.x ?? 0)}
              y={Number((td.pointInitialState as Record<string,number>)?.y ?? 0)}
              onX={v => update(idx, key, { pointInitialState: { ...(td.pointInitialState as object), x: num(v) } })}
              onY={v => update(idx, key, { pointInitialState: { ...(td.pointInitialState as object), y: num(v) } })}
            />
            <Vec2Field label="To"
              x={Number((td.pointEndingState as Record<string,number>)?.x ?? 0)}
              y={Number((td.pointEndingState as Record<string,number>)?.y ?? 0)}
              onX={v => update(idx, key, { pointEndingState: { ...(td.pointEndingState as object), x: num(v) } })}
              onY={v => update(idx, key, { pointEndingState: { ...(td.pointEndingState as object), y: num(v) } })}
            />
            {(key === 'bezier' || key === 'bezier-cubic') && (
              <>
                <Vec2Field label="P1"
                  x={Number((td.p1 as Record<string,number>)?.x ?? 0)}
                  y={Number((td.p1 as Record<string,number>)?.y ?? 0)}
                  onX={v => update(idx, key, { p1: { ...(td.p1 as object), x: num(v) } })}
                  onY={v => update(idx, key, { p1: { ...(td.p1 as object), y: num(v) } })}
                />
                <Vec2Field label="P2"
                  x={Number((td.p2 as Record<string,number>)?.x ?? 0)}
                  y={Number((td.p2 as Record<string,number>)?.y ?? 0)}
                  onX={v => update(idx, key, { p2: { ...(td.p2 as object), x: num(v) } })}
                  onY={v => update(idx, key, { p2: { ...(td.p2 as object), y: num(v) } })}
                />
              </>
            )}
            {(key === 'lagrange' || key === 'akima-cubic-spline') && (
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                {((td['point-list'] as unknown[]) ?? []).length} control point(s)
              </div>
            )}
            {void p} {/* suppress unused warning */}
          </div>
        );
      })}
      {tweenList.length === 0 && <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>No tweens.</div>}
    </Section>
  );
}
