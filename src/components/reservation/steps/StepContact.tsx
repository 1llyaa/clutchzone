'use client';

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  discord: string;
  clutchzoneAccount: string;
}

interface Props {
  contact: ContactInfo;
  onChange: (c: ContactInfo) => void;
  requireClutchzoneAccount: boolean;
  onBack: () => void;
  onNext: () => void;
}

function Field({
  label, value, onChange, placeholder, type = 'text', required = true, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="font-mono text-cz-gray-light uppercase block" style={{ fontSize: 12, letterSpacing: 2.5, marginBottom: 8 }}>
        {label}{!required && <span className="text-cz-gray-light"> (nepovinné)</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-cz-black border border-cz-gray-dark rounded-cz text-white font-body placeholder:text-cz-gray-light focus:border-cz-orange outline-none transition-colors"
        style={{ padding: '12px 16px', fontSize: 16 }}
      />
      {hint && <p className="font-mono text-cz-gray-light" style={{ fontSize: 12, letterSpacing: 1, marginTop: 6 }}>{hint}</p>}
    </div>
  );
}

export default function StepContact({ contact, onChange, requireClutchzoneAccount, onBack, onNext }: Props) {
  const valid =
    contact.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) &&
    contact.phone.trim().length >= 9 &&
    (!requireClutchzoneAccount || contact.clutchzoneAccount.trim().length >= 2);

  const set = (patch: Partial<ContactInfo>) => onChange({ ...contact, ...patch });

  return (
    <div className="flex flex-col gap-4" style={{ marginTop: 8 }}>
      <Field label="Jméno" value={contact.name} onChange={(v) => set({ name: v })} placeholder="Jan Novák" />
      <Field label="E-mail" value={contact.email} onChange={(v) => set({ email: v })} placeholder="jan@email.cz" type="email" />
      <Field label="Telefon" value={contact.phone} onChange={(v) => set({ phone: v })} placeholder="+420 123 456 789" type="tel" />
      <Field
        label="Clutchzone account"
        value={contact.clutchzoneAccount}
        onChange={(v) => set({ clutchzoneAccount: v })}
        placeholder="tvoje přezdívka v ggLeap"
        required={requireClutchzoneAccount}
        hint={requireClutchzoneAccount ? 'Podle tohohle jména ti obsluha připíše hodiny na účet.' : undefined}
      />
      <Field label="Discord" value={contact.discord} onChange={(v) => set({ discord: v })} placeholder="uživatel#0000" required={false} />

      <div className="flex gap-3" style={{ marginTop: 4 }}>
        <button
          onClick={onBack}
          className="font-display uppercase rounded-[2px] cursor-pointer"
          style={{ fontSize: 16, letterSpacing: 2, padding: '11px 24px', background: 'transparent', border: '1.5px solid #2A2A2A', color: '#888' }}
        >
          ZPĚT
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="font-display uppercase rounded-[2px] flex-1 transition-colors"
          style={{
            fontSize: 16,
            letterSpacing: 2,
            padding: '11px 24px',
            background: valid ? '#E84A1A' : '#2A2A2A',
            border: 'none',
            color: valid ? '#fff' : '#888888',
            cursor: valid ? 'pointer' : 'not-allowed',
          }}
        >
          POKRAČOVAT NA PLATBU
        </button>
      </div>
    </div>
  );
}
