import fs from 'node:fs';
import path from 'node:path';

const host = 'wokchords.wokdens.com';
const key = '9f8e7d6c5b4a31209f8e7d6c5b4a3120';
const keyLocation = `https://${host}/${key}.txt`;

// Read top songs from content directory
const songsDir = path.join(process.cwd(), 'src/content/songs');
const songFiles = fs.readdirSync(songsDir).filter((f) => f.endsWith('.chopro'));

const urlList = [
  `https://${host}/`,
  `https://${host}/songs/`,
  `https://${host}/artists/`,
  `https://${host}/movies/`,
  `https://${host}/setlist/`,
  `https://${host}/about/`,
  `https://${host}/privacy-policy/`,
  ...songFiles.slice(0, 100).map((f) => `https://${host}/song/${f.replace(/\.chopro$/, '')}/`),
];

console.log(`Submitting ${urlList.length} priority URLs to IndexNow (Bing, Yandex, Yahoo, Naver)...`);

const payload = {
  host,
  key,
  keyLocation,
  urlList,
};

try {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  console.log('IndexNow Response Status:', res.status, res.statusText);
  if (res.status === 200 || res.status === 202) {
    console.log('✓ Successfully submitted URLs to IndexNow network!');
  } else {
    const text = await res.text();
    console.log('Response body:', text);
  }
} catch (err) {
  console.error('Error submitting to IndexNow:', err);
}
