import { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useEditorStore } from '../store/editorStore';
import { getGameObjects, GameObjectData, getGraphicsKey, ColliderEntry, RectangleColliderData, CircleColliderData } from '../types/scene';
import { parseColor } from '../utils/colorUtils';
import { assetUrl, deepClone } from '../utils/sceneUtils';

// ── Constants ───────────────────────────────────────────────────────────────
const COLLIDER_COLOR   = 0x44ff88;
const COLLIDER_ALPHA   = 0.55;
const COLLIDER_FILL    = 0x44ff88;
const COLLIDER_FILL_A  = 0.10;
const SELECT_COLOR     = 0x4a9eff;
const HANDLE_SIZE      = 6;
const HANDLE_COLOR     = 0xffffff;
const HANDLE_SELECT    = 0x4a9eff;

// ── Types ───────────────────────────────────────────────────────────────────
type DragState = {
  active: boolean;
  goName: string;
  startPointerX: number;
  startPointerY: number;
  startGoX: number;
  startGoY: number;
};

type HandleDragState = {
  active: boolean;
  goName: string;
  colliderIdx: number;
  handleType: 'rect-right' | 'rect-bottom' | 'rect-left' | 'rect-top' |
               'rect-br' | 'rect-bl' | 'rect-tr' | 'rect-tl' |
               'circle-radius';
  startPointerX: number;
  startPointerY: number;
  startValue: number;  // width, height or radius at drag start
  startValue2: number; // for offset.x when resizing left/top
};

export default function Viewport() {
  const wrapRef    = useRef<HTMLDivElement>(null);
  const appRef     = useRef<PIXI.Application | null>(null);
  const scaleRef   = useRef(1);
  const originRef  = useRef({ x: 0, y: 0 }); // canvas top-left in wrap coords
  const goContRef  = useRef<Map<string, PIXI.Container>>(new Map());
  const colliderLayerRef = useRef<PIXI.Graphics | null>(null);
  const handleLayerRef   = useRef<PIXI.Container | null>(null);
  const selBoxRef        = useRef<PIXI.Graphics | null>(null);
  const dragRef    = useRef<DragState>({ active: false, goName: '', startPointerX: 0, startPointerY: 0, startGoX: 0, startGoY: 0 });
  const handleDragRef = useRef<HandleDragState>({ active: false, goName: '', colliderIdx: 0, handleType: 'rect-right', startPointerX: 0, startPointerY: 0, startValue: 0, startValue2: 0 });

  const {
    sceneData, projectPath, selectedGameObjectName, playMode, playUrl,
    selectGameObject, updateComponent,
  } = useEditorStore();

  // ── Scene-to-screen helpers ────────────────────────────────────────────
  const toScreen = useCallback((sx: number, sy: number) => ({
    x: sx * scaleRef.current + originRef.current.x,
    y: sy * scaleRef.current + originRef.current.y,
  }), []);

  const toScene = useCallback((px: number, py: number) => ({
    x: (px - originRef.current.x) / scaleRef.current,
    y: (py - originRef.current.y) / scaleRef.current,
  }), []);

  // ── Initialize PixiJS ──────────────────────────────────────────────────
  useEffect(() => {
    if (!wrapRef.current || !sceneData) return;

    const wrap = wrapRef.current;
    const scW  = sceneData.gameConfiguration?.width  ?? 690;
    const scH  = sceneData.gameConfiguration?.height ?? 388;

    const fitScale = () => Math.min(
      (wrap.clientWidth  - 4) / scW,
      (wrap.clientHeight - 4) / scH
    );

    const scale = fitScale();
    scaleRef.current = scale;

    const canvasW = Math.floor(scW * scale);
    const canvasH = Math.floor(scH * scale);
    originRef.current = {
      x: Math.floor((wrap.clientWidth  - canvasW) / 2),
      y: Math.floor((wrap.clientHeight - canvasH) / 2),
    };

    // Destroy old app
    if (appRef.current) { appRef.current.destroy(true); appRef.current = null; }
    goContRef.current.clear();

    const app = new PIXI.Application({
      width: canvasW, height: canvasH,
      backgroundColor: 0x111116,
      resolution: 1,
      autoDensity: false,
    });
    appRef.current = app;
    wrap.appendChild(app.view as HTMLCanvasElement);

    // Stage: a scaled container matching scene units
    const stage = new PIXI.Container();
    stage.sortableChildren = true;
    stage.scale.set(scale);
    app.stage.addChild(stage);

    // Collider overlay layer (above everything)
    const colliderLayer = new PIXI.Graphics();
    colliderLayer.zIndex = 9000;
    stage.addChild(colliderLayer);
    colliderLayerRef.current = colliderLayer;

    // Handle layer (draggable handles)
    const handleLayer = new PIXI.Container();
    handleLayer.zIndex = 9001;
    stage.addChild(handleLayer);
    handleLayerRef.current = handleLayer;

    // Selection box
    const selBox = new PIXI.Graphics();
    selBox.zIndex = 8999;
    stage.addChild(selBox);
    selBoxRef.current = selBox;

    // Render scene objects
    renderObjects(app, stage);

    // Stage-level pointer events for drag
    app.stage.interactive = true;
    app.stage.hitArea = new PIXI.Rectangle(0, 0, canvasW, canvasH);

    app.stage.on('pointermove', onPointerMove);
    app.stage.on('pointerup',   onPointerUp);
    app.stage.on('pointerupoutside', onPointerUp);

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (!appRef.current || !wrapRef.current || !sceneData) return;
      const newScale = fitScale();
      scaleRef.current = newScale;
      const nW = Math.floor(scW * newScale);
      const nH = Math.floor(scH * newScale);
      originRef.current = {
        x: Math.floor((wrapRef.current.clientWidth  - nW) / 2),
        y: Math.floor((wrapRef.current.clientHeight - nH) / 2),
      };
      app.renderer.resize(nW, nH);
      stage.scale.set(newScale);
      app.stage.hitArea = new PIXI.Rectangle(0, 0, nW, nH);
    });
    ro.observe(wrap);

    return () => {
      ro.disconnect();
      app.stage.off('pointermove', onPointerMove);
      app.stage.off('pointerup',   onPointerUp);
      app.stage.off('pointerupoutside', onPointerUp);
      app.destroy(true);
      appRef.current = null;
      goContRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneData?.gameConfiguration?.width, sceneData?.gameConfiguration?.height, projectPath]);

  // ── Re-render objects when scene changes ──────────────────────────────
  useEffect(() => {
    if (!appRef.current || !sceneData) return;
    const app  = appRef.current;
    const stage = app.stage.children.find(c => c instanceof PIXI.Container) as PIXI.Container | undefined;
    if (!stage) return;
    renderObjects(app, stage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneData]);

  // ── Re-draw overlays when selection changes ────────────────────────────
  useEffect(() => {
    drawOverlays();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGameObjectName, sceneData]);

  // ── Render all scene objects ───────────────────────────────────────────
  function renderObjects(app: PIXI.Application, stage: PIXI.Container) {
    if (!sceneData) return;

    // Remove old GO containers (keep overlay layers)
    const toRemove = [...stage.children].filter(
      c => c !== colliderLayerRef.current && c !== handleLayerRef.current && c !== selBoxRef.current
    );
    toRemove.forEach(c => stage.removeChild(c));
    goContRef.current.clear();

    const entries = getGameObjects(sceneData);

    // Sort: descending z (further back first)
    const sorted = [...entries].sort((a, b) =>
      (b[1].transform?.position?.z ?? 0) - (a[1].transform?.position?.z ?? 0)
    );

    for (const [name, go] of sorted) {
      buildGoContainer(name, go, stage, app);
    }

    // Build parent-child hierarchy
    for (const [name, go] of entries) {
      const children = go.transform?.childrenObjects ?? [];
      if (!children.length) continue;
      const parentC = goContRef.current.get(name);
      if (!parentC) continue;
      for (const childName of children) {
        const childC = goContRef.current.get(childName);
        if (!childC) continue;
        if (childC.parent !== parentC) {
          childC.parent?.removeChild(childC);
          parentC.addChild(childC);
        }
      }
    }

    drawOverlays();
  }

  function buildGoContainer(name: string, go: GameObjectData, stage: PIXI.Container, app: PIXI.Application) {
    const c = new PIXI.Container();
    c.sortableChildren = true;
    c.zIndex = -(go.transform?.position?.z ?? 0);
    c.position.set(go.transform?.position?.x ?? 0, go.transform?.position?.y ?? 0);
    c.scale.set(go.transform?.scale?.x ?? 1, go.transform?.scale?.y ?? 1);
    if (go.transform?.rotation) c.rotation = go.transform.rotation;
    c.visible = go.isEnabled;

    // ── Visual element ──────────────────────────────────────────────────
    if (go.sprite) {
      const url = assetUrl(projectPath, go.sprite.nameImage);
      const tex = PIXI.utils.TextureCache[url] || PIXI.Texture.EMPTY;
      const sp = new PIXI.Sprite(tex);
      sp.anchor.set(0.5, 0.5);
      const col = parseColor(go.sprite.color);
      if (col.hex !== 0xffffff) sp.tint = col.hex;
      sp.alpha = col.alpha;
      c.addChild(sp);

      // Load async and update
      if (tex === PIXI.Texture.EMPTY) {
        PIXI.Texture.fromURL(url).then(t => {
          sp.texture = t;
          app.renderer.render(app.stage);
        }).catch(() => {
          // Placeholder square
          const ph = new PIXI.Graphics();
          ph.lineStyle(1, 0x888888);
          ph.drawRect(-24, -24, 48, 48);
          ph.endFill();
          c.addChild(ph);
        });
      }
    }

    if (go.textComponent) {
      const tc = go.textComponent;
      const style = new PIXI.TextStyle({
        fontSize: tc.fontSize ?? 14,
        fontFamily: tc.fontFamily ?? 'Arial',
        fill: tc.fill ?? '#ffffff',
        fontWeight: (tc.fontWeight ?? 'normal') as string,
        align: (tc.align ?? 'center') as string,
      });
      const txt = new PIXI.Text(String(tc.textValue ?? ''), style);
      txt.anchor.set(0.5, 0.5);
      txt.alpha = tc.opacity ?? 1;
      c.addChild(txt);
    }

    const gKey = getGraphicsKey(go);
    if (gKey) {
      const gd = (go as unknown as Record<string, unknown>)[gKey] as Record<string, unknown>;
      const g = new PIXI.Graphics();
      const bc = gd.backgroundColor ? parseColor(String(gd.backgroundColor)) : null;
      const lc = gd.borderColor ? parseColor(String(gd.borderColor)) : null;
      const bw = Number(gd.borderWidth ?? 1);
      const op = Number(gd.opacity ?? 1);
      if (lc && bw > 0) g.lineStyle(bw, lc.hex, lc.alpha);
      if (bc) g.beginFill(bc.hex, bc.alpha * op);
      if (gKey === 'RectangleComponent') g.drawRect(Number(gd.x ?? 0), Number(gd.y ?? 0), Number(gd.width ?? 50), Number(gd.height ?? 50));
      if (gKey === 'RoundedRectangleComponent') g.drawRoundedRect(Number(gd.x ?? 0), Number(gd.y ?? 0), Number(gd.width ?? 50), Number(gd.height ?? 50), Number(gd.radius ?? 5));
      if (gKey === 'CircleComponent') g.drawCircle(Number(gd.x ?? 0), Number(gd.y ?? 0), Number(gd.radius ?? 25));
      g.endFill();
      c.addChild(g);
    }

    // Invisible GOs: draw a tiny marker so they're clickable
    if (!go.sprite && !go.textComponent && !gKey) {
      const marker = new PIXI.Graphics();
      marker.lineStyle(1, 0x555566);
      marker.drawCircle(0, 0, 6);
      c.addChild(marker);
    }

    // ── Hit area for interaction ────────────────────────────────────────
    c.interactive = true;
    c.buttonMode  = true;
    c.on('pointerdown', (e: PIXI.InteractionEvent) => {
      e.stopPropagation();
      selectGameObject(name);
      // Start drag
      const gp = e.data.global;
      const goData = sceneData?.[name] as GameObjectData;
      dragRef.current = {
        active: true,
        goName: name,
        startPointerX: gp.x,
        startPointerY: gp.y,
        startGoX: goData?.transform?.position?.x ?? 0,
        startGoY: goData?.transform?.position?.y ?? 0,
      };
    });

    goContRef.current.set(name, c);
    stage.addChild(c);
  }

  // ── Pointer move: handles drag ─────────────────────────────────────────
  const onPointerMove = useCallback((e: PIXI.InteractionEvent) => {
    const gp = e.data.global;
    const scale = scaleRef.current;

    // Handle drag (resizing collider)
    if (handleDragRef.current.active) {
      const h = handleDragRef.current;
      const dx = (gp.x - h.startPointerX) / scale;
      const dy = (gp.y - h.startPointerY) / scale;
      const go = sceneData?.[h.goName] as GameObjectData | undefined;
      if (!go?.colliders) return;
      const colliders = deepClone(go.colliders);
      const entry = colliders[h.colliderIdx];
      if ('rectangleCollider' in entry) {
        const rc = entry.rectangleCollider;
        if (h.handleType === 'rect-right')  rc.size.width  = Math.max(2, h.startValue  + dx);
        if (h.handleType === 'rect-bottom') rc.size.height = Math.max(2, h.startValue  + dy);
        if (h.handleType === 'rect-left')   { rc.size.width  = Math.max(2, h.startValue - dx); rc.offset.x = h.startValue2 + dx; }
        if (h.handleType === 'rect-top')    { rc.size.height = Math.max(2, h.startValue - dy); rc.offset.y = h.startValue2 + dy; }
        if (h.handleType === 'rect-br')     { rc.size.width = Math.max(2, h.startValue + dx); rc.size.height = Math.max(2, h.startValue2 + dy); }
        if (h.handleType === 'rect-bl')     { rc.size.width = Math.max(2, h.startValue - dx); rc.offset.x = (go.colliders[h.colliderIdx] as { rectangleCollider: RectangleColliderData }).rectangleCollider.offset.x + dx; rc.size.height = Math.max(2, h.startValue2 + dy); }
        if (h.handleType === 'rect-tr')     { rc.size.width = Math.max(2, h.startValue + dx); rc.size.height = Math.max(2, h.startValue2 - dy); rc.offset.y = (go.colliders[h.colliderIdx] as { rectangleCollider: RectangleColliderData }).rectangleCollider.offset.y + dy; }
        if (h.handleType === 'rect-tl')     { rc.size.width = Math.max(2, h.startValue - dx); rc.offset.x = (go.colliders[h.colliderIdx] as { rectangleCollider: RectangleColliderData }).rectangleCollider.offset.x + dx; rc.size.height = Math.max(2, h.startValue2 - dy); rc.offset.y = (go.colliders[h.colliderIdx] as { rectangleCollider: RectangleColliderData }).rectangleCollider.offset.y + dy; }
      } else if ('circleCollider' in entry) {
        const cc = entry.circleCollider;
        if (h.handleType === 'circle-radius') cc.radius = Math.max(2, h.startValue + dx);
      }
      updateComponent(h.goName, 'colliders', colliders);
      return;
    }

    // GO drag (move)
    if (dragRef.current.active) {
      const d = dragRef.current;
      const dx = (gp.x - d.startPointerX) / scale;
      const dy = (gp.y - d.startPointerY) / scale;
      const go = sceneData?.[d.goName] as GameObjectData | undefined;
      if (!go) return;
      const transform = deepClone(go.transform);
      transform.position.x = Math.round((d.startGoX + dx) * 10) / 10;
      transform.position.y = Math.round((d.startGoY + dy) * 10) / 10;
      updateComponent(d.goName, 'transform', transform);
    }
  }, [sceneData, updateComponent]);

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
    handleDragRef.current.active = false;
  }, []);

  // ── Draw collider overlays + selection box + handles ───────────────────
  function drawOverlays() {
    const cl = colliderLayerRef.current;
    const hl = handleLayerRef.current;
    const sb = selBoxRef.current;
    if (!cl || !hl || !sb || !sceneData) return;

    cl.clear();
    hl.removeChildren();
    sb.clear();

    const entries = getGameObjects(sceneData);

    for (const [name, go] of entries) {
      if (!go.isEnabled || !go.colliders?.length) continue;
      const isSelected = name === selectedGameObjectName;
      const wx = go.transform?.position?.x ?? 0;
      const wy = go.transform?.position?.y ?? 0;
      const sx = go.transform?.scale?.x ?? 1;
      const sy = go.transform?.scale?.y ?? 1;

      go.colliders.forEach((entry: ColliderEntry, idx: number) => {
        if ('rectangleCollider' in entry) {
          const rc: RectangleColliderData = entry.rectangleCollider;
          const x  = wx + rc.offset.x - rc.size.width  / 2;
          const y  = wy + rc.offset.y - rc.size.height / 2;
          const w  = rc.size.width  * sx;
          const h  = rc.size.height * sy;

          cl.lineStyle(1.5 / scaleRef.current, COLLIDER_COLOR, COLLIDER_ALPHA);
          cl.beginFill(COLLIDER_FILL, isSelected ? 0.18 : COLLIDER_FILL_A);
          cl.drawRect(x, y, w, h);
          cl.endFill();

          if (isSelected) drawRectHandles(name, idx, x, y, w, h);
        }

        if ('circleCollider' in entry) {
          const cc: CircleColliderData = entry.circleCollider;
          const cx = wx + cc.offset.x;
          const cy = wy + cc.offset.y;
          const r  = cc.radius * Math.max(sx, sy);

          cl.lineStyle(1.5 / scaleRef.current, COLLIDER_COLOR, COLLIDER_ALPHA);
          cl.beginFill(COLLIDER_FILL, isSelected ? 0.18 : COLLIDER_FILL_A);
          cl.drawCircle(cx, cy, r);
          cl.endFill();

          if (isSelected) drawCircleHandle(name, idx, cx, cy, r);
        }
      });

      // Selection bounding box
      if (isSelected && !go.colliders?.length) {
        drawSelectionBox(name, go);
      }
    }

    // Also draw selection box if selected GO has no colliders
    if (selectedGameObjectName) {
      const go = sceneData[selectedGameObjectName] as GameObjectData | undefined;
      if (go && !go.colliders?.length) drawSelectionBox(selectedGameObjectName, go);
    }
  }

  function drawSelectionBox(name: string, go: GameObjectData) {
    const sb = selBoxRef.current;
    if (!sb) return;
    const wx = go.transform?.position?.x ?? 0;
    const wy = go.transform?.position?.y ?? 0;
    // Simple 24x24 selection indicator around origin
    sb.lineStyle(1 / scaleRef.current, SELECT_COLOR, 0.8);
    sb.drawRect(wx - 20, wy - 20, 40, 40);
    void name; // suppress lint
  }

  function drawRectHandles(goName: string, colliderIdx: number, x: number, y: number, w: number, h: number) {
    const hl = handleLayerRef.current;
    if (!hl) return;
    const hs = HANDLE_SIZE / scaleRef.current;

    type RectHandleType = HandleDragState['handleType'];
    const handles: Array<{ hx: number; hy: number; type: RectHandleType }> = [
      { hx: x + w,       hy: y + h / 2, type: 'rect-right' },
      { hx: x + w / 2,   hy: y + h,     type: 'rect-bottom' },
      { hx: x,           hy: y + h / 2, type: 'rect-left' },
      { hx: x + w / 2,   hy: y,         type: 'rect-top' },
      { hx: x + w,       hy: y + h,     type: 'rect-br' },
      { hx: x,           hy: y + h,     type: 'rect-bl' },
      { hx: x + w,       hy: y,         type: 'rect-tr' },
      { hx: x,           hy: y,         type: 'rect-tl' },
    ];

    handles.forEach(({ hx, hy, type }) => {
      const g = new PIXI.Graphics();
      g.beginFill(HANDLE_COLOR);
      g.lineStyle(1 / scaleRef.current, HANDLE_SELECT, 1);
      g.drawRect(hx - hs / 2, hy - hs / 2, hs, hs);
      g.endFill();
      g.interactive = true;
      g.buttonMode  = true;
      g.cursor = type.includes('right') || type.includes('left') ? 'ew-resize' : 'ns-resize';
      if (type.includes('br') || type.includes('tl')) g.cursor = 'nwse-resize';
      if (type.includes('bl') || type.includes('tr')) g.cursor = 'nesw-resize';

      g.on('pointerdown', (e: PIXI.InteractionEvent) => {
        e.stopPropagation();
        const go = sceneData?.[goName] as GameObjectData | undefined;
        if (!go?.colliders) return;
        const entry = go.colliders[colliderIdx];
        if (!('rectangleCollider' in entry)) return;
        const rc = entry.rectangleCollider;
        handleDragRef.current = {
          active: true,
          goName,
          colliderIdx,
          handleType: type,
          startPointerX: e.data.global.x,
          startPointerY: e.data.global.y,
          startValue:  type.includes('right') || type.includes('br') || type.includes('tr') ? rc.size.width : type.includes('left') || type.includes('bl') || type.includes('tl') ? rc.size.width : type.includes('top') ? rc.size.height : rc.size.height,
          startValue2: type.includes('br') || type.includes('bl') || type.includes('tr') || type.includes('tl') ? rc.size.height : 0,
        };
      });
      hl.addChild(g);
    });
  }

  function drawCircleHandle(goName: string, colliderIdx: number, cx: number, cy: number, r: number) {
    const hl = handleLayerRef.current;
    if (!hl) return;
    const hs = HANDLE_SIZE / scaleRef.current;

    const g = new PIXI.Graphics();
    g.beginFill(HANDLE_COLOR);
    g.lineStyle(1 / scaleRef.current, HANDLE_SELECT, 1);
    g.drawRect(cx + r - hs / 2, cy - hs / 2, hs, hs);
    g.endFill();
    g.interactive = true;
    g.buttonMode  = true;
    g.cursor = 'ew-resize';

    g.on('pointerdown', (e: PIXI.InteractionEvent) => {
      e.stopPropagation();
      const go = sceneData?.[goName] as GameObjectData | undefined;
      if (!go?.colliders) return;
      const entry = go.colliders[colliderIdx];
      if (!('circleCollider' in entry)) return;
      handleDragRef.current = {
        active: true,
        goName,
        colliderIdx,
        handleType: 'circle-radius',
        startPointerX: e.data.global.x,
        startPointerY: e.data.global.y,
        startValue:  entry.circleCollider.radius,
        startValue2: 0,
      };
    });
    hl.addChild(g);
  }

  // ── Render ─────────────────────────────────────────────────────────────
  if (!sceneData) {
    return (
      <div className="viewport panel" style={{ gridArea: 'viewport' }}>
        <div className="panel-header">Viewport</div>
        <div className="viewport-canvas-wrap" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-dim)' }}>Open a project and select a scene to start editing.</span>
        </div>
      </div>
    );
  }

  const scW = sceneData.gameConfiguration?.width ?? 690;
  const scH = sceneData.gameConfiguration?.height ?? 388;

  return (
    <div className="viewport panel" style={{ gridArea: 'viewport' }}>
      <div className="panel-header">
        <span>Viewport</span>
        <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>{scW} × {scH}</span>
      </div>
      <div className="viewport-canvas-wrap" ref={wrapRef}>
        {playMode !== 'stopped' && (
          <div className="viewport-play-overlay">
            <iframe src={playUrl} title="Game Play" />
          </div>
        )}
      </div>
    </div>
  );
}
