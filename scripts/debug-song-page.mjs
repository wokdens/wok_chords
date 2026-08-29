import http from 'node:http';

http.get('http://localhost:4321/song/dil-aaj-kal-purani-jeans-k-k-883/', (res) => {
  let text = '';
  res.on('data', (c) => (text += c));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Total HTML Length:', text.length);
    console.log('Has .chord-sheet-container:', text.includes('chord-sheet-container'));
    console.log('Has class="chord":', text.includes('class="chord"'));
    console.log('Has class="lyrics":', text.includes('class="lyrics"'));
    console.log('Has "Dil aaj kal":', text.includes('Dil aaj kal'));
    console.log('Has "G#m":', text.includes('G#m'));
    const chordsCount = (text.match(/class="chord">([^<]+)<\/div>/g) || []).length;
    console.log('Rendered Chord count in HTML:', chordsCount);
  });
});
