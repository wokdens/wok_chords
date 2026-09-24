import React, { useState, useMemo } from 'react';

export interface OpenChordSongData {
  slug: string;
  title: string;
  artist: string;
  movie?: string;
  key?: string;
  tags: string[];
  chords: string[];
  chordCount: number;
}

interface Props {
  songs: OpenChordSongData[];
}

export default function OpenChordsExplorer({ songs }: Props) {
  const [search, setSearch] = useState('');
  const [chordFilter, setChordFilter] = useState<string | null>(null);
  const [countFilter, setCountFilter] = useState<number | null>(null);
  const [fourMagicFilter, setFourMagicFilter] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 32;

  const popularOpenChords = ['C', 'G', 'D', 'Em', 'Am', 'E', 'A', 'Dm'];

  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      // Search query filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesArtist = s.artist.toLowerCase().includes(q);
        const matchesChord = s.chords.some((c) => c.toLowerCase() === q);
        if (!matchesTitle && !matchesArtist && !matchesChord) return false;
      }

      // Specific chord filter
      if (chordFilter) {
        if (!s.chords.includes(chordFilter)) return false;
      }

      // Chord count filter (2-chord, 3-chord, etc.)
      if (countFilter !== null) {
        if (countFilter === 4 && s.chordCount >= 4) {
          // 4+ chords
        } else if (s.chordCount !== countFilter) {
          return false;
        }
      }

      // The 4 Magic Chords filter (G, C, D, Em)
      if (fourMagicFilter) {
        const magicSet = new Set(['G', 'C', 'D', 'Em', 'Cadd9', 'Dsus4', 'Em7']);
        const onlyMagic = s.chords.every((c) => magicSet.has(c));
        if (!onlyMagic) return false;
      }

      return true;
    });
  }, [songs, search, chordFilter, countFilter, fourMagicFilter]);

  const visibleSongs = filteredSongs.slice(0, page * pageSize);

  const resetFilters = () => {
    setSearch('');
    setChordFilter(null);
    setCountFilter(null);
    setFourMagicFilter(false);
    setPage(1);
  };

  return (
    <div class="space-y-6">
      {/* Controls Bar */}
      <div class="p-4 sm:p-6 rounded-3xl border border-black/5 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
        {/* Search input */}
        <div class="relative mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search 1,200+ open-chord songs by title, artist, or chord (e.g. Ed Sheeran, Lucky Ali, Em)..."
            class="w-full px-5 py-3.5 pl-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm md:text-base text-wok-text placeholder-wok-muted/70 focus:outline-none focus:ring-2 focus:ring-wok-accent/50 focus:border-wok-accent transition-all"
          />
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-wok-muted text-lg pointer-events-none">
            🔍
          </span>
          {search && (
            <button
              onClick={() => setSearch('')}
              class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-md bg-black/10 dark:bg-white/10 text-wok-muted hover:text-wok-text"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Filter Tabs */}
        <div class="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
          <span class="text-xs font-bold uppercase tracking-wider text-wok-muted mr-1">
            Skill Level:
          </span>
          <button
            onClick={() => {
              setCountFilter(null);
              setFourMagicFilter(false);
              setPage(1);
            }}
            class={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              countFilter === null && !fourMagicFilter
                ? 'bg-wok-accent text-white shadow-md shadow-wok-accent/20'
                : 'bg-black/5 dark:bg-white/5 text-wok-muted hover:text-wok-text'
            }`}
          >
            All Open Chords ({songs.length})
          </button>
          <button
            onClick={() => {
              setCountFilter(2);
              setFourMagicFilter(false);
              setPage(1);
            }}
            class={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              countFilter === 2
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-black/5 dark:bg-white/5 text-wok-muted hover:text-wok-text'
            }`}
          >
            ⚡ 2-Chord Songs (Easiest)
          </button>
          <button
            onClick={() => {
              setCountFilter(3);
              setFourMagicFilter(false);
              setPage(1);
            }}
            class={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              countFilter === 3
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-black/5 dark:bg-white/5 text-wok-muted hover:text-wok-text'
            }`}
          >
            🎸 3-Chord Classics
          </button>
          <button
            onClick={() => {
              setFourMagicFilter(!fourMagicFilter);
              setCountFilter(null);
              setPage(1);
            }}
            class={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              fourMagicFilter
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-black/5 dark:bg-white/5 text-wok-muted hover:text-wok-text'
            }`}
          >
            ✨ The 4 Magic Chords (G, C, D, Em)
          </button>
        </div>

        {/* Chord Pills Filter */}
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-xs font-bold uppercase tracking-wider text-wok-muted mr-1">
            Filter by Chord:
          </span>
          {popularOpenChords.map((chord) => {
            const isSelected = chordFilter === chord;
            return (
              <button
                key={chord}
                onClick={() => {
                  setChordFilter(isSelected ? null : chord);
                  setPage(1);
                }}
                class={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                    : 'bg-wok-chord/10 text-wok-chord hover:bg-wok-chord/20 border border-wok-chord/20'
                }`}
              >
                [{chord}]
              </button>
            );
          })}
          {(chordFilter || countFilter || fourMagicFilter || search) && (
            <button
              onClick={resetFilters}
              class="ml-auto text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div class="flex items-center justify-between text-xs sm:text-sm text-wok-muted px-1">
        <span>
          Showing <strong class="text-wok-text">{visibleSongs.length}</strong> of{' '}
          <strong class="text-wok-text">{filteredSongs.length}</strong> songs
        </span>
        {chordFilter && (
          <span>
            Filtering by chord: <strong class="text-wok-accent">[{chordFilter}]</strong>
          </span>
        )}
      </div>

      {/* Grid of Open Chord Songs */}
      {visibleSongs.length === 0 ? (
        <div class="text-center py-16 px-4 rounded-3xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-slate-900/50">
          <p class="text-4xl mb-3">🎸</p>
          <h3 class="text-lg font-bold text-wok-text mb-1">No songs matched this combination</h3>
          <p class="text-xs text-wok-muted max-w-md mx-auto mb-4">
            Try resetting your search query or selecting a different skill level filter.
          </p>
          <button
            onClick={resetFilters}
            class="px-4 py-2 rounded-xl bg-wok-accent text-white text-xs font-bold shadow-md shadow-wok-accent/20"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleSongs.map((s) => (
            <a
              key={s.slug}
              href={`/song/${s.slug}/`}
              class="group flex flex-col justify-between rounded-2xl border border-black/5 dark:border-white/5 bg-white/75 dark:bg-slate-900/60 backdrop-blur-md hover:bg-white/95 dark:hover:bg-slate-900/90 transition-all p-4 hover:border-orange-500/40 hover:-translate-y-1 duration-200 shadow-sm hover:shadow-xl hover:shadow-orange-500/10"
            >
              <div>
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <h3 class="text-base font-bold text-wok-text group-hover:text-wok-accent transition-colors line-clamp-1">
                    {s.title}
                  </h3>
                  <span class="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    {s.chordCount} Chords
                  </span>
                </div>
                <p class="text-xs text-wok-muted line-clamp-1 mb-2 font-medium">
                  {s.artist}
                  {s.movie ? ` · ${s.movie}` : ''}
                </p>

                {/* Chords Used in this song */}
                <div class="flex flex-wrap gap-1 mb-3">
                  {s.chords.slice(0, 5).map((c) => (
                    <span
                      key={c}
                      class="px-1.5 py-0.5 rounded bg-wok-chord/10 text-wok-chord text-[11px] font-mono font-bold"
                    >
                      {c}
                    </span>
                  ))}
                  {s.chords.length > 5 && (
                    <span class="text-[10px] text-wok-muted self-center">
                      +{s.chords.length - 5}
                    </span>
                  )}
                </div>
              </div>

              <div class="flex items-center justify-between text-[11px] pt-2 border-t border-black/5 dark:border-white/5">
                <span class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span>✓</span> No Barre Chords
                </span>
                <span class="text-wok-muted group-hover:text-wok-accent font-bold flex items-center gap-1">
                  Play Chords →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {visibleSongs.length < filteredSongs.length && (
        <div class="text-center pt-4">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            class="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 hover:border-wok-accent text-wok-text font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            Load More Songs ({filteredSongs.length - visibleSongs.length} remaining) ↓
          </button>
        </div>
      )}
    </div>
  );
}
