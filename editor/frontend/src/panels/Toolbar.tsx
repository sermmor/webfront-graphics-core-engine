import { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import FolderPickerModal from './FolderPickerModal';

export default function Toolbar() {
  const {
    projectPath, scenes, currentScenePath, isDirty, playMode,
    openProject, openScene, saveScene, startPlay, stopPlay,
  } = useEditorStore();

  const [pickerOpen, setPickerOpen] = useState(false);
  const isPlaying = playMode !== 'stopped';

  const handleAccept = (path: string) => {
    openProject(path);
  };

  return (
    <>
      <div className="toolbar">
        <span className="toolbar-title">🎮 Engine Editor</span>
        <div className="toolbar-sep" />

        {/* Show current project path (read-only once selected) */}
        {projectPath && (
          <span style={{
            fontSize: 10, color: 'var(--text-dim)',
            maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }} title={projectPath}>
            {projectPath}
          </span>
        )}

        <button className="btn btn-primary" onClick={() => setPickerOpen(true)}>
          📂 {projectPath ? 'Cambiar proyecto' : 'Abrir proyecto'}
        </button>

        {scenes.length > 0 && (
          <>
            <div className="toolbar-sep" />
            <select value={currentScenePath} onChange={e => openScene(e.target.value)}>
              <option value="">— seleccionar escena —</option>
              {scenes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </>
        )}

        {currentScenePath && (
          <>
            <div className="toolbar-sep" />
            <button
              className="btn btn-save"
              onClick={saveScene}
              disabled={!isDirty}
              title="Guardar escena (Ctrl+S)"
            >
              💾 Guardar{isDirty && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginLeft: 4, verticalAlign: 'middle' }} />}
            </button>
            <div className="toolbar-sep" />
            {!isPlaying ? (
              <button className="btn btn-play" onClick={startPlay}>▶ Play</button>
            ) : (
              <button className="btn btn-stop" onClick={stopPlay}>■ Stop</button>
            )}
          </>
        )}
      </div>

      <FolderPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAccept={handleAccept}
      />
    </>
  );
}
