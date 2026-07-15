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
    ['Datum', b.date],
    ['Čas', `${b.startTime} – ${endMin}`],
    ['Cena', `${b.totalPrice} Kč`],
    ['Jméno', b.customerName],
    ['E-mail', b.customerEmail],
    ['Telefon', b.customerPhone],
  ];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Nová rezervace</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Clutch Zone — právě přišla nová rezervace.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;width:110px">${k}</td>
            <td style="padding:8px 0;color:#fff;border-bottom:1px solid #2a2a2a"><strong>${v}</strong></td>
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
    ['Datum', b.date],
    ['Čas', `${b.startTime} – ${endMin}`],
    ['Cena', `${b.totalPrice} Kč`],
  ];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#111;color:#e8e8e8;padding:32px;border-top:3px solid #E84A1A">
      <h2 style="margin:0 0 4px;color:#fff;text-transform:uppercase;letter-spacing:2px">Rezervace potvrzena</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px">Díky za rezervaci v Clutch Zone, ${b.customerName}!</p>
      <div style="text-align:center;margin:0 0 24px">
        <span style="display:inline-block;font-size:32px;letter-spacing:4px;color:#fff;border:1px solid #E84A1A;padding:12px 32px;background:rgba(232,74,26,0.08)">${b.reference}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;width:110px">${k}</td>
            <td style="padding:8px 0;color:#fff;border-bottom:1px solid #2a2a2a"><strong>${v}</strong></td>
          </tr>`).join('')}
      </table>
      <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.6">
        Přijďte 10 minut před začátkem a ukažte referenční kód na recepci.
        Uvedená cena je orientační — platba probíhá na místě.
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: b.customerEmail,
      subject: `Rezervace potvrzena ${b.reference} · Clutch Zone · ${b.date} ${b.startTime}`,
      html,
      text: `Rezervace potvrzena: ${b.reference}\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\nPřijďte 10 minut před začátkem a ukažte referenční kód na recepci.`,
    });
  } catch (err) {
    console.error('Booking confirmation email failed:', err);
  }
}
