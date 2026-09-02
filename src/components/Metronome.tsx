import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, Plus, Minus } from 'lucide-react';

interface MetronomeProps {
  initialBpm?: number;
  compact?: boolean;
}

export default function Metronome({ initialBpm = 100, compact = false }: MetronomeProps) {
  const [bpm, setBpm] = useState<number>(initialBpm);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [beatsPerBar, setBeatsPerBar] = useState<number>(4);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.7);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const beatCountRef = useRef<number>(0);
  const tapTimesRef = useRef<number[]>([]);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playClick = useCallback((time: number, isAccent: boolean) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isAccent ? 987.77 : 587.33, time); // B5 vs D5 crisp click

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(volume * (isAccent ? 0.9 : 0.6), time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.045);
  }, [getAudioContext, volume]);

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    const scheduleAheadTime = 0.1; // 100ms lookahead

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const isAccent = beatCountRef.current % beatsPerBar === 0;
      playClick(nextNoteTimeRef.current, isAccent);

      const beatIdx = beatCountRef.current % beatsPerBar;
      setTimeout(() => {
        setCurrentBeat(beatIdx);
      }, Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000));

      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      beatCountRef.current++;
    }

    timerIdRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, beatsPerBar, getAudioContext, playClick]);

  useEffect(() => {
    if (isPlaying) {
      const ctx = getAudioContext();
      nextNoteTimeRef.current = ctx.currentTime + 0.05;
      beatCountRef.current = 0;
      scheduler();
    } else {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
      setCurrentBeat(0);
    }

    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, [isPlaying, scheduler, getAudioContext]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleTap = () => {
    const now = performance.now();
    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length > 5) {
      tapTimesRef.current.shift();
    }

    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
      }
    }
  };

  return (
    <div className={`bg-wok-panel/90 border border-black/10 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-lg ${compact ? 'max-w-xs' : 'max-w-md w-full'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-brand-orange" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Metronome
          </span>
        </div>

        {/* Time Signature Buttons */}
        <div className="flex gap-1 text-[11px] font-mono">
          {[2, 3, 4, 6].map((ts) => (
            <button
              key={ts}
              onClick={() => setBeatsPerBar(ts)}
              className={`px-2 py-0.5 rounded transition-all ${
                beatsPerBar === ts
                  ? 'bg-brand-orange text-white font-bold'
                  : 'bg-black/5 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {ts}/4
            </button>
          ))}
        </div>
      </div>

      {/* Visual Beat Indicator Dots */}
      <div className="flex justify-center gap-2 mb-4 py-2">
        {Array.from({ length: beatsPerBar }).map((_, i) => (
          <div
            key={i}
            className={`transition-all duration-75 rounded-full ${
              currentBeat === i && isPlaying
                ? i === 0
                  ? 'w-4 h-4 bg-brand-orange shadow-[0_0_12px_rgba(249,115,22,0.8)] scale-125'
                  : 'w-4 h-4 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] scale-110'
                : 'w-3.5 h-3.5 bg-black/10 dark:bg-white/15'
            }`}
          />
        ))}
      </div>

      {/* BPM Numerical Display and Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => setBpm((b) => Math.max(40, b - 5))}
          className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors"
          title="-5 BPM"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="text-center">
          <div className="text-4xl sm:text-5xl font-mono font-black text-slate-900 dark:text-white tracking-tight">
            {bpm}
          </div>
          <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
            BPM
          </div>
        </div>

        <button
          onClick={() => setBpm((b) => Math.min(240, b + 5))}
          className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors"
          title="+5 BPM"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={40}
        max={240}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="w-full h-1.5 bg-black/10 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-brand-orange mb-4"
      />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-brand-orange hover:bg-brand-orange/90 text-white'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white ml-0.5" />
              <span>Start Metronome</span>
            </>
          )}
        </button>

        <button
          onClick={handleTap}
          className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
          title="Tap repeatedly to set tempo"
        >
          Tap
        </button>
      </div>
    </div>
  );
}
