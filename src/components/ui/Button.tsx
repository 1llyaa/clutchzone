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
    'font-display uppercase transition-[background-color,color,border-color,scale,box-shadow] duration-150 ease-out rounded-[2px] border-none inline-block';

  const sizes = {
    sm: { fontSize: 15, padding: '9px 22px', letterSpacing: 2, borderWidth: '1.5px' },
    md: { fontSize: 19, padding: '15px 40px', letterSpacing: 2, borderWidth: '1.5px' },
  };

  const s = sizes[size];
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

  if (variant === 'primary') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${cursor} bg-cz-orange text-white disabled:opacity-60 disabled:hover:shadow-none hover:bg-cz-orange-dark hover:shadow-[0_0_18px_rgba(232,74,26,0.35)] active:scale-[0.96] ${className}`}
        style={{ fontSize: s.fontSize, padding: s.padding, letterSpacing: s.letterSpacing }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${cursor} bg-transparent text-white disabled:opacity-60 hover:text-cz-orange hover:border-cz-orange ${className}`}
      style={{
        fontSize: s.fontSize,
        padding: s.padding,
        letterSpacing: s.letterSpacing,
        border: `${s.borderWidth} solid #2A2A2A`,
      }}
    >
      {children}
    </button>
  );
}
