import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Music, CheckCircle2 } from 'lucide-react';
import {
  GUITAR_STANDARD,
  GUITAR_DROP_D,
  UKULELE_STANDARD,
  playReferenceTone,
  autoCorrelate,
  getClosestNote,
} from '../lib/tunerEngine';
import type { InstrumentTuning, TuningString } from '../lib/tunerEngine';

interface GuitarTunerProps {
  standalone?: boolean;
}

export default function GuitarTuner({ standalone = false }: GuitarTunerProps) {
  const [selectedTuning, setSelectedTuning] = useState<InstrumentTuning>(GUITAR_STANDARD);
  const [activeToneString, setActiveToneString] = useState<string | null>(null);

  // Mic state
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<{
    note: string;
    octave: number;
    cents: number;
    freq: number;
    inTune: boolean;
  } | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const playStringTone = (s: TuningString) => {
    setActiveToneString(s.name);
    playReferenceTone(s.frequency, 2.5);
    setTimeout(() => {
      setActiveToneString(null);
    }, 2500);
  };

  const updatePitch = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const freq = autoCorrelate(buffer, audioContextRef.current.sampleRate);
    if (freq !== -1 && freq >= 50 && freq <= 1000) {
      const { note, octave, cents, inTune } = getClosestNote(freq);
      setDetectedPitch({
        note,
        octave,
        cents,
        freq: Math.round(freq * 10) / 10,
        inTune,
      });
    }

    rafIdRef.current = requestAnimationFrame(updatePitch);
  }, []);

  const startMic = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      streamRef.current = stream;

      setIsMicActive(true);
      rafIdRef.current = requestAnimationFrame(updatePitch);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setMicError('Microphone permission denied or unsupported in this browser.');
      setIsMicActive(false);
    }
  };

  const stopMic = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsMicActive(false);
    setDetectedPitch(null);
  };

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  return (
    <div className={`bg-wok-panel/95 border border-black/10 dark:border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl ${standalone ? 'max-w-2xl mx-auto' : 'w-full'}`}>
      {/* Header and Tuning Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Guitar & Ukulele Tuner
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tune by ear with reference tones or use your live microphone
            </p>
          </div>
        </div>

        {/* Instrument Dropdown / Switcher */}
        <div className="flex gap-1.5 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-medium">
          {[GUITAR_STANDARD, GUITAR_DROP_D, UKULELE_STANDARD].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTuning(t)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTuning.id === t.id
                  ? 'bg-brand-orange text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: Live Microphone Pitch Gauge */}
      <div className="my-6 p-5 sm:p-6 rounded-xl bg-black/5 dark:bg-black/30 border border-black/5 dark:border-white/5 text-center relative overflow-hidden">
        {isMicActive && detectedPitch ? (
          <div>
            {/* Note Display */}
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span
                className={`text-6xl sm:text-7xl font-mono font-black tracking-tight transition-colors ${
                  detectedPitch.inTune
                    ? 'text-emerald-500'
                    : detectedPitch.cents < 0
                    ? 'text-amber-500'
                    : 'text-sky-500'
                }`}
              >
                {detectedPitch.note}
              </span>
              <span className="text-2xl font-mono text-slate-400 font-semibold">
                {detectedPitch.octave}
              </span>
            </div>

            {/* In-Tune / Flat / Sharp Status Pill */}
            <div className="mb-4">
              {detectedPitch.inTune ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Perfect Pitch!
                </span>
              ) : (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    detectedPitch.cents < 0
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                      : 'bg-sky-500/10 text-sky-500 border border-sky-500/30'
                  }`}
                >
                  {detectedPitch.cents < 0
                    ? `Too Flat (${detectedPitch.cents} cents)`
                    : `Too Sharp (+${detectedPitch.cents} cents)`}
                </span>
              )}
            </div>

            {/* Pitch Gauge Needle Bar */}
            <div className="relative max-w-sm mx-auto h-6 flex items-center mb-3">
              {/* Scale marks */}
              <div className="absolute inset-x-0 h-1.5 bg-black/15 dark:bg-white/10 rounded-full" />
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-500 -translate-x-1/2 z-10" />

              {/* Dynamic Needle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-75"
                style={{
                  left: `calc(50% + ${Math.max(-48, Math.min(48, detectedPitch.cents)) * 0.95}%)`,
                  backgroundColor: detectedPitch.inTune
                    ? '#10b981'
                    : detectedPitch.cents < 0
                    ? '#f59e0b'
                    : '#0ea5e9',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              {detectedPitch.freq} Hz
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isMicActive ? 'Listening... Pluck any string' : 'Live Auto-Tuner'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              Enable your microphone for real-time string pitch detection with automated flat/sharp needle guidance.
            </p>

            <button
              onClick={isMicActive ? stopMic : startMic}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                isMicActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-brand-orange hover:bg-brand-orange/90 text-white'
              }`}
            >
              {isMicActive ? (
                <>
                  <MicOff className="w-4 h-4" /> Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> Enable Microphone
                </>
              )}
            </button>

            {micError && (
              <p className="text-xs text-rose-500 mt-3">{micError}</p>
            )}
          </div>
        )}
      </div>

      {/* Mode 2: By-Ear String Reference Tone Generator */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-brand-orange" />
            Tune by Ear (Reference Tones)
          </span>
          <span className="text-[11px] text-slate-400">Click string to play pitch</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {selectedTuning.strings.map((s) => {
            const isPlaying = activeToneString === s.name;
            return (
              <button
                key={s.name}
                onClick={() => playStringTone(s)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  isPlaying
                    ? 'bg-brand-orange text-white border-brand-orange shadow-md scale-105'
                    : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:border-brand-orange/40 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="text-xl font-mono font-black">{s.note}</span>
                <span className="text-[10px] font-mono opacity-70 mt-0.5">{s.name}</span>
                <span className="text-[9px] font-mono opacity-50 mt-0.5">{s.frequency} Hz</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
