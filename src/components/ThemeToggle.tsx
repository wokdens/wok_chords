import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'wokchords-theme';

function getInitialTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(getInitialTheme());
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (next === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
    }
  };

  const Icon = mounted ? (theme === 'dark' ? Sun : Moon) : Sun;
  const label = mounted
    ? theme === 'dark'
      ? 'Switch to light mode'
      : 'Switch to dark mode'
    : 'Toggle theme';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggle}
      className="inline-flex h-10 md:h-8 w-10 md:w-8 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-wok-accent/15 hover:text-wok-accent text-wok-muted transition shrink-0"
    >
      <Icon size={16} />
    </button>
  );
}
