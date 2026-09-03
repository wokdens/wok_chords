import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, Sparkles } from 'lucide-react';

export default function AdFreeBubblePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if already dismissed in this session
    if (typeof window !== 'undefined') {
      const alreadySeen = sessionStorage.getItem('wokchords:adfree_bubble_seen');
      if (alreadySeen) return;
    }

    // Step 1: Wait 10 seconds after visitor lands on the site
    const showTimer = setTimeout(() => {
      setIsVisible(true);

      // Step 2: Auto-dismiss after 10 seconds if user does not click cross
      autoDismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 10000);
    }, 10000);

    return () => {
      clearTimeout(showTimer);
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    setTimeout(() => {
      setIsVisible(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('wokchords:adfree_bubble_seen', '1');
      }
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] sm:w-auto transition-all duration-300 ${
        isClosing ? 'opacity-0 scale-90 translate-y-4' : 'opacity-100 scale-100 translate-y-0 animate-in fade-in slide-in-from-bottom-6'
      }`}
    >
      <div className="relative rounded-2xl bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-emerald-950/95 backdrop-blur-xl border border-emerald-500/40 p-4 sm:p-5 text-white shadow-[0_10px_35px_-5px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/20">
        {/* Subtle top progress bar indicating 10s auto-dismiss */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/20 rounded-t-2xl overflow-hidden">
          <div className="h-full bg-emerald-400 w-full animate-adfree-timer" />
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full text-emerald-300/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Close announcement"
          aria-label="Close ad-free popup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-5">
          {/* Animated Shield Icon */}
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1">
                100% Ad-Free. We Promise.
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                Forever
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Zero banner ads, zero video interruptions, no paywalls. Built by{' '}
              <strong className="text-white font-bold tracking-wide">Wokdens</strong> so musicians can jam in peace.
            </p>

            <div className="pt-1 flex items-center justify-between text-[10px] text-emerald-400/80 font-mono">
              <span>Powered by Wokdens Software Labs</span>
              <span className="opacity-70">Auto-closing in 10s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
