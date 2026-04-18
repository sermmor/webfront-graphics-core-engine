import { SpriteData } from '../../types/scene';
import { useEditorStore } from '../../store/editorStore';
import { Section, Field } from './shared';
import { parseColor, toEngineColor } from '../../utils/colorUtils';
import { deepClone } from '../../utils/sceneUtils';

interface Props { goName: string; sprite: SpriteData; }

export default function SpriteInspector({ goName, sprite }: Props) {
  const { updateComponent, projectPath } = useEditorStore();

  const set = (patch: Partial<SpriteData>) =>
    updateComponent(goName, 'sprite', { ...deepClone(sprite), ...patch });

  const col = parseColor(sprite.color);

  return (
    <Section title="Sprite">
      <Field
        label="Image"
        value={sprite.nameImage}
        type="text"
        onChange={v => set({ nameImage: v })}
      />
      {projectPath && sprite.nameImage && (
        <div className="field-row">
          <label>Preview</label>
          <img
            src={`/api/asset?projectPath=${encodeURIComponent(projectPath)}&name=${encodeURIComponent(sprite.nameImage)}`}
            alt={sprite.nameImage}
            style={{ maxWidth: 120, maxHeight: 60, objectFit: 'contain', background: '#333', borderRadius: 2 }}
          />
        </div>
      )}
      <div className="field-row">
        <label>Color (hex)</label>
        <input
          className="field-input"
          type="color"
          value={col.cssHex}
          onChange={e => set({ color: toEngineColor(e.target.value, col.alpha) })}
        />
      </div>
      <Field
        label="Alpha"
        value={col.alpha}
        step={0.01}
        min={0}
        onChange={v => set({ color: toEngineColor(col.cssHex, Math.min(1, Math.max(0, parseFloat(v) || 0))) })}
      />
    </Section>
  );
}
