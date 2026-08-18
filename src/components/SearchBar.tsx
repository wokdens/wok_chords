import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export interface SongSearchEntry {
  slug: string;
  title: string;
  artist: string;
  key?: string;
  tags?: string[];
  snippet?: string;
}

const STORAGE_KEY = 'wokchords:songs-index';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function scoreSong(song: SongSearchEntry, q: string): number {
  const nq = normalize(q);
  if (!nq) return 0;
  const tokens = nq.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;

  const title = normalize(song.title);
  const artist = normalize(song.artist);
  const tags = (song.tags ?? []).map(normalize).join(' ');
  const snippet = normalize(song.snippet ?? '');
  const haystacks = [
    { text: title, weight: 10 },
    { text: artist, weight: 6 },
    { text: tags, weight: 4 },
    { text: snippet, weight: 1 },
  ];

  let score = 0;
  for (const { text, weight } of haystacks) {
    for (const tok of tokens) {
      if (!tok) continue;
      if (text.includes(tok)) {
        score += weight * (1 + tok.length / 6);
      }
      const idx = text.indexOf(tok);
      if (idx === 0) score += weight * 0.5;
    }
  }
  return score;
}

async function loadIndex(url: string): Promise<SongSearchEntry[]> {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    if (Array.isArray(data)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
      return data as SongSearchEntry[];
    }
  } catch {
    /* fallthrough */
  }
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) return JSON.parse(cached) as SongSearchEntry[];
  } catch {
    /* ignore */
  }
  return [];
}

export default function SearchBar({ indexUrl = '/songs-index.json' }: { indexUrl?: string }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SongSearchEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    loadIndex(indexUrl).then((arr) => {
      if (alive) setIndex(arr);
    });
    return () => {
      alive = false;
    };
  }, [indexUrl]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIdx(-1);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setFocusedIdx(-1);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const scored = index
      .map((s) => ({ s, score: scoreSong(s, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.s);
    return scored;
  }, [query, index]);

  const showDropdown = open && results.length > 0;

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = focusedIdx >= 0 ? results[focusedIdx] : results[0];
      if (target) {
        window.location.href = `/song/${target.slug}/`;
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-3 h-4 w-4 text-wok-muted"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setFocusedIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search songs, artists, tags… (press /)"
          className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-9 pr-9 text-sm text-wok-text placeholder:text-wok-muted/80 outline-none transition focus:border-wok-accent/50 focus:ring-2 focus:ring-wok-accent/20"
          aria-label="Search songs"
          aria-expanded={showDropdown}
          role="combobox"
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={focusedIdx >= 0 ? `search-result-${focusedIdx}` : undefined}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFocusedIdx(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-wok-muted hover:bg-white/10 hover:text-wok-text"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-2 max-h-[60vh] overflow-auto rounded-xl border border-white/10 bg-wok-panel/95 p-1 shadow-2xl shadow-black/60 backdrop-blur"
        >
          {results.map((r, i) => (
            <li key={r.slug} role="option" id={`search-result-${i}`} aria-selected={i === focusedIdx}>
              <a
                href={`/song/${r.slug}/`}
                onMouseEnter={() => setFocusedIdx(i)}
                className={`block rounded-lg px-3 py-2.5 transition ${
                  i === focusedIdx ? 'bg-wok-accent/15 text-wok-text' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-wok-text">
                      {r.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-wok-muted">
                      <span className="truncate">🧑‍🎤 {r.artist}</span>
                      {r.key && (
                        <span className="rounded bg-wok-chord/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-wok-chord">
                          {r.key}
                        </span>
                      )}
                      {r.tags?.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-white/5 px-1.5 py-0.5 capitalize"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  {r.snippet && (
                    <div className="mt-0.5 hidden max-w-[45%] text-right text-xs italic text-wok-muted/80 line-clamp-2 md:block">
                      “{r.snippet}
                      {r.snippet.length >= 60 ? '…' : ''}”
                    </div>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
