import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { getSetlist, subscribeToSetlist } from '../lib/setlistStore';

export default function SetlistHeaderButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getSetlist().length);
    const unsubscribe = subscribeToSetlist((list) => {
      setCount(list.length);
    });
    return unsubscribe;
  }, []);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('wokchords:open-setlist'));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Open My Saved Setlist"
      aria-label={`My Setlist (${count} songs)`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold text-wok-muted hover:text-rose-500 transition-colors"
    >
      <Heart
        size={14}
        className={`transition-colors ${count > 0 ? 'text-rose-500 fill-rose-500' : 'text-wok-muted'}`}
      />
      <span>Setlist</span>
      {count > 0 && (
        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold leading-tight">
          {count}
        </span>
      )}
    </button>
  );
}
