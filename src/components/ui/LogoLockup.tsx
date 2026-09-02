import Image from 'next/image';

interface LogoLockupProps {
  size?: number;
  subtitle?: string;
}

export default function LogoLockup({ size = 44, subtitle = 'ESPORT CLUB · ČB' }: LogoLockupProps) {
  return (
    <div className="flex items-center gap-[14px]">
      <Image
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        priority
        style={{ flexShrink: 0, display: 'block' }}
      />
      <div className="flex flex-col leading-none">
        <span
          className="font-display text-white uppercase"
          style={{ fontSize: size === 40 ? 22 : 24, letterSpacing: 2 }}
        >
          CLUTCH ZONE
        </span>
        <span
          className="font-mono text-cz-orange uppercase mt-[3px]"
          style={{ fontSize: 16, letterSpacing: 3 }}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
}
