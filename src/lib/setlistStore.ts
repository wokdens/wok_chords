export interface SetlistItem {
  slug: string;
  title: string;
  artist: string;
  key?: string;
  capo?: number;
  transpose?: number;
  addedAt: number;
}

const SETLIST_STORAGE_KEY = 'wokchords:favorites_setlist';
const SETLIST_EVENT_NAME = 'wokchords:setlist-change';

export function getSetlist(): SetlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(SETLIST_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSetlist(items: SetlistItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(SETLIST_EVENT_NAME, { detail: items }));
  } catch (err) {
    console.error('Failed to save setlist to localStorage:', err);
  }
}

export function isSongInSetlist(slug: string): boolean {
  if (!slug) return false;
  const list = getSetlist();
  return list.some((item) => item.slug === slug);
}

export function toggleSetlist(item: {
  slug: string;
  title: string;
  artist: string;
  key?: string;
  capo?: number;
  transpose?: number;
}): { added: boolean; list: SetlistItem[] } {
  const current = getSetlist();
  const existingIdx = current.findIndex((s) => s.slug === item.slug);

  let updated: SetlistItem[];
  let added = false;

  if (existingIdx >= 0) {
    // Remove if already in setlist
    updated = current.filter((s) => s.slug !== item.slug);
    added = false;
  } else {
    // Add to top of setlist with active key/capo settings
    const newItem: SetlistItem = {
      ...item,
      addedAt: Date.now(),
    };
    updated = [newItem, ...current];
    added = true;
  }

  saveSetlist(updated);
  return { added, list: updated };
}

export function removeFromSetlist(slug: string): SetlistItem[] {
  const current = getSetlist();
  const updated = current.filter((s) => s.slug !== slug);
  saveSetlist(updated);
  return updated;
}

export function reorderSetlist(fromIdx: number, toIdx: number): SetlistItem[] {
  const current = [...getSetlist()];
  if (fromIdx < 0 || fromIdx >= current.length || toIdx < 0 || toIdx >= current.length) {
    return current;
  }
  const [moved] = current.splice(fromIdx, 1);
  current.splice(toIdx, 0, moved);
  saveSetlist(current);
  return current;
}

export function clearSetlist(): void {
  saveSetlist([]);
}

export function formatSetlistForWhatsApp(items: SetlistItem[]): string {
  if (items.length === 0) return 'My WokChords Setlist is currently empty.';
  const lines = [
    '🎸 *WOKCHORDS LIVE SETLIST*',
    '-------------------------',
  ];
  items.forEach((s, idx) => {
    let meta = '';
    if (s.key) meta += ` [Key ${s.key}]`;
    if (s.capo && s.capo > 0) meta += ` (Capo ${s.capo})`;
    lines.push(`${idx + 1}. *${s.title}* - ${s.artist}${meta}`);
    lines.push(`   https://wokchords.wokdens.com/song/${s.slug}/?transpose=${s.transpose ?? 0}&capo=${s.capo ?? 0}`);
  });
  lines.push('-------------------------');
  lines.push('🎵 Built on https://wokchords.wokdens.com');
  return lines.join('\n');
}

export function subscribeToSetlist(callback: (items: SetlistItem[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: any) => {
    callback(e.detail ?? getSetlist());
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === SETLIST_STORAGE_KEY) {
      callback(getSetlist());
    }
  };

  window.addEventListener(SETLIST_EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(SETLIST_EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
