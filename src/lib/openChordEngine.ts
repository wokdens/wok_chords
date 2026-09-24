import { getAllSongs, type SongItem } from './songStore';

// Strict Open Chords: Natural roots only (A, C, D, E, G, and open F/Fmaj7).
// Strictly NO sharps (#), NO flats (b), NO standard barre chords (B, Bm, Fm, F#m, C#m, Bb, etc.)
export const STRICT_OPEN_CHORDS_SET = new Set([
  'C', 'C7', 'Cmaj7', 'Cadd9',
  'D', 'Dm', 'D7', 'Dsus2', 'Dsus4',
  'E', 'Em', 'E7', 'Em7', 'Esus4',
  'G', 'G7', 'Gadd9',
  'A', 'Am', 'A7', 'Am7', 'Asus2', 'Asus4',
  'F', 'Fmaj7',
]);

export function isOpenChord(chord: string): boolean {
  if (!chord) return false;
  const clean = chord.trim();
  
  // Strictly reject any sharp (#) or flat (b) anywhere in the chord or slash bass
  if (clean.includes('#') || clean.includes('b') || clean.includes('♭') || clean.includes('♯')) {
    return false;
  }

  // Reject B and Bm (standard guitar barre chords on fret 2)
  if (/^B(m|maj|7|min|sus4|sus2)?(\/.*)?$/i.test(clean)) {
    return false;
  }

  // Check the base chord ignoring slash bass
  const base = clean.split('/')[0];
  if (STRICT_OPEN_CHORDS_SET.has(base)) {
    // If slash note exists, ensure it's a natural note
    const slash = clean.split('/')[1];
    if (!slash) return true;
    return /^[A-G]$/.test(slash) && !slash.includes('#') && !slash.includes('b');
  }

  return false;
}

export interface OpenChordSong {
  slug: string;
  title: string;
  artist: string;
  movie?: string;
  key?: string;
  tags: string[];
  snippet: string;
  chords: string[];
  chordCount: number;
}

let cachedOpenSongs: OpenChordSong[] | null = null;

export function getOpenChordSongs(): OpenChordSong[] {
  if (cachedOpenSongs && cachedOpenSongs.length > 0) {
    return cachedOpenSongs;
  }

  const allSongs = getAllSongs();
  const result: OpenChordSong[] = [];

  for (const song of allSongs) {
    // Extract chord tokens from rawBody
    const chordMatches = song.rawBody.match(/\[([A-G][^\]]*)\]/g) || [];
    if (chordMatches.length === 0) continue;

    const uniqueChords = Array.from(new Set(chordMatches.map((m) => m.slice(1, -1).trim())));

    // Check if ALL unique chords used in the song are strict open chords
    const allOpen = uniqueChords.length >= 2 && uniqueChords.every((c) => isOpenChord(c));

    if (allOpen) {
      result.push({
        slug: song.slug,
        title: song.title,
        artist: song.artist,
        movie: song.movie,
        key: song.key,
        tags: song.tags || [],
        snippet: song.snippet,
        chords: uniqueChords,
        chordCount: uniqueChords.length,
      });
    }
  }

  cachedOpenSongs = result;
  return result;
}
