'use client';

interface Props {
  reference: string;
  stationLabels: string[];
  date: string;
  startTime: string;
  totalAmount: number;
  offerLabel: string;
  isCredit: boolean;
  creditExpiryMonths: number;
  onClose: () => void;
}

export default function StepDone({ reference, stationLabels, date, startTime, totalAmount, offerLabel, isCredit, creditExpiryMonths, onClose }: Props) {
  return (
    <div className="flex flex-col items-center text-center gap-6" style={{ marginTop: 16 }}>
      <div>
        <span className="font-mono text-cz-gray-light uppercase block" style={{ fontSize: 13, letterSpacing: 3, marginBottom: 12 }}>
          REFERENČNÍ KÓD
        </span>
        <div
          className="font-display text-white rounded-cz border border-cz-orange inline-block"
          style={{ fontSize: 48, letterSpacing: 4, padding: '16px 40px', background: 'rgba(232,74,26,0.06)' }}
        >
          {reference}
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 13, letterSpacing: 2 }}>STANICE</span>
          <span className="font-mono text-white" style={{ fontSize: 15, letterSpacing: 1 }}>{stationLabels.join(', ')}</span>
        </div>
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 13, letterSpacing: 2 }}>VARIANTA</span>
          <span className="font-mono text-white" style={{ fontSize: 15, letterSpacing: 1 }}>{offerLabel}</span>
        </div>
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 13, letterSpacing: 2 }}>DATUM</span>
          <span className="font-mono text-white" style={{ fontSize: 15, letterSpacing: 1 }}>{date} {startTime}</span>
        </div>
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 13, letterSpacing: 2 }}>CELKEM</span>
          <span className="font-display text-cz-orange" style={{ fontSize: 20, letterSpacing: 1 }}>{totalAmount} Kč</span>
        </div>
      </div>

      {isCredit && (
        <div style={{ background: 'rgba(232,74,26,0.08)', border: '1px solid rgba(232,74,26,0.25)', padding: '16px 18px', width: '100%' }}>
          <div className="font-mono text-cz-orange uppercase" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>HODINY ZŮSTÁVAJÍ</div>
          <p className="font-body text-cz-gray-light" style={{ fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>
            Platnost {creditExpiryMonths} měsíce od nákupu. Připíšeme ti je na Clutchzone account při první návštěvě — ukaž tenhle kód na recepci.
          </p>
        </div>
      )}

      <p className="font-body text-cz-gray-light" style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 380 }}>
        Potvrzení jsme poslali na tvůj e-mail. Přijď 10 minut před začátkem a ukaž referenční kód na recepci.
      </p>

      <button
        onClick={onClose}
        className="w-full bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors rounded-[2px] border-none cursor-pointer"
        style={{ fontSize: 17, letterSpacing: 2, padding: '14px' }}
      >
        ZAVŘÍT
      </button>
    </div>
  );
}
