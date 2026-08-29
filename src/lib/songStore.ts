import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../content/songs');

export interface SongItem {
  slug: string;
  title: string;
  artist: string;
  movie?: string;
  movieSlug?: string;
  key?: string;
  tempo?: number;
  tags: string[];
  draft?: boolean;
  rawBody: string;
  snippet: string;
}

let cachedSongs: SongItem[] | null = null;
let cacheTime = 0;

function parseFrontmatter(raw: string): Record<string, any> {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return {};
  const fm = m[1];
  const data: Record<string, any> = {};
  for (const line of fm.split('\n')) {
    const lm = line.match(/^(\w+):\s*(.*)$/);
    if (!lm) continue;
    const [, k, vRaw] = lm;
    let v: any = vRaw.trim().replace(/^["']|["']$/g, '');
    if (v.startsWith('[') && v.endsWith(']')) {
      try {
        v = JSON.parse(v);
      } catch {
        v = v.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
      }
    }
    if (k === 'tempo') {
      const n = Number(v);
      if (!Number.isNaN(n)) v = n;
    }
    if (k === 'draft') {
      v = v === 'true' || v === true;
    }
    data[k] = v;
  }
  return data;
}

export function getAllSongs(): SongItem[] {
  const now = Date.now();
  if (cachedSongs && now - cacheTime < 5000) {
    return cachedSongs;
  }

  if (!fs.existsSync(SONGS_DIR)) return [];

  const files = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));
  const songs: SongItem[] = [];

  for (const file of files) {
    const filePath = path.join(SONGS_DIR, file);
    const rawBody = fs.readFileSync(filePath, 'utf8');
    const slug = file.replace(/\.chopro$/, '');
    const data = parseFrontmatter(rawBody);

    if (data.draft === true) continue;

    const lyricsOnly = rawBody
      .replace(/^---[\s\S]*?---\n?/, '')
      .replace(/\{[^}]*\}/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .trim();

    const snippet = lyricsOnly
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, 2)
      .join(' ')
      .slice(0, 120);

    songs.push({
      slug,
      title: data.title || 'Untitled',
      artist: data.artist || 'Unknown Artist',
      movie: data.movie || undefined,
      movieSlug: data.movieSlug || undefined,
      key: data.key,
      tempo: data.tempo,
      tags: Array.isArray(data.tags) ? data.tags : [],
      draft: data.draft,
      rawBody,
      snippet,
    });
  }

  songs.sort((a, b) => a.title.localeCompare(b.title));

  cachedSongs = songs;
  cacheTime = now;
  return songs;
}
