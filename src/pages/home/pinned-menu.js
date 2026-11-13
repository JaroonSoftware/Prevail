import { useEffect, useState } from 'react';
import nav from '../../nav';

export const PINNED_MAX = 10;
export const PINNED_EVENT = 'prevail:pinned-changed';
const storageKey = userId => 'prevail-menu-pinned:' + userId;
const validPaths = new Set(nav.filter(m => !m.type && m.to && !m.hidden && !['/menu', '/dashboard'].includes(m.to)).map(m => m.to));

export function readPinned(userId) {
  if (!userId) return [];
  try {
    const rows = JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
    return Array.isArray(rows) ? [...new Set(rows.filter(p => typeof p === 'string' && validPaths.has(p)))].slice(0, PINNED_MAX) : [];
  } catch { return []; }
}

export function togglePinned(userId, menuPath) {
  const list = readPinned(userId);
  if (!userId || !validPaths.has(menuPath)) return { list, error: true };
  const has = list.includes(menuPath);
  if (!has && list.length >= PINNED_MAX) return { list, full: true };
  const next = has ? list.filter(p => p !== menuPath) : [...list, menuPath];
  try { localStorage.setItem(storageKey(userId), JSON.stringify(next)); }
  catch { return { list, error: true }; }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(PINNED_EVENT, { detail: { userId: String(userId) } }));
  return { list: next, pinned: !has };
}

export function usePinnedMenus(userId) {
  const [state, setState] = useState(() => ({ userId, list: readPinned(userId) }));
  useEffect(() => {
    const refresh = () => setState({ userId, list: readPinned(userId) });
    const onPin = event => { if (event.detail?.userId === String(userId)) refresh(); };
    const onStorage = event => { if (event.key === storageKey(userId) || event.key === null) refresh(); };
    refresh();
    window.addEventListener(PINNED_EVENT, onPin);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(PINNED_EVENT, onPin);
      window.removeEventListener('storage', onStorage);
    };
  }, [userId]);
  return state.userId === userId ? state.list : readPinned(userId);
}
