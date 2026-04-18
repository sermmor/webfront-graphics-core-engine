import { useState, KeyboardEvent } from 'react';
import { useEditorStore } from '../store/editorStore';

async function pickFolder(): Promise<string | null> {
  const res = await fetch('/api/folder-picker');
  if (!res.ok) return null;
  const data = await res.json();
  return data.cancelled ? null : (data.path ?? null);
}

export default function Toolbar() {
  const {
    projectPath, scenes, currentScenePath, isDirty, playMode,
    openProject, openScene, saveScene, startPlay, stopPlay,
  } = useEditorStore();

  const [pathInput, setPathInput] = useState(projectPath);
  const [picking, setPicking] = useState(false);

  const handleOpen = async () => {
    setPicking(true);
    try {
      const picked = await pickFolder();
      if (picked) {
        setPathInput(picked);
        openProject(picked);
      } else if (pathInput.trim()) {
        openProject(pathInput.trim());
      }
    } finally {
      setPicking(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pathInput.trim()) openProject(pathInput.trim());
  };

  const isPlaying = playMode !== 'stopped';

  return (
    <div className="toolbar">
      <span className="toolbar-title">🎮 Engine Editor</span>
      <div className="toolbar-sep" />

      <input
        value={pathInput}
        onChange={e => setPathInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Project folder path…"
        title="Absolute path to the project folder"
        style={{ minWidth: 280 }}
      />
      <button className="btn btn-primary" onClick={handleOpen} disabled={picking}>
        {picking ? '…' : '📂 Open'}
      </button>

      {scenes.length > 0 && (
        <>
          <div className="toolbar-sep" />
          <select
            value={currentScenePath}
            onChange={e => openScene(e.target.value)}
          >
            <option value="">— select scene —</option>
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
            title="Save scene (Ctrl+S)"
          >
            💾 Save{isDirty && <span className="dirty-dot" style={{ display: 'inline-block', marginLeft: 4 }} />}
          </button>
          <div className="toolbar-sep" />
          {!isPlaying ? (
            <button className="btn btn-play" onClick={startPlay} title="Play">▶ Play</button>
          ) : (
            <button className="btn btn-stop" onClick={stopPlay} title="Stop">■ Stop</button>
          )}
        </>
      )}
    </div>
  );
}
