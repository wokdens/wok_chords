import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause Auto-Scroll' },
  { key: '+', desc: 'Transpose key up half-step' },
  { key: '-', desc: 'Transpose key down half-step' },
  { key: '0', desc: 'Reset key & capo to original' },
  { key: ']', desc: 'Increase auto-scroll speed' },
  { key: '[', desc: 'Decrease auto-scroll speed' },
  { key: 'M', desc: 'Toggle Metronome clicker' },
  { key: 'T', desc: 'Open Guitar & Ukulele Tuner' },
  { key: 'F', desc: 'Toggle Fullscreen stage mode' },
  { key: '?', desc: 'Show this keyboard shortcuts guide' },
];

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-wok-panel/95 border border-black/10 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          title="Close shortcuts"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Musician Stage Hotkeys
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hands-free keyboard shortcuts for stage performance
            </p>
          </div>
        </div>

        <div className="divide-y divide-black/5 dark:divide-white/5 max-h-80 overflow-y-auto pr-1">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2.5">
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {s.desc}
              </span>
              <kbd className="px-2.5 py-1 rounded-md bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white font-mono text-xs font-bold border border-black/10 dark:border-white/10 shadow-sm min-w-8 text-center">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-orange text-white font-medium text-sm hover:bg-brand-orange/90 transition-colors shadow-sm"
          >
            Got it, Let's Jam!
          </button>
        </div>
      </div>
    </div>
  );
}
