import http from 'node:http';

async function checkMovie(slug) {
  return new Promise((resolve) => {
    http.get(`http://localhost:4321/movie/${slug}/`, (res) => {
      let text = '';
      res.on('data', (c) => (text += c));
      res.on('end', () => {
        const songLinks = Array.from(text.matchAll(/<h3[^>]*class="[^"]*font-bold[^"]*"[^>]*>([\s\S]*?)<\/h3>/g)).map((m) => m[1].trim());
        console.log(`\n🎬 /movie/${slug}/ (${songLinks.length} tracks):`);
        songLinks.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
        resolve();
      });
    });
  });
}

async function run() {
  await checkMovie('rockstar');
  await checkMovie('aashiqui-2');
  await checkMovie('yeh-jawaani-hai-deewani');
  await checkMovie('cocktail');
  await checkMovie('barfi');
  await checkMovie('kabir-singh');
  await checkMovie('dil-chahta-hai');
}

run();
