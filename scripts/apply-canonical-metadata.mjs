import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');
const MAPPING_FILE = path.resolve(__dirname, 'indichords-canonical-metadata.json');

const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
const files = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));

function toTitleCase(str) {
  if (!str) return '';
  return str
    .split(/[\s-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Exact track-to-movie mapping rules with precise boundary matching
const TRACK_MOVIE_RULES = [
  // Yeh Jawaani Hai Deewani
  {
    movie: 'Yeh Jawaani Hai Deewani',
    movieSlug: 'yeh-jawaani-hai-deewani',
    patterns: [
      /(^|-)badtameez-dil(-|$)/i,
      /(^|-)kabira(-|$)/i,
      /(^|-)ilahi(-|$)/i,
      /(^|-)balam-pichkari(-|$)/i,
      /(^|-)subhanallah(-|$)/i,
      /(^|-)dilliwaali-girlfriend(-|$)/i,
      /(^|-)ghagra(-|$)/i,
    ],
  },
  // Rockstar
  {
    movie: 'Rockstar',
    movieSlug: 'rockstar',
    patterns: [
      /(^|-)kun-faya-kun(-|$)/i,
      /(^|-)nadaan-parinde/i,
      /(^|-)tum-ho-paas-mere/i,
      /(^|-)tum-ho-guitar-chord-rockstar/i,
      /(^|-)jo-bhi-main(-|$)/i,
      /(^|-)phir-se-ud-chala(-|$)/i,
      /(^|-)sa?dda-haq(-|$)/i,
      /(^|-)aur-ho(-|$)/i,
      /(^|-)katiya-karun(-|$)/i,
      /(^|-)hawaa-hawaa(-.*)?rockstar/i,
    ],
  },
  // Aashiqui 2
  {
    movie: 'Aashiqui 2',
    movieSlug: 'aashiqui-2',
    patterns: [
      /(^|-)tum-hi-ho(-|$)/i,
      /(^|-)sun-raha-hai(-|$)/i,
      /(^|-)chahun-main-ya-na(-|$)/i,
      /(^|-)milne-hai-mujhse(-|$)/i,
      /(^|-)piya-aaye-na(-|$)/i,
      /(^|-)aasan-nahi-yahan(-|$)/i,
      /(^|-)bhula-dena(-|$)/i,
      /(^|-)hum-mar-jayenge(-|$)/i,
      /(^|-)meri-aashiqui-arijit/i,
    ],
  },
  // Cocktail
  {
    movie: 'Cocktail',
    movieSlug: 'cocktail',
    patterns: [
      /(^|-)tumhi-ho-bandhu(-|$)/i,
      /(^|-)daaru-desi(-|$)/i,
      /(^|-)yaariyan(-.*)?cocktail/i,
      /(^|-)tera-naam-japdi(-|$)/i,
      /(^|-)jugni(-.*)?cocktail/i,
      /(^|-)luttna(-|$)/i,
    ],
  },
  // Barfi!
  {
    movie: 'Barfi!',
    movieSlug: 'barfi',
    patterns: [
      /(^|-)ala-barfi(-|$)/i,
      /(^|-)main-kya-karoon(-|$)/i,
      /(^|-)kyun-na-hum-tum(-|$)/i,
      /(^|-)phir-le-aya-dil(-|$)/i,
      /(^|-)aashiyan(-|$)/i,
      /(^|-)sawali-si-raat(-|$)/i,
    ],
  },
  // 1920 Evil Returns
  {
    movie: '1920 Evil Returns',
    movieSlug: '1920-evil-returns',
    patterns: [
      /(^|-)uska-hi-banana(-|$)/i,
      /(^|-)jaavedaan-hai(-|$)/i,
      /(^|-)apna-mujhe-tu-lagaa(-|$)/i,
      /(^|-)khud-ko-tere(-.*)?1920/i,
    ],
  },
  // Desi Boyz
  {
    movie: 'Desi Boyz',
    movieSlug: 'desi-boyz',
    patterns: [
      /(^|-)subah-hone-na-de(-|$)/i,
      /(^|-)make-some-noise(-|$)/i,
      /(^|-)jhooke-jhooke(-|$)/i,
      /(^|-)tu-mera-hero(-|$)/i,
    ],
  },
  // Kabir Singh
  {
    movie: 'Kabir Singh',
    movieSlug: 'kabir-singh',
    patterns: [
      /(^|-)bekhayali(-|$)/i,
      /(^|-)kaise-hua(-|$)/i,
      /(^|-)mere-sohneya(-|$)/i,
      /(^|-)pehla-pyar-vishal-mishra/i,
      /(^|-)tujhe-kitna-chahne(-|$)/i,
      /(^|-)tera-ban-jaa?unga(-|$)/i,
      /(^|-)yeh-aaina(-|$)/i,
    ],
  },
  // Jab We Met
  {
    movie: 'Jab We Met',
    movieSlug: 'jab-we-met',
    patterns: [
      /(^|-)tum-se-hi(-|$)/i,
      /(^|-)mauja-hi-mauja(-|$)/i,
      /(^|-)yeh-ishq-hai(-|$)/i,
      /(^|-)aaoge-jab-tum(-|$)/i,
      /(^|-)nagada-nagada(-|$)/i,
      /(^|-)aao-milo-chalo(-|$)/i,
    ],
  },
  // Dilwale Dulhania Le Jayenge
  {
    movie: 'Dilwale Dulhania Le Jayenge',
    movieSlug: 'dilwale-dulhania-le-jayenge',
    patterns: [
      /(^|-)tujhe-dekha-to(-|$)/i,
      /(^|-)mehndi-laga-ke(-|$)/i,
      /(^|-)ho-gaya-hai-tujhko(-|$)/i,
      /(^|-)mere-khwabon-mein(-|$)/i,
      /(^|-)ruk-ja-o-dil(-|$)/i,
      /(^|-)zara-sa-jhoom(-|$)/i,
    ],
  },
  // Ae Dil Hai Mushkil
  {
    movie: 'Ae Dil Hai Mushkil',
    movieSlug: 'ae-dil-hai-mushkil',
    patterns: [
      /(^|-)ae-dil-hai-mushkil(-|$)/i,
      /(^|-)channa-mereya(-|$)/i,
      /(^|-)bulleya(-|$)/i,
      /(^|-)breakup-song(-|$)/i,
      /(^|-)cutiepie(-|$)/i,
      /(^|-)alizeh(-|$)/i,
    ],
  },
  // Kal Ho Naa Ho
  {
    movie: 'Kal Ho Naa Ho',
    movieSlug: 'kal-ho-naa-ho',
    patterns: [
      /(^|-)kal-ho-naa-ho(-|$)/i,
      /(^|-)kuch-to-hua-hai(-|$)/i,
      /(^|-)pretty-woman(-|$)/i,
      /(^|-)its-the-time-to-disco(-|$)/i,
    ],
  },
  // Kuch Kuch Hota Hai
  {
    movie: 'Kuch Kuch Hota Hai',
    movieSlug: 'kuch-kuch-hota-hai',
    patterns: [
      /(^|-)kuch-kuch-hota-hai(-|$)/i,
      /(^|-)koi-mil-gaya(-|$)/i,
      /(^|-)ladki-badi-anjani(-|$)/i,
      /(^|-)yeh-ladka-hai-deewana(-|$)/i,
      /(^|-)tujhe-yaad-na-meri(-|$)/i,
    ],
  },
  // Dil Chahta Hai
  {
    movie: 'Dil Chahta Hai',
    movieSlug: 'dil-chahta-hai',
    patterns: [
      /(^|-)dil-chahta-hai(-|$)/i,
      /(^|-)jaane-kyon-log-pyar/i,
      /(^|-)tanhayee(-|$)/i,
      /(^|-)wo-ladki-hai-kahan(-|$)/i,
      /(^|-)koi-kahe-kehta(-|$)/i,
      /(^|-)kaisi-hai-ye-rut(-|$)/i,
    ],
  },
  // Hum Dil De Chuke Sanam
  {
    movie: 'Hum Dil De Chuke Sanam',
    movieSlug: 'hum-dil-de-chuke-sanam',
    patterns: [
      /(^|-)aankhon-ki-gustakhiyan(-|$)/i,
      /(^|-)albela-sajan(-|$)/i,
      /(^|-)chaand-chhupa(-|$)/i,
      /(^|-)hum-dil-de-chuke-sanam(-|$)/i,
      /(^|-)jhonka-hawa-ka(-|$)/i,
      /(^|-)tadap-tadap(-|$)/i,
    ],
  },
  // Veer-Zaara
  {
    movie: 'Veer-Zaara',
    movieSlug: 'veer-zaara',
    patterns: [
      /(^|-)tere-liye(-.*)?veer/i,
      /(^|-)main-yahaan-hoon(-|$)/i,
      /(^|-)do-pal(-|$)/i,
      /(^|-)aisa-des-hai-mera(-|$)/i,
      /(^|-)yeh-hum-aa-gaye(-|$)/i,
      /(^|-)kyon-hawa(-|$)/i,
    ],
  },
  // Sholay
  {
    movie: 'Sholay',
    movieSlug: 'sholay',
    patterns: [
      /(^|-)yeh-dosti(-|$)/i,
      /(^|-)mehbooba-mehbooba(-|$)/i,
      /(^|-)koi-haseena(-|$)/i,
      /(^|-)haan-jab-tak(-|$)/i,
    ],
  },
];

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(SONGS_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const slug = file.replace(/\.chopro$/, '');

  const idMatch = slug.match(/-(\d+)$/);
  const songId = idMatch ? idMatch[1] : '';

  // Parse existing frontmatter
  const fmM = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmM) continue;

  const fmText = fmM[1];
  const fm = {};
  for (const line of fmText.split('\n')) {
    const lm = line.match(/^(\w+):\s*(.*)$/);
    if (!lm) continue;
    const [, k, vRaw] = lm;
    let v = vRaw.trim().replace(/^["']|["']$/g, '');
    if (v.startsWith('[') && v.endsWith(']')) {
      try { v = JSON.parse(v); } catch {
        v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
      }
    }
    fm[k] = v;
  }

  let artist = fm.artist || 'Unknown Artist';
  let movie = '';
  let movieSlug = '';

  // 1. Check canonical artist from IndiChords mapping
  if (songId && mapping.songToArtist[songId]) {
    artist = mapping.songToArtist[songId];
  } else if (mapping.songToArtist[slug]) {
    artist = mapping.songToArtist[slug];
  }

  // 2. Check track-to-movie rule
  for (const rule of TRACK_MOVIE_RULES) {
    if (rule.patterns.some((p) => p.test(slug))) {
      movie = rule.movie;
      movieSlug = rule.movieSlug;
      break;
    }
  }

  // 3. Check if artist has movie in parenthesis, e.g. "Arijit (1920-Evil Returns)"
  const movieParen = artist.match(/\(([^)]+)\)$/);
  if (movieParen) {
    const extractedMovie = movieParen[1].trim();
    artist = artist.replace(/\s*\([^)]+\)$/, '').trim();
    if (!movie) {
      movie = extractedMovie;
      movieSlug = slugify(extractedMovie);
    }
  }

  // 4. Check canonical movie from IndiChords mapping
  if (!movie) {
    if (songId && mapping.songToMovie[songId]) {
      const albSlug = mapping.songToMovie[songId];
      movie = toTitleCase(albSlug);
      movieSlug = albSlug;
    } else if (mapping.songToMovie[slug]) {
      const albSlug = mapping.songToMovie[slug];
      movie = toTitleCase(albSlug);
      movieSlug = albSlug;
    }
  }

  // 5. Clean up artist string
  if (movie && artist.toLowerCase().includes(movie.toLowerCase())) {
    artist = artist.replace(new RegExp(`\\b${movie}\\b`, 'gi'), '').replace(/-\s*\d{4}/g, '').trim();
    if (!artist || artist.length < 2) artist = 'Various Artists';
  }

  artist = artist
    .replace(/\s*20\d\d.*$/g, '')
    .replace(/\s*-\s*guitar.*$/gi, '')
    .replace(/\s*chords.*$/gi, '')
    .trim();

  // Normalize tags
  let tags = Array.isArray(fm.tags) ? fm.tags : ['hindi'];
  if (movie && !tags.includes('bollywood')) {
    tags.push('bollywood');
  }

  // Rebuild frontmatter
  let newFm = `---\ntitle: "${fm.title || 'Untitled'}"\nartist: "${toTitleCase(artist)}"\n`;
  if (movie) {
    newFm += `movie: "${toTitleCase(movie)}"\nmovieSlug: "${movieSlug}"\n`;
  }
  if (fm.key) newFm += `key: "${fm.key}"\n`;
  if (fm.tempo) newFm += `tempo: ${fm.tempo}\n`;
  newFm += `tags: ${JSON.stringify(tags)}\n---\n`;

  const bodyOnly = raw.replace(/^---[\s\S]*?---\n?/, '');
  const updatedContent = newFm + '\n' + bodyOnly.trim() + '\n';

  fs.writeFileSync(filePath, updatedContent, 'utf8');
  updatedCount++;
}

console.log(`✓ Successfully updated ${updatedCount} song files with precision artist and movie mappings.`);
