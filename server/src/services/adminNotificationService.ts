/**
 * Admin Notification Service
 * --------------------------
 * Sends the platform owner an email whenever something noteworthy happens:
 * a new signup, a book getting published, a purchase, or a David-agent run.
 *
 * Design rules:
 *  - NEVER throws. Every send is fire-and-forget and self-contained in try/catch,
 *    so a mail failure can never break the user-facing request that triggered it.
 *  - Honors a kill switch: set ADMIN_NOTIFICATIONS_ENABLED=false to silence.
 *  - Destination comes from ADMIN_EMAIL (falls back to the owner's address).
 */

import { sendEmail } from './emailService';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'maorargaman22@gmail.com';
const ENABLED = process.env.ADMIN_NOTIFICATIONS_ENABLED !== 'false';
const APP_NAME = 'MeStory';

/** Build a simple, consistent RTL HTML body from a title + list of label/value rows. */
function buildHtml(title: string, rows: Array<{ label: string; value: string }>, footer?: string): string {
  const rowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 12px;color:#6b7280;white-space:nowrap;vertical-align:top">${r.label}</td>
        <td style="padding:6px 12px;color:#111827;font-weight:600">${r.value}</td>
      </tr>`
    )
    .join('');

  return `
  <div dir="rtl" style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#f9fafb;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#8b6914;color:#fff;padding:16px 20px;font-size:16px;font-weight:700">
        🔔 ${APP_NAME} · התראת מנהל
      </div>
      <div style="padding:20px">
        <h2 style="margin:0 0 12px;font-size:18px;color:#111827">${title}</h2>
        <table style="border-collapse:collapse;width:100%;font-size:14px">${rowsHtml}</table>
        ${footer ? `<p style="margin:16px 0 0;color:#6b7280;font-size:13px">${footer}</p>` : ''}
      </div>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">
      הודעה אוטומטית מ-${APP_NAME}. לכיבוי: הגדר ADMIN_NOTIFICATIONS_ENABLED=false.
    </p>
  </div>`;
}

/** Core send. Fire-and-forget, never throws. */
export function notifyAdmin(subject: string, title: string, rows: Array<{ label: string; value: string }>, footer?: string): void {
  if (!ENABLED) return;
  void sendEmail({ to: ADMIN_EMAIL, subject: `[${APP_NAME}] ${subject}`, html: buildHtml(title, rows, footer) }).catch(
    (err) => console.error('[adminNotify] send failed:', err?.message || err)
  );
}

function nowStr(): string {
  return new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
}

// ==================== EVENT HELPERS ====================

export function notifyAdminNewUser(user: { name?: string; email?: string; role?: string }): void {
  notifyAdmin(
    '🎉 הרשמה חדשה',
    'משתמש חדש נרשם למערכת',
    [
      { label: 'שם', value: user.name || '—' },
      { label: 'אימייל', value: user.email || '—' },
      { label: 'תוכנית', value: user.role || 'FREE' },
      { label: 'מתי', value: nowStr() },
    ]
  );
}

export function notifyAdminBookPublished(params: {
  authorName?: string;
  authorEmail?: string;
  bookTitle?: string;
  bookId?: string;
}): void {
  notifyAdmin(
    '📖 ספר חדש פורסם',
    'ספר חדש פורסם בחנות',
    [
      { label: 'כותרת', value: params.bookTitle || '—' },
      { label: 'מחבר', value: params.authorName || '—' },
      { label: 'אימייל מחבר', value: params.authorEmail || '—' },
      { label: 'מזהה ספר', value: params.bookId || '—' },
      { label: 'מתי', value: nowStr() },
    ]
  );
}

export function notifyAdminPurchase(params: {
  buyerEmail?: string;
  amount?: number;
  currency?: string;
  description?: string;
  orderId?: string;
}): void {
  notifyAdmin(
    '💰 רכישה חדשה',
    'בוצעה רכישה במערכת',
    [
      { label: 'תיאור', value: params.description || '—' },
      { label: 'סכום', value: params.amount != null ? `${params.amount} ${params.currency || 'USD'}` : '—' },
      { label: 'קונה', value: params.buyerEmail || '—' },
      { label: 'מזהה הזמנה', value: params.orderId || '—' },
      { label: 'מתי', value: nowStr() },
    ]
  );
}

export function notifyAdminDavidRun(params: {
  status?: string;
  summary?: string;
  actionsCount?: number;
  trigger?: string;
}): void {
  notifyAdmin(
    `🤖 הסוכן דוד · ${params.status || 'הרצה הושלמה'}`,
    'הסוכן דוד סיים הרצה',
    [
      { label: 'סטטוס', value: params.status || '—' },
      { label: 'הפעלה', value: params.trigger || '—' },
      { label: 'פעולות', value: params.actionsCount != null ? String(params.actionsCount) : '—' },
      { label: 'מתי', value: nowStr() },
    ],
    params.summary || undefined
  );
}
