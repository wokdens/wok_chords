import { getAllSongs, getSongBySlug } from '../src/lib/songStore.ts';

const songs = getAllSongs();
console.log(`Total songs loaded: ${songs.length}`);

const unknownCount = songs.filter(s => s.artist === 'Unknown Artist').length;
console.log(`Songs with "Unknown Artist": ${unknownCount} / ${songs.length}`);

const withMovie = songs.filter(s => s.movie);
console.log(`Songs with movie soundtracks: ${withMovie.length}`);

const tumHiHo = getSongBySlug('tum-hi-ho-arijit-singh-mithoon-aashiqui--3');
console.log('Tum Hi Ho data:', {
  title: tumHiHo?.title,
  artist: tumHiHo?.artist,
  movie: tumHiHo?.movie,
  movieSlug: tumHiHo?.movieSlug,
  key: tumHiHo?.key,
});

const coldplay = getSongBySlug('yellow-coldplay-635');
console.log('Coldplay Yellow data:', {
  title: coldplay?.title,
  artist: coldplay?.artist,
  key: coldplay?.key,
});

const artists = new Set(songs.map(s => s.artist).filter(Boolean));
console.log(`Total unique artists: ${artists.size}`);

const movies = new Set(songs.map(s => s.movieSlug).filter(Boolean));
console.log(`Total unique movie albums: ${movies.size}`);
