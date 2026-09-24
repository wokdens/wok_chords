import React, { useState, useMemo } from 'react';

export interface TrendingSongData {
  slug: string;
  title: string;
  artist: string;
  movie?: string;
  key?: string;
  tags: string[];
  snippet?: string;
  category: 'hindi' | 'english' | 'all';
}

interface Props {
  initialSongs: TrendingSongData[];
  allPool: TrendingSongData[];
}

export default function DynamicTrending({ initialSongs, allPool }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'hindi' | 'english'>('all');
  const [rotationIndex, setRotationIndex] = useState(0);

  // Filter songs by active tab
  const categoryPool = useMemo(() => {
    if (activeTab === 'all') return allPool;
    return allPool.filter((s) => s.category === activeTab || s.category === 'all');
  }, [allPool, activeTab]);

  // Rotate through pool 8 at a time
  const currentSongs = useMemo(() => {
    if (categoryPool.length <= 8) return categoryPool;
    const start = (rotationIndex * 8) % categoryPool.length;
    let slice = categoryPool.slice(start, start + 8);
    if (slice.length < 8) {
      slice = slice.concat(categoryPool.slice(0, 8 - slice.length));
    }
    return slice;
  }, [categoryPool, rotationIndex]);

  const handleShuffle = () => {
    setRotationIndex((prev) => prev + 1);
  };

  return (
    <div>
      {/* Category Tabs & Shuffle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-md">
          <button
            onClick={() => {
              setActiveTab('all');
              setRotationIndex(0);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-wok-muted hover:text-wok-text'
            }`}
          >
            🔥 All Trending
          </button>
          <button
            onClick={() => {
              setActiveTab('hindi');
              setRotationIndex(0);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'hindi'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-wok-muted hover:text-wok-text'
            }`}
          >
            🎬 Hindi & Bollywood
          </button>
          <button
            onClick={() => {
              setActiveTab('english');
              setRotationIndex(0);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'english'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-wok-muted hover:text-wok-text'
            }`}
          >
            🌍 English & Global
          </button>
        </div>

        {/* Dynamic Shuffle & Rotation CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="Discover other popular songs in this category"
          >
            <span>🎲</span>
            <span>Discover More (Shuffle)</span>
          </button>
        </div>
      </div>

      {/* Grid of Dynamic Trending Songs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {currentSongs.map(({ slug, title, artist, movie, key, tags, snippet }) => (
          <a
            key={slug}
            href={`/song/${slug}/`}
            className="group flex flex-col justify-between rounded-2xl border border-black/5 dark:border-white/5 bg-white/75 dark:bg-slate-900/60 backdrop-blur-md hover:bg-white/95 dark:hover:bg-slate-900/90 transition-all p-4 hover:border-orange-500/40 hover:-translate-y-1 duration-200 shadow-sm hover:shadow-xl hover:shadow-orange-500/10"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-base font-bold text-wok-text group-hover:text-wok-accent transition-colors line-clamp-1">
                  {title}
                </h3>
                {key && (
                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-wok-chord/10 text-wok-chord border border-wok-chord/20 text-[11px] font-mono font-bold">
                    Key {key}
                  </span>
                )}
              </div>
              <p className="text-xs text-wok-muted line-clamp-1 mb-2 font-medium">
                {artist}
                {movie ? ` · ${movie}` : ''}
              </p>
              {snippet && (
                <p className="text-xs text-wok-muted/80 italic leading-snug line-clamp-2 mb-3 pl-2 border-l-2 border-orange-500/30">
                  “{snippet}”
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-black/5 dark:border-white/5">
              <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-wok-muted capitalize font-medium">
                #{tags[0] || 'chords'}
              </span>
              <span className="text-wok-muted group-hover:text-wok-accent font-bold flex items-center gap-1">
                Play Chords →
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
