import fs from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { validateSession } from '../../../lib/admin-auth';

const SONGS_DIR = path.resolve(import.meta.dirname ?? process.cwd(), '../../../../src/content/songs');
const FM_OPEN = /^---\s*$/;

export interface SongSummary {
  slug: string;
  file: string;
  title: string;
  artist: string;
  key?: string;
  tags?: string[];
}

function parseFrontMatter(raw: string): {
  title: string;
  artist: string;
  key?: string;
  tags?: string[];
} {
  const lines = raw.split(/\r?\n/);
  let inFm = false;
  let fmEnded = false;
  let fmOpens = 0;
  const fm: Record<string, string> = {};
  for (const line of lines) {
    if (!fmEnded && FM_OPEN.test(line.trim())) {
      fmOpens++;
      inFm = fmOpens === 1;
      if (fmOpens === 2) {
        fmEnded = true;
        inFm = false;
      }
      continue;
    }
    if (inFm) {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        fm[k] = v;
      }
    }
    if (fmEnded) break;
  }
  let tags: string[] | undefined;
  if (fm.tags) {
    try {
      const parsed = JSON.parse(fm.tags);
      if (Array.isArray(parsed)) tags = parsed.map(String);
    } catch {
      tags = fm.tags.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return {
    title: fm.title ?? 'Untitled',
    artist: fm.artist ?? 'Unknown',
    key: fm.key || undefined,
    tags,
  };
}

export { SONGS_DIR, parseFrontMatter };

export const GET: APIRoute = async ({ request }) => {
  if (!validateSession(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const files = fs
    .readdirSync(SONGS_DIR)
    .filter((f) => f.endsWith('.chopro'));
  const songs: SongSummary[] = files
    .map((file) => {
      const slug = file.replace(/\.chopro$/, '');
      const raw = fs.readFileSync(path.join(SONGS_DIR, file), 'utf8');
      const meta = parseFrontMatter(raw);
      return { slug, file, ...meta };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  return new Response(JSON.stringify({ ok: true, songs }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
