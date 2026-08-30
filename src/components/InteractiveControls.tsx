import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  X,
  ChevronLeft,
  ChevronRight,
  Music,
  Share2,
  Check,
  Printer,
} from 'lucide-react';
import { generateChordSvg } from '../lib/chordDiagrams';

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
  chords: string[];
}

function renderChordHtml(rawText: string, semitones: number): RenderedResult {
  if (!rawText) return { html: '', chords: [] };
  const parser = new ChordProParser();
  const normalized = rawText
    .replace(/^---[\s\S]*?---\r?\n?/, '')
    .replace(/,[ \t]+/g, ', ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  const sheet: Song = parser.parse(normalized);

  const frontmatterBlock = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  let fmKey: string | undefined;
  for (const line of frontmatterBlock.split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === 'key') fmKey = v.trim().replace(/^["']|["']$/g, '');
  }
  const sheetKey = (sheet as any).key ? String((sheet as any).key) : undefined;
  const originalKey = fmKey || sheetKey;

  let final: Song = sheet;
  if (semitones !== 0) {
    let t = parser.parse(normalized);
    try {
      t = (t as any).transpose(semitones) || t;
    } catch {
      /* no-op */
    }
    if (inferUseFlats(originalKey) && originalKey) {
      const nk = transposeKeyName(originalKey, semitones, true);
      if (nk) {
        try {
          (t as any).setKey?.(nk);
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

  const collectedChords: string[] = [];
  try {
    const lines: any[] = (final as any).lines ?? [];
    for (const line of lines) {
      const items: any[] = line.items ?? [];
      for (const item of items) {
        if (item && item.chord) {
          collectedChords.push(String(item.chord).trim());
        }
      }
    }
  } catch {
    /* no-op */
  }

  const uniqueChords = Array.from(new Set(collectedChords.filter(Boolean)));
  return { html, key: displayedKey, originalKey, chords: uniqueChords };
}

function bindChordClicks(scope: HTMLElement, onChordClick: (chordName: string) => void) {
  scope.querySelectorAll<HTMLElement>('.chord').forEach((el) => {
    el.onclick = (e) => {
      e.stopPropagation();
      const chordText = el.textContent?.trim();
      if (chordText) onChordClick(chordText);
    };
  });
}

export interface InteractiveControlsProps {
  rawText?: string;
  rawBody?: string;
  title?: string;
  initialKey?: string;
  mountId?: string;
  scrollTargetSelector?: string;
}

export default function InteractiveControls({
  rawText,
  rawBody,
  title,
  initialKey,
  mountId = 'chord-sheet-mount',
  scrollTargetSelector = '#chord-sheet',
}: InteractiveControlsProps) {
  const contentText = rawText || rawBody || '';

  const [transpose, setTranspose] = useState(0);
  const [capoFret, setCapoFret] = useState(0);
  const [copied, setCopied] = useState(false);
  const [instrument, setInstrument] = useState<'guitar' | 'ukulele'>('guitar');
  const [displayKey, setDisplayKey] = useState<string | undefined>(initialKey);
  const [currentChords, setCurrentChords] = useState<string[]>([]);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [showChordModal, setShowChordModal] = useState(false);

  const [scrollActive, setScrollActive] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const scrollFracRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);
  const scrollTargetRef = useRef<HTMLElement | null>(null);
  const mountRef = useRef<HTMLElement | null>(null);

  const effectiveSemitones = transpose - capoFret;

  const handleOpenChordDiagram = useCallback((chord: string) => {
    setSelectedChord(chord);
    setShowChordModal(true);
  }, []);

  const handleShare = useCallback(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard?.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, []);

  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  // Initialize from URL params if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTranspose = parseInt(params.get('transpose') || '0', 10);
      const urlCapo = parseInt(params.get('capo') || '0', 10);
      if (!isNaN(urlTranspose) && urlTranspose >= -12 && urlTranspose <= 12) {
        setTranspose(urlTranspose);
      }
      if (!isNaN(urlCapo) && urlCapo >= 0 && urlCapo <= 12) {
        setCapoFret(urlCapo);
      }
    }
  }, []);

  // Sync URL search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (transpose !== 0) {
        url.searchParams.set('transpose', String(transpose));
      } else {
        url.searchParams.delete('transpose');
      }
      if (capoFret !== 0) {
        url.searchParams.set('capo', String(capoFret));
      } else {
        url.searchParams.delete('capo');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [transpose, capoFret]);

  // Initialize DOM bindings
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (scrollTargetSelector) {
        scrollTargetRef.current = document.querySelector<HTMLElement>(scrollTargetSelector);
      }
      mountRef.current = document.getElementById(mountId);
      if (mountRef.current) {
        bindChordClicks(mountRef.current, handleOpenChordDiagram);
      }
    }
    const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    setWakeLockSupported(supported);

    // Initial extraction of chords
    const initial = renderChordHtml(contentText, effectiveSemitones);
    setCurrentChords(initial.chords);
  }, [scrollTargetSelector, mountId, contentText, handleOpenChordDiagram]);

  // Update chord sheet on transpose or capo change
  useEffect(() => {
    try {
      const { html, key, chords } = renderChordHtml(contentText, effectiveSemitones);
      setDisplayKey(key ?? initialKey);
      setCurrentChords(chords);

      const mount = mountRef.current ?? document.getElementById(mountId);
      if (mount && html) {
        mount.innerHTML = html;
        bindChordClicks(mount, handleOpenChordDiagram);
      }
    } catch (err) {
      console.error('Failed to update chords:', err);
    }
  }, [effectiveSemitones, contentText, initialKey, mountId, handleOpenChordDiagram]);

  // Auto-scroll loop
  useEffect(() => {
    if (!scrollActive) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      scrollFracRef.current = 0;
      return;
    }

    lastTsRef.current = 0;
    const step = (ts: number) => {
      const last = lastTsRef.current || ts;
      const dt = ts - last;
      lastTsRef.current = ts;
      const pxPerSec = scrollSpeed * 40;
      const delta = (pxPerSec * dt) / 1000;

      if (typeof window !== 'undefined') {
        scrollFracRef.current += delta;
        const apply = Math.floor(scrollFracRef.current);
        if (apply > 0) {
          scrollFracRef.current -= apply;
          window.scrollBy({ top: apply, behavior: 'instant' as ScrollBehavior });
        }
        const atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 10;
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
    };
  }, [scrollActive, scrollSpeed]);

  // Screen WakeLock toggle
  const toggleWakeLock = async () => {
    if (!wakeLockSupported) return;
    try {
      if (wakeLockActive && wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setWakeLockActive(false);
      } else if (navigator.wakeLock) {
        const lock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = lock;
        setWakeLockActive(true);
        lock.addEventListener('release', () => {
          setWakeLockActive(false);
          wakeLockRef.current = null;
        });
      }
    } catch {
      setWakeLockActive(false);
    }
  };

  const handleCycleChord = (direction: 'next' | 'prev') => {
    if (!selectedChord || currentChords.length === 0) return;
    const currentIndex = currentChords.indexOf(selectedChord);
    if (currentIndex === -1) {
      setSelectedChord(currentChords[0]);
      return;
    }
    const delta = direction === 'next' ? 1 : -1;
    const newIndex = (currentIndex + delta + currentChords.length) % currentChords.length;
    setSelectedChord(currentChords[newIndex]);
  };

  const activeChordSvg = useMemo(() => {
    if (!selectedChord) return '';
    return generateChordSvg(selectedChord, instrument);
  }, [selectedChord, instrument]);

  return (
    <div className="space-y-3">
      {/* Sleek Sticky Controls Bar */}
      <div className="sticky top-[65px] z-20 rounded-2xl border border-black/10 dark:border-white/10 bg-wok-panel/90 backdrop-blur-md p-2 sm:p-2.5 shadow-xl shadow-black/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* 1. Transpose Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-wok-muted mr-0.5">Key</span>
            <button
              type="button"
              onClick={() => setTranspose((t) => Math.max(-12, t - 1))}
              title="Transpose key down 1 semitone"
              aria-label="Transpose down"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-wok-accent/20 hover:text-wok-accent border border-black/5 dark:border-white/5 transition active:scale-95 text-xs"
            >
              <Minus size={14} />
            </button>

            <div className="px-2.5 h-8 rounded-lg bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5 flex items-center gap-1 min-w-[70px] justify-center">
              <span className="font-mono font-bold text-wok-chord text-xs">
                {displayKey ?? '—'}
              </span>
              {transpose !== 0 && (
                <span className="text-[10px] text-wok-muted font-mono">
                  {transpose > 0 ? `+${transpose}` : transpose}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setTranspose((t) => Math.min(12, t + 1))}
              title="Transpose key up 1 semitone"
              aria-label="Transpose up"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-wok-accent/20 hover:text-wok-accent border border-black/5 dark:border-white/5 transition active:scale-95 text-xs"
            >
              <Plus size={14} />
            </button>

            {transpose !== 0 && (
              <button
                type="button"
                onClick={() => setTranspose(0)}
                title="Reset to original key"
                aria-label="Reset transpose"
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-wok-muted hover:text-wok-text hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* 2. Capo Position */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-wok-muted">Capo:</span>
            <select
              value={capoFret}
              onChange={(e) => setCapoFret(Number(e.target.value))}
              aria-label="Select Capo Position"
              className="h-8 px-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-semibold text-wok-text outline-none focus:ring-1 focus:ring-wok-accent cursor-pointer"
            >
              <option value={0}>No Capo</option>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((fret) => (
                <option key={fret} value={fret}>
                  Fret {fret}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Auto Scroll & Speed */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setScrollActive((v) => !v)}
              aria-pressed={scrollActive}
              className={`h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition active:scale-95 ${
                scrollActive
                  ? 'bg-wok-accent text-white border-wok-accent shadow-[0_0_16px_-2px_rgba(249,115,22,0.7)]'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-black/5 dark:border-white/5 text-wok-text'
              }`}
            >
              {scrollActive ? <Pause size={14} /> : <Play size={14} />}
              <span>{scrollActive ? 'Pause' : 'Auto Scroll'}</span>
            </button>

            <div className="hidden md:flex items-center gap-1.5 h-8 px-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <Gauge size={12} className="text-wok-muted" aria-hidden />
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.1}
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                className="w-20 lg:w-24 accent-wok-accent wok-range"
              />
              <span className="text-[10px] font-mono text-wok-muted w-6 text-right">{scrollSpeed.toFixed(1)}x</span>
            </div>
          </div>

          {/* 4. Screen Wake Lock */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={toggleWakeLock}
              disabled={!wakeLockSupported}
              aria-pressed={wakeLockActive}
              title={
                !wakeLockSupported
                  ? 'Wake Lock API not supported in this browser'
                  : wakeLockActive
                  ? 'Release screen lock'
                  : 'Keep screen awake while playing'
              }
              className={`h-8 px-2 sm:px-2.5 inline-flex items-center gap-1 rounded-lg border text-xs font-semibold transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                wakeLockActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_-2px_rgba(16,185,129,0.5)]'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-black/5 dark:border-white/5 text-wok-muted'
              }`}
            >
              {wakeLockActive ? <BatteryFull size={14} /> : <Battery size={14} />}
              <span className="hidden sm:inline">{wakeLockActive ? 'Screen Locked' : 'Keep Awake'}</span>
            </button>
          </div>

          {/* 5. Share Transposed Key & Print/PDF */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              title="Copy link with active key & capo settings"
              aria-label="Share transposed chords"
              className={`h-8 px-2 sm:px-2.5 inline-flex items-center gap-1 rounded-lg border text-xs font-semibold transition active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-black/5 dark:border-white/5 text-wok-muted hover:text-wok-accent'
              }`}
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Print clean chord sheet or save as PDF"
              aria-label="Print chord sheet"
              className="h-8 px-2 sm:px-2.5 inline-flex items-center gap-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 text-wok-muted hover:text-wok-text text-xs font-semibold transition active:scale-95"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chords Summary Bar (Click chord to view fingering) */}
      {currentChords.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-wok-panel/50 border border-black/5 dark:border-white/5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-wok-muted flex items-center gap-1">
              <Music size={12} className="text-wok-accent" />
              Chords:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentChords.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => handleOpenChordDiagram(ch)}
                  title={`View ${instrument} diagram for ${ch}`}
                  className="px-2 py-0.5 rounded-md bg-wok-chord/10 hover:bg-wok-accent/20 text-wok-chord hover:text-wok-accent border border-wok-chord/30 font-mono font-bold text-xs transition active:scale-95"
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Instrument Toggle */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[10px] text-wok-muted uppercase font-semibold">Diagrams:</span>
            <button
              type="button"
              onClick={() => setInstrument('guitar')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                instrument === 'guitar'
                  ? 'bg-wok-accent text-white'
                  : 'bg-black/5 dark:bg-white/5 text-wok-muted hover:text-wok-text'
              }`}
            >
              Guitar
            </button>
            <button
              type="button"
              onClick={() => setInstrument('ukulele')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                instrument === 'ukulele'
                  ? 'bg-wok-accent text-white'
                  : 'bg-black/5 dark:bg-white/5 text-wok-muted hover:text-wok-text'
              }`}
            >
              Ukulele
            </button>
          </div>
        </div>
      )}

      {/* Capo Information Banner */}
      {capoFret > 0 && (
        <div className="px-3.5 py-1.5 rounded-lg bg-wok-accent/10 border border-wok-accent/20 text-wok-accent text-xs font-medium flex items-center justify-between">
          <span>
            📌 <strong>Capo on Fret {capoFret}</strong> — Chords shown below are relative to capo. Sound pitch matches key of {displayKey}.
          </span>
          <button
            type="button"
            onClick={() => setCapoFret(0)}
            className="text-[11px] underline opacity-80 hover:opacity-100 ml-2"
          >
            Remove Capo
          </button>
        </div>
      )}

      {/* Interactive Chord Diagram Modal */}
      {showChordModal && selectedChord && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowChordModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-black/10 dark:border-white/10 bg-wok-panel p-5 shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-extrabold text-wok-chord">
                  {selectedChord}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[11px] font-semibold capitalize text-wok-muted">
                  {instrument}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowChordModal(false)}
                className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-wok-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-wok-text transition"
                aria-label="Close chord diagram"
              >
                <X size={16} />
              </button>
            </div>

            {/* SVG Diagram Canvas */}
            <div
              className="flex items-center justify-center py-2 text-wok-text"
              dangerouslySetInnerHTML={{ __html: activeChordSvg }}
            />

            {/* Instrument Switcher & Navigation Footer */}
            <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCycleChord('prev')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-wok-muted hover:text-wok-accent transition"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInstrument('guitar')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                    instrument === 'guitar'
                      ? 'bg-wok-accent text-white'
                      : 'text-wok-muted hover:text-wok-text'
                  }`}
                >
                  Guitar
                </button>
                <button
                  type="button"
                  onClick={() => setInstrument('ukulele')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                    instrument === 'ukulele'
                      ? 'bg-wok-accent text-white'
                      : 'text-wok-muted hover:text-wok-text'
                  }`}
                >
                  Uke
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCycleChord('next')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-wok-muted hover:text-wok-accent transition"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
