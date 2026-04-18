import { create } from 'zustand';
import { SceneData, GameObjectData, getGameObjects } from '../types/scene';
import { apiFetchProject, apiFetchScene, apiSaveScene, apiPlayStart, apiPlayStop, deepClone } from '../utils/sceneUtils';

export type PlayMode = 'stopped' | 'preview' | 'external';

interface EditorState {
  // ── Project ─────────────────────────────────────────────────────────────
  projectPath: string;
  scenes: string[];
  assets: string[];
  projectConfig: Record<string, unknown>;

  // ── Scene ────────────────────────────────────────────────────────────────
  currentScenePath: string;
  sceneData: SceneData | null;
  isDirty: boolean;

  // ── Selection ────────────────────────────────────────────────────────────
  selectedGameObjectName: string | null;

  // ── Play ─────────────────────────────────────────────────────────────────
  playMode: PlayMode;
  playUrl: string;

  // ── Status ───────────────────────────────────────────────────────────────
  statusMessage: string;
  statusType: 'info' | 'success' | 'error';

  // ── Actions ──────────────────────────────────────────────────────────────
  openProject: (path: string) => Promise<void>;
  openScene: (scenePath: string) => Promise<void>;
  saveScene: () => Promise<void>;
  selectGameObject: (name: string | null) => void;

  /** Replaces the full data of a single GameObject */
  updateGameObject: (name: string, data: GameObjectData) => void;

  /** Replaces a single component key inside a GameObject (e.g. 'transform', 'sprite') */
  updateComponent: (goName: string, componentKey: string, value: unknown) => void;

  /** Rename a GameObject (updates childrenObjects references too) */
  renameGameObject: (oldName: string, newName: string) => void;

  /** Add a new empty GameObject to the scene */
  addGameObject: (name: string) => void;

  /** Remove a GameObject from the scene */
  removeGameObject: (name: string) => void;

  /** Toggle isEnabled on a GameObject */
  toggleEnabled: (name: string) => void;

  startPlay: () => Promise<void>;
  stopPlay: () => Promise<void>;

  setStatus: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  projectPath: '',
  scenes: [],
  assets: [],
  projectConfig: {},
  currentScenePath: '',
  sceneData: null,
  isDirty: false,
  selectedGameObjectName: null,
  playMode: 'stopped',
  playUrl: '',
  statusMessage: 'Open a project folder to start.',
  statusType: 'info',

  // ── Project & scene loading ──────────────────────────────────────────────
  openProject: async (path: string) => {
    try {
      get().setStatus('Loading project…');
      const info = await apiFetchProject(path);
      set({ projectPath: path, scenes: info.scenes, assets: info.assets, projectConfig: info.config, currentScenePath: '', sceneData: null });
      get().setStatus(`Project loaded. ${info.scenes.length} scene(s) found.`, 'success');
      if (info.scenes.length === 1) await get().openScene(info.scenes[0]);
    } catch (err) {
      get().setStatus(`Failed to open project: ${(err as Error).message}`, 'error');
    }
  },

  openScene: async (scenePath: string) => {
    try {
      get().setStatus(`Loading scene ${scenePath}…`);
      const data = await apiFetchScene(get().projectPath, scenePath);
      set({ currentScenePath: scenePath, sceneData: data, isDirty: false, selectedGameObjectName: null });
      get().setStatus(`Scene loaded: ${scenePath}`, 'success');
    } catch (err) {
      get().setStatus(`Failed to load scene: ${(err as Error).message}`, 'error');
    }
  },

  saveScene: async () => {
    const { projectPath, currentScenePath, sceneData } = get();
    if (!sceneData || !currentScenePath) return;
    try {
      get().setStatus('Saving…');
      await apiSaveScene(projectPath, currentScenePath, sceneData);
      set({ isDirty: false });
      get().setStatus('Scene saved.', 'success');
    } catch (err) {
      get().setStatus(`Save failed: ${(err as Error).message}`, 'error');
    }
  },

  // ── Selection ────────────────────────────────────────────────────────────
  selectGameObject: (name) => set({ selectedGameObjectName: name }),

  // ── Mutation helpers ─────────────────────────────────────────────────────
  updateGameObject: (name, data) => {
    const scene = get().sceneData;
    if (!scene) return;
    set({ sceneData: { ...scene, [name]: data }, isDirty: true });
  },

  updateComponent: (goName, componentKey, value) => {
    const scene = get().sceneData;
    if (!scene) return;
    const go = deepClone(scene[goName] as GameObjectData);
    if (!go) return;
    (go as unknown as Record<string, unknown>)[componentKey] = value;
    set({ sceneData: { ...scene, [goName]: go }, isDirty: true });
  },

  renameGameObject: (oldName, newName) => {
    const scene = get().sceneData;
    if (!scene || !newName || newName === oldName || scene[newName]) return;
    const next = deepClone(scene) as SceneData;
    next[newName] = next[oldName];
    delete next[oldName];
    // Update childrenObjects references
    for (const [, go] of getGameObjects(next)) {
      const idx = go.transform.childrenObjects.indexOf(oldName);
      if (idx !== -1) go.transform.childrenObjects[idx] = newName;
    }
    const selected = get().selectedGameObjectName === oldName ? newName : get().selectedGameObjectName;
    set({ sceneData: next, isDirty: true, selectedGameObjectName: selected });
  },

  addGameObject: (name) => {
    const scene = get().sceneData;
    if (!scene || scene[name]) return;
    const newGo: GameObjectData = {
      transform: { position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1 }, childrenObjects: [] },
      isEnabled: true,
    };
    set({ sceneData: { ...scene, [name]: newGo }, isDirty: true });
  },

  removeGameObject: (name) => {
    const scene = get().sceneData;
    if (!scene) return;
    const next = deepClone(scene) as SceneData;
    delete next[name];
    // Remove from any childrenObjects list
    for (const [, go] of getGameObjects(next)) {
      go.transform.childrenObjects = go.transform.childrenObjects.filter(c => c !== name);
    }
    set({ sceneData: next, isDirty: true, selectedGameObjectName: get().selectedGameObjectName === name ? null : get().selectedGameObjectName });
  },

  toggleEnabled: (name) => {
    const scene = get().sceneData;
    if (!scene) return;
    const go = deepClone(scene[name] as GameObjectData);
    go.isEnabled = !go.isEnabled;
    set({ sceneData: { ...scene, [name]: go }, isDirty: true });
  },

  // ── Play ─────────────────────────────────────────────────────────────────
  startPlay: async () => {
    const { projectPath, currentScenePath, projectConfig } = get();
    if (!currentScenePath) return;
    try {
      get().setStatus('Starting play mode…');
      const cmd = projectConfig.playCommand as string | undefined;
      const url = projectConfig.playUrl as string | undefined;
      const delay = projectConfig.playReadyDelay as number | undefined;
      const result = await apiPlayStart({ projectPath, command: cmd, playUrl: url, readyDelay: delay });
      const playUrl = result.mode === 'external' && result.playUrl
        ? result.playUrl
        : `/preview?projectPath=${encodeURIComponent(projectPath)}&scenePath=${encodeURIComponent(currentScenePath)}`;
      set({ playMode: result.mode, playUrl });
      get().setStatus('Playing.', 'success');
    } catch (err) {
      get().setStatus(`Play failed: ${(err as Error).message}`, 'error');
    }
  },

  stopPlay: async () => {
    try {
      await apiPlayStop();
      set({ playMode: 'stopped', playUrl: '' });
      get().setStatus('Stopped.', 'info');
    } catch { /* ignore */ }
  },

  // ── Status ───────────────────────────────────────────────────────────────
  setStatus: (msg, type = 'info') => set({ statusMessage: msg, statusType: type }),
}));
