import { ColliderEntry, RectangleColliderData, CircleColliderData } from '../../types/scene';
import { useEditorStore } from '../../store/editorStore';
import { Section, Field, Vec2Field, num } from './shared';
import { deepClone } from '../../utils/sceneUtils';

interface Props { goName: string; colliders: ColliderEntry[]; }

export default function ColliderInspector({ goName, colliders }: Props) {
  const { updateComponent } = useEditorStore();

  const updateCollider = (idx: number, patch: ColliderEntry) => {
    const next = deepClone(colliders);
    next[idx] = patch;
    updateComponent(goName, 'colliders', next);
  };

  const addRect = () => {
    const next = deepClone(colliders);
    next.push({ rectangleCollider: { offset: { x: 0, y: 0 }, size: { width: 50, height: 50 } } });
    updateComponent(goName, 'colliders', next);
  };

  const addCircle = () => {
    const next = deepClone(colliders);
    next.push({ circleCollider: { offset: { x: 0, y: 0 }, radius: 25 } });
    updateComponent(goName, 'colliders', next);
  };

  const removeCollider = (idx: number) => {
    const next = deepClone(colliders).filter((_: ColliderEntry, i: number) => i !== idx);
    updateComponent(goName, 'colliders', next);
  };

  return (
    <Section title="Colliders">
      <div style={{ marginBottom: 6, color: 'var(--text-dim)', fontSize: 10 }}>
        Drag the green handles in the viewport to resize colliders visually.
      </div>

      {colliders.map((entry, idx) => {
        if ('rectangleCollider' in entry) {
          const rc: RectangleColliderData = entry.rectangleCollider;

          const setRc = (patch: Partial<RectangleColliderData>) =>
            updateCollider(idx, { rectangleCollider: { ...deepClone(rc), ...patch } });

          return (
            <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: 6, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>▭ Rect #{idx}</span>
                <button className="btn" style={{ padding: '1px 6px' }} onClick={() => removeCollider(idx)}>✕</button>
              </div>
              <div className="field-row">
                <label>Label</label>
                <input className="field-input" type="text" value={rc.labelCollider ?? ''} onChange={e => setRc({ labelCollider: e.target.value })} />
              </div>
              <Vec2Field
                label="Offset"
                x={rc.offset.x} y={rc.offset.y}
                onX={v => setRc({ offset: { ...rc.offset, x: num(v) } })}
                onY={v => setRc({ offset: { ...rc.offset, y: num(v) } })}
                step={1}
              />
              <Vec2Field
                label="Size"
                x={rc.size.width} y={rc.size.height}
                onX={v => setRc({ size: { ...rc.size, width: num(v) } })}
                onY={v => setRc({ size: { ...rc.size, height: num(v) } })}
                step={1}
              />
              <div className="field-row">
                <label>Layer mask</label>
                <input className="field-input" type="text" value={rc.layerMask ?? 'default'} onChange={e => setRc({ layerMask: e.target.value })} />
              </div>
            </div>
          );
        }

        if ('circleCollider' in entry) {
          const cc: CircleColliderData = entry.circleCollider;

          const setCc = (patch: Partial<CircleColliderData>) =>
            updateCollider(idx, { circleCollider: { ...deepClone(cc), ...patch } });

          return (
            <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: 6, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: '#88ffaa' }}>◯ Circle #{idx}</span>
                <button className="btn" style={{ padding: '1px 6px' }} onClick={() => removeCollider(idx)}>✕</button>
              </div>
              <div className="field-row">
                <label>Label</label>
                <input className="field-input" type="text" value={cc.labelCollider ?? ''} onChange={e => setCc({ labelCollider: e.target.value })} />
              </div>
              <Vec2Field
                label="Offset"
                x={cc.offset.x} y={cc.offset.y}
                onX={v => setCc({ offset: { ...cc.offset, x: num(v) } })}
                onY={v => setCc({ offset: { ...cc.offset, y: num(v) } })}
                step={1}
              />
              <Field label="Radius" value={cc.radius} step={1} onChange={v => setCc({ radius: num(v) })} />
              <div className="field-row">
                <label>Layer mask</label>
                <input className="field-input" type="text" value={cc.layerMask ?? 'default'} onChange={e => setCc({ layerMask: e.target.value })} />
              </div>
            </div>
          );
        }
        return null;
      })}

      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        <button className="btn" onClick={addRect} style={{ flex: 1 }}>+ Rectangle</button>
        <button className="btn" onClick={addCircle} style={{ flex: 1 }}>+ Circle</button>
      </div>
    </Section>
  );
}
