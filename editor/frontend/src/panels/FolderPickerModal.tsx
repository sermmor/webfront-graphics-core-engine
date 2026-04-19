import { useEffect, useState, useCallback } from 'react';

interface FolderItem { name: string; path: string; }
interface RootItem   { name: string; path: string; }

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  onAccept: (path: string) => void;
}

async function fetchRoots(): Promise<RootItem[]> {
  const r = await fetch('/api/fs/roots');
  const d = await r.json();
  return d.roots ?? [];
}

async function fetchList(folderPath: string): Promise<{ folders: FolderItem[]; parent: string | null }> {
  const r = await fetch(`/api/fs/list?path=${encodeURIComponent(folderPath)}`);
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return { folders: d.folders ?? [], parent: d.parent ?? null };
}

// Split a path into breadcrumb segments keeping the drive/root as first part
function pathSegments(p: string): { label: string; path: string }[] {
  // Normalise separators to forward slashes for display
  const norm = p.replace(/\\/g, '/').replace(/\/+$/, '');
  const parts = norm.split('/').filter(Boolean);
  if (!parts.length) return [];

  // Windows: parts[0] === 'C:' → show as 'C:\'
  const segs: { label: string; path: string }[] = [];
  let accumulated = '';
  parts.forEach((part, i) => {
    // Windows drive letter: reconstruct with backslash
    if (i === 0 && /^[A-Z]:$/i.test(part)) {
      accumulated = part + '\\';
      segs.push({ label: part + '\\', path: accumulated });
    } else {
      accumulated = accumulated
        ? (accumulated.endsWith('\\') || accumulated.endsWith('/')
            ? accumulated + part
            : accumulated + '/' + part)
        : '/' + part;
      segs.push({ label: part, path: accumulated });
    }
  });
  return segs;
}

export default function FolderPickerModal({ isOpen, onClose, onAccept }: Props) {
  const [roots,       setRoots]       = useState<RootItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string | null>(null); // null = root screen
  const [folders,     setFolders]     = useState<FolderItem[]>([]);
  const [parent,      setParent]      = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const isAtRoot = currentPath === null;

  // Reset & load roots every time the dialog opens
  useEffect(() => {
    if (!isOpen) return;
    setCurrentPath(null);
    setFolders([]);
    setParent(null);
    setError(null);
    setIsLoading(true);
    fetchRoots()
      .then(r => { setRoots(r); setIsLoading(false); })
      .catch(e => { setError(e.message); setIsLoading(false); });
  }, [isOpen]);

  const navigateTo = useCallback((folderPath: string) => {
    setIsLoading(true);
    setError(null);
    fetchList(folderPath)
      .then(({ folders, parent }) => {
        setFolders(folders);
        setParent(parent);
        setCurrentPath(folderPath);
        setIsLoading(false);
      })
      .catch(e => { setError(e.message); setIsLoading(false); });
  }, []);

  const handleGoUp = () => {
    if (parent === null) {
      setCurrentPath(null);
      setFolders([]);
      setParent(null);
    } else {
      navigateTo(parent);
    }
  };

  if (!isOpen) return null;

  const segments = currentPath ? pathSegments(currentPath) : [];

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.dialog}>

        {/* Title */}
        <div style={styles.title}>📂 Seleccionar carpeta de proyecto</div>

        {/* Breadcrumb bar */}
        <div style={styles.breadcrumb}>
          <button style={styles.crumbBtn} onClick={() => { setCurrentPath(null); setFolders([]); }}>
            🏠
          </button>
          {segments.map((seg, i) => (
            <span key={seg.path} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>›</span>
              <button
                style={{ ...styles.crumbBtn, fontWeight: i === segments.length - 1 ? 700 : 400 }}
                disabled={i === segments.length - 1}
                onClick={() => navigateTo(seg.path)}
              >
                {seg.label}
              </button>
            </span>
          ))}
        </div>

        {/* Folder list */}
        <div style={styles.listBox}>
          {isLoading && (
            <div style={styles.centerMsg}>Cargando…</div>
          )}
          {!isLoading && error && (
            <div style={{ ...styles.centerMsg, color: 'var(--stop)' }}>⚠ {error}</div>
          )}
          {!isLoading && !error && isAtRoot && roots.map(root => (
            <button key={root.path} style={styles.item} onClick={() => navigateTo(root.path)}>
              <span style={styles.itemIcon}>💾</span>
              <span>{root.name}</span>
            </button>
          ))}
          {!isLoading && !error && !isAtRoot && (
            <>
              <button style={{ ...styles.item, ...styles.itemUp }} onClick={handleGoUp}>
                <span style={styles.itemIcon}>⬆</span>
                <span style={{ color: 'var(--text-dim)' }}>..</span>
              </button>
              {folders.map(f => (
                <button key={f.path} style={styles.item} onClick={() => navigateTo(f.path)}>
                  <span style={styles.itemIcon}>📁</span>
                  <span>{f.name}</span>
                </button>
              ))}
              {folders.length === 0 && (
                <div style={styles.centerMsg}>Esta carpeta no tiene subcarpetas</div>
              )}
            </>
          )}
        </div>

        {/* Selected path display */}
        <div style={styles.selectedPath}>
          <span style={{ color: 'var(--text-dim)' }}>Ruta seleccionada: </span>
          <span style={{ fontFamily: 'monospace', color: currentPath ? 'var(--text-hi)' : 'var(--text-dim)' }}>
            {currentPath ?? '—'}
          </span>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button className="btn" style={{ minWidth: 80 }} onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            style={{ minWidth: 80 }}
            disabled={currentPath === null}
            onClick={() => { if (currentPath) { onAccept(currentPath); onClose(); } }}
          >
            Aceptar
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Inline styles (uses CSS variables from App.css) ────────────────────────
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dialog: {
    background: 'var(--bg1)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    width: 520,
    maxWidth: '95vw',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  title: {
    padding: '12px 16px',
    fontWeight: 700,
    fontSize: 13,
    borderBottom: '1px solid var(--border)',
    background: 'var(--panel-header)',
  },
  breadcrumb: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2,
    padding: '6px 12px',
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
    minHeight: 32,
  },
  crumbBtn: {
    background: 'none', border: 'none', color: 'var(--accent)',
    cursor: 'pointer', fontSize: 11, padding: '1px 4px', borderRadius: 3,
  },
  listBox: {
    minHeight: 220, maxHeight: 320, overflowY: 'auto',
    background: 'var(--bg1)',
  },
  item: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', textAlign: 'left',
    background: 'none', border: 'none',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 12,
    padding: '7px 16px', cursor: 'pointer',
  },
  itemUp: { color: 'var(--text-dim)' },
  itemIcon: { fontSize: 14, lineHeight: 1, flexShrink: 0 },
  centerMsg: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 80, color: 'var(--text-dim)', fontSize: 12,
  },
  selectedPath: {
    padding: '6px 16px',
    fontSize: 11,
    borderTop: '1px solid var(--border)',
    background: 'var(--bg2)',
    wordBreak: 'break-all',
  },
  actions: {
    display: 'flex', justifyContent: 'flex-end', gap: 8,
    padding: '10px 16px',
    borderTop: '1px solid var(--border)',
    background: 'var(--panel-header)',
  },
};
