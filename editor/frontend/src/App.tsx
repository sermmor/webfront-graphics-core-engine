import './App.css';
import { useEditorStore } from './store/editorStore';
import Toolbar from './panels/Toolbar';
import Hierarchy from './panels/Hierarchy';
import Viewport from './panels/Viewport';
import Inspector from './panels/Inspector';

export default function App() {
  const { statusMessage, statusType } = useEditorStore();

  return (
    <div className="editor-root">
      <Toolbar />
      <Hierarchy />
      <Viewport />
      <Inspector />
      <div className={`statusbar ${statusType}`}>
        <span>{statusMessage}</span>
      </div>
    </div>
  );
}
