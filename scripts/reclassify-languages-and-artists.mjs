import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');

const files = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));

const ENGLISH_ARTISTS = [
  'the beatles', 'beatles', 'coldplay', 'ed sheeran', 'taylor swift', 'adele', 'maroon 5',
  'shawn mendes', 'bryan adams', 'bon jovi', 'justin bieber', 'nirvana', 'westlife',
  'billie eilish', 'bruno mars', 'dua lipa', 'eminem', 'imagine dragons', 'john mayer',
  'lady gaga', 'linkin park', 'michael jackson', 'oasis', 'one direction', 'queen',
  'rihanna', 'the chainsmokers', 'the weeknd', 'dean lewis', 'ariana grande', 'anne-marie',
  'anne marie', 'yungblud', 'halsey', 'travis barker', 'zedd', 'katy perry', 'train',
  'calum scott', 'james blunt', 'avicii', 'marshmello', 'sam smith', 'sia', 'charlie puth',
  'harry styles', 'camila cabello', 'post malone', 'selena gomez', 'khalid', 'lauv',
  'lewis capaldi', 'olivia rodrigo', 'the script', 'green day', 'red hot chili peppers',
  'guns n roses', 'metallica', 'ac/dc', 'ac dc', 'led zeppelin', 'pink floyd', 'u2',
  'radiohead', 'arctic monkeys', 'foo fighters', 'twenty one pilots', 'elvis presley',
  'eric clapton', 'john legend', 'avril lavigne', 'alessia cara', 'alec benjamin',
  'alicia keys', 'backstreet boys', 'bee gees', 'beyonce', 'bob dylan', 'bob marley',
  'boyzone', 'celine dion', 'clean bandit', 'david guetta', 'demi lovato', 'elton john',
  'george michael', 'james arthur', 'jason mraz', 'john denver', 'jonas brothers',
  'kesha', 'kodaline', 'lana del rey', 'lorde', 'miley cyrus', 'passenger', 'phil collins',
  'rick astley', 'rod stewart', 'shania twain', 'sia', 'simple plan', 'steve miller band',
  'the eagles', 'eagles', 'the fray', 'the police', 'the rolling stones', 'rolling stones',
  'wham', 'whitney houston', 'the cranberries', 'cranberries', 'scorpions', 'hot chocolate'
];

const HINDI_ARTISTS = [
  'arijit singh', 'kishore kumar', 'atif aslam', 'jubin nautiyal', 'darshan raval',
  'sonu nigam', 'rahat fateh ali khan', 'jagjit singh', 'lucky ali', 'mohammed rafi',
  'kumar sanu', 'anuv jain', 'pritam', 'a.r. rahman', 'a.r rahman', 'ar rahman',
  'lata mangeshkar', 'asha bhosle', 'mohit chauhan', 'shreya ghoshal', 'amit trivedi',
  'vishal mishra', 'sachet tandon', 'sachet-parampara', 'mithoon', 'ankit tiwari',
  'armaan malik', 'amaal mallik', 'amaal malik', 'papon', 'badshah', 'guru randhawa',
  'neha kakkar', 'tony kakkar', 'kk', 'k.k', 'k.k.', 'udit narayan', 'alka yagnik',
  'kavita krishnamurthy', 'hariharan', 'pankaj udhas', 'bhupen hazarika', 'shankar mahadevan',
  'shankar-ehsaan-loy', 'shankar ehsaan loy', 'vishal-shekhar', 'vishal shekhar',
  'sachin-jigar', 'sachin jigar', 'meet bros', 'himesh reshammiya', 'bappi lahiri',
  'r.d. burman', 'rd burman', 's.d. burman', 'sd burman', 'laxmikant-pyarelal',
  'kalyanji-anandji', 'nadeem-shravan', 'jatin-lalit', 'anand-milind', 'anu malik',
  'mika singh', 'daler mehndi', 'honey singh', 'yo yo honey singh', 'raftaar',
  'shaan', 'sunidhi chauhan', 'geeta dutt', 'talat mahmood', 'manna dey', 'hemant kumar',
  'mukesh', 'prateek kuhad', 'jasleen royal', 'shilpa rao', 'rekha bhardwaj', 'richa sharma',
  'sukhwinder singh', 'kailash kher', 'adnan sami', 'ali zafar', 'shafqat amanat ali',
  'strings', 'jal', 'junoon', 'fuzon', 'roop kumar rathod', 'anuradha paudwal', 'zeest'
];

const HINDI_WORDS = new Set([
  'hai', 'hain', 'hum', 'tum', 'tera', 'meri', 'mera', 'tere', 'mere', 'dil', 'pyar', 'pyaar',
  'zindagi', 'kabhi', 'saath', 'humsafar', 'ishq', 'deewana', 'deewani', 'aankhen', 'aankhon',
  'nazar', 'raat', 'khuda', 'mohabbat', 'jaane', 'kyun', 'tujhe', 'mujhe', 'apna', 'apni',
  'apne', 'gaya', 'gayi', 'gaye', 'kuch', 'kuchh', 'nahi', 'nahin', 'kisi', 'karna', 'karta',
  'karti', 'baat', 'baatein', 'yaad', 'duniya', 'dost', 'hona', 'hoga', 'hogi', 'wali', 'wala',
  'sab', 'aaj', 'kal', 'paas', 'door', 'jeena', 'marna', 'suno', 'dekho', 'leke', 'aaya',
  'aayi', 'chala', 'chali', 'rang', 'sanam', 'yaara', 'dholna', 'sajna', 'bin', 'bina', 'karu',
  'kare', 'maahi', 'ranjha', 'heer', 'dhadkan', 'aashiqui', 'tere', 'teri', 'mujhko', 'tujhko',
  'waaste', 'vaaste', 'rabba', 'duaa', 'dua', 'khwahish', 'manzil', 'raste', 'chaahat', 'chaaha',
  'pal', 'lamhe', 'lamha', 'hawa', 'mausam', 'roop', 'mastani', 'mehbooba', 'deewanapan',
  'kahani', 'fitoor', 'aaina', 'shikwa', 'sapna', 'jeevan', 'saaz', 'awaaz', 'kasmein', 'khamoshi',
  'rupai', 'rupaye', 'chahiye', 'chhod', 'de', 'do'
]);

const ENGLISH_WORDS = new Set([
  'the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'they', 'have', 'this', 'from',
  'one', 'had', 'word', 'but', 'not', 'what', 'all', 'were', 'when', 'your', 'can', 'said',
  'there', 'use', 'each', 'which', 'she', 'how', 'their', 'if', 'will', 'up', 'other', 'about',
  'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him',
  'into', 'time', 'has', 'look', 'two', 'more', 'write', 'go', 'see', 'number', 'no', 'way',
  'could', 'people', 'my', 'than', 'first', 'water', 'been', 'call', 'who', 'oil', 'its',
  'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part', 'baby',
  'love', 'girl', 'yeah', 'oh', 'dont', 'cant', 'wont', 'cause', 'never', 'gonna', 'wanna',
  'got', 'feel', 'know', 'think', 'take', 'see', 'want', 'tell', 'good', 'night', 'tonight',
  'heart', 'eyes', 'stay', 'away', 'back', 'give', 'keep', 'hold', 'right', 'life', 'fall',
  'dream', 'world', 'look', 'break', 'breakin', 'somethin', 'nothin', 'every', 'everybody',
  'somebody', 'nobody', 'alone', 'together', 'forever', 'always', 'leave', 'light',
  'dark', 'sun', 'moon', 'sky', 'rain', 'fire', 'burn', 'breathe', 'touch', 'kiss', 'sweet',
  'twenty', 'two', 'rings', 'breakfast', 'tiffany', 'minutes', 'ways', 'goodbye'
]);

function toTitleCase(str) {
  if (!str) return '';
  return str
    .split(/[\s-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function cleanArtistName(art) {
  let cleaned = art
    .replace(/\s*from\s+album.*$/i, '')
    .replace(/\s*sung\s+by.*$/i, '')
    .replace(/\s*guitar\s+chords.*$/i, '')
    .replace(/\s*-\s*guitar.*$/i, '')
    .trim();

  if (/taylor\s*swift/i.test(art)) return 'Taylor Swift';
  if (/ariana\s*grande/i.test(art)) return 'Ariana Grande';
  if (/anne\s*marie|anne-marie/i.test(art)) return 'Anne-Marie';
  if (/yungblud/i.test(art)) return 'YUNGBLUD, Halsey & Travis Barker';
  if (/zedd/i.test(art) && /katy\s*perry/i.test(art)) return 'Zedd & Katy Perry';
  if (/50\s*ways\s*to\s*say\s*goodbye/i.test(art) || /goodbye/i.test(art)) return 'Train';
  if (/dean\s*lewis/i.test(art)) return 'Dean Lewis';
  if (/zeest/i.test(art)) return 'Zeest';

  return toTitleCase(cleaned);
}

function detectLanguageAndArtist(slug, rawContent, existingFm) {
  const lyricsOnly = rawContent
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .toLowerCase();

  const words = lyricsOnly.match(/[a-z']+/g) || [];

  let hindiCount = 0;
  let englishCount = 0;

  for (const w of words) {
    const cleanW = w.replace(/^'+|'+$/g, '');
    if (HINDI_WORDS.has(cleanW)) hindiCount++;
    if (ENGLISH_WORDS.has(cleanW)) englishCount++;
  }

  let artist = existingFm.artist || 'Unknown Artist';
  let title = existingFm.title || 'Untitled';
  let movie = existingFm.movie || '';
  let movieSlug = existingFm.movieSlug || '';

  // Check specific English songs by title/body
  const rawLower = rawContent.toLowerCase();
  if (/taylor\s*swift/i.test(rawLower) || /twenty\s*two\s*chords/i.test(rawLower) || slug === 'tac-22') {
    artist = 'Taylor Swift';
    title = '22';
  } else if (/ariana\s*grande/i.test(rawLower) || slug === 'tac-7-rings') {
    artist = 'Ariana Grande';
    title = '7 Rings';
  } else if (/anne\s*marie/i.test(rawLower) || slug === 'tac-2002') {
    artist = 'Anne-Marie';
    title = '2002';
  } else if (/yungblud/i.test(rawLower) || slug === 'tac-11-minutes') {
    artist = 'YUNGBLUD, Halsey & Travis Barker';
    title = '11 Minutes';
  } else if (/zedd/i.test(rawLower) && /katy\s*perry/i.test(rawLower) || slug === 'tac-365') {
    artist = 'Zedd & Katy Perry';
    title = '365';
  } else if (/50\s*ways\s*to\s*say\s*goodbye/i.test(slug)) {
    artist = 'Train';
    title = '50 Ways To Say Goodbye';
  } else if (/dean\s*lewis/i.test(rawLower) || slug === 'tac-7-minutes') {
    artist = 'Dean Lewis';
    title = '7 Minutes';
  } else if (/zeest/i.test(rawLower) || slug.includes('100-rupai')) {
    artist = 'Zeest';
    title = '100 Rupai';
  } else if (slug.startsWith('tac-') || artist.toLowerCase() === 'bollywood' || artist.toLowerCase() === 'unknown artist') {
    const bodyHeader = rawContent.slice(0, 500);
    const sungByMatch = bodyHeader.match(/sung by ([^.\n,]+(?:,\s*[^.\n,]+)*?(?: and [^.\n,]+)?)/i);
    const byMatch = bodyHeader.match(/(?:guitar chords|chords)\s+(?:by|of)\s+([^.\n]+)/i);
    const artistDirective = rawContent.match(/\{artist:\s*([^}]+)\}/i);

    if (sungByMatch && sungByMatch[1] && !sungByMatch[1].toLowerCase().includes('bollywood')) {
      artist = cleanArtistName(sungByMatch[1].trim());
    } else if (artistDirective && artistDirective[1] && !artistDirective[1].toLowerCase().includes('bollywood')) {
      artist = cleanArtistName(artistDirective[1].trim());
    } else if (byMatch && byMatch[1] && !byMatch[1].toLowerCase().includes('bollywood')) {
      artist = cleanArtistName(byMatch[1].trim());
    }
  }

  artist = cleanArtistName(artist);

  const artistLower = artist.toLowerCase();

  // Check known artists
  const isKnownEnglishArtist = ENGLISH_ARTISTS.some((a) => artistLower.includes(a));
  const isKnownHindiArtist = HINDI_ARTISTS.some((a) => artistLower.includes(a));

  let primaryLanguage = 'hindi';

  if (isKnownEnglishArtist) {
    primaryLanguage = 'english';
  } else if (isKnownHindiArtist) {
    primaryLanguage = 'hindi';
  } else if (englishCount > hindiCount * 2 && englishCount >= 8) {
    primaryLanguage = 'english';
  } else if (hindiCount > englishCount) {
    primaryLanguage = 'hindi';
  } else if (englishCount > hindiCount) {
    primaryLanguage = 'english';
  }

  // Tags
  let tags = [primaryLanguage];
  if (primaryLanguage === 'hindi' && (movie || isKnownHindiArtist)) {
    tags.push('bollywood');
  }

  // Clean artist if it says "Bollywood" for an English song
  if (primaryLanguage === 'english' && (artistLower === 'bollywood' || !artist || artist === 'Unknown Artist')) {
    const cleanSlug = slug.replace(/^tac-/, '');
    const parts = cleanSlug.split('-');
    if (parts.length > 1) {
      artist = toTitleCase(parts.slice(-1)[0]);
    } else {
      artist = 'Western Artist';
    }
  }

  return {
    title,
    artist,
    movie: primaryLanguage === 'english' ? '' : movie,
    movieSlug: primaryLanguage === 'english' ? '' : movieSlug,
    tags,
    primaryLanguage,
  };
}

let hindiTotal = 0;
let englishTotal = 0;
let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(SONGS_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const slug = file.replace(/\.chopro$/, '');

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

  const detected = detectLanguageAndArtist(slug, raw, fm);

  if (detected.primaryLanguage === 'english') {
    englishTotal++;
  } else {
    hindiTotal++;
  }

  // Rebuild frontmatter
  let newFm = `---\ntitle: "${detected.title}"\nartist: "${detected.artist}"\n`;
  if (detected.movie) {
    newFm += `movie: "${detected.movie}"\nmovieSlug: "${detected.movieSlug}"\n`;
  }
  if (fm.key) newFm += `key: "${fm.key}"\n`;
  if (fm.tempo) newFm += `tempo: ${fm.tempo}\n`;
  newFm += `tags: ${JSON.stringify(detected.tags)}\n---\n`;

  const bodyOnly = raw.replace(/^---[\s\S]*?---\n?/, '');
  const updatedContent = newFm + '\n' + bodyOnly.trim() + '\n';

  fs.writeFileSync(filePath, updatedContent, 'utf8');
  updatedCount++;
}

console.log(`\nReclassification Complete!`);
console.log(`- Total Hindi / Bollywood Songs: ${hindiTotal}`);
console.log(`- Total English / Western Songs: ${englishTotal}`);
console.log(`- Files updated: ${updatedCount}`);
