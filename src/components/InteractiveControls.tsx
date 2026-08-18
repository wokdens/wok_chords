import { useCallback, useEffect, useRef, useState } from 'react';
import chordsheetjs from 'chordsheetjs';
import type { Song as SongType } from 'chordsheetjs';
import {
  Minus,
  Plus,
  RotateCcw,
  Play,
  Pause,
  Gauge,
  BatteryFull,
  Battery,
} from 'lucide-react';

const cs: any =
  (chordsheetjs as any)?.ChordProParser
    ? chordsheetjs
    : (chordsheetjs as any)?.default ?? chordsheetjs;

const ChordProParser = cs.ChordProParser;
const HtmlDivFormatter = cs.HtmlDivFormatter;
type Song = SongType;

declare global {
  interface Navigator {
    wakeLock?: {
      request: (type: 'screen') => Promise<any>;
    };
  }
}

const ORDER_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ORDER_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];

function inferUseFlats(key?: string): boolean {
  if (!key) return false;
  const base = key.replace(/m$/, '').replace(/maj$/, '').replace(/min$/, '');
  return FLAT_KEYS.some((k) => base === k || base.startsWith(k));
}

function transposeKeyName(key: string, semitones: number, preferFlats = false): string | undefined {
  const order = preferFlats ? ORDER_FLATS : ORDER_SHARPS;
  const altOrder = preferFlats ? ORDER_SHARPS : ORDER_FLATS;
  const minor = /m$|min$/.test(key);
  const base = key.replace(/m$/, '').replace(/maj$/, '').replace(/min$/, '');
  let idx = order.findIndex((n) => n === base);
  if (idx === -1) idx = altOrder.findIndex((n) => n === base);
  if (idx === -1) return undefined;
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return order[newIdx] + (minor ? 'm' : '');
}

interface RenderedResult {
  html: string;
  key?: string;
  originalKey?: string;
}

function renderChordHtml(rawText: string, semitones: number): RenderedResult {
  const parser = new ChordProParser();
  const normalized = rawText.replace(/^---[\s\S]*?---\n?/, '').trim();
  const sheet: Song = parser.parse(normalized);

  const frontmatterBlock = rawText.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  let fmKey: string | undefined;
  for (const line of frontmatterBlock.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === 'key') fmKey = v.trim().replace(/^["']|["']$/g, '');
  }
  const sheetKey = (sheet as any).key ? String((sheet as any).key) : undefined;
  const originalKey = fmKey || sheetKey;

  let final: Song = sheet;
  if (semitones !== 0) {
    const t = parser.parse(normalized);
    try {
      (t as any).transpose(semitones);
    } catch {
      /* no-op */
    }
    if (inferUseFlats(originalKey) && originalKey) {
      const nk = transposeKeyName(originalKey, semitones, true);
      if (nk) {
        try {
          (t as any).setKey(nk);
        } catch {
          /* no-op */
        }
      }
    }
    final = t;
  }

  let html = '';
  try {
    html = new HtmlDivFormatter().format(final);
  } catch {
    html = '';
  }

  let displayedKey: string | undefined = originalKey;
  if (semitones !== 0 && originalKey) {
    displayedKey =
      ((final as any).key ? String((final as any).key) : undefined) ??
      transposeKeyName(originalKey, semitones, inferUseFlats(originalKey));
  }

  return { html, key: displayedKey, originalKey };
}

function applyStyling(scope: HTMLElement) {
  scope.querySelectorAll<HTMLElement>('.chord').forEach((el) => {
    el.classList.add('font-mono', 'text-wok-chord', 'font-bold', 'text-sm', 'md:text-base', 'tracking-wide', 'select-none');
    el.style.lineHeight = '1.2';
  });

  scope.querySelectorAll<HTMLElement>('.lyrics, .lyric').forEach((el) => {
    el.classList.add('font-sans', 'text-wok-text', 'text-base', 'md:text-lg', 'whitespace-pre-wrap');
    el.style.lineHeight = '1.5';
  });

  scope.querySelectorAll<HTMLElement>('.comment, .label').forEach((el) => {
    const text = el.textContent?.trim() ?? '';
    if (text) {
      el.classList.add('uppercase', 'text-xs', 'md:text-sm', 'font-semibold', 'text-wok-muted', 'tracking-widest', 'mt-4', 'mb-1.5', 'border-l-2', 'border-wok-accent', 'pl-2.5');
    }
  });

  scope.querySelectorAll<HTMLElement>('.row').forEach((row) => {
    row.classList.add('mb-1.5');
    row.style.display = 'flex';
    row.style.flexWrap = 'wrap';
    row.style.alignItems = 'flex-end';
    row.style.rowGap = '0.5rem';
  });

  scope.querySelectorAll<HTMLElement>('.column').forEach((col) => {
    col.style.display = 'inline-flex';
    col.style.flexDirection = 'column';
    col.style.verticalAlign = 'bottom';
  });

  scope.querySelectorAll<HTMLElement>('.chord + .lyrics, .chord + .lyric').forEach((el) => {
    el.classList.add('pt-0.5');
  });

  scope.querySelectorAll<HTMLElement>('.verse, .chorus, .bridge, .tab, .indeterminate').forEach((sec) => {
    sec.classList.add('mb-4', 'md:mb-5');
  });
}

export interface InteractiveControlsProps {
  rawText: string;
  initialKey?: string;
  mountId?: string;
  scrollTargetSelector?: string;
}

export default function InteractiveControls({
  rawText,
  initialKey,
  mountId = 'chord-sheet-mount',
  scrollTargetSelector = '#chord-sheet',
}: InteractiveControlsProps) {
  const [transpose, setTranspose] = useState(0);
  const [displayKey, setDisplayKey] = useState<string | undefined>(initialKey);
  const [scrollActive, setScrollActive] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);
  const scrollTargetRef = useRef<HTMLElement | null>(null);
  const mountRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setHydrated(true);
    if (typeof document !== 'undefined') {
      scrollTargetRef.current = document.querySelector<HTMLElement>(scrollTargetSelector);
      mountRef.current = document.getElementById(mountId);
      if (mountRef.current) applyStyling(mountRef.current);
    }
    const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    setWakeLockSupported(supported);
  }, [scrollTargetSelector, mountId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const { html, key } = renderChordHtml(rawText, transpose);
      setDisplayKey(key ?? initialKey);
      const mount = mountRef.current ?? document.getElementById(mountId);
      if (mount && html) {
        mount.innerHTML = html;
        applyStyling(mount);
      }
    } catch (err) {
      console.error('Failed to update chords on transpose:', err);
    }
  }, [transpose, rawText, hydrated, initialKey, mountId]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!scrollActive) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastTsRef.current = 0;
    const step = (ts: number) => {
      const last = lastTsRef.current || ts;
      const dt = ts - last;
      lastTsRef.current = ts;
      const pxPerSec = scrollSpeed * 30;
      const delta = (pxPerSec * dt) / 1000;
      const target = scrollTargetRef.current;
      if (target) {
        target.scrollTop += delta;
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 4) {
          setScrollActive(false);
          return;
        }
      } else if (typeof window !== 'undefined') {
        window.scrollBy(0, delta);
        const atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 4;
        if (atBottom) {
          setScrollActive(false);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [scrollActive, scrollSpeed]);

  const toggleWakeLock = useCallback(async () => {
    try {
      if (wakeLockActive) {
        if (wakeLockRef.current?.release) {
          await wakeLockRef.current.release();
        }
        wakeLockRef.current = null;
        setWakeLockActive(false);
      } else if (navigator.wakeLock) {
        const lock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = lock;
        setWakeLockActive(true);
        lock.addEventListener?.('release', () => {
          setWakeLockActive(false);
          wakeLockRef.current = null;
        });
      }
    } catch (err) {
      console.warn('Wake lock error', err);
      setWakeLockActive(false);
    }
  }, [wakeLockActive]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const onVisible = async () => {
      if (
        document.visibilityState === 'visible' &&
        wakeLockSupported &&
        wakeLockActive &&
        !wakeLockRef.current &&
        navigator.wakeLock
      ) {
        try {
          const lock = await navigator.wakeLock.request('screen');
          wakeLockRef.current = lock;
        } catch {
          /* no-op */
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [wakeLockSupported, wakeLockActive]);

  const handleTransposeDown = () => setTranspose((t) => Math.max(-12, t - 1));
  const handleTransposeUp = () => setTranspose((t) => Math.min(12, t + 1));
  const handleReset = () => setTranspose(0);

  return (
    <div className="sticky top-[44px] z-20 bg-wok-panel/90 backdrop-blur-md border border-white/5 rounded-2xl p-2.5 md:p-3 shadow-xl shadow-black/40">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          <span className="text-[11px] uppercase tracking-wider text-wok-muted font-semibold mr-0.5 md:mr-1">
            Key
          </span>
          <button
            type="button"
            onClick={handleTransposeDown}
            aria-label="Transpose key down one semitone"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white/5 hover:bg-wok-accent/20 hover:text-wok-accent border border-white/5 transition"
          >
            <Minus size={15} />
          </button>
          <div className="px-3 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center gap-1.5 min-w-[76px] justify-center">
            <span className="font-mono font-bold text-wok-chord text-sm">
              {transpose === 0 ? (displayKey ?? '—') : (displayKey ?? `${transpose >= 0 ? '+' : ''}${transpose}`)}
            </span>
            {transpose !== 0 && (
              <span className="text-[10px] text-wok-muted font-mono">
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleTransposeUp}
            aria-label="Transpose key up one semitone"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white/5 hover:bg-wok-accent/20 hover:text-wok-accent border border-white/5 transition"
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={transpose === 0}
            title="Reset key to original"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white/5 hover:bg-wok-accent/20 hover:text-wok-accent border border-white/5 transition disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-inherit"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={() => setScrollActive((v) => !v)}
            aria-pressed={scrollActive}
            className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border transition ${
              scrollActive
                ? 'bg-wok-accent text-black border-wok-accent shadow-[0_0_20px_-4px_rgba(249,115,22,0.6)]'
                : 'bg-white/5 hover:bg-white/10 border-white/5'
            }`}
          >
            {scrollActive ? <Pause size={15} /> : <Play size={15} />}
            <span className="text-xs md:text-sm font-medium">{scrollActive ? 'Pause' : 'Auto Scroll'}</span>
          </button>

          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white/5 border border-white/5">
            <Gauge size={13} className="text-wok-muted" aria-hidden />
            <label className="text-xs sr-only" htmlFor="scroll-speed-range">
              Scroll speed
            </label>
            <input
              id="scroll-speed-range"
              type="range"
              min={0.5}
              max={1.5}
              step={0.1}
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="w-24 md:w-32 accent-wok-accent"
            />
            <span className="text-[11px] font-mono text-wok-muted w-7 text-right">{scrollSpeed.toFixed(1)}x</span>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={toggleWakeLock}
            disabled={!wakeLockSupported}
            aria-pressed={wakeLockActive}
            title={
              !wakeLockSupported
                ? 'Wake Lock API not supported in this browser'
                : wakeLockActive
                ? 'Release wake lock (allow screen to dim)'
                : 'Keep screen on'
            }
            className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${
              wakeLockActive
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-white/5 hover:bg-white/10 border-white/5'
            }`}
          >
            {wakeLockActive ? <BatteryFull size={15} /> : <Battery size={15} />}
            <span className="text-xs md:text-sm font-medium">
              {wakeLockActive ? 'Screen On' : 'Keep Screen On'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
