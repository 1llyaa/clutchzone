import nodemailer from 'nodemailer';
import { BUSINESS } from '@/lib/business';

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
  /** The offer *banks* hours (an hour package was bought). */
  isCredit?: boolean;
  /** The booking is *paid with* hours already on the account — nothing is due. */
  paysWithCredit?: boolean;
  creditExpiryMonths?: number;
  clutchzoneAccount?: string | null;
  /** Signed self-service cancellation link (VOP §3.4.3) — omitted if unsigned. */
  cancelUrl?: string | null;
  /** Free-cancellation window in minutes, for the copy around that link. */
  cancellationWindowMinutes?: number;
  /**
   * How the customer chose to pay. Without it an unpaid card booking and a
   * pay-at-club booking read identically, which is how "Rezervace potvrzena"
   * ended up going to people who never paid.
   */
  paymentMethod?: 'online' | 'onsite';
  /** Minutes an unpaid online booking holds its slot — online path only. */
  holdMinutes?: number;
}

/** Data for the payment receipt, which is only ever sent once money arrived. */
interface BookingReceiptEmailData {
  reference: string;
  stationLabel: string;
  customerName: string;
  customerEmail: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  amountPaid: number;
  offerLabel?: string;
  /** How the money arrived, for the wording only. */
  paidVia: 'card' | 'onsite';
  cancelUrl?: string | null;
  cancellationWindowMinutes?: number;
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

/**
 * § 435 obč. zák. — a business has to identify itself (name, IČO, registered
 * seat) on its business communications, e-mail included, whether or not any
 * money changed hands. Goes on customer-facing mail only; staff already know
 * who they work for.
 *
 * Reads BUSINESS rather than hardcoding, so the open questions about the
 * address and the .cz/.club e-mail (docs/legal-review-notes.md section B)
 * resolve in one place.
 */
const LEGAL_IDENTITY_LINE = `${BUSINESS.ownerName} · IČO: ${BUSINESS.ico} · ${BUSINESS.registeredAddress} · ${BUSINESS.email}`;

// Deliberately just the identity, no legal-form sentence: which register the
// operator is entered in is still an open question with their lawyer
// (docs/legal-review-notes.md section B) and is not ours to assert.
function legalFooter(): string {
  return `<p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;line-height:1.6">
        ${escapeHtml(LEGAL_IDENTITY_LINE)}
      </p>`;
}

function legalFooterText(): string {
  return `\n\n—\n${LEGAL_IDENTITY_LINE}`;
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
    // Showing a price on a credit booking invites staff to collect money that
    // isn't due.
    b.paysWithCredit
      ? ['Platba', 'Hodinami z účtu — nevybírat']
      : ['Cena', `${b.totalPrice} Kč`],
    ['Jméno', b.customerName],
    ['E-mail', b.customerEmail],
    ['Telefon', b.customerPhone],
    ...(b.clutchzoneAccount ? [['Clutchzone account', b.clutchzoneAccount] as [string, string]] : []),
  ];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Nová rezervace</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Clutch Zone — právě přišla nová rezervace.</p>
      ${
        b.paysWithCredit
          ? `<p style="margin:0 0 20px;padding:10px 14px;background:rgba(232,74,26,0.1);border:1px solid rgba(232,74,26,0.3);color:#ff8a5c;font-size:13px">Platí hodinami z účtu — nic nevybírej, hodiny se strhnou podle odehraného času.</p>`
          : b.isCredit
            ? `<p style="margin:0 0 20px;padding:10px 14px;background:rgba(232,74,26,0.1);border:1px solid rgba(232,74,26,0.3);color:#ff8a5c;font-size:13px">Hodinový kredit — připiš na Clutchzone account při první návštěvě.</p>`
            : ''
      }
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

  // Nothing here is paid yet. Three different reasons why, and the customer
  // needs to be told which one applies — the online path in particular has a
  // deadline attached.
  const awaitingCardPayment = b.paymentMethod === 'online' && !b.paysWithCredit;
  const holdMinutes = b.holdMinutes ?? 30;

  const rows: [string, string][] = [
    ['Stanice', b.stationLabel],
    ['Nabídka', b.offerLabel ?? '—'],
    ['Datum', b.date],
    ['Čas', `${b.startTime} – ${endMin}`],
    // Showing a price to someone paying with banked hours reads as money owed.
    b.paysWithCredit
      ? ['Platba', 'Hodinami z účtu — nic neplatíš']
      : awaitingCardPayment
        ? ['K zaplacení', `${b.totalPrice} Kč — kartou`]
        : ['Zaplatíš na místě', `${b.totalPrice} Kč`],
  ];

  const heading = awaitingCardPayment ? 'Rezervace čeká na platbu' : 'Rezervace potvrzena';

  // An unpaid card booking must not be told the price is binding as though the
  // reservation were settled — it may still lapse.
  const arrivalNote = b.paysWithCredit
    ? 'Přijďte 10 minut před začátkem a ukažte referenční kód na recepci. Nic neplatíte — hodiny se strhnou z účtu až podle odehraného času.'
    : awaitingCardPayment
      ? 'Po zaplacení přijďte 10 minut před začátkem a ukažte referenční kód na recepci.'
      : 'Přijďte 10 minut před začátkem a ukažte referenční kód na recepci. Cena uvedená výše je závazná a zaplatíte ji na recepci.';

  const pendingNote = awaitingCardPayment
    ? `<p style="margin:0 0 20px;padding:12px 14px;background:rgba(232,74,26,0.08);border:1px solid rgba(232,74,26,0.25);color:#ff8a5c;font-size:13px;line-height:1.6">
        Rezervace ti drží místo ${holdMinutes} minut. Pokud do té doby platba nedorazí, automaticky propadne
        a stanice se uvolní. Po zaplacení ti přijde potvrzení o platbě.
      </p>`
    : '';

  // isCredit means the offer BANKS hours. Paying with hours already on the
  // account banks nothing, so promising a top-up there contradicts the
  // "nic neplatíš" line right above it.
  const creditNote =
    b.isCredit && !b.paysWithCredit
      ? `<p style="margin:0 0 20px;padding:12px 14px;background:rgba(232,74,26,0.08);border:1px solid rgba(232,74,26,0.25);color:#ff8a5c;font-size:13px;line-height:1.6">
        Hodiny ti připíšeme na Clutchzone account při první návštěvě — ukaž tenhle kód na recepci.
        Platnost ${b.creditExpiryMonths ?? 3} měsíce od nákupu.
      </p>`
      : '';

  // The URL is server-generated and HMAC-signed, so it is safe to embed as an
  // href — but it still gets escaped, since it lands inside an HTML attribute.
  const cancelWindow = b.cancellationWindowMinutes ?? 15;
  // Deliberately doesn't promise credit back: nothing is paid at send time on
  // any path, so what the customer eventually gets depends on state we don't
  // know here. The cancel page reads the live payment status and says what
  // actually applies.
  const cancelNote = b.cancelUrl
    ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #2a2a2a;color:#888;font-size:13px;line-height:1.6">
        Nemůžeš dorazit? Rezervaci zrušíš bezplatně do ${cancelWindow} minut před začátkem.<br>
        <a href="${escapeHtml(b.cancelUrl)}" style="color:#E84A1A">Zrušit rezervaci →</a>
      </p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">${heading}</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Díky za rezervaci v Clutch Zone, ${escapeHtml(b.customerName)}!</p>
      <div style="text-align:center;margin:0 0 24px">
        <span style="display:inline-block;font-size:32px;letter-spacing:4px;color:#fff;border:1px solid #E84A1A;padding:12px 32px;background:rgba(232,74,26,0.08)">${b.reference}</span>
      </div>
      ${pendingNote}
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;width:110px">${k}</td>
            <td style="padding:8px 0;color:#fff;border-bottom:1px solid #2a2a2a"><strong>${escapeHtml(v)}</strong></td>
          </tr>`).join('')}
      </table>
      <p style="margin:24px 0 20px;color:#888;font-size:13px;line-height:1.6">
        ${arrivalNote}
      </p>
      ${creditNote}
      ${cancelNote}
      ${legalFooter()}
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: b.customerEmail,
      subject: `${heading} ${b.reference} · Clutch Zone · ${b.date} ${b.startTime}`,
      html,
      text: `${heading}: ${b.reference}\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n${awaitingCardPayment ? `Rezervace ti drží místo ${holdMinutes} minut. Pokud platba nedorazí, propadne.\n` : ''}${arrivalNote}${b.isCredit && !b.paysWithCredit ? `\nHodiny ti připíšeme na Clutchzone account při první návštěvě.` : ''}${b.cancelUrl ? `\nZrušit rezervaci (bezplatně do ${cancelWindow} minut před začátkem): ${b.cancelUrl}` : ''}${legalFooterText()}`.trim(),
    });
  } catch (err) {
    console.error('Booking confirmation email failed:', err);
  }
}

/**
 * Payment receipt — sent only on the real unpaid → paid transition, from the
 * Stripe webhook or from staff marking an on-site payment received.
 *
 * This is the doklad o zakoupení under § 16 zák. o ochraně spotřebitele, which
 * is why it carries the date of payment, what was bought, the amount, and the
 * seller's identity. The booking confirmation cannot serve that purpose: at the
 * time it goes out nothing has been paid on any path.
 *
 * Never sent for bookings paid with banked hours — no money moves there.
 */
export async function sendBookingPaymentReceipt(b: BookingReceiptEmailData): Promise<void> {
  const transport = getTransport();
  if (!transport) return;

  const endMin = (() => {
    const [h, m] = b.startTime.split(':').map(Number);
    const total = h * 60 + m + b.durationMinutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  })();

  const paidOn = new Date().toLocaleDateString('cs-CZ', { timeZone: 'Europe/Prague' });

  const rows: [string, string][] = [
    ['Datum platby', paidOn],
    ['Zaplaceno', `${b.amountPaid} Kč`],
    ['Způsob platby', b.paidVia === 'card' ? 'Platební kartou online' : 'Na místě v klubu'],
    ['Služba', b.offerLabel ? `${b.offerLabel} — ${b.stationLabel}` : `Herní rezervace — ${b.stationLabel}`],
    ['Termín', `${b.date}, ${b.startTime} – ${endMin}`],
    ['Reference', b.reference],
  ];

  const cancelWindow = b.cancellationWindowMinutes ?? 15;
  const cancelNote = b.cancelUrl
    ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #2a2a2a;color:#888;font-size:13px;line-height:1.6">
        Nemůžeš dorazit? Rezervaci zrušíš bezplatně do ${cancelWindow} minut před začátkem.<br>
        <a href="${escapeHtml(b.cancelUrl)}" style="color:#E84A1A">Zrušit rezervaci →</a>
      </p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Platba přijata</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Díky, ${escapeHtml(b.customerName)} — rezervace je zaplacená a potvrzená.</p>
      <div style="text-align:center;margin:0 0 24px">
        <span style="display:inline-block;font-size:32px;letter-spacing:4px;color:#fff;border:1px solid #E84A1A;padding:12px 32px;background:rgba(232,74,26,0.08)">${b.reference}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;width:130px">${k}</td>
            <td style="padding:8px 0;color:#fff;border-bottom:1px solid #2a2a2a"><strong>${escapeHtml(v)}</strong></td>
          </tr>`).join('')}
      </table>
      <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.6">
        Tento e-mail slouží jako doklad o zakoupení. Přijďte 10 minut před začátkem a ukažte referenční kód na recepci.
      </p>
      ${cancelNote}
      ${legalFooter()}
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: b.customerEmail,
      subject: `Platba přijata ${b.reference} · Clutch Zone · ${b.amountPaid} Kč`,
      html,
      text: `Platba přijata: ${b.reference}\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\nTento e-mail slouží jako doklad o zakoupení.${b.cancelUrl ? `\nZrušit rezervaci (bezplatně do ${cancelWindow} minut před začátkem): ${b.cancelUrl}` : ''}${legalFooterText()}`,
    });
  } catch (err) {
    console.error('Booking payment receipt email failed:', err);
  }
}

/**
 * Admin alert — Stripe took money for a booking that was no longer live (an
 * expired hold, or one the customer had already cancelled). Nothing can be
 * done automatically, so staff has to refund it from the Stripe dashboard.
 */
export async function sendStrandedPaymentAlert(p: {
  groupId: string;
  paymentIntentId?: string;
}): Promise<void> {
  const transport = getTransport();
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!transport || !to) return;

  const body = [
    `Booking group: ${p.groupId}`,
    `Payment intent: ${p.paymentIntentId ?? '—'}`,
    '',
    'Stripe potvrdil platbu, ale rezervace už nebyla platná (propadlá nebo zrušená).',
    'Peníze je potřeba vrátit ručně ve Stripe dashboardu.',
  ].join('\n');

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: `⚠ Platba bez platné rezervace — nutná ruční refundace (${p.groupId})`,
      html: `<pre style="font-family:monospace;font-size:13px;line-height:1.6">${escapeHtml(body)}</pre>`,
      text: body,
    });
  } catch (err) {
    console.error('Stranded payment alert email failed:', err);
  }
}

interface CreditOrderEmailData {
  reference: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  expiresAt: string; // YYYY-MM-DD
  clutchzoneAccount: string | null;
  items: { stationType: 'pc' | 'ps5'; hours: number; quantity: number }[];
  /** Signed 14-day withdrawal link (VOP §11.3) — omitted if unsigned. */
  withdrawUrl?: string | null;
}

function formatCzechDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${Number(d)}. ${Number(m)}. ${y}`;
}

// Admin notification — fires only once the order is actually paid (spec §11.3:
// unpaid credit orders are just clutter, staff only needs to know once money
// has moved and hours need crediting).
export async function sendCreditOrderNotification(o: CreditOrderEmailData): Promise<void> {
  const transport = getTransport();
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!transport || !to) return;

  const itemsList = o.items.map((i) => `${i.quantity}× ${i.hours}H ${i.stationType.toUpperCase()}`).join(', ');
  const rows: [string, string][] = [
    ['Reference', o.reference],
    ['Položky', itemsList],
    ['Částka', `${o.totalAmount} Kč`],
    ['Platnost do', formatCzechDate(o.expiresAt)],
    ['Jméno', o.customerName],
    ['E-mail', o.customerEmail],
    ['Clutchzone account', o.clutchzoneAccount ?? '— (nemá zatím účet)'],
  ];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Zaplacený nákup kreditu</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Clutch Zone — hodiny čekají na připsání.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;width:140px">${k}</td>
            <td style="padding:8px 0;color:#fff;border-bottom:1px solid #2a2a2a"><strong>${escapeHtml(v)}</strong></td>
          </tr>`).join('')}
      </table>
      <p style="margin:24px 0 0;font-size:12px">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/cs/admin/credits" style="color:#E84A1A">Otevřít v administraci →</a>
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: `Zaplacený kredit ${o.reference} · ${itemsList}`,
      html,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    });
  } catch (err) {
    console.error('Credit order notification email failed:', err);
  }
}

// Confirmation for the customer — fires once payment clears.
export async function sendCreditPurchaseConfirmation(o: CreditOrderEmailData): Promise<void> {
  const transport = getTransport();
  if (!transport) return;

  const itemsRows: [string, string][] = o.items.map((i) => [`${i.stationType.toUpperCase()} hodiny`, `${i.quantity}× ${i.hours}H`]);
  const rows: [string, string][] = [
    ...itemsRows,
    ['Celkem', `${o.totalAmount} Kč`],
    ['Platnost do', formatCzechDate(o.expiresAt)],
  ];

  // § 1829 obč. zák. requires an easily accessible way to withdraw within 14
  // days for undated purchases like these — hence a button in the email, not
  // just a form to print out.
  const withdrawNote = o.withdrawUrl
    ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #2a2a2a;color:#888;font-size:13px;line-height:1.6">
        Rozmyslel sis to? Od nákupu můžeš do 14 dnů odstoupit, pokud hodiny ještě nebyly čerpány —
        peníze ti vrátíme zpět na kartu.<br>
        <a href="${escapeHtml(o.withdrawUrl)}" style="color:#E84A1A">Odstoupit od smlouvy →</a>
      </p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Nákup kreditu potvrzen</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Díky za nákup v Clutch Zone, ${escapeHtml(o.customerName)}!</p>
      <div style="text-align:center;margin:0 0 24px">
        <span style="display:inline-block;font-size:32px;letter-spacing:4px;color:#fff;border:1px solid #E84A1A;padding:12px 32px;background:rgba(232,74,26,0.08)">${o.reference}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;width:140px">${k}</td>
            <td style="padding:8px 0;color:#fff;border-bottom:1px solid #2a2a2a"><strong>${escapeHtml(v)}</strong></td>
          </tr>`).join('')}
      </table>
      <p style="margin:24px 0 0;padding:12px 14px;background:rgba(232,74,26,0.08);border:1px solid rgba(232,74,26,0.25);color:#ff8a5c;font-size:13px;line-height:1.6">
        Hodiny ti připíšeme na Clutchzone account při první návštěvě — ukaž tenhle kód na recepci.
        Nevyužité hodiny po ${formatCzechDate(o.expiresAt)} propadají.
      </p>
      ${withdrawNote}
      ${legalFooter()}
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: o.customerEmail,
      subject: `Nákup kreditu potvrzen ${o.reference} · Clutch Zone`,
      html,
      text: `Nákup kreditu potvrzen: ${o.reference}\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\nHodiny ti připíšeme na Clutchzone account při první návštěvě — ukaž tenhle kód na recepci.${o.withdrawUrl ? `\nOdstoupení od smlouvy do 14 dnů: ${o.withdrawUrl}` : ''}${legalFooterText()}`,
    });
  } catch (err) {
    console.error('Credit purchase confirmation email failed:', err);
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
      ${legalFooter()}
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: t.captainEmail,
      subject: `Registrace přijata · ${t.tournamentTitle}`,
      html,
      text: `Tým ${t.teamName} je přihlášen na turnaj ${t.tournamentTitle} (${t.tournamentDate}). Registrace čeká na potvrzení organizátorem.${legalFooterText()}`,
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
      ${legalFooter()}
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: t.captainEmail,
      subject: `Účast potvrzena · ${t.tournamentTitle}`,
      html,
      text: `Účast týmu ${t.teamName} na turnaji ${t.tournamentTitle} (${t.tournamentDate}) je potvrzena.${legalFooterText()}`,
    });
  } catch (err) {
    console.error('Tournament participation confirmed email failed:', err);
  }
}
