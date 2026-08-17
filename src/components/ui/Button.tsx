'use client';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  /** `xs` is the dense admin table-row action size (edit/delete/save/cancel/toggle in table cells). `sm`/`md` are the marketing-site sizes. */
  size?: 'xs' | 'sm' | 'md';
  /** Square icon-only shape (~40x40px), no uppercase/letter-spacing text styling. */
  iconOnly?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  onClick,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const base =
    'transition-[background-color,color,border-color,scale,box-shadow] duration-150 ease-out rounded-[2px] inline-flex items-center justify-center';

  const textShape = 'font-display uppercase';

  const sizes = {
    xs: { fontSize: 16, padding: '4px 10px', letterSpacing: 1 },
    sm: { fontSize: 16, padding: '11px 22px', letterSpacing: 1.5 },
    md: { fontSize: 18, padding: '14px 32px', letterSpacing: 1.5 },
  };

  const s = sizes[size];
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

  const shapeClasses = iconOnly ? '' : textShape;
  const style = iconOnly
    ? { width: 40, height: 40, lineHeight: 1 }
    : { fontSize: s.fontSize, padding: s.padding, letterSpacing: s.letterSpacing, lineHeight: 1 };

  if (variant === 'primary') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`${base} ${shapeClasses} ${cursor} bg-cz-orange text-white border-[1.5px] border-cz-orange disabled:opacity-60 disabled:hover:shadow-none hover:bg-cz-orange-dark hover:border-cz-orange-dark hover:shadow-cta-glow active:scale-[0.96] ${className}`}
        style={style}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${base} ${shapeClasses} ${cursor} bg-transparent text-white border-[1.5px] border-cz-gray-dark disabled:opacity-60 hover:text-cz-orange hover:border-cz-orange ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}
