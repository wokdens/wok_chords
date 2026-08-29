import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');

const files = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));

const REGIONAL_RULES = [
  {
    tag: 'punjabi',
    patterns: [
      /guru-randhawa/i, /diljit/i, /sidhu/i, /moose-wala/i, /moosewala/i, /ap-dhillon/i,
      /b-praak/i, /bpraak/i, /jassie-gill/i, /jassi-gill/i, /harrdy-sandhu/i, /hardy-sandhu/i,
      /ammy-virk/i, /daler-mehndi/i, /mika-singh/i, /prabh-gill/i, /maninder-buttar/i,
      /sharry-maan/i, /bohemia/i, /jazzy-b/i, /sukhe/i, /karan-aujla/i, /mankirt-aulakh/i,
      /millind-gaba/i, /pav-dharia/i, /qismat/i, /soch-hardy/i, /laung-laachi/i, /prada-jass/i,
      /lehanga-jass/i, /sakhiyaan-maninder/i, /coka-sukhe/i, /jaani/i, /bhangra/i
    ],
  },
  {
    tag: 'bengali',
    patterns: [
      /anupam-roy/i, /rabindra/i, /nachiketa/i, /hemanta/i, /mushkil-ashan/i,
      /mon-majhi-re/i, /tomake-chai/i, /bojhona-shey/i, /bengali/i, /bangla/i,
      /rupankar/i, /shreya-ghoshal-bengali/i, /somlata/i, /fossils/i, /cactus-bengali/i
    ],
  },
  {
    tag: 'marathi',
    patterns: [
      /ajay-atul/i, /zingaat/i, /sairat/i, /duniyadari/i, /marathi/i, /swapnil-bandodkar/i,
      /avdhoot-gupte/i, /yad-lagla/i, /sairat-zaala-ji/i, /shantabai/i, /tik-tik-vajate/i,
      /man-dhaaga-dhaaga/i, /radha-hi-bawari/i
    ],
  },
  {
    tag: 'spanish',
    patterns: [
      /enrique-iglesias/i, /despacito/i, /luis-fonsi/i, /bailando/i, /ricky-martin/i,
      /alvaro-soler/i, /maluma/i, /bad-bunny/i, /j-balvin/i, /camila-cabello-havana/i,
      /rosalia/i, /spanish/i, /shakira-chantaje/i
    ],
  },
  {
    tag: 'tamil',
    patterns: [
      /kolaveri/i, /anirudh/i, /yuvan-shankar/i, /rowdy-baby/i, /vaathi/i,
      /enjoy-enjaami/i, /tamil/i, /sid-sriram-tamil/i, /dhanush/i, /harris-jayaraj-tamil/i
    ],
  },
];

let updatedCount = 0;
const counts = { punjabi: 0, bengali: 0, marathi: 0, spanish: 0, tamil: 0 };

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

  let tags = Array.isArray(fm.tags) ? [...fm.tags] : ['hindi'];
  let tagsChanged = false;

  for (const rule of REGIONAL_RULES) {
    if (rule.patterns.some((p) => p.test(slug) || p.test(raw.slice(0, 300)))) {
      if (!tags.includes(rule.tag)) {
        tags.push(rule.tag);
        tagsChanged = true;
        counts[rule.tag]++;
      }
    }
  }

  if (tagsChanged) {
    let newFm = `---\ntitle: "${fm.title || 'Untitled'}"\nartist: "${fm.artist || 'Unknown Artist'}"\n`;
    if (fm.movie) newFm += `movie: "${fm.movie}"\nmovieSlug: "${fm.movieSlug}"\n`;
    if (fm.key) newFm += `key: "${fm.key}"\n`;
    if (fm.tempo) newFm += `tempo: ${fm.tempo}\n`;
    newFm += `tags: ${JSON.stringify(tags)}\n---\n`;

    const bodyOnly = raw.replace(/^---[\s\S]*?---\n?/, '');
    const updatedContent = newFm + '\n' + bodyOnly.trim() + '\n';
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    updatedCount++;
  }
}

console.log(`✓ Regional Tagging Complete!`);
console.log(`- Files updated: ${updatedCount}`);
console.log(`- Counts:`, counts);
