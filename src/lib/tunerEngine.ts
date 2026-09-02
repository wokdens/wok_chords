export interface TuningString {
  name: string;
  note: string;
  octave: number;
  frequency: number;
}

export interface InstrumentTuning {
  id: string;
  name: string;
  strings: TuningString[];
}

export const GUITAR_STANDARD: InstrumentTuning = {
  id: 'guitar-standard',
  name: 'Guitar (Standard EADGBE)',
  strings: [
    { name: '6th (Low E)', note: 'E', octave: 2, frequency: 82.41 },
    { name: '5th (A)', note: 'A', octave: 2, frequency: 110.0 },
    { name: '4th (D)', note: 'D', octave: 3, frequency: 146.83 },
    { name: '3rd (G)', note: 'G', octave: 3, frequency: 196.0 },
    { name: '2nd (B)', note: 'B', octave: 3, frequency: 246.94 },
    { name: '1st (High E)', note: 'E', octave: 4, frequency: 329.63 },
  ],
};

export const GUITAR_DROP_D: InstrumentTuning = {
  id: 'guitar-drop-d',
  name: 'Guitar (Drop D)',
  strings: [
    { name: '6th (Low D)', note: 'D', octave: 2, frequency: 73.42 },
    { name: '5th (A)', note: 'A', octave: 2, frequency: 110.0 },
    { name: '4th (D)', note: 'D', octave: 3, frequency: 146.83 },
    { name: '3rd (G)', note: 'G', octave: 3, frequency: 196.0 },
    { name: '2nd (B)', note: 'B', octave: 3, frequency: 246.94 },
    { name: '1st (High E)', note: 'E', octave: 4, frequency: 329.63 },
  ],
};

export const UKULELE_STANDARD: InstrumentTuning = {
  id: 'ukulele-standard',
  name: 'Ukulele (Standard GCEA)',
  strings: [
    { name: '4th (G)', note: 'G', octave: 4, frequency: 392.0 },
    { name: '3rd (C)', note: 'C', octave: 4, frequency: 261.63 },
    { name: '2nd (E)', note: 'E', octave: 4, frequency: 329.63 },
    { name: '1st (A)', note: 'A', octave: 4, frequency: 440.0 },
  ],
};

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getClosestNote(frequency: number): {
  note: string;
  octave: number;
  targetFreq: number;
  cents: number;
  inTune: boolean;
} {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const roundedNote = Math.round(noteNum) + 69;
  const noteIndex = roundedNote % 12;
  const octave = Math.floor(roundedNote / 12) - 1;
  const targetFreq = 440 * Math.pow(2, (roundedNote - 69) / 12);
  const cents = Math.floor(1200 * (Math.log(frequency / targetFreq) / Math.log(2)));

  return {
    note: NOTE_STRINGS[noteIndex],
    octave,
    targetFreq,
    cents,
    inTune: Math.abs(cents) <= 4,
  };
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playReferenceTone(frequency: number, duration = 2.5): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Warm guitar-like string harmonic profile
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch (err) {
    console.error('Failed to play reference tone:', err);
  }
}

// Autocorrelation pitch detection algorithm
export function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // Not enough signal

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const subBuf = buf.slice(r1, r2);
  const subSize = subBuf.length;

  const c = new Array(subSize).fill(0);
  for (let i = 0; i < subSize; i++) {
    for (let j = 0; j < subSize - i; j++) {
      c[i] = c[i] + subBuf[j] * subBuf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < subSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  // Parabolic interpolation for fine sub-sample frequency accuracy
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}
