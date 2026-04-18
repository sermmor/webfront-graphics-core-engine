import { BehaviourEntry } from '../../types/scene';
import { useEditorStore } from '../../store/editorStore';
import { Section } from './shared';
import { deepClone } from '../../utils/sceneUtils';

interface Props { goName: string; behaviours: BehaviourEntry[]; }

export default function BehaviourInspector({ goName, behaviours }: Props) {
  const { updateComponent } = useEditorStore();

  const updateRef = (idx: number, refKey: string, value: string) => {
    const next = deepClone(behaviours) as BehaviourEntry[];
    const refs: Record<string, string> = { ...(next[idx].references ?? {}) };
    refs[refKey] = value;
    next[idx] = { ...next[idx], references: refs };
    updateComponent(goName, 'behaviourComponentList', next);
  };

  const updateConfig = (idx: number, cfgKey: string, value: unknown) => {
    const next = deepClone(behaviours) as BehaviourEntry[];
    next[idx] = { ...next[idx], [cfgKey]: value };
    updateComponent(goName, 'behaviourComponentList', next);
  };

  return (
    <Section title="Behaviours" defaultOpen={false}>
      {behaviours.map((entry, idx) => {
        const reserved = new Set(['nameClass', 'references']);
        const configKeys = Object.keys(entry).filter(k => !reserved.has(k));
        const refs = (entry.references ?? {}) as Record<string, string>;

        return (
          <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: 6, marginBottom: 6 }}>
            <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4, fontSize: 12 }}>
              {entry.nameClass}
            </div>

            {Object.entries(refs).length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>References</div>
                {Object.entries(refs).map(([k, v]) => (
                  <div key={k} className="field-row">
                    <label style={{ fontSize: 10 }}>{k}</label>
                    <input
                      className="field-input"
                      type="text"
                      value={v}
                      onChange={e => updateRef(idx, k, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {configKeys.map(k => {
              const v = (entry as Record<string, unknown>)[k];
              const type = typeof v;
              return (
                <div key={k} className="field-row">
                  <label style={{ fontSize: 10 }}>{k}</label>
                  {type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={Boolean(v)}
                      onChange={e => updateConfig(idx, k, e.target.checked)}
                    />
                  ) : type === 'number' ? (
                    <input
                      className="field-input"
                      type="number"
                      value={Number(v)}
                      step={1}
                      onChange={e => updateConfig(idx, k, parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <input
                      className="field-input"
                      type="text"
                      value={String(v ?? '')}
                      onChange={e => updateConfig(idx, k, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      {behaviours.length === 0 && <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>No behaviours.</div>}
    </Section>
  );
}
