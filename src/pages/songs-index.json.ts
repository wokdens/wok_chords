import { extractLyricsSnippet } from '../lib/chordEngine';

interface IndexedSong {
  slug: string;
  title: string;
  artist: string;
  key?: string;
  tags?: string[];
  snippet?: string;
}

export async function GET() {
  const mods = import.meta.glob<string>('/src/content/songs/*.chopro', {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  const rows: IndexedSong[] = [];
  for (const [filePath, rawText] of Object.entries(mods)) {
    const fm = rawText.match(/^---\n([\s\S]*?)\n---\n?/)?.[1] ?? '';
    const data: Record<string, any> = {};
    for (const line of fm.split('\n')) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (!m) continue;
      const [, k, vRaw] = m;
      let v: any = vRaw.trim().replace(/^["']|["']$/g, '');
      if (v.startsWith('[') && v.endsWith(']')) {
        try {
          v = JSON.parse(v);
        } catch {
          v = v
            .slice(1, -1)
            .split(',')
            .map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
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
    if (data.draft) continue;
    const slug = filePath.match(/\/([^/]+)\.chopro$/)?.[1] ?? filePath;
    rows.push({
      slug,
      title: data.title ?? slug.replace(/-/g, ' '),
      artist: data.artist ?? 'Unknown Artist',
      key: data.key,
      tags: data.tags ?? [],
      snippet: extractLyricsSnippet(rawText, 80),
    });
  }

  return Response.json(rows, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
