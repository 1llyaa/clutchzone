'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number; // ms transition-delay, for staggering card groups
  as?: 'div' | 'section' | 'li' | 'span';
  className?: string;
}

// Scroll-reveal wrapper. SSR renders children fully visible; only after
// hydration do offscreen elements get hidden and revealed on first
// intersection. No-JS users, crawlers, and reduced-motion users always
// see content immediately.
export default function Reveal({ children, delay = 0, as: Tag = 'div', className }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;
    // Anchor deep-link (/#cenik): the smooth anchor scroll races hydration,
    // so the in-viewport check below can't be trusted — show everything.
    if (window.location.hash) return;
    // Already in viewport (above the fold): don't hide-then-show — that
    // reads as a flash.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.classList.add('cz-reveal-hidden');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.remove('cz-reveal-hidden');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`cz-reveal${className ? ` ${className}` : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
