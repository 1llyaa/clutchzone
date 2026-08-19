'use client';

import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  /** Only meaningful when `variant="ghost"` — renders a visually "on" state for filter-toggle chip buttons (distinct from inactive ghost and from primary/danger mutating actions). No-op for `primary`/`danger`. Defaults to `false`. */
  active?: boolean;
  /** `xs` is the dense admin table-row action size (edit/delete/save/cancel/toggle in table cells). `sm`/`md` are the marketing-site sizes. `responsive` uses clamp()-based fluid font-size/padding for large hero-style CTAs that need to scale smoothly between mobile and desktop instead of stepping at a breakpoint. */
  size?: 'xs' | 'sm' | 'md' | 'responsive';
  /** Square icon-only shape (~40x40px), no uppercase/letter-spacing text styling. */
  iconOnly?: boolean;
  /** Native button `type`. Defaults to the browser's implicit `submit` — set explicitly to `button` when placing this inside a `<form>` for a non-submit action (e.g. cancel). Ignored when `href` is set. */
  type?: 'button' | 'submit';
  /** When set, renders as a `next/link` `Link` (same visual styling) instead of a `<button>` — for CTAs that navigate rather than trigger an action. Caller is responsible for locale-prefixing the href, same as any other `next/link` usage in this codebase. */
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export default function Button({
  children,
  variant = 'primary',
  active = false,
  size = 'md',
  iconOnly = false,
  type,
  href,
  onClick,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const base =
    'transition-[background-color,color,border-color,scale,box-shadow] duration-150 ease-out rounded-control inline-flex items-center justify-center';

  const textShape = 'font-display uppercase';

  const sizes = {
    xs: { fontSize: 16, padding: '4px 10px', letterSpacing: 1 },
    sm: { fontSize: 16, padding: '11px 22px', letterSpacing: 1.5 },
    md: { fontSize: 18, padding: '14px 32px', letterSpacing: 1.5 },
    responsive: { fontSize: 'clamp(16px, 2vw, 19px)', padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px)', letterSpacing: 2 },
  };

  const s = sizes[size];
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

  const shapeClasses = iconOnly ? '' : textShape;
  const style = iconOnly
    ? { width: 40, height: 40, lineHeight: 1 }
    : { fontSize: s.fontSize, padding: s.padding, letterSpacing: s.letterSpacing, lineHeight: 1 };

  const variantClasses =
    variant === 'primary'
      ? 'bg-cz-orange text-white border-[1.5px] border-cz-orange disabled:opacity-60 disabled:hover:shadow-none hover:bg-cz-orange-dark hover:border-cz-orange-dark hover:shadow-cta-glow active:scale-[0.96]'
      : variant === 'danger'
        ? 'bg-cz-danger text-white border-[1.5px] border-cz-danger disabled:opacity-60 disabled:hover:brightness-100 hover:brightness-90 active:scale-[0.96]'
        : active
          ? 'bg-[rgba(232,74,26,0.08)] text-cz-orange border-[1.5px] border-cz-orange disabled:opacity-60'
          : 'bg-transparent text-white border-[1.5px] border-cz-gray-dark disabled:opacity-60 hover:text-cz-orange hover:border-cz-orange';

  const classes = `${base} ${shapeClasses} ${cursor} ${variantClasses} ${className}`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} aria-label={ariaLabel} className={classes} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={classes}
      style={style}
    >
      {children}
    </button>
  );
}
