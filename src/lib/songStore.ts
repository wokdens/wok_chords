import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function getSongsDir(): string {
  const cwdPath = path.resolve(process.cwd(), 'src/content/songs');
  if (fs.existsSync(cwdPath)) return cwdPath;

  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const relPath = path.resolve(__dirname, '../content/songs');
    if (fs.existsSync(relPath)) return relPath;
    const relParent = path.resolve(__dirname, '../../src/content/songs');
    if (fs.existsSync(relParent)) return relParent;
  } catch {}

  return cwdPath;
}

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
  if (cachedSongs && cachedSongs.length > 0 && now - cacheTime < 5000) {
    return cachedSongs;
  }

  const songsDir = getSongsDir();
  if (!fs.existsSync(songsDir)) return [];

  const files = fs.readdirSync(songsDir).filter((f) => f.endsWith('.chopro'));
  const songs: SongItem[] = [];

  for (const file of files) {
    const filePath = path.join(songsDir, file);
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
      .join(' / ');

    songs.push({
      slug,
      title: data.title || slug,
      artist: data.artist || 'Unknown Artist',
      movie: data.movie,
      movieSlug: data.movieSlug,
      key: data.key,
      tempo: data.tempo,
      tags: Array.isArray(data.tags) ? data.tags : [],
      draft: data.draft,
      rawBody,
      snippet,
    });
  }

  cachedSongs = songs;
  cacheTime = now;
  return songs;
}

export function getSongBySlug(slug: string): SongItem | null {
  const songs = getAllSongs();
  return songs.find((s) => s.slug === slug) || null;
}

export function saveSong(slug: string, content: string): void {
  const songsDir = getSongsDir();
  const filePath = path.join(songsDir, `${slug}.chopro`);
  fs.writeFileSync(filePath, content, 'utf8');
  cachedSongs = null;
}
