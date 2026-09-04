import nodemailer from 'nodemailer';
import { BUSINESS } from '@/lib/business';
import { getServerTranslator, resolveLocale } from '@/lib/i18n/server';

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
  /** Language the customer booked in. Staff mail stays Czech regardless. */
  locale?: string;
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
  locale?: string;
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
 * Reads BUSINESS rather than hardcoding, so the seat, venue address and e-mail
 * resolve in one place — they now match the operator's legal documents.
 */
const LEGAL_IDENTITY_LINE = `${BUSINESS.ownerName} · IČO: ${BUSINESS.ico} · ${BUSINESS.registeredAddress} · ${BUSINESS.email}`;

// Deliberately just the identity, no legal-form sentence: the terms name the
// register (trade register, Magistrát města České Budějovice), but spelling it
// out in every e-mail footer buys nothing § 435 asks for.
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

  const locale = resolveLocale(b.locale);
  const t = await getServerTranslator(locale, 'email');

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
    [t('labels.station'), b.stationLabel],
    [t('labels.offer'), b.offerLabel ?? '—'],
    [t('labels.date'), formatDate(b.date, locale)],
    [t('labels.time'), `${b.startTime} – ${endMin}`],
    // Showing a price to someone paying with banked hours reads as money owed.
    b.paysWithCredit
      ? [t('labels.payment'), t('booking.payWithCredit')]
      : awaitingCardPayment
        ? [t('labels.toPay'), t('booking.toPayCard', { amount: b.totalPrice })]
        : [t('labels.payOnSite'), t('booking.amountPlain', { amount: b.totalPrice })],
  ];

  const heading = awaitingCardPayment ? t('booking.headingAwaitingPayment') : t('booking.headingConfirmed');

  // An unpaid card booking must not be told the price is binding as though the
  // reservation were settled — it may still lapse.
  const arrivalNote = b.paysWithCredit
    ? t('booking.arrivalCredit')
    : awaitingCardPayment
      ? t('booking.arrivalAwaiting')
      : t('booking.arrivalOnsite');

  const pendingNote = awaitingCardPayment
    ? `<p style="margin:0 0 20px;padding:12px 14px;background:rgba(232,74,26,0.08);border:1px solid rgba(232,74,26,0.25);color:#ff8a5c;font-size:13px;line-height:1.6">
        ${escapeHtml(t('booking.holdNote', { minutes: holdMinutes }))}
      </p>`
    : '';

  // isCredit means the offer BANKS hours. Paying with hours already on the
  // account banks nothing, so promising a top-up there contradicts the
  // "nic neplatíš" line right above it.
  const creditNote =
    b.isCredit && !b.paysWithCredit
      ? `<p style="margin:0 0 20px;padding:12px 14px;background:rgba(232,74,26,0.08);border:1px solid rgba(232,74,26,0.25);color:#ff8a5c;font-size:13px;line-height:1.6">
        ${escapeHtml(t('booking.creditNote', { months: b.creditExpiryMonths ?? 3 }))}
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
        ${escapeHtml(t('booking.cancelNote', { minutes: cancelWindow }))}<br>
        <a href="${escapeHtml(b.cancelUrl)}" style="color:#E84A1A">${escapeHtml(t('booking.cancelLink'))}</a>
      </p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">${escapeHtml(heading)}</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">${escapeHtml(t('booking.intro', { name: b.customerName }))}</p>
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
      subject: t('booking.subject', { heading, reference: b.reference, date: formatDate(b.date, locale), time: b.startTime }),
      html,
      text: `${heading}: ${b.reference}\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n${awaitingCardPayment ? `${t('booking.holdNoteText', { minutes: holdMinutes })}\n` : ''}${arrivalNote}${b.isCredit && !b.paysWithCredit ? `\n${t('booking.creditNoteText')}` : ''}${b.cancelUrl ? `\n${t('booking.cancelLinkText', { minutes: cancelWindow })}: ${b.cancelUrl}` : ''}${legalFooterText()}`.trim(),
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

  const locale = resolveLocale(b.locale);
  const t = await getServerTranslator(locale, 'email');

  const endMin = (() => {
    const [h, m] = b.startTime.split(':').map(Number);
    const total = h * 60 + m + b.durationMinutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  })();

  const paidOn = new Date().toLocaleDateString(INTL_TAG[locale] ?? INTL_TAG.cs, { timeZone: 'Europe/Prague' });

  const rows: [string, string][] = [
    [t('labels.paymentDate'), paidOn],
    [t('labels.paidAmount'), t('booking.amountPlain', { amount: b.amountPaid })],
    [t('labels.paymentMethod'), b.paidVia === 'card' ? t('receipt.methodCard') : t('receipt.methodOnsite')],
    [
      t('labels.service'),
      b.offerLabel
        ? t('receipt.serviceWithOffer', { offer: b.offerLabel, station: b.stationLabel })
        : t('receipt.serviceDefault', { station: b.stationLabel }),
    ],
    [t('labels.term'), `${formatDate(b.date, locale)}, ${b.startTime} – ${endMin}`],
    [t('labels.reference'), b.reference],
  ];

  const cancelWindow = b.cancellationWindowMinutes ?? 15;
  const cancelNote = b.cancelUrl
    ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #2a2a2a;color:#888;font-size:13px;line-height:1.6">
        ${escapeHtml(t('booking.cancelNote', { minutes: cancelWindow }))}<br>
        <a href="${escapeHtml(b.cancelUrl)}" style="color:#E84A1A">${escapeHtml(t('booking.cancelLink'))}</a>
      </p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">${escapeHtml(t('receipt.heading'))}</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">${escapeHtml(t('receipt.intro', { name: b.customerName }))}</p>
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
        ${escapeHtml(t('receipt.docNote'))}
      </p>
      ${cancelNote}
      ${legalFooter()}
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: b.customerEmail,
      subject: t('receipt.subject', { reference: b.reference, amount: b.amountPaid }),
      html,
      text: `${t('receipt.heading')}: ${b.reference}\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n${t('receipt.docNoteText')}${b.cancelUrl ? `\n${t('booking.cancelLinkText', { minutes: cancelWindow })}: ${b.cancelUrl}` : ''}${legalFooterText()}`,
    });
  } catch (err) {
    console.error('Booking payment receipt email failed:', err);
  }
}

/**
 * Admin notification — a customer cancelled and something is owed back.
 *
 * `booking_cancellations` is written on every cancellation, but no admin screen
 * reads it yet, so this is the only thing that puts an owed refund or credit in
 * front of staff.
 */
export async function sendCancellationNotification(c: {
  reference: string;
  customerName: string;
  customerEmail: string;
  date: string;
  startTime: string;
  stationLabel: string;
  creditHoursOwed: number;
  refundRequested: boolean;
  refundAmount: number;
}): Promise<void> {
  const transport = getTransport();
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!transport || !to) return;

  const action = c.refundRequested
    ? `VRÁTIT ${c.refundAmount} Kč na platební kartu (Stripe dashboard)`
    : c.creditHoursOwed > 0
      ? `PŘIPSAT ${c.creditHoursOwed} h na Clutchzone account`
      : // Paid, cancelled in time, yet nothing was computed to return — the
        // customer was told they get their money back, so this needs a human.
        'ZKONTROLOVAT RUČNĚ — zaplaceno a zrušeno včas, ale systém nespočítal, co vrátit';

  const rows: [string, string][] = [
    ['Akce', action],
    ['Reference', c.reference],
    ['Stanice', c.stationLabel],
    ['Termín', `${c.date} ${c.startTime}`],
    ['Jméno', c.customerName],
    ['E-mail', c.customerEmail],
  ];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Zrušená rezervace</h2>
      <p style="margin:0 0 20px;color:#888;font-size:13px">Zákazník zrušil rezervaci včas — něco se mu vrací.</p>
      <p style="margin:0 0 20px;padding:10px 14px;background:rgba(232,74,26,0.1);border:1px solid rgba(232,74,26,0.3);color:#ff8a5c;font-size:13px">${escapeHtml(action)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;width:110px">${k}</td>
            <td style="padding:8px 0;color:#fff;border-bottom:1px solid #2a2a2a"><strong>${escapeHtml(v)}</strong></td>
          </tr>`).join('')}
      </table>
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: `Zrušená rezervace ${c.reference} — ${c.refundRequested ? `vrátit ${c.refundAmount} Kč` : c.creditHoursOwed > 0 ? `připsat ${c.creditHoursOwed} h` : 'zkontrolovat ručně'}`,
      html,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    });
  } catch (err) {
    console.error('Cancellation notification email failed:', err);
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
  locale?: string;
}

function formatCzechDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${Number(d)}. ${Number(m)}. ${y}`;
}

// Customer mail is dated in the reader's own convention; staff mail keeps the
// Czech one above, since the club reads it.
// `ua` is our routing segment; the BCP 47 tag for Ukrainian is `uk`.
const INTL_TAG: Record<string, string> = { cs: 'cs-CZ', en: 'en-GB', de: 'de-DE', ua: 'uk-UA' };

function formatDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(INTL_TAG[locale] ?? INTL_TAG.cs, {
    day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Europe/Prague',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
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

  const locale = resolveLocale(o.locale);
  const t = await getServerTranslator(locale, 'email');

  const itemsRows: [string, string][] = o.items.map((i) => [
    t('credit.hoursRow', { station: i.stationType.toUpperCase() }),
    `${i.quantity}× ${i.hours}H`,
  ]);
  const rows: [string, string][] = [
    ...itemsRows,
    [t('labels.total'), t('booking.amountPlain', { amount: o.totalAmount })],
    [t('labels.validUntil'), formatDate(o.expiresAt, locale)],
  ];

  // § 1829 obč. zák. requires an easily accessible way to withdraw within 14
  // days for undated purchases like these — hence a button in the email, not
  // just a form to print out.
  const withdrawNote = o.withdrawUrl
    ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #2a2a2a;color:#888;font-size:13px;line-height:1.6">
        ${escapeHtml(t('credit.withdrawNote'))}<br>
        <a href="${escapeHtml(o.withdrawUrl)}" style="color:#E84A1A">${escapeHtml(t('credit.withdrawLink'))}</a>
      </p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">${escapeHtml(t('credit.heading'))}</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">${escapeHtml(t('credit.intro', { name: o.customerName }))}</p>
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
        ${escapeHtml(t('credit.creditNote', { date: formatDate(o.expiresAt, locale) }))}
      </p>
      ${withdrawNote}
      ${legalFooter()}
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: o.customerEmail,
      subject: t('credit.subject', { reference: o.reference }),
      html,
      text: `${t('credit.heading')}: ${o.reference}\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n${t('credit.creditNoteText')}${o.withdrawUrl ? `\n${t('credit.withdrawLinkText')}: ${o.withdrawUrl}` : ''}${legalFooterText()}`,
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
  locale?: string;
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

  const locale = resolveLocale(t.locale);
  const m = await getServerTranslator(locale, 'email');

  // Values are escaped before interpolation, so the bold markup around the team
  // and tournament survives ICU substitution without opening an injection hole.
  const intro = m('tournamentReceived.intro', {
    captain: escapeHtml(t.captainName),
    team: `<strong style="color:#fff">${escapeHtml(t.teamName)}</strong>`,
    tournament: `<strong style="color:#fff">${escapeHtml(t.tournamentTitle)}</strong>`,
    date: escapeHtml(t.tournamentDate),
  });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">${escapeHtml(m('tournamentReceived.heading'))}</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">${intro}</p>
      <p style="margin:0;color:#888;font-size:13px;line-height:1.6">
        ${escapeHtml(m('tournamentReceived.body'))}
      </p>
      ${legalFooter()}
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: t.captainEmail,
      subject: m('tournamentReceived.subject', { tournament: t.tournamentTitle }),
      html,
      text: `${m('tournamentReceived.text', { team: t.teamName, tournament: t.tournamentTitle, date: t.tournamentDate })}${legalFooterText()}`,
    });
  } catch (err) {
    console.error('Tournament registration received email failed:', err);
  }
}

// Confirmation to the captain — an admin confirmed their participation.
export async function sendTournamentParticipationConfirmed(t: TournamentEmailData): Promise<void> {
  const transport = getTransport();
  if (!transport) return;

  const locale = resolveLocale(t.locale);
  const m = await getServerTranslator(locale, 'email');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">${escapeHtml(m('tournamentConfirmed.heading'))}</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">${escapeHtml(m('tournamentConfirmed.intro', { captain: t.captainName }))}</p>
      <div style="text-align:center;margin:0 0 24px">
        <span style="display:inline-block;font-size:20px;letter-spacing:1px;color:#fff;border:1px solid #E84A1A;padding:14px 28px;background:rgba(232,74,26,0.08);text-transform:uppercase">${escapeHtml(t.teamName)}</span>
      </div>
      <p style="margin:0 0 16px;color:#e8e8e8;font-size:14px;line-height:1.6">
        ${m('tournamentConfirmed.body', {
          tournament: `<strong>${escapeHtml(t.tournamentTitle)}</strong>`,
          date: escapeHtml(t.tournamentDate),
        })}
      </p>
      ${legalFooter()}
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: t.captainEmail,
      subject: m('tournamentConfirmed.subject', { tournament: t.tournamentTitle }),
      html,
      text: `${m('tournamentConfirmed.text', { team: t.teamName, tournament: t.tournamentTitle, date: t.tournamentDate })}${legalFooterText()}`,
    });
  } catch (err) {
    console.error('Tournament participation confirmed email failed:', err);
  }
}
