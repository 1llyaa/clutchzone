import nodemailer from 'nodemailer';

interface BookingEmailData {
  reference: string;
  stationLabel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  totalPrice: number;
  offerLabel?: string;
  isCredit?: boolean;
  creditExpiryMonths?: number;
  clutchzoneAccount?: string | null;
}

// Escape user-supplied values before interpolating into email HTML.
// Booking fields come from the public POST /api/bookings endpoint and
// are only length-validated, so raw markup would otherwise render in
// the recipient's mail client (HTML/link injection).
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// Fire-and-forget: booking must never fail because email failed.
export async function sendBookingNotification(b: BookingEmailData): Promise<void> {
  const transport = getTransport();
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!transport || !to) return;

  const endMin = (() => {
    const [h, m] = b.startTime.split(':').map(Number);
    const total = h * 60 + m + b.durationMinutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  })();

  const rows: [string, string][] = [
    ['Reference', b.reference],
    ['Stanice', b.stationLabel],
    ['Nabídka', b.offerLabel ?? '—'],
    ['Datum', b.date],
    ['Čas', `${b.startTime} – ${endMin}`],
    ['Cena', `${b.totalPrice} Kč`],
    ['Jméno', b.customerName],
    ['E-mail', b.customerEmail],
    ['Telefon', b.customerPhone],
    ...(b.clutchzoneAccount ? [['Clutchzone account', b.clutchzoneAccount] as [string, string]] : []),
  ];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Nová rezervace</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Clutch Zone — právě přišla nová rezervace.</p>
      ${b.isCredit ? `<p style="margin:0 0 20px;padding:10px 14px;background:rgba(232,74,26,0.1);border:1px solid rgba(232,74,26,0.3);color:#ff8a5c;font-size:13px">Hodinový kredit — připiš na Clutchzone account při první návštěvě.</p>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;width:110px">${k}</td>
            <td style="padding:8px 0;color:#fff;border-bottom:1px solid #2a2a2a"><strong>${escapeHtml(v)}</strong></td>
          </tr>`).join('')}
      </table>
      <p style="margin:24px 0 0;font-size:12px">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/cs/admin/bookings?from=${b.date}&to=${b.date}" style="color:#E84A1A">Otevřít v administraci →</a>
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: `Nová rezervace ${b.reference} · ${b.stationLabel} · ${b.date} ${b.startTime}`,
      html,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    });
  } catch (err) {
    console.error('Booking notification email failed:', err);
  }
}

// Confirmation for the customer — fire-and-forget as well.
export async function sendBookingConfirmation(b: BookingEmailData): Promise<void> {
  const transport = getTransport();
  if (!transport) return;

  const endMin = (() => {
    const [h, m] = b.startTime.split(':').map(Number);
    const total = h * 60 + m + b.durationMinutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  })();

  const rows: [string, string][] = [
    ['Stanice', b.stationLabel],
    ['Nabídka', b.offerLabel ?? '—'],
    ['Datum', b.date],
    ['Čas', `${b.startTime} – ${endMin}`],
    ['Cena', `${b.totalPrice} Kč`],
  ];

  const creditNote = b.isCredit
    ? `<p style="margin:0 0 20px;padding:12px 14px;background:rgba(232,74,26,0.08);border:1px solid rgba(232,74,26,0.25);color:#ff8a5c;font-size:13px;line-height:1.6">
        Hodiny ti připíšeme na Clutchzone account při první návštěvě — ukaž tenhle kód na recepci.
        Platnost ${b.creditExpiryMonths ?? 3} měsíce od nákupu.
      </p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Rezervace potvrzena</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Díky za rezervaci v Clutch Zone, ${escapeHtml(b.customerName)}!</p>
      <div style="text-align:center;margin:0 0 24px">
        <span style="display:inline-block;font-size:32px;letter-spacing:4px;color:#fff;border:1px solid #E84A1A;padding:12px 32px;background:rgba(232,74,26,0.08)">${b.reference}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;width:110px">${k}</td>
            <td style="padding:8px 0;color:#fff;border-bottom:1px solid #2a2a2a"><strong>${escapeHtml(v)}</strong></td>
          </tr>`).join('')}
      </table>
      <p style="margin:24px 0 20px;color:#888;font-size:13px;line-height:1.6">
        Přijďte 10 minut před začátkem a ukažte referenční kód na recepci. Cena uvedená výše je závazná.
      </p>
      ${creditNote}
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: b.customerEmail,
      subject: `Rezervace potvrzena ${b.reference} · Clutch Zone · ${b.date} ${b.startTime}`,
      html,
      text: `Rezervace potvrzena: ${b.reference}\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\nPřijďte 10 minut před začátkem a ukažte referenční kód na recepci. Cena je závazná.${b.isCredit ? `\nHodiny ti připíšeme na Clutchzone account při první návštěvě.` : ''}`,
    });
  } catch (err) {
    console.error('Booking confirmation email failed:', err);
  }
}

interface TournamentEmailData {
  tournamentTitle: string;
  tournamentDate: string;
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainDiscord?: string;
}

// Admin notification — a new team just registered for a tournament.
export async function sendTournamentRegistrationNotification(t: TournamentEmailData): Promise<void> {
  const transport = getTransport();
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!transport || !to) return;

  const rows: [string, string][] = [
    ['Turnaj', t.tournamentTitle],
    ['Datum', t.tournamentDate],
    ['Tým', t.teamName],
    ['Kapitán', t.captainName],
    ['E-mail', t.captainEmail],
    ['Discord', t.captainDiscord || '—'],
  ];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Nová registrace na turnaj</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Clutch Zone — právě se přihlásil nový tým.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;width:110px">${k}</td>
            <td style="padding:8px 0;color:#fff;border-bottom:1px solid #2a2a2a"><strong>${escapeHtml(v)}</strong></td>
          </tr>`).join('')}
      </table>
      <p style="margin:24px 0 0;font-size:12px">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/cs/admin/tournaments" style="color:#E84A1A">Otevřít v administraci →</a>
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: `Nová registrace · ${t.tournamentTitle} · ${t.teamName}`,
      html,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    });
  } catch (err) {
    console.error('Tournament registration notification email failed:', err);
  }
}

// Confirmation to the captain — their registration was received (pending review).
export async function sendTournamentRegistrationReceived(t: TournamentEmailData): Promise<void> {
  const transport = getTransport();
  if (!transport) return;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Registrace přijata</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Ahoj ${escapeHtml(t.captainName)}, tým <strong style="color:#fff">${escapeHtml(t.teamName)}</strong> je přihlášen na turnaj <strong style="color:#fff">${escapeHtml(t.tournamentTitle)}</strong> (${escapeHtml(t.tournamentDate)}).</p>
      <p style="margin:0;color:#888;font-size:13px;line-height:1.6">
        Registrace teď čeká na potvrzení organizátorem. Jakmile ji potvrdíme, přijde ti další e-mail.
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: t.captainEmail,
      subject: `Registrace přijata · ${t.tournamentTitle}`,
      html,
      text: `Tým ${t.teamName} je přihlášen na turnaj ${t.tournamentTitle} (${t.tournamentDate}). Registrace čeká na potvrzení organizátorem.`,
    });
  } catch (err) {
    console.error('Tournament registration received email failed:', err);
  }
}

// Confirmation to the captain — an admin confirmed their participation.
export async function sendTournamentParticipationConfirmed(t: TournamentEmailData): Promise<void> {
  const transport = getTransport();
  if (!transport) return;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Účast potvrzena</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Ahoj ${escapeHtml(t.captainName)}!</p>
      <div style="text-align:center;margin:0 0 24px">
        <span style="display:inline-block;font-size:20px;letter-spacing:1px;color:#fff;border:1px solid #E84A1A;padding:14px 28px;background:rgba(232,74,26,0.08);text-transform:uppercase">${escapeHtml(t.teamName)}</span>
      </div>
      <p style="margin:0 0 16px;color:#e8e8e8;font-size:14px;line-height:1.6">
        Vaše účast na turnaji <strong>${escapeHtml(t.tournamentTitle)}</strong> (${escapeHtml(t.tournamentDate)}) je potvrzena. Uvidíme se na místě!
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: t.captainEmail,
      subject: `Účast potvrzena · ${t.tournamentTitle}`,
      html,
      text: `Účast týmu ${t.teamName} na turnaji ${t.tournamentTitle} (${t.tournamentDate}) je potvrzena.`,
    });
  } catch (err) {
    console.error('Tournament participation confirmed email failed:', err);
  }
}
