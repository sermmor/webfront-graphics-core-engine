import { TransformData } from '../../types/scene';
import { useEditorStore } from '../../store/editorStore';
import { Section, Vec3Field, Vec2Field, Field, num } from './shared';
import { deepClone } from '../../utils/sceneUtils';

interface Props { goName: string; transform: TransformData; }

export default function TransformInspector({ goName, transform }: Props) {
  const { updateComponent } = useEditorStore();

  const update = (patch: Partial<TransformData>) => {
    updateComponent(goName, 'transform', { ...deepClone(transform), ...patch });
  };

  const setPos = (axis: 'x' | 'y' | 'z', v: string) =>
    update({ position: { ...transform.position, [axis]: num(v) } });

  const setScale = (axis: 'x' | 'y', v: string) =>
    update({ scale: { ...transform.scale, [axis]: num(v) } });

  return (
    <Section title="Transform">
      <Vec3Field
        label="Position"
        x={transform.position.x} y={transform.position.y} z={transform.position.z}
        onX={v => setPos('x', v)} onY={v => setPos('y', v)} onZ={v => setPos('z', v)}
      />
      <Vec2Field
        label="Scale"
        x={transform.scale.x} y={transform.scale.y}
        onX={v => setScale('x', v)} onY={v => setScale('y', v)}
      />
      <Field
        label="Rotation (rad)"
        value={transform.rotation ?? 0}
        onChange={v => update({ rotation: num(v) })}
        step={0.01}
      />
      <div className="field-row">
        <label style={{ gridColumn: '1/-1', color: 'var(--text-dim)', fontSize: 10, marginTop: 4 }}>
          Children: {transform.childrenObjects.join(', ') || '—'}
        </label>
      </div>
    </Section>
  );
}
