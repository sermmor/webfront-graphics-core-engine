const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { glob } = require('glob');
const mime = require('mime-types');
const { spawn } = require('child_process');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── State ──────────────────────────────────────────────────────────────────
let playProcess = null;

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Project ────────────────────────────────────────────────────────────────
app.get('/api/project', async (req, res) => {
  const { projectPath } = req.query;
  if (!projectPath) return res.status(400).json({ error: 'projectPath required' });

  try {
    const normalizedPath = path.normalize(String(projectPath));
    if (!(await fs.pathExists(normalizedPath))) {
      return res.status(404).json({ error: 'Project path not found' });
    }

    const IGNORE = ['node_modules/**', 'dist/**', '.git/**', '.cache/**'];

    // Scene JSON files: any JSON that has a "gameConfiguration" key
    const jsonFiles = await glob('**/*.json', { cwd: normalizedPath, ignore: IGNORE });
    const scenes = [];
    for (const f of jsonFiles) {
      try {
        const content = await fs.readJson(path.join(normalizedPath, f));
        if (content.gameConfiguration) scenes.push(f.replace(/\\/g, '/'));
      } catch { /* skip */ }
    }

    // Asset files
    const ASSET_EXT = new Set(['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp3', '.ogg', '.wav', '.json']);
    const allFiles = await glob('**/*', { cwd: normalizedPath, ignore: IGNORE, nodir: true });
    const assets = allFiles
      .filter(f => ASSET_EXT.has(path.extname(f).toLowerCase()))
      .map(f => f.replace(/\\/g, '/'));

    // Optional editor config
    let config = {};
    const cfgPath = path.join(normalizedPath, '.graphics-editor.json');
    if (await fs.pathExists(cfgPath)) config = await fs.readJson(cfgPath);

    res.json({ scenes, assets, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Scene read/write ───────────────────────────────────────────────────────
app.get('/api/scene', async (req, res) => {
  const { projectPath, scenePath } = req.query;
  if (!projectPath || !scenePath) return res.status(400).json({ error: 'projectPath and scenePath required' });
  try {
    const data = await fs.readJson(path.join(path.normalize(String(projectPath)), String(scenePath)));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scene', async (req, res) => {
  const { projectPath, scenePath } = req.query;
  if (!projectPath || !scenePath) return res.status(400).json({ error: 'projectPath and scenePath required' });
  try {
    const fullPath = path.join(path.normalize(String(projectPath)), String(scenePath));
    await fs.writeJson(fullPath, req.body, { spaces: '\t' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Asset serving ──────────────────────────────────────────────────────────
app.get('/api/asset', async (req, res) => {
  const { projectPath, name } = req.query;
  if (!projectPath || !name) return res.status(400).json({ error: 'projectPath and name required' });
  try {
    const base = path.normalize(String(projectPath));
    const matches = await glob(`**/${name}`, {
      cwd: base,
      ignore: ['node_modules/**', 'dist/**', '.git/**'],
      absolute: true,
      nodir: true,
    });
    if (!matches.length) return res.status(404).send('Asset not found');

    const filePath = matches[0];
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=60');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Play mode ──────────────────────────────────────────────────────────────
app.post('/api/play/start', async (req, res) => {
  const { projectPath, command, playUrl, readyDelay = 3000 } = req.body;

  if (playProcess) { playProcess.kill('SIGTERM'); playProcess = null; }

  if (!command) return res.json({ ok: true, mode: 'preview' });

  try {
    playProcess = spawn(command, [], {
      cwd: path.normalize(String(projectPath)),
      shell: true,
      stdio: 'pipe',
    });
    playProcess.stdout.on('data', d => process.stdout.write(`[PLAY] ${d}`));
    playProcess.stderr.on('data', d => process.stderr.write(`[PLAY] ${d}`));
    playProcess.on('exit', () => { playProcess = null; });

    await new Promise(r => setTimeout(r, Number(readyDelay)));
    res.json({ ok: true, mode: 'external', playUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/play/stop', (_req, res) => {
  if (playProcess) { playProcess.kill('SIGTERM'); playProcess = null; }
  res.json({ ok: true });
});

// ── Visual preview page (served inside the Play iframe) ───────────────────
app.get('/preview', (req, res) => {
  const { projectPath, scenePath } = req.query;

  // language=HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Game Preview</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#111; display:flex; align-items:center; justify-content:center; height:100vh; overflow:hidden; }
    #msg { color:#888; font-family:sans-serif; font-size:14px; position:absolute; top:8px; left:8px; }
  </style>
</head>
<body>
<div id="msg">Loading preview…</div>
<div id="container"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.3.12/pixi.min.js"></script>
<script>
const API = 'http://localhost:${PORT}';
const projectPath = ${JSON.stringify(projectPath || '')};
const scenePath   = ${JSON.stringify(scenePath   || '')};

function parseColor(str) {
  if (!str) return { hex: 0xffffff, alpha: 1 };
  const m = str.match(/\\((\\d+),\\s*(\\d+),\\s*(\\d+),\\s*([\\d.]+)\\)/);
  if (m) return { hex:(+m[1]<<16)|(+m[2]<<8)|+m[3], alpha:+m[4] };
  return { hex: parseInt(str.replace('#',''), 16)||0xffffff, alpha: 1 };
}

async function main() {
  const msg = document.getElementById('msg');
  const resp = await fetch(API+'/api/scene?projectPath='+encodeURIComponent(projectPath)+'&scenePath='+encodeURIComponent(scenePath));
  if (!resp.ok) { msg.textContent = 'Could not load scene: '+scenePath; return; }
  const scene = await resp.json();
  const cfg = scene.gameConfiguration || {};
  const SW = cfg.width  || 690;
  const SH = cfg.height || 388;

  const scale = Math.min(window.innerWidth / SW, window.innerHeight / SH);
  const app = new PIXI.Application({ width: SW*scale, height: SH*scale, backgroundColor: 0x111111, resolution: 1 });
  document.getElementById('container').appendChild(app.view);

  const root = new PIXI.Container();
  root.sortableChildren = true;
  root.scale.set(scale);
  app.stage.addChild(root);
  msg.textContent = '';

  const entries = Object.entries(scene).filter(([k]) => k !== 'gameConfiguration' && scene[k] && scene[k].transform);
  const containers = {};

  // Sort: higher z rendered first (further back)
  const sorted = [...entries].sort((a,b) => (b[1].transform?.position?.z??0) - (a[1].transform?.position?.z??0));

  for (const [name, go] of sorted) {
    if (!go.isEnabled) continue;
    const c = new PIXI.Container();
    c.sortableChildren = true;
    c.zIndex = -(go.transform?.position?.z ?? 0);
    c.position.set(go.transform?.position?.x ?? 0, go.transform?.position?.y ?? 0);
    c.scale.set(go.transform?.scale?.x ?? 1, go.transform?.scale?.y ?? 1);
    if (go.transform?.rotation) c.rotation = go.transform.rotation;

    // Sprite
    if (go.sprite) {
      try {
        const url = API+'/api/asset?projectPath='+encodeURIComponent(projectPath)+'&name='+encodeURIComponent(go.sprite.nameImage);
        const tex = await PIXI.Texture.fromURL(url);
        const sp = new PIXI.Sprite(tex);
        sp.anchor.set(0.5, 0.5);
        const col = parseColor(go.sprite.color);
        if (col.hex !== 0xffffff) sp.tint = col.hex;
        sp.alpha = col.alpha;
        c.addChild(sp);
      } catch(e) { /* placeholder */ }
    }

    // Text
    if (go.textComponent) {
      const tc = go.textComponent;
      const txt = new PIXI.Text(String(tc.textValue ?? ''), new PIXI.TextStyle({
        fontSize: tc.fontSize ?? 14,
        fontFamily: tc.fontFamily ?? 'Arial',
        fill: tc.fill ?? '#ffffff',
        fontWeight: tc.fontWeight ?? 'normal',
        align: tc.align ?? 'center',
      }));
      txt.anchor.set(0.5, 0.5);
      txt.alpha = tc.opacity ?? 1;
      c.addChild(txt);
    }

    // Graphics
    const GFX_KEYS = ['RectangleComponent','RoundedRectangleComponent','CircleComponent','FreestyleGraphicComponent'];
    for (const key of GFX_KEYS) {
      if (!go[key]) continue;
      const gd = go[key];
      const g = new PIXI.Graphics();
      if (gd.backgroundColor) g.beginFill(parseColor(gd.backgroundColor).hex, gd.opacity??1);
      if (gd.borderColor && (gd.borderWidth??1) > 0) g.lineStyle(gd.borderWidth??1, parseColor(gd.borderColor).hex);
      if (key === 'RectangleComponent') g.drawRect(gd.x??0, gd.y??0, gd.width??50, gd.height??50);
      if (key === 'RoundedRectangleComponent') g.drawRoundedRect(gd.x??0, gd.y??0, gd.width??50, gd.height??50, gd.radius??5);
      if (key === 'CircleComponent') g.drawCircle(gd.x??0, gd.y??0, gd.radius??25);
      g.endFill();
      c.addChild(g);
      break;
    }

    containers[name] = c;
    root.addChild(c);
  }

  // Build parent-child hierarchy
  for (const [name, go] of entries) {
    const children = go.transform?.childrenObjects ?? [];
    if (!children.length) continue;
    const parentC = containers[name];
    if (!parentC) continue;
    for (const childName of children) {
      const childC = containers[childName];
      if (!childC) continue;
      root.removeChild(childC);
      parentC.addChild(childC);
    }
  }
}

main().catch(e => { document.getElementById('msg').textContent = 'Error: '+e.message; console.error(e); });
</script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Editor backend → http://localhost:${PORT}`);
});
