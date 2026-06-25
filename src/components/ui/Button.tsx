'use client';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
}: ButtonProps) {
  const base =
    'font-display uppercase cursor-pointer transition-all duration-150 rounded-[2px] border-none inline-block';

  const sizes = {
    sm: { fontSize: 15, padding: '9px 22px', letterSpacing: 2, borderWidth: '1.5px' },
    md: { fontSize: 19, padding: '15px 40px', letterSpacing: 2, borderWidth: '1.5px' },
  };

  const s = sizes[size];

  if (variant === 'primary') {
    return (
      <button
        onClick={onClick}
        className={`${base} bg-cz-orange text-white hover:bg-cz-orange-dark active:scale-[0.98] ${className}`}
        style={{ fontSize: s.fontSize, padding: s.padding, letterSpacing: s.letterSpacing }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${base} bg-transparent text-white hover:text-cz-orange hover:border-cz-orange ${className}`}
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
