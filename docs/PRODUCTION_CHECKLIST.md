# MeStory — Production Readiness Checklist

> **מטרה:** לסגור את כל הפערים כדי שמשתמש אמיתי יוכל להיכנס, ליצור ספר, ולצאת מרוצה — בלי שום רגע של "זה לא עובד" או "מה זה אומר?".

---

## 🔴 קריטי — חייב לפני השקה

### 1. תיקון באגים ידועים
- [ ] **עריכה ב-flipbook** — לוודא שהסמן ממוקם בלחיצה, טקסט נכתב, Save עובד
- [ ] **Vercel client deploy** — לוודא שה-build עובר בכל push (היו בעיות עם קבצים חסרים)
- [ ] **WebSocket errors** — להשתיק את שגיאות ה-WebSocket ב-production (Vercel לא תומך) כדי שהקונסול נקי
- [ ] **Cookie warnings** — GA4 cookies domain mismatch — לתקן או להסיר GA4 עד שיש domain נכון
- [ ] **RTL Debug logs** — להסיר את `console.log('RTL Debug:')` שנשאר ב-BookLayoutPage

### 2. Hebrew completeness
- [ ] **סריקה מלאה** — לעבור על כל מסך בעברית ולוודא שאין אנגלית שלא אמורה להיות
- [ ] **Toast messages** — כל ההודעות success/error בעברית
- [ ] **Error messages מהשרת** — לתרגם שגיאות API לעברית ידידותית
- [ ] **Placeholder texts** — "Start writing...", "Search..." → עברית
- [ ] **Email templates** — אם יש, לתרגם

### 3. Empty states חסרים
- [ ] **Marketplace ריק** — מה רואים כשאין ספרים בחנות?
- [ ] **חיפוש ללא תוצאות** — הודעה חמה, לא "No results"
- [ ] **אין חיבור לאינטרנט** — הודעת offline ידידותית
- [ ] **שגיאת שרת 500** — עמוד שגיאה ידידותי (לא מסך לבן)

### 4. ביצועים
- [ ] **תמונות** — לדחוס את כל התמונות ב-`/img/new/` (34 תמונות × ~3MB = ~100MB! צריך להוריד ל-<500KB כל אחת)
- [ ] **Lazy loading** — תמונות שמתחת ל-fold נטענות רק כשגוללים אליהן
- [ ] **Bundle size** — BookLayoutPage הוא 261KB! לבדוק אם אפשר code splitting
- [ ] **Font loading** — 3 קריאות Google Fonts — לצמצם רק לפונטים שבשימוש

---

## 🟡 חשוב — צריך לפני שמשתמשים אמיתיים נכנסים

### 5. חוויית משתמש חדש (First-Time UX)
- [ ] **Onboarding** — כשמשתמש נרשם בפעם הראשונה, מה הוא רואה? (צריך הנחיה ברורה)
- [ ] **ספר דוגמה** — ספר מוכן שמשתמש חדש יכול לדפדף בו ולראות מה אפשר
- [ ] **הסבר קצר** — tooltip או modal שמסביר "ככה יוצרים ספר" (3 צעדים)

### 6. שמירה ואמינות
- [ ] **Auto-save indicator** — האם המשתמש יודע שהעבודה שלו נשמרה?
- [ ] **Unsaved changes warning** — אם עוזבים דף בלי לשמור, להציג אזהרה
- [ ] **Conflict handling** — מה קורה אם שני אנשים עורכים בו-זמנית?
- [ ] **Backup/Recovery** — האם יש גרסאות קודמות?

### 7. ייצוא PDF
- [ ] **לבדוק שה-PDF יוצא נכון** — RTL, פונטים עבריים, תמונות
- [ ] **כריכה קדמית + אחורית** נכללות ב-PDF
- [ ] **מספרי עמודים** תואמים בין תצוגה ל-PDF
- [ ] **חיתוך תמונות** — תמונות לא נחתכות ב-PDF

### 8. מובייל
- [ ] **בדיקה על iPhone** — כל המסכים עובדים
- [ ] **בדיקה על Android** — כל המסכים עובדים
- [ ] **כפתורים** — כל כפתור >= 44px (נגיש למגע)
- [ ] **Flipbook במובייל** — האם אפשר לדפדף ולערוך?
- [ ] **הקלטה קולית במובייל** — האם המיקרופון עובד?

### 9. נגישות (Accessibility)
- [ ] **ניגודיות צבעים** — טקסט על רקע כהה קריא (WCAG AA)
- [ ] **Alt text לתמונות** — כל תמונה עם alt text
- [ ] **Focus states** — כל כפתור נראה מסומן ב-Tab
- [ ] **Screen reader** — headings hierarchy (h1→h2→h3)

### 10. אבטחה
- [ ] **GSC verification code** — להחליף את `YOUR_GSC_VERIFICATION_CODE` בקוד אמיתי (או להסיר)
- [ ] **Bing verification** — להחליף `YOUR_BING_VERIFICATION_CODE` או להסיר
- [ ] **Rate limiting** — לוודא שכל endpoint מוגן
- [ ] **XSS** — `dangerouslySetInnerHTML` בכמה מקומות — לוודא שהתוכן sanitized
- [ ] **File upload validation** — לוודא שמעלים רק תמונות, לא סקריפטים

---

## 🟢 נחמד — עושה רושם טוב

### 11. פוליש ויזואלי
- [ ] **Loading states** — להחליף את כל ה-spinners העגולים ב-`spinner-book` (CSS כבר קיים)
- [ ] **Skeleton loading** — להחליף "Loading..." ב-`skeleton-handwriting` (CSS כבר קיים)
- [ ] **Page transitions** — מעבר חלק בין דפים (`warm-enter` class)
- [ ] **Success celebrations** — confetti כשמסיימים ספר / מפרסמים (חלקית קיים)

### 12. SEO & Marketing
- [ ] **Meta descriptions** — כל עמוד עם description ייחודי
- [ ] **Sitemap** — לוודא שה-sitemap.xml מעודכן עם כל הנתיבים
- [ ] **Robots.txt** — לוודא שנתיבים פרטיים (dashboard, editor) חסומים
- [ ] **Social sharing preview** — לבדוק איך נראה כשמשתפים ב-WhatsApp/Facebook
- [ ] **Google Search Console** — לרשום את האתר ולהגיש sitemap

### 13. ניטור ודיווח
- [ ] **Error tracking** — להוסיף Sentry או דומה לתפוס שגיאות בproduction
- [ ] **Analytics events** — לעקוב: הרשמה, יצירת ספר, שמירה, ייצוא, פרסום
- [ ] **Performance monitoring** — Web Vitals ל-GA4 (כבר מוכן, צריך web-vitals package)
- [ ] **Uptime monitoring** — Vercel health check / UptimeRobot

### 14. תוכן ומשפטי
- [ ] **תנאי שימוש** — לעדכן עם התנאים העדכניים
- [ ] **מדיניות פרטיות** — GDPR compliance, מה נשמר, איפה
- [ ] **Cookie banner** — אם משתמשים ב-GA4, צריך הסכמת cookies
- [ ] **About page** — עדכני עם הסיפור של החברה

---

## 📋 סדר ביצוע מומלץ

| עדיפות | משימה | זמן | |
|--------|--------|------|--|
| 🔴 1 | דחיסת תמונות (100MB → <15MB) | 30 דק | **חייב** — Vercel limit |
| 🔴 2 | הסרת debug logs + console.log | 20 דק | נקיון |
| 🔴 3 | השתקת WebSocket errors בproduction | 15 דק | קונסול נקי |
| 🔴 4 | סריקת עברית מלאה | 2-3 שעות | שלמות שפה |
| 🔴 5 | בדיקת PDF export | 1 שעה | פונקציונליות ליבה |
| 🟡 6 | Empty states חסרים | 1-2 שעות | חוויית משתמש |
| 🟡 7 | בדיקת מובייל | 2-3 שעות | 50%+ מהמשתמשים |
| 🟡 8 | First-time UX (onboarding) | 2-3 שעות | הכרחי להמרה |
| 🟡 9 | הסרת placeholder verification codes | 10 דק | אבטחה |
| 🟡 10 | Unsaved changes warning | 30 דק | אמינות |
| 🟢 11 | Loading skeleton + book spinner | 1 שעה | premium feel |
| 🟢 12 | Error tracking (Sentry) | 1 שעה | ניטור |
| 🟢 13 | Social sharing preview test | 30 דק | marketing |
| 🟢 14 | Cookie consent banner | 1 שעה | compliance |

---

## ✅ כבר בוצע (מהסשנים הקודמים)

- [x] SEO/GEO/AEO optimization
- [x] GA4 tracking
- [x] Structured data (JSON-LD)
- [x] Professional book typography
- [x] 15 audience-focused templates
- [x] Warm Hebrew UX copy
- [x] 12 micro-animations CSS
- [x] 34 AI-generated images integrated
- [x] New brand logos everywhere
- [x] Simplified wizard (1 step)
- [x] Simplified dashboard
- [x] Simplified navigation
- [x] Simplified settings
- [x] Simplified editor panel
- [x] Flipbook editor with react-pageflip
- [x] Collaboration/sharing feature
- [x] Server defensive error handling (no more FUNCTION_INVOCATION_FAILED)

---

*Production Readiness Checklist — MeStory — 17 באפריל 2026*
