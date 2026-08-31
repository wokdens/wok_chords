import { useEffect, useMemo, useState } from 'react';
import {
  ListMusic,
  Save,
  LogOut,
  Search,
  ArrowLeft,
  FileText,
  RefreshCcw,
  X,
} from 'lucide-react';
import type { SongSummary } from '../pages/api/admin/list';

interface Props {
  initialAuthed: boolean;
  usingDefault: boolean;
}

type View = { kind: 'list' } | { kind: 'edit'; slug: string };

export default function AdminApp({ initialAuthed, usingDefault }: Props) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [songs, setSongs] = useState<SongSummary[] | null>(null);
  const [songsError, setSongsError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>({ kind: 'list' });

  const filtered = useMemo(() => {
    if (!songs) return [];
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [songs, query]);

  const loadList = async () => {
    setSongsError(null);
    try {
      const res = await fetch('/api/admin/list', { credentials: 'same-origin' });
      if (res.status === 401) {
        setAuthed(false);
        setSongs(null);
        return;
      }
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to load songs');
      setSongs(data.songs as SongSummary[]);
    } catch (e: any) {
      setSongsError(e?.message ?? 'Failed to load');
    }
  };

  useEffect(() => {
    if (authed && !songs) loadList();
    if (!authed) setSongs(null);
  }, [authed]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginErr(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setLoginErr(data?.error ?? 'Login failed');
        return;
      }
      setAuthed(true);
      setPassword('');
    } catch (e: any) {
      setLoginErr(e?.message ?? 'Network error');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
    setAuthed(false);
    setSongs(null);
    setView({ kind: 'list' });
  };

  if (!authed) {
    return (
      <div className="max-w-md mx-auto mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-wok-panel/60 backdrop-blur p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <ListMusic size={18} /> Admin login
        </h2>
        <p className="text-wok-muted text-sm mb-4">
          Enter your administrative credentials to manage songs.
        </p>
        <form className="flex flex-col gap-3" onSubmit={handleLogin}>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              className="rounded-lg border py-2 px-3 outline-none input-surface"
              placeholder="Enter admin password"
            />
          </label>
          <div className="text-red-600 dark:text-red-400 text-sm min-h-[1.25rem]">
            {loginErr}
          </div>
          <button
            type="submit"
            disabled={loggingIn}
            className="h-10 rounded-lg bg-wok-accent text-white font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loggingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  if (view.kind === 'edit') {
    return (
      <SongEditor
        slug={view.slug}
        onBack={() => setView({ kind: 'list' })}
        onLogout={handleLogout}
        usingDefault={usingDefault}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative max-w-md w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-wok-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder="Filter by title, artist, slug, or tag…"
            className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-sm outline-none input-surface"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadList}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-wok-accent/15 hover:text-wok-accent text-sm text-wok-muted transition"
            title="Refresh list"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-300 text-sm text-wok-muted transition"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {songsError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
          {songsError}
        </div>
      )}

      <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden">
        {songs === null ? (
          <div className="p-8 text-sm text-wok-muted text-center">Loading songs…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-sm text-wok-muted text-center">No songs match your filter.</div>
        ) : (
          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-wok-panel text-wok-muted uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="text-left font-semibold px-3 py-2">Title</th>
                  <th className="text-left font-semibold px-3 py-2 hidden md:table-cell">Artist</th>
                  <th className="text-left font-semibold px-3 py-2 hidden lg:table-cell">Key</th>
                  <th className="text-left font-semibold px-3 py-2 hidden lg:table-cell">Tags</th>
                  <th className="text-right font-semibold px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filtered.map((s) => (
                  <tr
                    key={s.slug}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    <td className="px-3 py-2 font-semibold text-wok-text">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-wok-muted shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate">{s.title}</div>
                          <div className="text-[11px] text-wok-muted md:hidden truncate">
                            {s.artist}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-wok-muted hidden md:table-cell truncate max-w-[22ch]">
                      {s.artist}
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell">
                      {s.key ? (
                        <span className="font-mono text-xs font-bold text-wok-chord bg-wok-chord/10 rounded px-1.5 py-0.5">
                          {s.key}
                        </span>
                      ) : (
                        <span className="text-wok-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(s.tags ?? []).slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded bg-black/5 dark:bg-white/5 px-1.5 py-0.5 text-[11px] capitalize text-wok-muted"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setView({ kind: 'edit', slug: s.slug })}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-wok-accent/15 text-wok-accent text-xs font-semibold hover:bg-wok-accent/25 transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SongEditor(props: {
  slug: string;
  onBack: () => void;
  onLogout: () => void;
  usingDefault: boolean;
}) {
  const { slug, onBack, onLogout, usingDefault } = props;
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [raw, setRaw] = useState('');
  const [initial, setInitial] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const res = await fetch(`/api/admin/song/${encodeURIComponent(slug)}`, {
          credentials: 'same-origin',
        });
        if (res.status === 401) {
          if (!canceled) onLogout();
          return;
        }
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? 'Failed to load song');
        if (!canceled) {
          setRaw(data.raw);
          setInitial(data.raw);
        }
      } catch (e: any) {
        if (!canceled) setLoadErr(e?.message ?? 'Load failed');
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [slug, onLogout]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/song/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ raw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error ?? 'Save failed');
      setInitial(raw);
      setSaveMsg({ kind: 'ok', text: `Saved (${raw.length} bytes). Site updates on next page load.` });
    } catch (e: any) {
      setSaveMsg({ kind: 'err', text: e?.message ?? 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const dirty = raw !== initial;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-wok-accent/15 hover:text-wok-accent text-sm text-wok-muted transition shrink-0"
          >
            <ArrowLeft size={14} /> Back to list
          </button>
          <div className="min-w-0">
            <div className="font-bold truncate">{slug}</div>
            <div className="text-[11px] text-wok-muted truncate">
              {loading
                ? 'Loading…'
                : dirty
                ? 'Unsaved changes'
                : 'Saved'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-wok-accent/15 hover:text-wok-accent text-sm text-wok-muted transition"
          >
            {showPreview ? <X size={14} /> : <FileText size={14} />}
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || !raw.trim()}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-wok-accent text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save song'}
          </button>
        </div>
      </div>

      {saveMsg && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            saveMsg.kind === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}
        >
          {saveMsg.text}
        </div>
      )}
      {loadErr && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
          {loadErr}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-wok-muted font-semibold">
            Raw ChordPro source (.chopro file)
          </label>
          <textarea
            value={raw}
            onChange={(e) => setRaw((e.target as HTMLTextAreaElement).value)}
            spellCheck={false}
            disabled={loading}
            className="w-full min-h-[70vh] h-[70vh] rounded-xl border p-3 text-xs md:text-sm font-mono leading-relaxed outline-none transition input-surface disabled:opacity-70"
            placeholder="Loading song…"
          />
        </div>
        {showPreview && (
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider text-wok-muted font-semibold">
              Live preview · Tip: add spaces between words by editing source directly
            </label>
            <div className="w-full min-h-[70vh] h-[70vh] overflow-auto rounded-xl border border-black/10 dark:border-white/10 bg-wok-panel/40 p-4 md:p-6">
              <SourcePreview raw={raw} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SourcePreview({ raw }: { raw: string }) {
  const html = useMemo(() => {
    try {
      const lines = raw.split(/\r?\n/);
      let inFm = false;
      let fmEnded = false;
      let fmOpenCount = 0;
      const out: string[] = [];
      for (const line of lines) {
        if (!fmEnded && /^---\s*$/.test(line.trim())) {
          fmOpenCount++;
          inFm = fmOpenCount === 1;
          if (fmOpenCount === 2) {
            fmEnded = true;
            inFm = false;
          }
          out.push(esc(line));
          continue;
        }
        if (inFm) {
          out.push(`<span className="text-wok-muted">${esc(line)}</span>`);
          continue;
        }
        const directive = /^\s*\{([^{}]*)\}\s*$/.exec(line);
        if (directive) {
          out.push(
            `<div className="text-xs md:text-sm mt-4 mb-2 uppercase tracking-widest font-semibold text-wok-muted border-l-2 border-wok-accent pl-2">${esc(
              directive[1],
            )}</div>`,
          );
          continue;
        }
        if (line.trim() === '') {
          out.push('<div className="h-3"></div>');
          continue;
        }
        out.push(renderChordLine(line));
      }
      return out.join('\n');
    } catch {
      return `<pre className="whitespace-pre-wrap text-xs">${esc(raw)}</pre>`;
    }
  }, [raw]);

  return (
    <div
      className="space-y-0.5 text-wok-text"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderChordLine(line: string): string {
  const re = /\[([^\]]+)\]|(\[[^\]]*\]|[^\[]+)/g;
  const parts: { chord?: string; text: string }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) {
      parts.push({ text: line.slice(last, m.index) });
    }
    if (m[1] !== undefined) {
      const after = m.index + m[0].length;
      const next = re.exec(line);
      if (next) {
        const lyr = line.slice(after, next.index);
        parts.push({ chord: m[1], text: lyr || '\u00A0' });
        if (next.index > last) last = next.index + next[0].length;
        if (next[1] !== undefined) {
          const afterN = next.index + next[0].length;
          const rest = line.slice(afterN);
          parts.push({ chord: next[1], text: rest || '\u00A0' });
          break;
        } else {
          parts.push({ text: next[0] });
          last = next.index + next[0].length;
        }
      } else {
        const lyr = line.slice(after);
        parts.push({ chord: m[1], text: lyr || '\u00A0' });
        last = after + lyr.length;
        break;
      }
    } else {
      parts.push({ text: m[0] });
      last = m.index + m[0].length;
    }
  }
  if (last < line.length) parts.push({ text: line.slice(last) });

  const cells = parts.map((p) => {
    const txt = esc(p.text === '' ? '\u00A0' : p.text);
    if (p.chord) {
      return `<span className="inline-flex flex-col leading-none align-bottom mr-2"><span className="font-mono text-wok-chord font-bold text-sm md:text-base">${esc(
        p.chord,
      )}</span><span className="text-base md:text-lg leading-relaxed">${txt}</span></span>`;
    }
    return `<span className="text-base md:text-lg leading-relaxed">${txt}</span>`;
  });
  return `<div className="flex flex-wrap items-end gap-x-1 mb-1.5">${cells.join('')}</div>`;
}
