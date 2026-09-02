import { useEffect, useState } from 'react';
import { Cookie, X, Check, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'wokchords:cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Show after a brief delay so page loads smoothly first
        const timer = setTimeout(() => {
          setVisible(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      document.cookie = `wc_cookie_consent=accepted; max-age=31536000; path=/; SameSite=Lax`;
    } catch {}
    setVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'essential');
      document.cookie = `wc_cookie_consent=essential; max-age=31536000; path=/; SameSite=Lax`;
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-5 left-5 right-5 sm:right-auto sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-4 sm:p-5 rounded-3xl bg-wok-panel/95 dark:bg-slate-900/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 text-wok-text">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Cookie size={18} />
            </span>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-wok-text flex items-center gap-1.5">
                We use cookies
              </h3>
              <span className="text-[11px] text-wok-muted">Personalized chords & settings</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAcceptEssential}
            aria-label="Dismiss cookie notice"
            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-wok-muted hover:text-wok-text hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-xs text-wok-muted leading-relaxed mb-4">
          WokChords uses cookies and local storage to save your transposed song keys, customized setlists, dark mode theme, and to analyze traffic performance.{' '}
          <a
            href="/privacy-policy/"
            className="text-wok-accent hover:underline font-semibold"
          >
            Learn more
          </a>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-wok-accent hover:opacity-90 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition active:scale-95"
          >
            <Check size={14} />
            <span>Accept All</span>
          </button>

          <button
            type="button"
            onClick={handleAcceptEssential}
            className="h-9 px-3.5 inline-flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 text-wok-text text-xs font-semibold transition active:scale-95"
          >
            <span>Essential Only</span>
          </button>
        </div>
      </div>
    </div>
  );
}
