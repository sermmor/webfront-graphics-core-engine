import { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { getGameObjects, GameObjectData, getRootGameObjects } from '../types/scene';

interface NodeProps {
  name: string;
  depth: number;
  childNames: string[];
  allGos: Map<string, GameObjectData>;
}

function GoNode({ name, depth, childNames, allGos }: NodeProps) {
  const { selectedGameObjectName, selectGameObject, toggleEnabled, removeGameObject, sceneData } = useEditorStore();
  const [expanded, setExpanded] = useState(true);

  const go = allGos.get(name);
  if (!go) return null;

  const isSelected = selectedGameObjectName === name;
  const hasChildren = childNames.length > 0;

  const icon = go.sprite ? '🖼' : go.textComponent ? '𝐓' : go.colliders ? '⬡' : go.particleList ? '✨' : '◻';

  return (
    <>
      <div
        className={`go-row ${isSelected ? 'selected' : ''} ${!go.isEnabled ? 'disabled' : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => selectGameObject(isSelected ? null : name)}
        onContextMenu={e => {
          e.preventDefault();
          // Simple context actions via window.confirm
          const action = window.prompt(`GameObject: "${name}"\n\nActions:\n1 = toggle enabled\n2 = delete\n\nEnter number:`);
          if (action === '1') toggleEnabled(name);
          if (action === '2' && window.confirm(`Delete "${name}"?`)) removeGameObject(name);
        }}
      >
        <button
          className="go-expand-btn"
          onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <span className="go-icon">{icon}</span>
        <span className="go-name" title={name}>{name}</span>
      </div>

      {expanded && hasChildren && childNames.map(child => {
        const childGo = allGos.get(child);
        return (
          <GoNode
            key={child}
            name={child}
            depth={depth + 1}
            childNames={childGo?.transform.childrenObjects ?? []}
            allGos={allGos}
          />
        );
      })}
    </>
  );
}

export default function Hierarchy() {
  const { sceneData, addGameObject } = useEditorStore();
  const [newGoName, setNewGoName] = useState('');

  if (!sceneData) {
    return (
      <div className="panel hierarchy">
        <div className="panel-header">Hierarchy</div>
        <div className="panel-body">
          <div style={{ padding: 12, color: 'var(--text-dim)' }}>No scene loaded.</div>
        </div>
      </div>
    );
  }

  const goEntries = getGameObjects(sceneData);
  const allGos = new Map(goEntries);
  const rootNames = getRootGameObjects(sceneData);

  const handleAdd = () => {
    const name = newGoName.trim();
    if (!name) return;
    if (sceneData[name]) { alert(`A GameObject named "${name}" already exists.`); return; }
    addGameObject(name);
    setNewGoName('');
  };

  return (
    <div className="panel hierarchy">
      <div className="panel-header">
        <span>Hierarchy</span>
        <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>{goEntries.length} objects</span>
      </div>
      <div className="panel-body">
        {rootNames.map(name => (
          <GoNode
            key={name}
            name={name}
            depth={0}
            childNames={(allGos.get(name) as GameObjectData)?.transform.childrenObjects ?? []}
            allGos={allGos}
          />
        ))}
      </div>

      <div className="hierarchy-actions">
        <input
          className="field-input"
          placeholder="New GameObject name…"
          value={newGoName}
          onChange={e => setNewGoName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1 }}
        />
        <button className="btn" onClick={handleAdd} title="Add GameObject">+</button>
      </div>
    </div>
  );
}
