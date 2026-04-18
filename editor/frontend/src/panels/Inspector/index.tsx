import { GameObjectData, getGraphicsKey, getGameObjects } from '../../types/scene';
import { useEditorStore } from '../../store/editorStore';
import TransformInspector from './TransformInspector';
import SpriteInspector from './SpriteInspector';
import TextInspector from './TextInspector';
import ColliderInspector from './ColliderInspector';
import RigidbodyInspector from './RigidbodyInspector';
import GraphicsInspector from './GraphicsInspector';
import TweenInspector from './TweenInspector';
import BehaviourInspector from './BehaviourInspector';

export default function Inspector() {
  const { sceneData, selectedGameObjectName, updateComponent, toggleEnabled } = useEditorStore();

  if (!sceneData || !selectedGameObjectName) {
    return (
      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
        Select a game object
      </div>
    );
  }

  const gos = getGameObjects(sceneData);
  const entry = gos.find(([name]) => name === selectedGameObjectName);
  if (!entry) return null;
  const go: GameObjectData = entry[1];

  const gKey = getGraphicsKey(go);

  return (
    <div className="panel" style={{ overflowY: 'auto' }}>
      <div className="panel-header">Inspector</div>
      <div className="panel-body">

        {/* Header: name + enabled toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={go.isEnabled !== false}
            onChange={() => toggleEnabled(selectedGameObjectName)}
            title="Enabled"
          />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedGameObjectName}
          </span>
        </div>

        {go.transform && (
          <TransformInspector goName={selectedGameObjectName} transform={go.transform} />
        )}

        {go.sprite && (
          <SpriteInspector goName={selectedGameObjectName} sprite={go.sprite} />
        )}

        {go.textComponent && (
          <TextInspector goName={selectedGameObjectName} text={go.textComponent} />
        )}

        {gKey && (
          <GraphicsInspector goName={selectedGameObjectName} go={go} gKey={gKey} />
        )}

        {go.colliders && (
          <ColliderInspector goName={selectedGameObjectName} colliders={go.colliders} />
        )}

        {go.rigidbody && (
          <RigidbodyInspector goName={selectedGameObjectName} rigidbody={go.rigidbody} />
        )}

        {go.tweenList && (
          <TweenInspector goName={selectedGameObjectName} tweenList={go.tweenList} />
        )}

        {go.behaviourComponentList && (
          <BehaviourInspector goName={selectedGameObjectName} behaviours={go.behaviourComponentList} />
        )}

        {go.particleList && (
          <div style={{ padding: '6px 0', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim)' }}>
            Particle system ({go.particleList.length} emitter{go.particleList.length !== 1 ? 's' : ''}) — edit JSON directly
          </div>
        )}

        {go.soundComponent && (
          <div style={{ padding: '6px 0', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim)' }}>
            Sound: {go.soundComponent.soundNames?.join(', ') || '—'}
          </div>
        )}

        {/* Add component */}
        <div style={{ marginTop: 12 }}>
          <button
            className="btn"
            style={{ width: '100%', fontSize: 11, opacity: 0.7 }}
            onClick={() => {
              const name = window.prompt('Component key to add (e.g. rigidbody, colliders):');
              if (!name) return;
              const defaults: Record<string, unknown> = {
                colliders: [],
                tweenList: [],
                behaviourComponentList: [],
                rigidbody: { type: 'Dynamic', mass: 1 },
              };
              updateComponent(selectedGameObjectName, name, defaults[name] ?? {});
            }}
          >
            + Add Component
          </button>
        </div>

      </div>
    </div>
  );
}
