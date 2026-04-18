// ── Primitive helpers ───────────────────────────────────────────────────────

export interface Vec2 { x: number; y: number; }
export interface Vec3 { x: number; y: number; z: number; }
export interface SizeRect { width: number; height: number; }

// ── Components ──────────────────────────────────────────────────────────────

export interface TransformData {
  position: Vec3;
  scale: Vec2;
  rotation?: number;
  childrenObjects: string[];
}

export interface SpriteData {
  nameImage: string;
  color: string;
}

export interface TextComponentData {
  textValue: string;
  fontSize: number;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  fill?: string;
  opacity?: number;
  fontWeight?: string;
  textBaseline?: string;
}

export interface RectangleColliderData {
  labelCollider?: string;
  offset: Vec2;
  size: SizeRect;
  layerMask?: string;
}

export interface CircleColliderData {
  labelCollider?: string;
  offset: Vec2;
  radius: number;
  layerMask?: string;
}

export type ColliderEntry =
  | { rectangleCollider: RectangleColliderData }
  | { circleCollider: CircleColliderData };

export interface RigidbodyData {
  type: 'Dynamic' | 'Static' | 'Kinematic';
  mass: number;
}

// Graphics
export interface GraphicsBaseData {
  borderColor?: string;
  backgroundColor?: string;
  opacity?: number;
  borderWidth?: number;
}
export interface RectangleComponentData extends GraphicsBaseData { x: number; y: number; width: number; height: number; }
export interface RoundedRectangleComponentData extends GraphicsBaseData { x: number; y: number; width: number; height: number; radius: number; }
export interface CircleComponentData extends GraphicsBaseData { x: number; y: number; radius: number; }
export interface FreestyleLineEntry { xToDraw: number; yToDraw: number; radius?: number; startAngle?: number; endAngle?: number; anticlockwise?: boolean; }
export interface FreestyleGraphicComponentData extends GraphicsBaseData { allLines: FreestyleLineEntry[]; }

// Tweens
export interface TweenBaseData {
  totalTime: number;
  pointInitialState: Vec2;
  pointEndingState: Vec2;
  option: 'move' | 'scale' | 'rotate' | 'opacity' | 'callback';
  gameObjectNameToAct: string;
}
export interface BezierTweenData extends TweenBaseData { p1: Vec2; p2: Vec2; }
export interface PointListTweenData extends TweenBaseData { 'point-list': Vec2[]; }
export type TweenEntry =
  | { bezier: BezierTweenData }
  | { 'bezier-cubic': BezierTweenData }
  | { lagrange: PointListTweenData }
  | { 'akima-cubic-spline': PointListTweenData }
  | { 'tween-configuration': { 'execution-tween-mode': 'parallel' | 'sequence' } };

// Behaviour
export interface BehaviourEntry { nameClass: string; references?: Record<string, string>; [prop: string]: unknown; }

// Particles
export interface ParticleEntryData {
  startAtMilliseconds?: number;
  duration: number;
  color: string;
  nameImages: string[];
  config: string;
}

// Sound
export interface SoundComponentData {
  soundNames: string[];
  sprite?: Record<string, [number, number] | [number, number, boolean]>;
}

// Animation sprite
export interface SpriteAnimationEntryData {
  nameAnimation: string;
  nameImageFileList: string[];
  animationSpeed: number;
  color: string;
}

// ── GameObject ──────────────────────────────────────────────────────────────

export interface GameObjectData {
  transform: TransformData;
  isEnabled: boolean;
  sprite?: SpriteData;
  textComponent?: TextComponentData;
  colliders?: ColliderEntry[];
  rigidbody?: RigidbodyData;
  tweenList?: TweenEntry[];
  particleList?: ParticleEntryData[];
  behaviourComponentList?: BehaviourEntry[];
  soundComponent?: SoundComponentData;
  spriteAnimation?: SpriteAnimationEntryData[];
  RectangleComponent?: RectangleComponentData;
  RoundedRectangleComponent?: RoundedRectangleComponentData;
  CircleComponent?: CircleComponentData;
  FreestyleGraphicComponent?: FreestyleGraphicComponentData;
}

// ── Scene ───────────────────────────────────────────────────────────────────

export interface GameConfiguration {
  width: number;
  height: number;
  gravity?: number;
  pools?: Record<string, string>;
}

export interface SceneData {
  gameConfiguration: GameConfiguration;
  [gameObjectName: string]: GameObjectData | GameConfiguration;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getGameObjects(scene: SceneData): [string, GameObjectData][] {
  return Object.entries(scene).filter(([k, v]) => k !== 'gameConfiguration' && v && (v as GameObjectData).transform) as [string, GameObjectData][];
}

export function getRootGameObjects(scene: SceneData): string[] {
  const allChildren = new Set<string>();
  for (const [, go] of getGameObjects(scene)) {
    for (const c of go.transform.childrenObjects) allChildren.add(c);
  }
  return getGameObjects(scene).map(([name]) => name).filter(n => !allChildren.has(n));
}

export const GRAPHICS_KEYS = ['RectangleComponent', 'RoundedRectangleComponent', 'CircleComponent', 'FreestyleGraphicComponent'] as const;
export type GraphicsKey = typeof GRAPHICS_KEYS[number];

export function getGraphicsKey(go: GameObjectData): GraphicsKey | undefined {
  return GRAPHICS_KEYS.find(k => k in go);
}
