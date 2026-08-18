import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = join(__dirname, '..', 'src', 'content', 'songs');
const SECTIONS_DIR = join(__dirname, 'sections');

const BASE_URL = 'https://indichords.com';
const SONGS_PER_SECTION = 30;
const TOTAL_SECTIONS = 100;
const START_SECTION = 1;
const END_SECTION = 2;

const KNOWN_SONG_IDS = [
  2986, 2587, 1262, 1916, 2289, 2826, 1402, 1380, 1172, 2566,
  2789, 2123, 896, 711, 2174, 2987, 2588, 1263, 1917, 2290,
  2827, 1403, 1381, 1173, 2567, 2790, 2124, 897, 712, 2175,
  2988, 2589, 1264, 1918, 2291, 2828, 1404, 1382, 1174, 2568,
  2791, 2125, 898, 713, 2176, 2989, 2590, 1265, 1919, 2292,
  2829, 1405, 1383, 1175, 2569, 2792, 2126, 899, 714, 2177,
  150, 151, 152, 153, 154, 155, 156, 157, 158, 159,
];

const REQUEST_DELAY_MS = 350;

const LANGUAGE_KEYWORDS = {
  hindi: ['laage', 'lage', 'hum', 'tum', 'mera', 'teri', 'yaad', 'pyar', 'dil', 'jaan', 'aap', 'main', 'tu', 'woh', 'yeh', 'hai', 'na', 'ki', 'ka', 'ke', 'se', 'ne', 'hoon', 'kar', 'karoon', 'shaam', 'shehar', 'mausam'],
  english: ['the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'have', 'this', 'from', 'your', 'they', 'been', 'know', 'want', 'will', 'just', 'love', 'baby', 'night', 'day', 'heart', 'time'],
  punjabi: ['kudi', 'yaar', 'sardar', 'jatt', 'pind', 've', 'sanu', 'menu', 'tusi', 'assi', 'si', 'ee', 'aa', 'ja', 'naal', 'nal', 'pyar', 'gabru', 'desi', 'drama'],
  tamil: ['unna', 'enna', 'kanna', 'thalli', 'poda', 'amma', 'appa', 'kadhal', 'uyire', 'thozha', 'adi', 'da', 'chella', 'manam', 'kanne', 'vaadi', 'thirumbi', 'aasai'],
  bengali: ['ami', 'tumi', 'she', 'eta', 'amr', 'tomar', 'bhalobashi', 'na', 'keno', 'jibon', 'dhoka', 'prem', 'kore', 'kothay', 'ache', 'chole', 'bangla', 'gaan'],
  marathi: ['mi', 'tu', 'te', 'ti', 'majha', 'tujha', 'prem', 'sang', 'nay', 'kaay', 'jhala', 'manat', 'dhadak', 'aani', 'pan', 'gaane', 'bhav', 'marathi'],
  spanish: ['el', 'la', 'los', 'las', 'un', 'una', 'que', 'de', 'porque', 'cuando', 'donde', 'amor', 'vida', 'siempre', 'nunca', 'manana', 'corazon', 'quiero', 'eres'],
};

const SECTION_LABELS = [
  { pattern: /(intro|music|prelude)/i, label: 'Intro' },
  { pattern: /(verse|stanza|antra|mukhda)\s*(\d*)/i, label: 'Verse' },
  { pattern: /(chorus|refrain|hook)\s*(\d*)/i, label: 'Chorus' },
  { pattern: /(pre.?chorus|build)\s*(\d*)/i, label: 'Pre-Chorus' },
  { pattern: /(bridge|antara)\s*(\d*)/i, label: 'Bridge' },
  { pattern: /(interlude|break|music.?break)\s*(\d*)/i, label: 'Interlude' },
  { pattern: /(outro|ending|fade|climax)\s*(\d*)/i, label: 'Outro' },
  { pattern: /(solo|guitar|instrumental)\s*(\d*)/i, label: 'Solo' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/['"()]/g, '')
    .replace(/[^a-z0-9\u0900-\u097F\u0A00-\u0A7F\u0980-\u09FF\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'song';
}

function escapeFrontmatter(s) {
  return String(s).replace(/\n/g, ' ').trim();
}

function detectLanguage(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [lang, kws] of Object.entries(LANGUAGE_KEYWORDS)) {
    scores[lang] = kws.filter((kw) => lower.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 2 ? best[0] : 'hindi';
}

function hasChords(line) {
  return /\[([A-G](#|b)?(m|maj|min|dim|aug|sus\d?|add\d?|7|9|11|13|maj7|m7|m9)?)\]/i.test(line);
}

function parseSongFromHtml(html, url) {
  let title = '';
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const songScope = articleMatch ? articleMatch[1] : html;

  const h1All = [];
  const h1Re = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;
  let h1m;
  while ((h1m = h1Re.exec(html)) !== null) {
    const text = h1m[1].replace(/<[^>]+>/g, '').trim();
    if (text) h1All.push(text);
  }
  for (const h of h1All) {
    const lower = h.toLowerCase();
    if (!/indichords/.test(lower) && !/let the chords/.test(lower)) {
      title = h;
      break;
    }
  }
  const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleFromTag = titleTagMatch
    ? titleTagMatch[1]
        .replace(/\s*[-|]\s*Chords.*$/i, '')
        .replace(/\s*[-|]\s*Indichords.*$/i, '')
        .replace(/\|.*$/g, '')
        .trim()
    : '';
  if (!title && titleFromTag) title = titleFromTag;
  if (!title) title = h1All[h1All.length - 1] || '';

  const metaMatch =
    songScope.match(/song-meta[^>]*>([\s\S]*?)<\/p>/i) ||
    songScope.match(/song-meta[^>]*>([\s\S]*?)<\/div>/i) ||
    songScope.match(/<p[^>]*class="[^"]*meta[^"]*"[^>]*>([\s\S]*?)<\/p>/i);

  let artistRaw = metaMatch ? metaMatch[1].replace(/<[^>]+>/g, ' ').trim() : '';

  artistRaw = artistRaw
    .replace(/Songwriting software.*$/i, '')
    .replace(/songwriting.*$/i, '')
    .replace(/music.*$/i, '')
    .trim();

  const artistParts = artistRaw.split(/[-_]+/).map((s) => s.trim()).filter(Boolean);
  const capitalized = artistParts.map((p) =>
    p.replace(/\b([a-z])/g, (_m, c) => c.toUpperCase()).replace(/\s+/g, '')
  );
  let artist = capitalized.join(' ');
  if (!artist || artist.length < 2) {
    const pieces = (titleFromTag || title).split(/[-–—|]+/).map((s) => s.trim()).filter(Boolean);
    if (pieces.length > 1) {
      artist = pieces
        .slice(1)
        .map((p) => p.replace(/\b([a-z])/g, (_m, c) => c.toUpperCase()))
        .join(' ');
    }
  }
  artist = artist.replace(/\s+/g, ' ').trim();
  if (!artist) artist = 'Unknown Artist';


  const idMatch = url.match(/\/song\/(\d+)/);
  const songId = idMatch ? idMatch[1] : '0';

  const fullText = html
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/data-trae-ref="[^"]*"/gi, '')
    .replace(/data-google[^>]*?>/gi, '>')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<(?:br|hr)\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|p|h[1-6]|section|article|main|li|tr|td|th|blockquote|pre|ul|ol|aside|nav|header|footer|span)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  const allLines = fullText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim());

  const songLines = [];
  let capture = false;
  let chordLineCount = 0;

  const AFTER_TITLE_STOPS = new Set([
    'Trending Songs', 'Related Songs', 'Categories', 'Movies',
    'Discover more', 'Hindi song chords', 'Online guitar tuner',
    'Chord progression generator', 'Music theory tutorials',
  ]);

  const LINE_STOP = (l) => {
    if (AFTER_TITLE_STOPS.has(l)) return true;
    if (/^Trending .* Artists/i.test(l)) return true;
    if (/^All (Hindi|English)/i.test(l)) return true;
    if (/^© \d{4}/.test(l)) return true;
    if (/IOS App|Android App/.test(l)) return true;
    if (/ad-free|strumming patterns|auto-scroll/.test(l)) return true;
    if (/songwriting software/i.test(l)) return true;
    if (/^Enrolling |^Discovering |^Accessing |^Buying |^Exploring /i.test(l)) return true;
    if (/^Hiring |^Guitar maintenance /i.test(l)) return true;
    if (/^(Chords of Songs|Transpose songs|Over 3K songs|1M users)/.test(l)) return true;
    if (/^Let the chords do the talking$/i.test(l)) return true;
    if (/^Indichords$/i.test(l) && chordLineCount > 0) return true;
    return false;
  };

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    if (line !== '' && LINE_STOP(line)) {
      if (chordLineCount > 0) capture = false;
      continue;
    }
    const hasChord = hasChords(line);
    if (hasChord && !capture) {
      capture = true;
    }
    if (capture) {
      if (hasChord) chordLineCount++;
      songLines.push(line);
    }
  }

  let finalLines = [];
  let lastBlank = false;
  for (const l of songLines) {
    if (l === '') {
      if (!lastBlank) finalLines.push('');
      lastBlank = true;
    } else {
      lastBlank = false;
      let normalized = l
        .replace(/\s{2,}/g, ' ')
        .replace(/^[\{\(\[<]\s*/g, '')
        .replace(/\s*[\}\)\]>]-(?:\s*\[\d+\s*times?\])?$/gi, '')
        .replace(/\s*\{\s*$/g, '')
        .replace(/^\s*\}\s*$/g, '')
        .replace(/\s+\[([^\]]+)\]\s+/g, (m, chord) => `[${chord.trim()}]`)
        .replace(/([^\s])\s+\[([^\]]+)\]/g, '$1[$2]')
        .replace(/\[([^\]]+)\]\s+([^\s])/g, '[$1]$2')
        .replace(/\s+\[([^\]]+)\]/g, '[$1]')
        .replace(/\[([^\]]+)\]\s+/g, '[$1]')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (normalized.length < 2) {
        if (!lastBlank) { finalLines.push(''); lastBlank = true; }
        continue;
      }
      finalLines.push(normalized);
    }
  }
  while (finalLines[0] === '') finalLines.shift();
  while (finalLines[finalLines.length - 1] === '') finalLines.pop();

  if (chordLineCount < 2) return null;

  const firstChord = finalLines.find((l) => hasChords(l))?.match(/\[([A-G][^\]]*)\]/i);
  const firstKey = firstChord ? firstChord[1] : undefined;

  const cleanKey = firstKey?.replace(/(m|Maj|min|7|9|sus\d?|add\d?|dim|aug).*$/i, '');

  return {
    id: songId,
    title: title || `Song ${songId}`,
    artist,
    key: cleanKey,
    lyricsText: finalLines.join('\n'),
    finalLines,
  };
}

function convertToChordPro(song) {
  const { title, artist, key, finalLines } = song;

  const lang = detectLanguage(song.lyricsText);
  const tags = [lang];

  let sectionCounts = {};
  let unknownCount = 0;
  let blankStreak = 0;
  let needsNextLabel = false;

  const chordProLines = [];
  chordProLines.push(`{title: ${title}}`);
  chordProLines.push(`{artist: ${artist}}`);
  if (key) chordProLines.push(`{key: ${key}}`);
  chordProLines.push('');

  const processedLines = [];
  let currentLabel = null;
  let lineAfterBlank = 0;

  for (let i = 0; i < finalLines.length; i++) {
    const line = finalLines[i];
    const prevLine = i > 0 ? finalLines[i - 1] : '';
    const nextLine = i < finalLines.length - 1 ? finalLines[i + 1] : '';

    if (line === '') {
      blankStreak++;
      lineAfterBlank = 0;
      processedLines.push('');
      if (blankStreak >= 1) needsNextLabel = true;
      continue;
    }
    lineAfterBlank++;
    blankStreak = 0;

    const lineIsChordOnly = hasChords(line) && line.replace(/\[[^\]]*\]/g, '').trim().length < 2;
    const nextLineHasLyrics = !lineIsChordOnly || (nextLine && nextLine.length > 0 && !hasChords(nextLine));

    let matchedLabel = null;
    const stripped = line.replace(/\[[^\]]*\]/g, '').trim().toLowerCase();
    if (stripped.length < 50) {
      for (const { pattern, label } of SECTION_LABELS) {
        const m = stripped.match(pattern);
        if (m) {
          const num = m[2] || '';
          sectionCounts[label] = (sectionCounts[label] || 0) + (num ? 0 : 1);
          matchedLabel = num ? `${label} ${num}` : (sectionCounts[label] > 1 ? `${label} ${sectionCounts[label]}` : label);
          if (lineIsChordOnly || stripped.length < 20) {
            processedLines.push({ label: matchedLabel, isLabel: true });
            currentLabel = matchedLabel;
            needsNextLabel = false;
          }
          break;
        }
      }
    }

    if (!matchedLabel && needsNextLabel && lineAfterBlank === 1 && !lineIsChordOnly) {
      if (/^\s*$/.test(prevLine) || i === 0) {
        if (!currentLabel) {
          unknownCount++;
          currentLabel = `Verse ${unknownCount}`;
          sectionCounts['Verse'] = unknownCount;
        }
        processedLines.push({ label: currentLabel, isLabel: true });
      }
      needsNextLabel = false;
    }

    if (!matchedLabel) {
      if (!currentLabel) {
        unknownCount++;
        currentLabel = `Verse ${unknownCount}`;
        sectionCounts['Verse'] = unknownCount;
        processedLines.push({ label: currentLabel, isLabel: true });
      }
      processedLines.push(line);
    }
  }

  for (const item of processedLines) {
    if (typeof item === 'string') {
      if (item === '') chordProLines.push('');
      else chordProLines.push(item);
    } else if (item.isLabel) {
      chordProLines.push('');
      chordProLines.push(`{c: ${item.label}}`);
    }
  }

  let fm = '---\n';
  fm += `title: "${escapeFrontmatter(title)}"\n`;
  fm += `artist: "${escapeFrontmatter(artist)}"\n`;
  if (key) fm += `key: "${key}"\n`;
  fm += `tags: ${JSON.stringify(tags)}\n`;
  fm += `draft: false\n`;
  fm += '---\n\n';

  return fm + chordProLines.filter((l, i, arr) => !(l === '' && i > 0 && arr[i - 1] === '')).join('\n') + '\n';
}

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 404) return { ok: false, status: 404, html: '' };
      if (res.status === 429) {
        await sleep(3000 + i * 2000);
        continue;
      }
      if (!res.ok) return { ok: false, status: res.status, html: '' };
      const html = await res.text();
      return { ok: true, status: res.status, html };
    } catch (e) {
      if (i === retries) return { ok: false, status: 0, html: '', error: e.message };
      await sleep(1500);
    }
  }
  return { ok: false, status: 0, html: '' };
}

async function discoverValidSongs() {
  const needed = SONGS_PER_SECTION * END_SECTION;
  console.log(`[1/4] First trying ${KNOWN_SONG_IDS.length} known IDs, then scanning supplementary ranges...`);
  const valid = [];
  const seenIds = new Set();
  let found = 0;
  let scanned = 0;

  for (const id of KNOWN_SONG_IDS) {
    if (found >= needed * 2) break;
    scanned++;
    seenIds.add(id);
    const probe = await fetchWithRetry(`${BASE_URL}/song/${id}/x`, 1);
    if (probe.ok && probe.status === 200) {
      const parsed = parseSongFromHtml(probe.html, `${BASE_URL}/song/${id}/x`);
      if (parsed) {
        valid.push({ id, parsed, html: probe.html });
        found++;
        console.log(`  ✓ ID ${id}: "${parsed.title}" by ${parsed.artist.slice(0, 40)} (found ${found})`);
      }
    }
    await sleep(REQUEST_DELAY_MS);
  }

  const FILL_RANGES = [
    [100, 200], [500, 700], [900, 1100], [1500, 1700], [2300, 2500], [2700, 2800],
  ];

  if (found < needed * 2) {
    console.log(`  Found ${found} from known IDs. Scanning supplementary ranges...`);
    for (const [start, end] of FILL_RANGES) {
      for (let id = start; id <= end && found < needed * 2; id++) {
        if (seenIds.has(id)) continue;
        scanned++;
        seenIds.add(id);
        const probe = await fetchWithRetry(`${BASE_URL}/song/${id}/x`, 1);
        if (probe.ok && probe.status === 200) {
          const parsed = parseSongFromHtml(probe.html, `${BASE_URL}/song/${id}/x`);
          if (parsed) {
            valid.push({ id, parsed, html: probe.html });
            found++;
            console.log(`  ✓ ID ${id}: "${parsed.title}" by ${parsed.artist.slice(0, 40)} (found ${found})`);
          }
        } else if (probe.status !== 404) {
          console.log(`  ? ID ${id}: status ${probe.status}`);
        }
        if (scanned % 50 === 0) {
          process.stdout.write(`  ...scanned ${scanned} total, found ${found}\r`);
        }
        await sleep(REQUEST_DELAY_MS);
      }
    }
  }

  valid.sort((a, b) => a.id - b.id);
  console.log(`\n    Found ${valid.length} valid songs from ${scanned} IDs.`);
  return valid;
}

function splitIntoSections(songs) {
  console.log(`[2/4] Splitting ${songs.length} songs into ${TOTAL_SECTIONS} sections x ${SONGS_PER_SECTION} songs...`);
  const sections = {};
  for (let i = 0; i < TOTAL_SECTIONS; i++) {
    const start = i * SONGS_PER_SECTION;
    const end = start + SONGS_PER_SECTION;
    sections[i + 1] = songs.slice(start, end);
  }
  return sections;
}

async function fetchFullSongs(sections) {
  console.log(`[3/4] Refreshing full content for sections ${START_SECTION}-${END_SECTION}...`);
  const out = [];
  for (let s = START_SECTION; s <= END_SECTION; s++) {
    const songs = sections[s] || [];
    console.log(`  Section ${s}: ${songs.length} songs`);
    for (const song of songs) {
      let html = song.html;
      let parsed = song.parsed;
      if (!html) {
        const res = await fetchWithRetry(`${BASE_URL}/song/${song.id}/x`, 2);
        if (res.ok) html = res.html;
        parsed = parseSongFromHtml(html, `${BASE_URL}/song/${song.id}/x`);
      }
      if (parsed) out.push({ section: s, id: song.id, parsed });
      await sleep(REQUEST_DELAY_MS * 0.5);
    }
  }
  return out;
}

async function saveChoproFiles(songsWithSection) {
  console.log(`[4/4] Saving .chopro files to src/content/songs/...`);
  mkdirSync(SONGS_DIR, { recursive: true });
  mkdirSync(SECTIONS_DIR, { recursive: true });

  const sectionIndex = {};
  let saved = 0;

  for (const { section, id, parsed } of songsWithSection) {
    const slugBase = slugify(`${parsed.title}-${parsed.artist.split(',')[0]}`);
    const slug = slugBase + '-' + id;
    const content = convertToChordPro(parsed);
    const path = join(SONGS_DIR, `${slug}.chopro`);
    writeFileSync(path, content, 'utf8');

    if (!sectionIndex[section]) sectionIndex[section] = [];
    sectionIndex[section].push({
      id,
      slug,
      title: parsed.title,
      artist: parsed.artist,
      key: parsed.key,
      file: `${slug}.chopro`,
    });
    saved++;
    console.log(`  ✓ [Sec ${section}] ${parsed.title.slice(0, 40)} → ${slug}.chopro`);
  }

  const indexPath = join(SECTIONS_DIR, 'sections-index.json');
  writeFileSync(indexPath, JSON.stringify({
    totalSongs: SONGS_PER_SECTION * TOTAL_SECTIONS,
    songsPerSection: SONGS_PER_SECTION,
    totalSections: TOTAL_SECTIONS,
    crawledSections: Object.keys(sectionIndex).map(Number).sort((a, b) => a - b),
    sections: sectionIndex,
  }, null, 2));
  console.log(`\n    Saved ${saved} songs. Section index at scripts/sections/sections-index.json`);
}

async function main() {
  console.log('==========================================================');
  console.log('  Indichords Crawler — Sections 1 & 2 (60 songs)');
  console.log('==========================================================\n');

  const discovered = await discoverValidSongs();
  if (discovered.length < SONGS_PER_SECTION * END_SECTION) {
    console.warn(`\n⚠ Only found ${discovered.length} songs. Increase ID_SCAN_LIMIT if needed.`);
  }

  const sections = splitIntoSections(discovered);
  const report = [];
  for (let s = 1; s <= Math.min(END_SECTION, TOTAL_SECTIONS); s++) {
    report.push(`  Section ${s.toString().padStart(3, ' ')}: ${(sections[s] || []).length} songs`);
  }
  console.log('  Section distribution (sections 1-2):');
  console.log(report.join('\n'));

  const fullSongs = await fetchFullSongs(sections);
  await saveChoproFiles(fullSongs);

  console.log('\n==========================================================');
  console.log('  Done! Sections 1 and 2 songs have been imported.');
  console.log(`  Run: npm run build  to verify the site renders.`);
  console.log('==========================================================');
}

main().catch((e) => {
  console.error('Crawler failed:', e);
  process.exit(1);
});
