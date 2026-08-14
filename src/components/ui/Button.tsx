'use client';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false,
}: ButtonProps) {
  const base =
    'font-display uppercase transition-[background-color,color,border-color,scale,box-shadow] duration-150 ease-out rounded-[2px] inline-block';

  const sizes = {
    sm: { fontSize: 16, padding: '11px 22px', letterSpacing: 1.5 },
    md: { fontSize: 18, padding: '14px 32px', letterSpacing: 1.5 },
  };

  const s = sizes[size];
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

  if (variant === 'primary') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${cursor} bg-cz-orange text-white border-[1.5px] border-cz-orange disabled:opacity-60 disabled:hover:shadow-none hover:bg-cz-orange-dark hover:border-cz-orange-dark hover:shadow-[0_0_18px_rgba(232,74,26,0.35)] active:scale-[0.96] ${className}`}
        style={{ fontSize: s.fontSize, padding: s.padding, letterSpacing: s.letterSpacing, lineHeight: 1 }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${cursor} bg-transparent text-white border-[1.5px] border-cz-gray-dark disabled:opacity-60 hover:text-cz-orange hover:border-cz-orange ${className}`}
      style={{ fontSize: s.fontSize, padding: s.padding, letterSpacing: s.letterSpacing, lineHeight: 1 }}
    >
      {children}
    </button>
  );
}
