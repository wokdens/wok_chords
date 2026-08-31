export interface ChordShape {
  frets: number[]; // -1 = muted (X), 0 = open (O), >0 = fret number
  fingers?: number[]; // 1=index, 2=middle, 3=ring, 4=pinky
  baseFret?: number; // 1-indexed start fret, defaults to 1
  barres?: number[];
}

export interface InstrumentChordDb {
  [chordName: string]: ChordShape;
}

// Normalize chord names: e.g. "C#m" -> "C#m", "Db" -> "Db", "F#m7" -> "F#m7"
export function normalizeChordName(chord: string): string {
  if (!chord) return '';
  return chord
    .trim()
    .replace(/^\[|\]$/g, '')
    .replace(/\s+/g, '');
}

// Guitar chord dictionary (6 strings: E2 A2 D3 G3 B3 E4)
export const GUITAR_CHORDS: InstrumentChordDb = {
  // C
  'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'Cm': { frets: [-1, 3, 5, 5, 4, 3], baseFret: 3, barres: [3] },
  'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  'Cmaj7': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  'Cm7': { frets: [-1, 3, 5, 3, 4, 3], baseFret: 3, barres: [3] },
  'Csus2': { frets: [-1, 3, 0, 0, 1, 0] },
  'Csus4': { frets: [-1, 3, 3, 0, 1, 1] },
  'Cadd9': { frets: [-1, 3, 2, 0, 3, 0] },

  // C# / Db
  'C#': { frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barres: [4] },
  'Db': { frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barres: [4] },
  'C#m': { frets: [-1, 4, 6, 6, 5, 4], baseFret: 4, barres: [4] },
  'Dbm': { frets: [-1, 4, 6, 6, 5, 4], baseFret: 4, barres: [4] },
  'C#7': { frets: [-1, 4, 6, 4, 6, 4], baseFret: 4, barres: [4] },
  'Db7': { frets: [-1, 4, 6, 4, 6, 4], baseFret: 4, barres: [4] },
  'C#m7': { frets: [-1, 4, 6, 4, 5, 4], baseFret: 4, barres: [4] },
  'Dbm7': { frets: [-1, 4, 6, 4, 5, 4], baseFret: 4, barres: [4] },

  // D
  'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'D7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  'Dmaj7': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] },
  'Dm7': { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  'Dsus2': { frets: [-1, -1, 0, 2, 3, 0] },
  'Dsus4': { frets: [-1, -1, 0, 2, 3, 3] },

  // D# / Eb
  'D#': { frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barres: [6] },
  'Eb': { frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barres: [6] },
  'D#m': { frets: [-1, 6, 8, 8, 7, 6], baseFret: 6, barres: [6] },
  'Ebm': { frets: [-1, 6, 8, 8, 7, 6], baseFret: 6, barres: [6] },
  'D#7': { frets: [-1, 6, 8, 6, 8, 6], baseFret: 6, barres: [6] },
  'Eb7': { frets: [-1, 6, 8, 6, 8, 6], baseFret: 6, barres: [6] },

  // E
  'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  'Emaj7': { frets: [0, 2, 1, 1, 0, 0] },
  'Em7': { frets: [0, 2, 2, 0, 3, 0] },
  'Esus4': { frets: [0, 2, 2, 2, 0, 0] },

  // F
  'F': { frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barres: [1] },
  'Fm': { frets: [1, 3, 3, 1, 1, 1], baseFret: 1, barres: [1] },
  'F7': { frets: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1] },
  'Fmaj7': { frets: [-1, -1, 3, 2, 1, 0] },
  'Fm7': { frets: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1] },
  'Fsus4': { frets: [1, 3, 3, 3, 1, 1], baseFret: 1, barres: [1] },

  // F# / Gb
  'F#': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barres: [2] },
  'Gb': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barres: [2] },
  'F#m': { frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barres: [2] },
  'Gbm': { frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barres: [2] },
  'F#7': { frets: [2, 4, 2, 3, 2, 2], baseFret: 2, barres: [2] },
  'Gb7': { frets: [2, 4, 2, 3, 2, 2], baseFret: 2, barres: [2] },
  'F#m7': { frets: [2, 4, 2, 2, 2, 2], baseFret: 2, barres: [2] },
  'Gbm7': { frets: [2, 4, 2, 2, 2, 2], baseFret: 2, barres: [2] },

  // G
  'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  'Gm': { frets: [3, 5, 5, 3, 3, 3], baseFret: 3, barres: [3] },
  'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  'Gmaj7': { frets: [3, 2, 0, 0, 0, 2] },
  'Gm7': { frets: [3, 5, 3, 3, 3, 3], baseFret: 3, barres: [3] },
  'Gsus4': { frets: [3, 3, 0, 0, 1, 3] },
  'Gadd9': { frets: [3, 2, 0, 2, 0, 3] },

  // G# / Ab
  'G#': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barres: [4] },
  'Ab': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barres: [4] },
  'G#m': { frets: [4, 6, 6, 4, 4, 4], baseFret: 4, barres: [4] },
  'Abm': { frets: [4, 6, 6, 4, 4, 4], baseFret: 4, barres: [4] },
  'G#7': { frets: [4, 6, 4, 5, 4, 4], baseFret: 4, barres: [4] },
  'Ab7': { frets: [4, 6, 4, 5, 4, 4], baseFret: 4, barres: [4] },
  'G#m7': { frets: [4, 6, 4, 4, 4, 4], baseFret: 4, barres: [4] },
  'Abm7': { frets: [4, 6, 4, 4, 4, 4], baseFret: 4, barres: [4] },

  // A
  'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'A7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  'Amaj7': { frets: [-1, 0, 2, 1, 2, 0] },
  'Am7': { frets: [-1, 0, 2, 0, 1, 0] },
  'Asus2': { frets: [-1, 0, 2, 2, 0, 0] },
  'Asus4': { frets: [-1, 0, 2, 2, 3, 0] },

  // A# / Bb
  'A#': { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  'Bb': { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  'A#m': { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barres: [1] },
  'Bbm': { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barres: [1] },
  'A#7': { frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, barres: [1] },
  'Bb7': { frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, barres: [1] },
  'A#m7': { frets: [-1, 1, 3, 1, 2, 1], baseFret: 1, barres: [1] },
  'Bbm7': { frets: [-1, 1, 3, 1, 2, 1], baseFret: 1, barres: [1] },

  // B
  'B': { frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, barres: [2] },
  'Bm': { frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, barres: [2] },
  'B7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  'Bmaj7': { frets: [-1, 2, 4, 3, 4, 2], baseFret: 2, barres: [2] },
  'Bm7': { frets: [-1, 2, 4, 2, 3, 2], baseFret: 2, barres: [2] },
  'Bsus4': { frets: [-1, 2, 4, 4, 5, 2], baseFret: 2, barres: [2] },
};

// Ukulele chord dictionary (4 strings: G4 C4 E4 A4)
export const UKULELE_CHORDS: InstrumentChordDb = {
  'C': { frets: [0, 0, 0, 3] },
  'Cm': { frets: [0, 3, 3, 3], baseFret: 1 },
  'C7': { frets: [0, 0, 0, 1] },
  'Cmaj7': { frets: [0, 0, 0, 2] },
  'C#': { frets: [1, 1, 1, 4] },
  'Db': { frets: [1, 1, 1, 4] },
  'C#m': { frets: [1, 4, 4, 4] },
  'Dbm': { frets: [1, 4, 4, 4] },
  'D': { frets: [2, 2, 2, 0] },
  'Dm': { frets: [2, 2, 1, 0] },
  'D7': { frets: [2, 0, 2, 0] },
  'Dmaj7': { frets: [2, 2, 2, 4] },
  'D#': { frets: [3, 3, 3, 1] },
  'Eb': { frets: [3, 3, 3, 1] },
  'E': { frets: [4, 4, 4, 2], baseFret: 2 },
  'Em': { frets: [0, 4, 3, 2] },
  'E7': { frets: [1, 2, 0, 2] },
  'Em7': { frets: [0, 2, 0, 2] },
  'F': { frets: [2, 0, 1, 0] },
  'Fm': { frets: [1, 0, 1, 3] },
  'F7': { frets: [2, 3, 1, 0] },
  'F#': { frets: [3, 1, 2, 1] },
  'Gb': { frets: [3, 1, 2, 1] },
  'F#m': { frets: [2, 1, 2, 0] },
  'Gbm': { frets: [2, 1, 2, 0] },
  'F#7': { frets: [3, 4, 2, 4] },
  'G': { frets: [0, 2, 3, 2] },
  'Gm': { frets: [0, 2, 3, 1] },
  'G7': { frets: [0, 2, 1, 2] },
  'Gmaj7': { frets: [0, 2, 2, 2] },
  'G#': { frets: [5, 3, 4, 3] },
  'Ab': { frets: [5, 3, 4, 3] },
  'G#m': { frets: [4, 3, 4, 2] },
  'Abm': { frets: [4, 3, 4, 2] },
  'A': { frets: [2, 1, 0, 0] },
  'Am': { frets: [2, 0, 0, 0] },
  'A7': { frets: [0, 1, 0, 0] },
  'Amaj7': { frets: [1, 1, 0, 0] },
  'Am7': { frets: [0, 0, 0, 0] },
  'A#': { frets: [3, 2, 1, 1] },
  'Bb': { frets: [3, 2, 1, 1] },
  'A#m': { frets: [3, 1, 1, 1] },
  'Bbm': { frets: [3, 1, 1, 1] },
  'B': { frets: [4, 3, 2, 2] },
  'Bm': { frets: [4, 2, 2, 2] },
  'B7': { frets: [2, 3, 2, 2] },
};

export function getChordShape(chord: string, instrument: 'guitar' | 'ukulele' = 'guitar'): ChordShape | undefined {
  const clean = normalizeChordName(chord);
  const db = instrument === 'ukulele' ? UKULELE_CHORDS : GUITAR_CHORDS;

  if (db[clean]) return db[clean];

  // Fallback to base chord if minor/7th variant isn't found
  const baseMatch = clean.match(/^([A-G][#b]?)/);
  if (baseMatch && db[baseMatch[1]]) {
    return db[baseMatch[1]];
  }

  return undefined;
}

export function generatePianoChordSvg(chordName: string): string {
  const clean = normalizeChordName(chordName);
  const ROOT_NOTES: { [n: string]: number } = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };

  const rootMatch = clean.match(/^([A-G][#b]?)/);
  if (!rootMatch) {
    return `<svg viewBox="0 0 160 80" class="w-full h-auto max-w-[160px] select-none"><text x="80" y="40" text-anchor="middle" font-size="11" fill="currentColor" class="text-wok-muted">Diagram pending</text></svg>`;
  }

  const rootNote = rootMatch[1];
  const rootPitch = ROOT_NOTES[rootNote] ?? 0;
  const suffix = clean.slice(rootNote.length);

  let intervals = [0, 4, 7]; // Major
  if (suffix === 'm' || suffix === 'min') intervals = [0, 3, 7];
  else if (suffix === '7' || suffix === 'dom7') intervals = [0, 4, 7, 10];
  else if (suffix === 'maj7') intervals = [0, 4, 7, 11];
  else if (suffix === 'm7' || suffix === 'min7') intervals = [0, 3, 7, 10];
  else if (suffix === 'sus2') intervals = [0, 2, 7];
  else if (suffix === 'sus4') intervals = [0, 5, 7];
  else if (suffix === 'dim') intervals = [0, 3, 6];
  else if (suffix === 'aug') intervals = [0, 4, 8];
  else if (suffix === 'add9') intervals = [0, 4, 7, 14];

  const activePitches = new Set(intervals.map((i) => (rootPitch + i) % 12));

  const whiteKeyPitches = [0, 2, 4, 5, 7, 9, 11, 0, 2, 4, 5, 7, 9, 11]; // 2 octaves C to B
  const blackKeys = [
    { pitch: 1, pos: 0 },
    { pitch: 3, pos: 1 },
    { pitch: 6, pos: 3 },
    { pitch: 8, pos: 4 },
    { pitch: 10, pos: 5 },
    { pitch: 1, pos: 7 },
    { pitch: 3, pos: 8 },
    { pitch: 6, pos: 10 },
    { pitch: 8, pos: 11 },
    { pitch: 10, pos: 12 },
  ];

  const keyWidth = 14;
  const keyHeight = 50;
  const blackKeyWidth = 9;
  const blackKeyHeight = 30;
  const totalWidth = whiteKeyPitches.length * keyWidth;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth + 10} 78" class="w-full h-auto max-w-[200px] select-none">`;
  svg += `<text x="${(totalWidth + 10) / 2}" y="14" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="currentColor" class="text-wok-chord">${chordName} (Piano)</text>`;
  svg += `<g transform="translate(5, 20)">`;

  // White keys
  whiteKeyPitches.forEach((pitch, i) => {
    const x = i * keyWidth;
    const isActive = activePitches.has(pitch);
    const fill = isActive ? 'rgb(249 115 22)' : 'rgb(248 250 252)';
    const stroke = 'rgb(148 163 184 / 0.4)';
    svg += `<rect x="${x}" y="0" width="${keyWidth}" height="${keyHeight}" fill="${fill}" stroke="${stroke}" stroke-width="1" rx="1.5"/>`;
    if (isActive) {
      svg += `<circle cx="${x + keyWidth / 2}" cy="${keyHeight - 7}" r="2.5" fill="white"/>`;
    }
  });

  // Black keys
  blackKeys.forEach(({ pitch, pos }) => {
    const x = pos * keyWidth + keyWidth - blackKeyWidth / 2;
    const isActive = activePitches.has(pitch);
    const fill = isActive ? 'rgb(249 115 22)' : 'rgb(30 41 59)';
    svg += `<rect x="${x}" y="0" width="${blackKeyWidth}" height="${blackKeyHeight}" fill="${fill}" rx="1"/>`;
    if (isActive) {
      svg += `<circle cx="${x + blackKeyWidth / 2}" cy="${blackKeyHeight - 5}" r="1.8" fill="white"/>`;
    }
  });

  svg += `</g></svg>`;
  return svg;
}

export function generateChordSvg(
  chordName: string,
  instrument: 'guitar' | 'ukulele' | 'piano' = 'guitar',
  options?: { width?: number; height?: number; theme?: 'dark' | 'light' }
): string {
  if (instrument === 'piano') {
    return generatePianoChordSvg(chordName);
  }

  const shape = getChordShape(chordName, instrument);
  const numStrings = instrument === 'ukulele' ? 4 : 6;
  const numFrets = 4;

  const width = options?.width ?? (numStrings === 4 ? 110 : 130);
  const height = options?.height ?? 140;

  const padX = 22;
  const padTop = 32;
  const gridWidth = width - padX * 2;
  const gridHeight = height - padTop - 18;

  const stringSpacing = gridWidth / (numStrings - 1);
  const fretSpacing = gridHeight / numFrets;

  const baseFret = shape?.baseFret ?? 1;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="w-full h-auto max-w-[130px] select-none">`;

  // Title (Chord name)
  svg += `<text x="${width / 2}" y="18" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="currentColor" class="text-wok-chord">${chordName}</text>`;

  // Nut or Top fret line
  const nutStrokeWidth = baseFret === 1 ? 4 : 1.5;
  svg += `<line x1="${padX}" y1="${padTop}" x2="${padX + gridWidth}" y2="${padTop}" stroke="currentColor" stroke-width="${nutStrokeWidth}" stroke-linecap="round" class="text-wok-text/80"/>`;

  // Base fret indicator (e.g. "3fr")
  if (baseFret > 1) {
    svg += `<text x="${padX - 8}" y="${padTop + fretSpacing * 0.7}" text-anchor="end" font-family="monospace" font-size="10" font-weight="600" fill="currentColor" class="text-wok-muted">${baseFret}fr</text>`;
  }

  // Fret lines (horizontal)
  for (let f = 1; f <= numFrets; f++) {
    const y = padTop + f * fretSpacing;
    svg += `<line x1="${padX}" y1="${y}" x2="${padX + gridWidth}" y2="${y}" stroke="currentColor" stroke-width="1" class="text-wok-muted/30"/>`;
  }

  // String lines (vertical)
  for (let s = 0; s < numStrings; s++) {
    const x = padX + s * stringSpacing;
    svg += `<line x1="${x}" y1="${padTop}" x2="${x}" y2="${padTop + gridHeight}" stroke="currentColor" stroke-width="1.2" class="text-wok-muted/50"/>`;
  }

  if (shape) {
    // Render Barres
    if (shape.barres && shape.barres.length > 0) {
      for (const barreFret of shape.barres) {
        const relFret = barreFret - baseFret + 1;
        if (relFret >= 1 && relFret <= numFrets) {
          const y = padTop + (relFret - 0.5) * fretSpacing;
          const x1 = padX;
          const x2 = padX + gridWidth;
          svg += `<rect x="${x1}" y="${y - 4}" width="${x2 - x1}" height="8" rx="4" fill="currentColor" class="text-wok-accent opacity-90"/>`;
        }
      }
    }

    // Render Dots and String status (O / X)
    shape.frets.forEach((fret, stringIdx) => {
      const x = padX + stringIdx * stringSpacing;

      if (fret === -1) {
        // Muted string (X)
        svg += `<text x="${x}" y="${padTop - 6}" text-anchor="middle" font-family="monospace" font-size="10" font-weight="700" fill="currentColor" class="text-wok-muted">✕</text>`;
      } else if (fret === 0) {
        // Open string (O)
        svg += `<circle cx="${x}" cy="${padTop - 8}" r="3" fill="none" stroke="currentColor" stroke-width="1.5" class="text-wok-accent"/>`;
      } else {
        // Fretted dot
        const relFret = fret - baseFret + 1;
        if (relFret >= 1 && relFret <= numFrets) {
          const y = padTop + (relFret - 0.5) * fretSpacing;
          svg += `<circle cx="${x}" cy="${y}" r="5" fill="currentColor" class="text-wok-accent"/>`;
        }
      }
    });
  } else {
    // Chord shape not found placeholder
    svg += `<text x="${width / 2}" y="${padTop + gridHeight / 2}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="currentColor" class="text-wok-muted">Diagram pending</text>`;
  }

  svg += `</svg>`;
  return svg;
}
