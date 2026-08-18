'use client';

import { Plus } from '@phosphor-icons/react';

interface ImagePlaceholderProps {
  /** Uppercase label shown in the placeholder, e.g. "NO IMAGE" or "COVER". */
  label: string;
  /** Renders a small Plus icon above the label — use for upload dropzones. */
  uploadable?: boolean;
  /**
   * Self-contained box: fills width/height and paints the gradient background
   * (matches the public-site card placeholder). Set to `false` when the parent
   * element already renders its own box (border/background/size) — e.g. an
   * upload dropzone — and this should only render the centered icon + label.
   */
  ownBox?: boolean;
  width?: number | string;
  height?: number | string;
  /** Label font — `display` matches the public showcase card, `mono` matches admin upload dropzones. */
  font?: 'display' | 'mono';
  letterSpacing?: number;
  className?: string;
}

export default function ImagePlaceholder({
  label,
  uploadable = false,
  ownBox = true,
  width,
  height,
  font = 'display',
  letterSpacing = 3,
  className = '',
}: ImagePlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      style={
        ownBox
          ? {
              width: width ?? '100%',
              height: height ?? '100%',
              background: 'linear-gradient(135deg, #1a1a1a 0%, var(--color-cz-gray-dark) 100%)',
            }
          : undefined
      }
    >
      {uploadable && <Plus size={24} className="text-cz-gray-light" weight="bold" />}
      <span
        className={`${font === 'display' ? 'font-display' : 'font-mono'} text-cz-gray-light uppercase`}
        style={{ fontSize: 16, letterSpacing }}
      >
        {label}
      </span>
    </div>
  );
}
