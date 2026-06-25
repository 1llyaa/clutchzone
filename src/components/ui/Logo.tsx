interface LogoProps {
  size?: number;
}

export default function Logo({ size = 44 }: LogoProps) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect x="0" y="0" width="100" height="100" rx="14" fill="#0A0A0A" />
        <rect x="1" y="1" width="98" height="98" rx="13" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="40" fill="#E8E5DC" />
        <circle cx="50" cy="50" r="32" fill="#141414" />
        <circle cx="50" cy="50" r="24" fill="#E8E5DC" />
        <circle cx="50" cy="50" r="16" fill="#141414" />
        <circle cx="50" cy="50" r="9" fill="#E84A1A" />
      </svg>
    </div>
  );
}
