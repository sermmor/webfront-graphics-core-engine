import { useEditorStore } from '../../store/editorStore';
import { GameObjectData, GraphicsKey, RectangleComponentData, RoundedRectangleComponentData, CircleComponentData, GraphicsBaseData } from '../../types/scene';
import { Section, Field, num } from './shared';
import { parseColor, toEngineColor } from '../../utils/colorUtils';
import { deepClone } from '../../utils/sceneUtils';

interface Props { goName: string; go: GameObjectData; gKey: GraphicsKey; }

export default function GraphicsInspector({ goName, go, gKey }: Props) {
  const { updateComponent } = useEditorStore();
  const gd = (go as unknown as Record<string, unknown>)[gKey] as Record<string, unknown>;

  const set = (patch: Partial<Record<string, unknown>>) =>
    updateComponent(goName, gKey, { ...deepClone(gd), ...patch });

  const baseFields = (gd: GraphicsBaseData) => (
    <>
      <div className="field-row">
        <label>Fill color</label>
        <input type="color"
          className="field-input"
          value={gd.backgroundColor ? parseColor(gd.backgroundColor).cssHex : '#000000'}
          onChange={e => set({ backgroundColor: toEngineColor(e.target.value, parseColor(gd.backgroundColor).alpha) })}
        />
      </div>
      <Field label="Fill alpha" value={gd.opacity ?? 1} step={0.01} min={0} onChange={v => set({ opacity: num(v) })} />
      <div className="field-row">
        <label>Border color</label>
        <input type="color"
          className="field-input"
          value={gd.borderColor ? parseColor(gd.borderColor).cssHex : '#ffffff'}
          onChange={e => set({ borderColor: toEngineColor(e.target.value, 1) })}
        />
      </div>
      <Field label="Border width" value={Number(gd.borderWidth ?? 1)} step={0.5} min={0} onChange={v => set({ borderWidth: num(v) })} />
    </>
  );

  if (gKey === 'RectangleComponent' || gKey === 'RoundedRectangleComponent') {
    const rd = gd as unknown as RectangleComponentData | RoundedRectangleComponentData;
    return (
      <Section title={gKey === 'RectangleComponent' ? 'Rectangle' : 'Rounded Rectangle'}>
        {baseFields(rd)}
        <Field label="X" value={rd.x} step={1} onChange={v => set({ x: num(v) })} />
        <Field label="Y" value={rd.y} step={1} onChange={v => set({ y: num(v) })} />
        <Field label="Width" value={rd.width} step={1} onChange={v => set({ width: num(v) })} />
        <Field label="Height" value={rd.height} step={1} onChange={v => set({ height: num(v) })} />
        {'radius' in rd && (
          <Field label="Radius" value={(rd as RoundedRectangleComponentData).radius} step={1} onChange={v => set({ radius: num(v) })} />
        )}
      </Section>
    );
  }

  if (gKey === 'CircleComponent') {
    const cd = gd as unknown as CircleComponentData;
    return (
      <Section title="Circle">
        {baseFields(cd)}
        <Field label="X" value={cd.x} step={1} onChange={v => set({ x: num(v) })} />
        <Field label="Y" value={cd.y} step={1} onChange={v => set({ y: num(v) })} />
        <Field label="Radius" value={cd.radius} step={1} onChange={v => set({ radius: num(v) })} />
      </Section>
    );
  }

  // FreestyleGraphicComponent — show as JSON text editor
  return (
    <Section title="Freestyle Graphic">
      {baseFields(gd as GraphicsBaseData)}
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
        allLines: {JSON.stringify((gd as Record<string, unknown>).allLines ?? [], null, 1)}
      </div>
    </Section>
  );
}
