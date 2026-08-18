import { useEffect, useState } from 'react';

interface Props {
  letters: string[];
}

export default function AlphabetNav({ letters }: Props) {
  const [active, setActive] = useState<string>(letters[0] ?? '');

  useEffect(() => {
    if (letters.length === 0) return;

    const elements: HTMLElement[] = letters
      .map((letter) => document.getElementById(`letter-${letter}`))
      .filter((el): el is HTMLElement => !!el);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.id.replace('letter-', '');
          setActive(id);
        }
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [letters.join(',')]);

  const handleClick = (letter: string, e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(`letter-${letter}`);
    if (!target) return;
    setActive(letter);
    const headerOffset = 80;
    const y = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
    history.replaceState(null, '', `#letter-${letter}`);
  };

  return (
    <nav aria-label="Browse songs by first letter" className="flex flex-row md:flex-col flex-wrap md:flex-nowrap items-start gap-1.5 md:gap-2 py-2 md:py-0">
      {letters.map((letter) => {
        const isActive = letter === active;
        return (
          <a
            key={letter}
            href={`#letter-${letter}`}
            onClick={(e) => handleClick(letter, e)}
            aria-current={isActive ? 'location' : undefined}
            className={`
              inline-flex items-center justify-center
              w-8 h-8 md:w-9 md:h-9 rounded-lg border
              font-bold tracking-tight transition-all duration-150
              ${isActive
                ? 'bg-wok-accent text-white border-wok-accent shadow-[0_0_0_3px_rgb(var(--wok-accent)/0.25)] text-lg scale-105'
                : 'bg-black/5 dark:bg-white/5 text-wok-muted border-black/10 dark:border-white/10 hover:bg-wok-accent/10 hover:text-wok-accent hover:border-wok-accent/40 text-sm'
              }
            `}
            title={`Jump to songs starting with ${letter}`}
          >
            {letter}
          </a>
        );
      })}
    </nav>
  );
}
