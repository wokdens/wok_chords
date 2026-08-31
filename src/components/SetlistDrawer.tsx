import { useEffect, useState } from 'react';
import {
  Heart,
  X,
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  Share2,
  Printer,
  Check,
  Music,
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

export default function SetlistDrawer() {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setItems(getSetlist());
    const unsubscribe = subscribeToSetlist((updated) => {
      setItems(updated);
    });

    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('wokchords:open-setlist', handleOpenEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('wokchords:open-setlist', handleOpenEvent);
    };
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
    window.open('/setlist/?print=1', '_blank');
  };

  return (
    <>
      {/* Floating Setlist Pill Button (Visible everywhere on desktop & mobile) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open My Setlist"
        className={`fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-2xl transition-all duration-200 active:scale-95 border ${
          items.length > 0
            ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-600/30'
            : 'bg-wok-panel/90 backdrop-blur-md text-wok-text hover:text-wok-accent border-black/10 dark:border-white/10 shadow-black/10'
        }`}
      >
        <Heart
          size={16}
          className={`${items.length > 0 ? 'fill-white animate-pulse' : 'text-rose-500'}`}
        />
        <span className="text-xs font-bold tracking-tight">
          Setlist {items.length > 0 && `(${items.length})`}
        </span>
      </button>

      {/* Slide-over Backdrop & Drawer Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-md h-full bg-wok-panel border-l border-black/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-wok-panel/50">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Heart size={18} className="fill-rose-500" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-wok-text tracking-tight flex items-center gap-2">
                    My Gig & Practice Setlist
                  </h2>
                  <p className="text-xs text-wok-muted">
                    {items.length} {items.length === 1 ? 'song' : 'songs'} saved for practice
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-wok-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-wok-text transition"
                aria-label="Close setlist drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Song List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {items.length === 0 ? (
                <div className="py-16 text-center px-4">
                  <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 inline-flex items-center justify-center mb-4">
                    <Heart size={28} />
                  </div>
                  <h3 className="font-bold text-sm text-wok-text mb-1">Your setlist is empty</h3>
                  <p className="text-xs text-wok-muted max-w-xs mx-auto mb-5 leading-relaxed">
                    Click the <strong>❤️ Heart / Add to Setlist</strong> button on any song sheet to save songs with your custom Key and Capo settings!
                  </p>
                  <a
                    href="/songs/"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-wok-accent text-white text-xs font-bold hover:opacity-90 shadow-md transition"
                  >
                    <Music size={14} /> Browse All Songs
                  </a>
                </div>
              ) : (
                items.map((song, idx) => {
                  const songHref = `/song/${song.slug}/?transpose=${song.transpose ?? 0}&capo=${song.capo ?? 0}`;
                  return (
                    <div
                      key={song.slug}
                      className="group flex items-center justify-between p-3 rounded-2xl border border-black/5 dark:border-white/5 bg-wok-panel/60 hover:bg-wok-panel/90 hover:border-wok-accent/30 transition shadow-sm"
                    >
                      {/* Left: Reorder & Number */}
                      <div className="flex items-center gap-2 shrink-0 pr-1">
                        <span className="w-6 text-center font-bold text-xs text-wok-muted">
                          {idx + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => setItems(reorderSetlist(idx, idx - 1))}
                            title="Move Up in setlist"
                            className="p-1 rounded text-wok-muted hover:text-wok-text disabled:opacity-20 hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === items.length - 1}
                            onClick={() => setItems(reorderSetlist(idx, idx + 1))}
                            title="Move Down in setlist"
                            className="p-1 rounded text-wok-muted hover:text-wok-text disabled:opacity-20 hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Title & Artist & Saved Key */}
                      <div className="min-w-0 flex-1 px-2">
                        <a
                          href={songHref}
                          className="font-bold text-xs sm:text-sm text-wok-text hover:text-wok-accent truncate block transition-colors"
                        >
                          {song.title}
                        </a>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-wok-muted truncate">
                          <span className="truncate">{song.artist}</span>
                          {song.key && (
                            <span className="px-1.5 py-0.2 rounded bg-wok-chord/10 text-wok-chord font-mono font-bold text-[10px]">
                              {song.key}
                            </span>
                          )}
                          {song.capo && song.capo > 0 ? (
                            <span className="px-1.5 py-0.2 rounded bg-wok-accent/10 text-wok-accent font-semibold text-[10px]">
                              Capo {song.capo}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Right: Play & Delete Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={songHref}
                          title="Open chord sheet with saved key"
                          className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg bg-wok-accent/10 hover:bg-wok-accent hover:text-white text-wok-accent text-xs font-bold transition"
                        >
                          <Play size={12} /> Play
                        </a>
                        <button
                          type="button"
                          onClick={() => setItems(removeFromSetlist(song.slug))}
                          title="Remove from setlist"
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-wok-muted hover:text-rose-500 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer Actions */}
            {items.length > 0 && (
              <div className="p-4 border-t border-black/10 dark:border-white/10 bg-wok-panel/60 space-y-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className={`flex-1 h-9 px-3 inline-flex items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition active:scale-95 ${
                      copied
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                        : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-black/10 dark:border-white/10 text-wok-text'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Share2 size={14} />}
                    <span>{copied ? 'Copied WhatsApp List!' : 'Copy for WhatsApp'}</span>
                  </button>

                  <a
                    href="/setlist/"
                    className="h-9 px-3 inline-flex items-center justify-center gap-1 rounded-xl bg-wok-accent text-white hover:opacity-90 text-xs font-bold transition shadow-sm"
                  >
                    <span>Full Stage View</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="flex items-center justify-between text-[11px] text-wok-muted pt-1">
                  <span>Saved on your device</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear your entire setlist?')) {
                        clearSetlist();
                      }
                    }}
                    className="hover:text-rose-500 underline"
                  >
                    Clear All ({items.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
