const EASY_CHORDS = new Set([
  'C', 'C7', 'Cmaj7', 'Cadd9',
  'D', 'D7', 'Dm', 'Dsus2', 'Dsus4',
  'E', 'E7', 'Em', 'Em7', 'Esus4',
  'G', 'G7', 'Gadd9',
  'A', 'A7', 'Am', 'Am7', 'Asus2', 'Asus4',
  'F', 'Fmaj7',
]);

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function transposeChordName(chord: string, semitones: number): string {
  if (!chord || semitones === 0) return chord;
  const match = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2];

  let idx = NOTES_SHARP.indexOf(root);
  if (idx === -1) idx = NOTES_FLAT.indexOf(root);
  if (idx === -1) return chord;

  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return NOTES_SHARP[newIdx] + suffix;
}

export interface SimplifyRecommendation {
  semitones: number;
  capoFret: number;
  openChordCount: number;
  totalChords: number;
  percentage: number;
  sampleChords: string[];
}

export function findOptimalEasyChords(chords: string[]): SimplifyRecommendation | null {
  if (!chords || chords.length === 0) return null;

  // Deduplicate chords ignoring slashes
  const uniqueChords = Array.from(new Set(chords.map((c) => c.split('/')[0])));

  // Current score
  const currentEasyCount = uniqueChords.filter((c) => EASY_CHORDS.has(c)).length;
  const currentRatio = currentEasyCount / uniqueChords.length;

  // If already > 85% easy chords and no capo needed, no simplification necessary
  if (currentRatio >= 0.85) return null;

  let bestRecommendation: SimplifyRecommendation | null = null;
  let bestScore = -1;

  // Check all 12 semitones
  for (let t = -6; t <= 6; t++) {
    if (t === 0) continue;

    // To preserve concert pitch:
    // If you transpose song chord shapes by `t` semitones,
    // placing Capo at `(12 - (t % 12)) % 12` restores original concert pitch!
    const capoFret = (12 - ((t % 12) + 12) % 12) % 12;

    // Capo frets 1 to 7 are practical for guitarists (fret > 7 gets crowded)
    if (capoFret < 1 || capoFret > 7) continue;

    const transposed = uniqueChords.map((c) => transposeChordName(c, t));
    const easyCount = transposed.filter((c) => EASY_CHORDS.has(c)).length;
    const ratio = easyCount / transposed.length;

    // Score favors higher easy chord ratio, and lower capo fret
    const score = ratio * 100 - capoFret * 2;

    if (ratio > currentRatio && score > bestScore) {
      bestScore = score;
      bestRecommendation = {
        semitones: t,
        capoFret,
        openChordCount: easyCount,
        totalChords: uniqueChords.length,
        percentage: Math.round(ratio * 100),
        sampleChords: transposed.slice(0, 5),
      };
    }
  }

  return bestRecommendation;
}
