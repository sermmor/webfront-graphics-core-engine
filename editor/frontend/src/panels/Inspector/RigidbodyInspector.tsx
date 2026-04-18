import { RigidbodyData } from '../../types/scene';
import { useEditorStore } from '../../store/editorStore';
import { Section, Field, num } from './shared';
import { deepClone } from '../../utils/sceneUtils';

interface Props { goName: string; rigidbody: RigidbodyData; }

export default function RigidbodyInspector({ goName, rigidbody }: Props) {
  const { updateComponent } = useEditorStore();
  const set = (patch: Partial<RigidbodyData>) =>
    updateComponent(goName, 'rigidbody', { ...deepClone(rigidbody), ...patch });

  return (
    <Section title="Rigidbody">
      <div className="field-row">
        <label>Type</label>
        <select className="field-input" value={rigidbody.type} onChange={e => set({ type: e.target.value as RigidbodyData['type'] })}>
          <option value="Dynamic">Dynamic</option>
          <option value="Static">Static</option>
          <option value="Kinematic">Kinematic</option>
        </select>
      </div>
      <Field label="Mass" value={rigidbody.mass} step={0.1} min={0} onChange={v => set({ mass: num(v) })} />
    </Section>
  );
}
