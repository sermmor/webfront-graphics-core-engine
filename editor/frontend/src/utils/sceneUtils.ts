import { SceneData, GameObjectData, getGameObjects } from '../types/scene';

const API = '/api';

export async function apiFetchProject(projectPath: string) {
  const r = await fetch(`${API}/project?projectPath=${encodeURIComponent(projectPath)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ scenes: string[]; assets: string[]; config: Record<string, unknown> }>;
}

export async function apiFetchScene(projectPath: string, scenePath: string): Promise<SceneData> {
  const r = await fetch(`${API}/scene?projectPath=${encodeURIComponent(projectPath)}&scenePath=${encodeURIComponent(scenePath)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiSaveScene(projectPath: string, scenePath: string, data: SceneData): Promise<void> {
  const r = await fetch(`${API}/scene?projectPath=${encodeURIComponent(projectPath)}&scenePath=${encodeURIComponent(scenePath)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
}

export async function apiPlayStart(body: { projectPath: string; command?: string; playUrl?: string; readyDelay?: number }) {
  const r = await fetch(`${API}/play/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ ok: boolean; mode: 'preview' | 'external'; playUrl?: string }>;
}

export async function apiPlayStop() {
  await fetch(`${API}/play/stop`, { method: 'POST' });
}

export function assetUrl(projectPath: string, name: string): string {
  return `${API}/asset?projectPath=${encodeURIComponent(projectPath)}&name=${encodeURIComponent(name)}`;
}

export function previewUrl(projectPath: string, scenePath: string): string {
  return `/preview?projectPath=${encodeURIComponent(projectPath)}&scenePath=${encodeURIComponent(scenePath)}`;
}

/** Deep clone any value (used when mutating scene data) */
export function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** Build a child→parentName lookup table */
export function buildParentMap(scene: SceneData): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [name, go] of getGameObjects(scene)) {
    for (const child of (go as GameObjectData).transform.childrenObjects) {
      map[child] = name;
    }
  }
  return map;
}

/** Compute cumulative world position of a GameObject (sum of ancestors) */
export function worldPosition(name: string, scene: SceneData): { x: number; y: number } {
  const parentMap = buildParentMap(scene);
  let x = 0, y = 0;
  let current: string | undefined = name;
  while (current) {
    const go = scene[current] as GameObjectData | undefined;
    if (!go?.transform) break;
    x += go.transform.position.x;
    y += go.transform.position.y;
    current = parentMap[current];
  }
  return { x, y };
}
