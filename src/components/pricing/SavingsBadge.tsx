'use client';

export default function SavingsBadge({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: "'Space Mono',monospace",
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: 1,
        color: '#E84A1A',
        marginTop: 12,
      }}
    >
      ↓ UŠETŘÍŠ {amount} KČ
    </div>
  );
}
