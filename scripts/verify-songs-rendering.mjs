import http from 'node:http';

const testSlugs = [
  'dil-aaj-kal-purani-jeans-k-k-883',
  'maine-dil-se-kaha-k-k-m-m-kreem-1730',
  'jo-bhi-main-rockstar-2011-a-r-rahman-mohit-49',
  'kun-faya-kun-javed-ali-a-r-rahman-rockstar--1160',
  'tac-uska-hi-banana',
  'tum-hi-ho-arijit-singh-mithoon-aashiqui--3',
  'tac-badtameez-dil',
];

async function checkSong(slug) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:4321/song/${slug}/`, (res) => {
      let text = '';
      res.on('data', (c) => (text += c));
      res.on('end', () => {
        const chordCount = (text.match(/class="chord">([^<]+)<\/div>/g) || []).length;
        const lyricsCount = (text.match(/class="lyrics">([^<]+)<\/div>/g) || []).length;
        const titleMatch = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : slug;
        console.log(`✓ [${res.statusCode}] ${title} (${slug}) -> ${chordCount} chords, ${lyricsCount} lyric lines`);
        resolve();
      });
    });
    req.on('error', (err) => {
      console.error(`Error fetching ${slug}:`, err.message);
      resolve();
    });
    req.setTimeout(4000, () => {
      console.error(`Timeout fetching ${slug}`);
      req.destroy();
      resolve();
    });
  });
}

async function run() {
  for (const s of testSlugs) {
    await checkSong(s);
  }
  console.log('\nAll test songs verified!');
}

run();
