import { useEffect, useState } from 'react';
import {
  Heart,
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  Share2,
  Printer,
  Check,
  Music,
  Shuffle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  getSetlist,
  removeFromSetlist,
  reorderSetlist,
  clearSetlist,
  formatSetlistForWhatsApp,
  subscribeToSetlist,
  type SetlistItem,
} from '../lib/setlistStore';

export default function SetlistPageApp() {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    setItems(getSetlist());
    const unsubscribe = subscribeToSetlist((updated) => {
      setItems(updated);
    });

    // Check if auto-print was requested
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('print') === '1') {
        setTimeout(() => window.print(), 500);
      }
    }

    return unsubscribe;
  }, []);

  const handleCopyWhatsApp = () => {
    const text = formatSetlistForWhatsApp(items);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShuffle = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    localStorage.setItem('wokchords:favorites_setlist', JSON.stringify(shuffled));
    setItems(shuffled);
  };

  const filteredItems = items.filter((s) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Setlist Management Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-wok-panel/60 border border-black/5 dark:border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search inside setlist…"
            className="h-9 px-3 text-xs md:text-sm rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-wok-accent text-wok-text w-48 sm:w-64 transition"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="text-xs text-wok-muted hover:text-wok-text"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleShuffle}
            disabled={items.length < 2}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-wok-text transition active:scale-95 disabled:opacity-30"
          >
            <Shuffle size={14} />
            <span className="hidden sm:inline">Shuffle</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            disabled={items.length === 0}
            className={`h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl border text-xs font-bold transition active:scale-95 disabled:opacity-30 ${
              copied
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copied ? 'Copied WhatsApp List!' : 'Share to WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={items.length === 0}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-wok-text transition active:scale-95 disabled:opacity-30"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print Paper Setlist</span>
          </button>
        </div>
      </div>

      {/* Setlist Song Table / Cards */}
      {items.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-black/10 dark:border-white/10 p-6 bg-wok-panel/20">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 inline-flex items-center justify-center mb-4">
            <Heart size={32} />
          </div>
          <h2 className="text-lg font-bold text-wok-text mb-2">No songs in your Setlist yet</h2>
          <p className="text-sm text-wok-muted max-w-md mx-auto mb-6 leading-relaxed">
            Whenever you are practicing or preparing for a gig, tap the <strong>❤️ Setlist</strong> button on any song page. It remembers your customized Key and Capo frets for live performance!
          </p>
          <a
            href="/songs/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wok-accent text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:opacity-90 transition active:scale-95"
          >
            <Music size={16} /> Browse 3,920 Songs
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((song, idx) => {
            const songHref = `/song/${song.slug}/?transpose=${song.transpose ?? 0}&capo=${song.capo ?? 0}`;
            return (
              <div
                key={song.slug}
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-wok-panel/60 hover:bg-wok-panel/90 hover:border-wok-accent/40 transition shadow-sm"
              >
                {/* Number & Reorder */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="w-7 sm:w-8 text-center font-extrabold text-sm sm:text-base text-wok-muted">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => setItems(reorderSetlist(idx, idx - 1))}
                      title="Move Up in performance order"
                      className="p-1 rounded text-wok-muted hover:text-wok-text disabled:opacity-20 hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => setItems(reorderSetlist(idx, idx + 1))}
                      title="Move Down in performance order"
                      className="p-1 rounded text-wok-muted hover:text-wok-text disabled:opacity-20 hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>

                {/* Song Title, Artist & Key Tags */}
                <div className="min-w-0 flex-1 px-3 sm:px-4">
                  <a
                    href={songHref}
                    className="font-extrabold text-sm sm:text-base text-wok-text hover:text-wok-accent truncate block transition-colors"
                  >
                    {song.title}
                  </a>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-wok-muted flex-wrap">
                    <span className="truncate">{song.artist}</span>
                    {song.key && (
                      <span className="px-2 py-0.5 rounded-md bg-wok-chord/10 text-wok-chord font-mono font-bold text-[11px] border border-wok-chord/20">
                        Key: {song.key}
                      </span>
                    )}
                    {song.capo && song.capo > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-wok-accent/10 text-wok-accent font-semibold text-[11px] border border-wok-accent/20">
                        Capo: {song.capo}
                      </span>
                    ) : null}
                    {song.transpose && song.transpose !== 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-wok-muted font-mono text-[11px]">
                        Transpose: {song.transpose > 0 ? `+${song.transpose}` : song.transpose}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Play and Remove */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={songHref}
                    className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl bg-wok-accent hover:opacity-90 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/10 transition active:scale-95"
                  >
                    <Play size={14} className="fill-white" />
                    <span>Play Sheet</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setItems(removeFromSetlist(song.slug))}
                    title="Remove from Setlist"
                    className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-wok-muted hover:text-rose-500 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      {items.length > 0 && (
        <div className="flex items-center justify-between text-xs text-wok-muted pt-4 border-t border-black/5 dark:border-white/5">
          <span>{items.length} songs in setlist · Auto-synced on this device</span>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your entire setlist?')) {
                clearSetlist();
              }
            }}
            className="hover:text-rose-500 text-rose-500/80 transition"
          >
            Clear Entire Setlist
          </button>
        </div>
      )}
    </div>
  );
}
