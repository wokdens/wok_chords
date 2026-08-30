import chordsheetjs from 'chordsheetjs';
import type {
  Song as SongType,
} from 'chordsheetjs';

const cs: any =
  (chordsheetjs as any)?.ChordProParser
    ? chordsheetjs
    : (chordsheetjs as any)?.default ?? chordsheetjs;

export const ChordProParser: any = cs.ChordProParser;
export const HtmlDivFormatter: any = cs.HtmlDivFormatter;
export const TextFormatter: any = cs.TextFormatter;
export const SongClass: any = cs.Song;
export type Song = SongType;

export interface SongMetadata {
  title: string;
  artist: string;
  key?: string;
  tempo?: number;
  time?: string;
}

export interface ParsedSong {
  metadata: SongMetadata;
  html: string;
  text: string;
  rawChordSheet: Song;
  key?: string;
  uniqueChords: string[];
}

const SHARP_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#'];
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];

function normalizeKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().replace(/\s+/g, '');
  if (!cleaned) return undefined;
  return cleaned;
}

function inferUseFlats(key?: string): boolean {
  if (!key) return false;
  const base = key.replace(/m$/, '').replace(/maj$/, '').replace(/min$/, '');
  return FLAT_KEYS.some((k) => base === k || base.startsWith(k));
}

function getMetadataFromSheet(sheet: any, frontmatter?: Partial<SongMetadata>): SongMetadata {
  const meta: Record<string, any> = {};
  try {
    meta.title = typeof sheet.title === 'string' ? sheet.title : undefined;
    meta.artist = typeof sheet.subtitle === 'string' ? sheet.subtitle : undefined;
    meta.key = sheet.key ? String(sheet.key) : undefined;
    try {
      meta.tempo = sheet.getSingleMetadata?.('tempo');
    } catch {
      meta.tempo = undefined;
    }
    try {
      meta.time = sheet.getSingleMetadata?.('time');
    } catch {
      meta.time = undefined;
    }
  } catch {
    /* no-op */
  }

  const title = (frontmatter?.title ?? meta.title ?? 'Untitled') as string;
  const artist = (frontmatter?.artist ?? meta.artist ?? 'Unknown Artist') as string;
  const key = normalizeKey((frontmatter?.key ?? meta.key) ?? undefined);
  const tempo = frontmatter?.tempo ?? (meta.tempo ? Number(meta.tempo) : undefined);
  const time = meta.time ? String(meta.time) : undefined;
  return { title, artist, key, tempo, time };
}

export function parseAndTranspose(rawText: string, semitones: number): ParsedSong {
  const parser = new ChordProParser();
  let normalized = rawText
    .replace(/^---[\s\S]*?---\r?\n?/, '')
    .trim();

  // Sanitize multiple consecutive spaces to prevent chordsheetjs from inserting extra commas
  normalized = normalized
    .replace(/,[ \t]+/g, ', ')
    .replace(/[ \t]{2,}/g, ' ');

  // Sanitize common ChordPro parsing edge cases
  normalized = normalized
    .replace(/\\?&#x27;/g, "'")
    .replace(/\\?&#39;/g, "'")
    .replace(/\\?&amp;/g, '&')
    .replace(/(\d+)%/g, '$1 percent')
    .replace(/\{([^{}:]+)\}/g, (m, p1) => {
      const t = p1.trim().toLowerCase();
      if (['title', 'artist', 'subtitle', 'key', 'tempo', 'time', 'c', 'comment', 'soc', 'eoc'].includes(t)) return m;
      return `{c: ${p1.trim()}}`;
    });

  let sheet: any;
  try {
    sheet = parser.parse(normalized);
  } catch {
    // If strict parser fails, strip braces and parse clean
    const safeBody = normalized.replace(/\{[^}]*\}/g, '').replace(/\[\s*\]/g, '');
    try {
      sheet = parser.parse(safeBody);
    } catch {
      sheet = { lines: [] };
    }
  }

  const frontmatterBlock = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const frontmatter: Partial<SongMetadata> = {};
  for (const line of frontmatterBlock.split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    const clean = v.trim().replace(/^["']|["']$/g, '');
    if (k === 'title') frontmatter.title = clean;
    else if (k === 'artist') frontmatter.artist = clean;
    else if (k === 'key') frontmatter.key = clean;
    else if (k === 'tempo') {
      const num = Number(clean);
      if (!Number.isNaN(num)) frontmatter.tempo = num;
    }
  }

  const metadata = getMetadataFromSheet(sheet, frontmatter);
  const originalKey = metadata.key;

  const useFlats = inferUseFlats(originalKey);

  let finalSheet: any = sheet;
  if (semitones !== 0) {
    let transposed: any;
    try {
      transposed = parser.parse(normalized);
      if (typeof transposed.transpose === 'function') {
        transposed.transpose(semitones);
      }
      if (useFlats && originalKey) {
        const newKeyName = transposeKeyName(originalKey, semitones, true);
        if (newKeyName && typeof transposed.setKey === 'function') {
          transposed.setKey(newKeyName);
        }
      }
    } catch {
      transposed = sheet;
    }
    finalSheet = transposed;
  }

  const htmlFormatter = new HtmlDivFormatter();
  const textFormatter = new TextFormatter();

  let html = '';
  let text = '';
  try {
    html = htmlFormatter.format(finalSheet);
  } catch {
    html = '';
  }
  try {
    text = textFormatter.format(finalSheet);
  } catch {
    text = normalized.replace(/\[.*?\]/g, '').replace(/\{.*?\}/g, '');
  }

  const allChords: string[] = [];
  try {
    const lines: any[] = finalSheet.lines ?? [];
    for (const line of lines) {
      const items: any[] = line.items ?? [];
      for (const item of items) {
        if (item && typeof item.chord !== 'undefined' && item.chord !== null && String(item.chord) !== '') {
          allChords.push(String(item.chord));
        }
      }
    }
  } catch {
    /* no-op */
  }

  let currentKey: string | undefined = originalKey;
  if (semitones !== 0 && originalKey) {
    try {
      const scratch: any = parser.parse(`{key: ${originalKey}}\n[C]x`);
      try {
        if (typeof scratch.transpose === 'function') scratch.transpose(semitones);
      } catch {
        /* no-op */
      }
      const scratchKey = scratch.key ? String(scratch.key) : undefined;
      currentKey = scratchKey ?? extractTransposedKey(allChords, originalKey, semitones);
    } catch {
      currentKey = extractTransposedKey(allChords, originalKey, semitones);
    }
  }

  const uniqueChords = Array.from(new Set(allChords.map((c) => String(c).trim()).filter(Boolean)));

  return {
    metadata,
    html,
    text,
    rawChordSheet: finalSheet as Song,
    key: currentKey,
    uniqueChords,
  };
}

const ORDER_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ORDER_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

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

function extractTransposedKey(_allChords: string[], originalKey: string, semitones: number): string | undefined {
  const useFlats = inferUseFlats(originalKey);
  return transposeKeyName(originalKey, semitones, useFlats);
}

export function extractLyricsText(rawText: string): string {
  return rawText
    .replace(/^---[\s\S]*?---\r?\n?/, '')
    .replace(/\{[^{}]*\}/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .trim();
}

export function extractLyricsSnippet(rawText: string, maxLen = 80): string {
  const stripped = rawText
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/\{[^{}]*\}/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped.length <= maxLen) return stripped;
  const cut = stripped.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

export interface ParsedFromEntry {
  metadata: SongMetadata;
  html: string;
  text: string;
  rawChordSheet: Song;
  key?: string;
  body?: string;
}

export async function parseChordProFromEntry(
  entry: { body: string; data?: Record<string, any> },
  semitones = 0,
): Promise<ParsedFromEntry> {
  const parsed = parseAndTranspose(entry.body, semitones);
  return { ...parsed, body: entry.body };
}
