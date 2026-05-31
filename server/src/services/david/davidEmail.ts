/**
 * Builds and sends David's daily report email to the admin. Strictly
 * factual: only what David actually did and observed — no invented metrics.
 */

import { sendEmail } from '../emailService';
import { RankResult } from './types';

const SITE = process.env.CLIENT_URL || 'https://mestory-ai.com';

export interface DailyReport {
  date: string;
  trigger: 'cron' | 'manual';
  ranks: RankResult[];
  publishedArticle?: { title: string; slug: string; targetQuery: string | null };
  draftedArticle?: { title: string; reason: string };
  addedQueries: number;
  discoveredCompetitors: string[];
  mediaNotes: string[];
  metrics: { trackedQueries: number; coveredQueries: number; presenceRate: number };
  nextFocus: string[];
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 12px;color:#a0a0a0;">${label}</td><td style="padding:6px 12px;color:#fff;font-weight:600;">${value}</td></tr>`;
}

export function buildReportHtml(r: DailyReport): string {
  const presentList = r.ranks
    .map((rk) => {
      const ai = rk.aiPresent ? '✅' : '❌';
      const g = rk.googlePresent === null ? '—' : rk.googlePresent ? '✅' : '❌';
      const comp = rk.competitorsSeen.length ? ` · מתחרים: ${rk.competitorsSeen.join(', ')}` : '';
      return `<li style="margin:6px 0;color:#ddd;"><span style="color:#fff;">${escapeHtml(rk.query)}</span><br/><small style="color:#999;">AI ${ai} · Google ${g}${escapeHtml(comp)}</small></li>`;
    })
    .join('');

  const article = r.publishedArticle
    ? `<p style="color:#7CFC9B;">📝 פורסם מאמר חדש: <a style="color:#FFD700;" href="${SITE}/guides/${r.publishedArticle.slug}">${escapeHtml(r.publishedArticle.title)}</a></p>`
    : r.draftedArticle
      ? `<p style="color:#FFC107;">📝 נכתב מאמר אך נשמר כטיוטה (לא פורסם): "${escapeHtml(r.draftedArticle.title)}" — סיבה: ${escapeHtml(r.draftedArticle.reason)}</p>`
      : `<p style="color:#999;">לא פורסם מאמר היום.</p>`;

  const media = r.mediaNotes.length
    ? `<ul>${r.mediaNotes.map((m) => `<li style="color:#ddd;margin:4px 0;">${escapeHtml(m)}</li>`).join('')}</ul>`
    : '<p style="color:#999;">אין תובנות מדיה חדשות.</p>';

  const next = r.nextFocus.length
    ? `<ul>${r.nextFocus.map((m) => `<li style="color:#ddd;margin:4px 0;">${escapeHtml(m)}</li>`).join('')}</ul>`
    : '';

  const disc = r.discoveredCompetitors.length
    ? `<p style="color:#ddd;">🔎 מתחרים שזוהו: ${r.discoveredCompetitors.map(escapeHtml).join(', ')}</p>`
    : '';

  return `
<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif;background:#0f0c29;margin:0;padding:24px;">
  <div style="max-width:620px;margin:0 auto;background:linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03));border:1px solid rgba(255,215,0,0.2);border-radius:18px;padding:28px;">
    <h1 style="color:#FFD700;font-size:24px;margin:0 0 4px;">דוד — דוח SEO/GEO/AEO יומי</h1>
    <p style="color:#a0a0a0;margin:0 0 20px;">${escapeHtml(r.date)} · הופעל ${r.trigger === 'cron' ? 'אוטומטית' : 'ידנית'}</p>

    <table style="width:100%;border-collapse:collapse;background:rgba(0,0,0,0.2);border-radius:10px;margin-bottom:18px;">
      ${row('שאלות שנבדקו היום', String(r.ranks.length))}
      ${row('נוכחות ב‑AI', String(r.ranks.filter((x) => x.aiPresent).length) + ' מתוך ' + r.ranks.length)}
      ${row('סה״כ שאלות במעקב', String(r.metrics.trackedQueries))}
      ${row('שאלות שכוסו במאמר', String(r.metrics.coveredQueries))}
      ${row('שיעור נוכחות מצטבר', Math.round(r.metrics.presenceRate * 100) + '%')}
      ${r.addedQueries ? row('שאלות חדשות שנוספו למעקב', String(r.addedQueries)) : ''}
    </table>

    ${article}
    ${disc}

    <h2 style="color:#FFD700;font-size:18px;margin:22px 0 8px;">בדיקת דירוג היום</h2>
    <ul style="padding-inline-start:18px;margin:0;">${presentList}</ul>

    <h2 style="color:#FFD700;font-size:18px;margin:22px 0 8px;">תובנות מדיה וקידום</h2>
    ${media}

    ${next ? `<h2 style="color:#FFD700;font-size:18px;margin:22px 0 8px;">מוקד למחר</h2>${next}` : ''}

    <p style="color:#666;font-size:12px;margin-top:24px;border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;">
      דוד פועל אוטונומית כל בוקר. אפשר לראות את כל הפעילות ולשנות הגדרות בלוח הניהול ← טאב "דוד".
    </p>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

export async function sendDailyReport(to: string, report: DailyReport): Promise<boolean> {
  const subject = `דוד · דוח יומי ${report.date}${report.publishedArticle ? ' · מאמר חדש פורסם' : ''}`;
  return sendEmail({ to, subject, html: buildReportHtml(report) });
}
