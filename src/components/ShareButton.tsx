import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { trackShare } from '../lib/analyticsTracker';

interface Props {
  title: string;
  artist: string;
  url?: string;
}

export default function ShareButton({ title, artist, url }: Props) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const getShareUrl = () => {
    if (url) return url;
    if (typeof window !== 'undefined') return window.location.href;
    return '';
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    const shareTitle = `${title} Chords — ${artist}`;
    const shareText = `Check out the guitar & piano chords for "${title}" by ${artist} on WokChords! 🎸`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        trackShare({ title, method: 'native_share' });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // User closed share sheet
      }
    }

    // Fallback: Copy to clipboard
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }

      setCopied(true);
      setShowToast(true);
      trackShare({ title, method: 'clipboard_copy' });

      setTimeout(() => {
        setCopied(false);
      }, 2500);

      setTimeout(() => {
        setShowToast(false);
      }, 3500);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share song chords"
        title="Share chords with friends"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 border border-black/5 dark:border-white/5 text-wok-muted hover:border-orange-500/30 text-xs font-semibold transition-all active:scale-95 shadow-sm"
      >
        {copied ? (
          <>
            <Check size={14} className="text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
          </>
        ) : (
          <>
            <Share2 size={14} className="transition-transform group-hover:scale-110" />
            <span>Share</span>
          </>
        )}
      </button>

      {/* Floating Toast Notification */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 px-3 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-bold shadow-lg shadow-black/20 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <Copy size={12} />
          <span>Link copied to clipboard! 🎸</span>
        </div>
      )}
    </div>
  );
}
