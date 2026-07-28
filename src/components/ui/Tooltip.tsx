'use client';

import { useId, useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  function show() {
    setVisible(true);
  }

  function hide() {
    setVisible(false);
  }

  return (
    <span
      className="relative inline-flex"
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={id}
    >
      {children}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className="absolute font-mono text-white rounded-[2px] pointer-events-none whitespace-nowrap"
          style={{
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0A0A0A',
            border: '1px solid #2A2A2A',
            padding: '6px 10px',
            fontSize: 11,
            letterSpacing: 0.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 10,
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
