# MeStory — מפת דרכים לאיחוד וסידור (Simplification Plan)

> נוצר 2026-06-23. המטרה: שהמערכת תרגיש *גמורה, קלילה ומאורגנת*, ושמשתמש חדש יוכל
> לכתוב ולהפיק ספר במסלול אחד ברור — בלי ריבוי פיצ'רים מתחרים.

## ממצא מפתח: המסלול הנכון כבר קיים

`client/src/components/common/BookProgressStepper.tsx` כבר מגדיר את השדרה הנכונה:

```
כתיבה (/editor)  →  עיצוב (/design)  →  פריסה (/layout)  →  פרסום (/publish)
BookWritingPage     DesignStudioPage    BookLayoutPage      publish flow
```

הבעיה אינה שחסר מסלול — אלא שצומחים ממנו עמודים ומסלולים "יתומים" שלא שייכים לשרשרת,
ושמתחת לפני השטח יש כפילויות והבטחות-שווא.

---

## A. מסכים — מה באמת מתחרה ומה לא

| נתיב | קומפוננטה | סטטוס | החלטה מומלצת |
|------|-----------|-------|--------------|
| `/editor/:id` | BookWritingPage | בשרשרת ✓ | להשאיר — שלב 1 |
| `/design/:id` | DesignStudioPage | בשרשרת ✓ | להשאיר — שלב 2 (העיצוב הרשמי) |
| `/layout/:id` | BookLayoutPage | בשרשרת ✓ | להשאיר — שלב 3 (מרכז הפריסה + ייצוא) |
| `/book-design/:id` | BookDesignPage | **יתום** — אין שום קישור נכנס | **למחוק / למזג** לתוך DesignStudio |
| `/auto-design` | AutoDesignLandingPage | דף שיווק ציבורי | להשאיר (זה landing, לא עורך) |
| `/print/:id` | PrintBookPage | משטח רינדור פנימי (browser→PDF) | להשאיר — לא UI למשתמש |
| `/print/:id/designed` | PrintDesignedBookPage | משטח רינדור פנימי (Puppeteer→PDF) | להשאיר — לא UI למשתמש |

**המסקנה:** אין 5 עורכים מתחרים. יש **2 עורכים בשרשרת** (DesignStudio + BookLayout)
שאולי חופפים חלקית, **1 עמוד יתום** (BookDesignPage) למחיקה, ושני משטחי רינדור פנימיים
שהם השורש לשתי צינורות הייצוא.

---

## B. שורשי תחושת "לא גמור" (לפי עדיפות)

### 1. ייצוא: 5 renderers בלי סדר עדיפויות → אזהרת "fallback renderer"
`server/src/controllers/bookController.ts` מנסה React→Puppeteer→PDFKit בשרשרת nested.
שני צינורות: manual (`/print/:id`) ו-designed (`/print/:id/designed`).
**יעד:** צינור אחד אמין. מה שנבנה === מה שיוצא. בלי אזהרות fallback.

### 2. כשלים שקטים — `catch { console.error }` בלי הודעה למשתמש
דוגמאות: `BookProgressStepper.tsx:66-74` (catch ריק לגמרי),
`ConversationsList.tsx:55/70`, `ChatModal.tsx:104/126`, `SettingsPage.tsx:74` (DEV-only).
**יעד:** כל catch מציג toast. כל empty-state מציג כרטיס עם פעולה, לא `return null`.

### 3. הבטחות-שווא ב-UI (פיצ'רים שמוצגים אך לא ממומשים)
- מיילים / push notifications — מסומנים קיימים, לא נשלחים.
- חידוש מנוי אוטומטי — תמיד נכשל (`subscriptionRenewalService.ts:409`).
- הזמנת הדפסה — נכתבת ל-log, לא נשלחת לספק POD.
- "API access (coming soon)" בתוכנית Premium.
- 10 design systems מתוכננים, רק `memoir-warm` ממומש.
**יעד:** או להסתיר/לסמן בבירור "בקרוב", או לממש. לא להציג כפעיל מה שלא עובד.

### 4. כפילויות קוד שמייצרות התנהגות לא צפויה
- 2× `TemplateGallery.tsx` (`components/design/` ו-`components/templates/`).
- 2× wrappers ל-Puppeteer (`puppeteerExportService.ts` + `pdfService.ts`).
- 3× מבני נתונים לספר (`PageLayoutSettings`, `DesignPlan`, `BookTemplate`) בלי שכבת תרגום.
- ערכי cover style משוכפלים בין client ל-`pdfService.ts` ("keep in sync" בהערה).
- שירותים מתים: `aiBookDesignService.ts`, `premiumDesignService.ts` (לא נקראים מאף controller).
**יעד:** מקור-אמת אחד לכל דבר; מחיקת קוד מת.

### 5. עקביות ויזואלית
225 inline styles, צבעי accent כפולים (`#8b6914`/`#8b6950`/`#DAA520`/`#c9a227`),
`index.css` מונוליטי (~1955 שורות), 11 מודלים בלי wrapper משותף.
**יעד:** design tokens מרכזיים + Modal wrapper אחד.

---

## C. תוכנית עבודה מדורגת (סדר ביצוע)

- [ ] **שלב 0 — סידור ניווט (מהיר, סיכון נמוך):** למחוק/למזג את BookDesignPage היתום;
      לוודא שכל מעבר בין שלבים עובר דרך ה-Stepper בלבד.
- [ ] **שלב 1 — כשלים שקטים:** toast לכל catch, empty-states אמיתיים. שיפור מיידי לתחושת "קליל".
- [ ] **שלב 2 — הבטחות-שווא:** להסתיר/לסמן "בקרוב" כל פיצ'ר לא-ממומש.
- [ ] **שלב 3 — ייצוא:** לבחור renderer ראשי אחד, להסיר fallbacks, WYSIWYG.
- [ ] **שלב 4 — כפילויות:** למחד TemplateGallery, Puppeteer wrappers, cover styles; למחוק קוד מת.
- [ ] **שלב 5 — עקביות ויזואלית:** design tokens + Modal משותף.

---

## D. עקרון מנחה אחד

> כל פיצ'ר חדש שלא משרת את המסלול `כתיבה → עיצוב → תצוגה → ייצוא` — נדחה.
> מוטב מערכת אחת שעושה דבר אחד מצוין, מאשר חמש דרכים לעשות אותו דבר.
