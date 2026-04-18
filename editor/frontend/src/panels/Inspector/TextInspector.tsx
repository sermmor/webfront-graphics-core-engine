import { TextComponentData } from '../../types/scene';
import { useEditorStore } from '../../store/editorStore';
import { Section, Field, num } from './shared';
import { deepClone } from '../../utils/sceneUtils';

interface Props { goName: string; text: TextComponentData; }

export default function TextInspector({ goName, text }: Props) {
  const { updateComponent } = useEditorStore();
  const set = (patch: Partial<TextComponentData>) =>
    updateComponent(goName, 'textComponent', { ...deepClone(text), ...patch });

  return (
    <Section title="Text Component">
      <div className="field-row">
        <label>Text</label>
        <input className="field-input" type="text" value={text.textValue} onChange={e => set({ textValue: e.target.value })} />
      </div>
      <Field label="Font size" value={text.fontSize} step={1} onChange={v => set({ fontSize: num(v, 14) })} />
      <div className="field-row">
        <label>Font family</label>
        <input className="field-input" type="text" value={text.fontFamily ?? ''} onChange={e => set({ fontFamily: e.target.value })} />
      </div>
      <div className="field-row">
        <label>Align</label>
        <select className="field-input" value={text.align ?? 'center'} onChange={e => set({ align: e.target.value as TextComponentData['align'] })}>
          <option value="left">left</option>
          <option value="center">center</option>
          <option value="right">right</option>
        </select>
      </div>
      <div className="field-row">
        <label>Font weight</label>
        <select className="field-input" value={text.fontWeight ?? 'normal'} onChange={e => set({ fontWeight: e.target.value })}>
          {['normal','bold','bolder','lighter','100','200','300','400','500','600','700','800','900'].map(w => <option key={w}>{w}</option>)}
        </select>
      </div>
      <div className="field-row">
        <label>Fill color</label>
        <input
          className="field-input"
          type="color"
          value={text.fill?.startsWith('#') ? text.fill : '#ffffff'}
          onChange={e => set({ fill: e.target.value })}
        />
      </div>
      <Field label="Opacity" value={text.opacity ?? 1} step={0.01} min={0} onChange={v => set({ opacity: num(v, 1) })} />
      <div className="field-row">
        <label>Baseline</label>
        <input className="field-input" type="text" value={text.textBaseline ?? ''} onChange={e => set({ textBaseline: e.target.value })} />
      </div>
    </Section>
  );
}
