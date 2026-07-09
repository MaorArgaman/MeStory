# תוכנית מימוש מלאה — מערכת העיצוב האוטומטי מקצה לקצה

> נוצר 2026-07-09. זו רמת הביצוע של `docs/AUTO_DESIGN_PRO_PLAN.md` (האסטרטגיה
> הטכנית) ו-`docs/BUSINESS_STRATEGY.md` (העסקית): כל שלב פתוח עד קבצים, ראוטים,
> מיגרציות, מסכים וקריטריוני סיום. מבוסס על סריקת קוד מלאה מ-2026-07-09.
>
> **סטטוס:** האתר בהשבתת חירום. הכול ניתן לפיתוח ולבדיקה; השקה ציבורית מחייבת
> אישור בעלים להסרת ההשבתה.

---

## תגלית מרכזית מסריקת הקוד: יש יותר ממה שחשבנו

| מה שתוכנן כ"לבנות" | מה שכבר קיים |
|--------------------|--------------|
| ראוט העלאת קובץ | ✅ `POST /api/books/upload` (bookRoutes.ts:96) — multer, DOCX/TXT |
| פענוח DOCX | ✅ mammoth ב-`uploadManuscript` (bookController.ts:2426-2650) |
| פיצול לפרקים | ✅ `splitTextIntoChapters()` — מזהה "פרק N" / "Chapter N" / כותרות ממוספרות, עברית ואנגלית |
| יצירת ספר מהקובץ | ✅ כולל זיהוי שפה, ספירת מילים, סטטיסטיקות |
| כפתור העלאה ב-UI | ✅ DashboardPage — "העלה קובץ" קיים |
| מודל עיצוב + ייצוא | ✅ AutoDesignModal מלא: סטטוס, הפקה, וריאציות חינם, PDF/DOCX |

**הפערים האמיתיים של שלב א':** (1) אין רצף — ההעלאה מסתיימת בדשבורד ולא ממשיכה
לעיצוב; (2) אין מסך אימות מבנה; (3) הפיצול הוא regex בלבד — נכשל על קבצים בלי
"פרק N" מפורש; (4) PDF מנוטרל; (5) אין מונה 2-חינם ברמת חשבון.

---

# שלב א' — הצינור המלא: קובץ נכנס, ספר מעוצב יוצא

**מטרה:** משתמש גורר DOCX ותוך דקות מדפדף בספר מעוצב. זמן משוער: 2-3 שבועות.

## א.1 — רצף העלאה→עיצוב (הפער הקריטי, יומיים)

**שרת:** אין שינוי — `uploadManuscript` כבר מחזיר `bookId` + פרקים.

**לקוח:**
- קומפוננטה חדשה `client/src/pages/ImportFlowPage.tsx`, ראוט `/import` (מוגן auth):
  - שלב 1: dropzone (קובץ או הדבקת טקסט; הדבקה → `POST /api/books` עם פרק יחיד).
  - שלב 2: מסך אימות מבנה (א.2).
  - שלב 3: הפקת עיצוב (משתמש ב-AutoDesignModal הקיים או בגרסת עמוד שלו).
- הכפתור "העלה קובץ" בדשבורד מפנה ל-`/import` במקום להסתיים ביצירת ספר.
- בזמן פענוח: מסך "קורא את היצירה שלך…" עם שלבים (יש socket.io; polling מספיק ל-MVP).

**קריטריון סיום:** מהעלאת DOCX ועד תצוגת ספר מעוצב בלי לגעת בדשבורד.

## א.2 — מסך אימות מבנה (3-4 ימים)

**שרת:**
- `uploadManuscript` מחזיר כבר היום את הפרקים בתשובה — להוסיף לתשובה
  `detection: { method: 'headings'|'regex'|'single', confidence: 'high'|'low' }`.
- ראוט חדש `PUT /api/books/:id/structure` — מקבל מערך פרקים ערוך
  (מיזוג/פיצול/שינוי כותרת/מחיקה) ומחליף את `book.chapters`. ולידציה: לא ריק,
  סך התוכן זהה (אסור לאבד טקסט בשוגג — השוואת אורך כולל עם סובלנות רווחים).

**לקוח:**
- `client/src/components/import/StructureReview.tsx`:
  - רשימת פרקים: כותרת (ניתנת לעריכה), ספירת מילים, 2 שורות preview.
  - פעולות: מיזוג עם הבא, פיצול (בחירת נקודה בטקסט), שינוי סדר (גרירה), סימון
    כ"הקדשה"/"פתח דבר"/"אפילוג" (נשמר כ-metadata לפרק — ה-planner ישתמש בהמשך).
  - כותרת המסך: "זיהינו X פרקים, Y מילים" + כפתור "נראה טוב, עצבו לי".

**קריטריון סיום:** קובץ בלי כותרות פרקים בכלל עדיין עובר את המסך בצורה סבירה
(פרק יחיד + הצעת פיצול), והמשתמש תמיד רואה מה זוהה לפני שהוא שורף הפקה.

## א.3 — פיצול חכם היברידי (3 ימים)

הבעיה: `splitTextIntoChapters` הוא regex. קבצים אמיתיים מגיעים עם כותרות בלי
"פרק", שורות ריקות, כותרות מעוצבות ב-Word.

- **רובד 1 (חינם, דטרמיניסטי):** לשדרג את הפענוח מ-`extractRawText` ל-
  `mammoth.convertToHtml` ולמפות סגנונות Word: Heading 1/2 → כותרות פרקים,
  Quote → ציטוט. זה לבדו פותר את רוב קבצי ה-DOCX המסודרים.
- **רובד 2 (Haiku, רק בספק):** אם אחרי רובד 1 יש פרק יחיד ארוך מ-3,000 מילים
  או פרקים חשודים (כותרת ארוכה מ-15 מילים), קריאה אחת ל-Claude Haiku 4.5:
  קלט = שורות-מועמדות לכותרת + הקשר (לא הטקסט המלא!), פלט = אינדקסים של
  גבולות פרקים. שירות חדש `server/src/services/autoDesign/importService.ts`.
  לרשום ב-`ai_usage_log` (feature: `import_structure`) — עלות ~$0.01-0.05.

**קריטריון סיום:** 8 מתוך 10 קבצי מבחן מגוונים (ראה סעיף בדיקות) מפוצלים נכון
בלי התערבות ידנית.

## א.4 — החזרת ייבוא PDF (יומיים)

הסיבה לנטרול: pdfjs דורש `DOMMatrix` שלא קיים ב-Vercel serverless.
- לנסות `unpdf` (חבילה שנבנתה בדיוק לסביבות serverless) במקום `pdf-parse`;
  חלופה: polyfill ל-DOMMatrix. טקסט בלבד; PDF סרוק → הודעה ברורה "הקובץ סרוק,
  נדרש קובץ טקסט" (OCR מחוץ לתחום).
- להסיר את החסימה ב-`uploadMiddleware.ts:75` ואת ה-400 ב-`bookController.ts:2486`.

## א.5 — מונה 2-חינם ברמת חשבון + סימן מים (3 ימים)

**מיגרציה 014** — בגלל באג ה-JSONB המתועד (User.ts:363-403, עדכוני dot-path
נבלעים בשקט) המונה יושב בעמודה רגילה, לא בתוך profile:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_designs_used INT NOT NULL DEFAULT 0;
```

**שרת:**
- middleware חדש `server/src/middleware/freeDesignAllowance.ts`, נכנס לשרשרת
  של `POST /api/auto-design/:bookId` לפני `requireCredits`:
  - אם `user.free_designs_used < 2` → מסמן `req.freeDesign = true`, מדלג על
    חיוב קרדיטים, ומעלה את המונה (עדכון אופטימי עם guard כמו deductCreditsStrict).
  - אחרת → ממשיך ל-requireCredits (היום) / לרכישת חבילה (מסלול המיצוב).
  - `autoDesignCap` הפר-ספרי (3 לספר) נשאר — שני הגבולות חיים יחד.
- **סימן מים:** `export.pdf` בודק זכאות: אם הספר לא שויך לרכישה (ראה מ.3)
  והמשתמש בחינם — מוסיף `&watermark=1` ל-URL של Puppeteer. ב-
  `PrintDesignedBookPage.tsx`: כשהפרמטר קיים, שורת שוליים עדינה "עוצב ב-MeStory •
  mestory.co.il" בכל עמוד. ההחלטה תמיד בשרת — הלקוח לא קובע.
- תקרת עמודים לחינמי: `uploadManuscript` דוחה מעל ~60,000 מילים (~150 עמ')
  למשתמש חינמי עם הודעה שמסבירה למה.

**סטטוס בלקוח:** `GET /auto-design/:bookId/status` יחזיר גם
`freeDesignsRemaining`; AutoDesignModal יציג "נשארו לך 2 עיצובים חינם" במקום
מונה הקרדיטים כשהרלוונטי.

## בדיקות שלב א'
- סט קבצי מבחן ב-`server/src/scripts/importFixtures/`: רומן עם "פרק N", זיכרונות
  עם כותרות Heading בלי "פרק", TXT גולמי, קובץ בלי שום כותרות, קובץ עם הקדשה
  ואפילוג, PDF טקסטואלי, מסמך אנגלית, עלון קצר.
- הרחבת `e2eFullFlow.ts` הקיים: upload → structure → auto-design → export.pdf.

---

# מסלול מ' — מיצוב המוצר מחדש (במקביל, אחרי א.1)

**מטרה:** האתר אומר "אנחנו מערכת עיצוב ספרים". חוסם השקה, לא חוסם פיתוח.

## מ.1 — דף הבית החדש (3-4 ימים)
- `AutoDesignLandingPage` (קיים ב-`/auto-design`, כבר בנוי נכון: hero, איך זה
  עובד, גלריית 10 מערכות, כרטיסי קהלים, FAQ) הופך לדף הבית `/`:
  - ה-hero מקבל **dropzone חי**: גרירת קובץ מדף הבית → redirect ל-`/import`
    (עם הקובץ ב-state; אם לא מחובר → הרשמה קצרה באמצע, הקובץ נשמר).
  - להחליף את ה-placeholder של before/after בצילומים אמיתיים (מיוצרים מה-fixtures).
  - `LandingPage` הישן עובר ל-`/write` (לא נמחק; יורד מהניווט).
- SEO: לעדכן title/description/OG לכיוון "עיצוב ועימוד ספרים אוטומטי".

## מ.2 — Stepper, דשבורד וניווט (3 ימים)
- `BookProgressStepper.tsx`: השדרה החדשה
  `תוכן (/import או /editor) → עיצוב (/design-studio חדש) → ייצוא/דפוס`.
  "עריכת טקסט" הופכת לפעולה בתוך הפרויקט, לא שלב. ה"Finish button" הקיים
  (שקורא ל-design-complete הישן) מוסר — מסלול legacy.
- `DashboardPage`: כרטיס פרויקט מציג סטטוס עיצוב (הועלה / עוצב ב-X / יוצא),
  thumbnail של העמוד הראשון המעוצב אם קיים. "פרויקט חדש" = `/import`.
  כפתורי הכתיבה (ראיון קולי, ראיון צ'אט) נאספים לתפריט משני "כלי כתיבה".
- ניקוי ניווט ראשי: עיצוב, גלריה, מחירים, מדריכים.

## מ.3 — חבילות ותשלום לפרויקט (שבוע; מאחורי דגל עד הסרת ההשבתה)
- **מיגרציה 015** — טבלת רכישות לפרויקט:
```sql
CREATE TABLE IF NOT EXISTS project_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  book_id UUID NOT NULL,
  package TEXT NOT NULL,            -- 'brochure' | 'book' | 'book_premium' | 'publisher_pack'
  price_agorot INT NOT NULL,
  payment_ref TEXT,                 -- אסמכתת סליקה
  generations_included INT NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'active'
);
```
- שרת: `server/src/config/packages.ts` (מקור אמת למחירים ותכולה — המחירים עדיין
  טיוטה); ראוטים `GET /api/packages`, `POST /api/books/:id/purchase-package`
  (מחובר לתשתית הסליקה הקיימת; **נשאר מאחורי דגל `PACKAGES_ENABLED` עד הסרת
  ההשבתה**).
- לוגיקת זכאות אחת: `resolveDesignEntitlement(user, book)` →
  `{ source: 'free'|'package'|'credits', generationsLeft, watermark }` —
  middleware אחד שמחליף את הטלאים (freeDesignAllowance + requireCredits + חבילה).
- `PricingPage` נבנה מחדש: 4 כרטיסי חבילות + שורת "2 עיצובים ראשונים חינם";
  המנויים הישנים יורדים מהדף (מנויים פעילים ממשיכים לקבל שירות — אין שינוי קוד,
  רק הסרת מסלול הרכישה).
- הסרת שכבת הכסף מהחנות (הוחלט 2026-07-09): שלב המחיר ב-PublishMetadata
  ($1-25 + "תרוויח 50%") יורד, `POST /api/books/:id/purchase` מוסר, `marketplace_publish`
  נמחק מ-creditCosts. הפרסום נשאר עם דרישות האיכות בלבד.

## מ.4 — דוד ומדידה (יומיים)
- כיוון מחדש של הנחיות דוד למילות מפתח של עימוד/עיצוב/הכנה לדפוס.
- אירועי משפך: `funnel_events` פשוט (upload_started, structure_confirmed,
  design_1_done, design_2_done, paywall_shown, package_purchased) — טבלה או
  שימוש ב-UserActivity הקיים; דשבורד אדמין מינימלי: משפך + עלות AI יומית
  (מ-`ai_usage_log` שכבר חי).

---

# שלב ב' — קפיצת האיכות (תוכנית v2, שכבות 1-3; 3-4 שבועות)

**מטרה:** שתי הפקות של אותו ספר נראות כמו שני מעצבים שונים, לא אותה תבנית
בצבע אחר. זה המנוע של ההמרה — עיצוב 1 חייב להרשים.

## ב.1 — טוקנים ופרימיטיבים (שבוע)
- `server/src/services/autoDesign/tokens.ts` (קיים, להרחיב): סולם מודולרי מלא
  (יחסים 1.2/1.25/1.333/1.414/1.618), baseline grid, תפקידי צבע סמנטיים
  (ink/paper/accent/muted/wash), סולם רווחים.
- מראה client: `client/src/components/autoDesign/tokens.ts` — לשקול חילוץ
  לחבילת shared (`shared/autoDesign/`) כדי לעצור את סחף הכפילות client/server
  (כרגע כל שינוי דורש עדכון כפול — מקור באגים מתועד).

## ב.2 — הרחבת ה-DSL (שבוע, כולל שני הרנדררים)
עדכון `designPlanSchema.ts` + ולידציה + DesignedBookView + renderDocx:
- בלוקים: `spread` (כפולה), `layered` משודרג (scrim מדורג, מיקומי טקסט),
  `margin-note`, `accent-bar`, `run-in-head` (חלקם קיימים — להשלים ל-schema מלא).
- עמוד: `kind: 'half-title' | 'part-divider'`; `template` לפותחני פרקים (3-5 למערכת).
- `documentClass: 'book' | 'article' | 'brochure'` — נוסף עכשיו כשדה עם ברירת
  מחדל 'book' (מימוש brochure בשלב ה'; הוספת השדה עכשיו חוסכת מיגרציית סכמה).
- חובה: כל בלוק חדש נתמך בשני הרנדררים או מקבל דגרדציה מוגדרת ב-DOCX
  (כמו ◆◆◆ הקיים) — אין בלוק "HTML בלבד".

## ב.3 — DNA לשלוש מערכות (שבוע-שבועיים)
memoir-warm, editorial-modern, storybook-illustrated (השלישית stub היום — נבנית
מאפס). לכל אחת, ב-`systems/<id>/`:
- 3-5 פלטות-וריאנט + 3-5 תבניות פותחן פרק + משפחת עיטורי SVG + drop-cap ייחודי
  + טיפולי תמונה מותאמים + טיפול רקע. ה-planner כבר יודע לבחור variant
  (ההנחיות קיימות ב-prompt) — המערכות צריכות לספק את הרוחב בפועל.

## ב.4 — מנועי מגוון זרועים (3 ימים)
הרחבת ה-genome הקיים (עובד, חינם, בצד לקוח): רוטציית פותחנים, דפוסי קצב
(איפה נופלים pull-quotes), בחירת סט עיטורים, יחס סולם — הכול נגזר מ-seed,
דטרמיניסטי, ומשוקף גם ב-renderDocx (יש כבר genomeMode — להרחיב).

## בדיקות שלב ב' — golden files
- `server/src/scripts/goldenRender.ts`: מריץ הפקה על 6-8 ספרי מבחן קבועים
  (seed קבוע!) → screenshot לעמודים מייצגים דרך Puppeteer → diff מול baseline.
  רץ ידנית לפני כל merge שנוגע ברנדרר. (Date/seed קבועים — אחרת ה-diff רועש.)

---

# שלב ג' — מוכנות לדפוס (שבועיים)

**מטרה:** בית דפוס מקבל את הקובץ בלי הערות. תלוי בשלב 3 של SIMPLIFICATION_PLAN
(renderer יחיד) עבור ספרים עם `activeDesign='auto'` — כבר כמעט נכון היום
(export.pdf של auto-design הוא Puppeteer יחיד).

## ג.1 — printSpec ב-DSL ובצינור (3-4 ימים)
- ל-DesignPlan נוסף:
```ts
printSpec?: {
  trim: 'A5' | 'A4' | '13x21' | '15x22' | '17x24';   // ס"מ, הסטנדרטים בדפוס הישראלי
  bleedMm: number;          // 0 = דיגיטלי, 3 = דפוס
  cropMarks: boolean;
  bindingType: 'perfect' | 'saddle';
}
```
- `PrintDesignedBookPage.tsx`: היום קשיח `148mm × 210mm` — הופך לנגזר מ-
  `printSpec` (משתני CSS). עם bleed: כל עמוד גדל ב-6mm לכל כיוון, רקעים
  full-bleed נמתחים עד קצה ה-bleed, תוכן נשאר בתוך ה-trim + שוליים בטוחים.
- `puppeteerExportService.ts`: `format` קשיח 'A5' היום → `page.pdf({ width, height })`
  מחושבים מ-trim+bleed; viewport מותאם. סימני חיתוך: שכבת CSS ב-print page
  (פשוט יותר מפוסט-פרוצסינג PDF).

## ג.2 — שוליים דינמיים ושדרה (3 ימים)
- שוליים פנימיים (gutter) לפי מספר עמודים וכריכה: טבלה סטנדרטית
  (עד 100 עמ' → 16mm, 100-300 → 19mm, 300+ → 22mm ב-perfect binding) —
  מוזרקת ל-grid של התוכנית.
- חישוב שדרה: `pages / 2 × עובי נייר` (ברירת מחדל 80 גרם ≈ 0.055mm לעלה) —
  שירות `server/src/services/autoDesign/printMath.ts`.
- **קובץ כריכה פרוש** (גב-שדרה-חזית ברצף אחד): עמוד חדש ב-print page
  (`/print/:id/designed?part=cover-spread`) בגודל `2×trim + spine + bleed`,
  נבנה מ-coverDesign הקיים; endpoint `GET /api/auto-design/:bookId/export.cover.pdf`.

## ג.3 — פונטים ודף מפרט (יומיים)
- אימות הטמעת פונטים: סקריפט בדיקה שמריץ `pdffonts` (או pdf-lib) על הפלט
  ומוודא שכל הפונטים embedded; חלק מ-goldenRender.
- **דף מפרט לדפוס** (עמוד אחרון נפרד או PDF נלווה): גודל גזירה, עמודים, bleed,
  שדרה, המלצת נייר, "קובץ RGB — נא המרה ל-CMYK בהדפסה" — טקסט שהמשתמש
  שולח לבית הדפוס כמו שהוא.

## ג.4 — בדיקת אמת פיזית
הדפסת ספר אחד אמיתי בבית דפוס ותיעוד כל הערה שלהם → תיקונים. **זה קריטריון
הסיום של השלב, לא בדיקת קוד.**

---

# שלב ד' — לולאת העידון (שבועיים)

**מטרה:** מ"3 נסיונות" ל"שיחה עם מעצב". מוריד את הלחץ מתקרת ההפקות ומעלה המרה.

## ד.1 — צ'אט עידון → patch (שבוע)
- ראוט `POST /api/auto-design/:bookId/refine` — body: `{ instruction: string }`.
- שירות `refineAgent.ts`: Claude Haiku 4.5 עם tool-use שמחזיר **patch** מוגבל:
  `{ op: 'set', path: 'typography.baseSize'|'palette.accent'|..., value }[]` —
  whitelist של נתיבים מותרים (טיפוגרפיה, פלטה, וריאנט, קצב, תבניות פותחן).
  שינויים מבניים (עמודים/בלוקים) — לא ב-v1 של העידון; אם הבקשה דורשת אותם,
  התשובה מציעה הפקה מחדש.
- ולידציה: patch עובר `validateDesignPlan` לפני שמירה; נכשל → לא נשמר.
- לא נספר בתקרת 3 ההפקות; כן נרשם ב-`ai_usage_log` (feature: `auto_design_refine`).
- UI: שדה צ'אט ב-AutoDesignModal/עמוד העיצוב + צ'יפים מוכנים ("חם יותר",
  "כותרות גדולות", "פחות עיטורים").

## ד.2 — היסטוריית גרסאות + undo (3 ימים)
- **מיגרציה 016:** `design_plan_versions (id, book_id, plan JSONB, source
  'generate'|'refine'|'seed', created_at)` — כל שמירה של autoDesignPlan כותבת
  גרסה. `POST /api/auto-design/:bookId/revert/:versionId` חינם.
- UI: "גרסאות קודמות" עם thumbnails.

## ד.3 — Art-Director critic (3-4 ימים)
- שדרוג `criticAgent.ts`: מ-Gemini pass/block ל-Claude Sonnet 4.6 עם רובריקה
  0-100 (היררכיה 25 / חלל לבן 20 / הרמוניית צבע 20 / עקביות 20 / התאמה לתוכן 15),
  שער ב-80, עד revision אחת (המבנה הקיים באורקסטרטור כבר תומך).
- הציון נשמר על הספר + ב-ai_usage_log.metadata → מדד איכות מצטבר (KPI).
- ההגנה הקיימת נשארת: כשל LLM לא חוסם משתמש.

## ד.4 — מסך "3 הצעות כיוון" (3 ימים)
- הפקה ראשונה בפרויקט: האורקסטרטור מריץ planner פעם אחת ל-3 מערכות מועמדות
  במקביל אבל עם `pages` חלקי (4 עמודים מייצגים: שער, פותחן, גוף, feature) —
  זול (~שליש הפקה); המשתמש בוחר כיוון → הפקה מלאה רק במערכת הנבחרת.
  נספרת כהפקה אחת. דורש פרמטר `partial: true` ב-plannerAgent (הנחיה ב-prompt
  + ולידציה מקלה).

---

# שלב ה' — רוחב (מתמשך, אחרי ב'-ד')

- **ה.1 עלונים ומאמרים:** מימוש `documentClass: 'brochure'` (מודל גריד, 2-8
  עמודים, קיפול) + `article` (זרימה אחת, כותרות משנה); 2 מערכות עלון
  (עסקי נקי / קהילתי חם) + מערכת מאמר; זיהוי docType ב-Content Analysis.
- **ה.2 שאר 7 המערכות** ב-DNA מלא (בסדר: poetry-quiet, fairytale-classic,
  minimalist-nordic, romantic-vintage — כי 4 כבר חצי-בנויות — ואז השאר).
- **ה.3 הרחבת ספריות:** פלטות 44→60+, פונטים 14→20+, עיטורים.
- **ה.4 Content Analysis pass** (Haiku): פרופיל תוכן מלא שמצמצם את בחירת
  ה-planner — נדחה לכאן כי עד שיש 10 מערכות אמיתיות אין מה לצמצם.

---

# סדר ביצוע, תלויות ואומדנים

```
שבועות 1-3:   שלב א' (א.1→א.5)         ← הקפיצה הנראית הראשונה
שבועות 2-4:   מסלול מ' במקביל (מ.1→מ.4)  ← מ.3 מאחורי דגל
שבועות 4-7:   שלב ב' (ב.1→ב.4 + golden)
שבועות 8-9:   שלב ג' (ג.1→ג.4 + הדפסה פיזית)
שבועות 10-11: שלב ד' (ד.1→ד.4)
שבוע 12+:     שלב ה' + השקה (בכפוף להסרת ההשבתה)
```

תלויות קשיחות: א.5 לפני מ.3 (הזכאות בנויה על המונה) · ב.2 לפני ג.1 (printSpec
הוא הרחבת DSL) · ג' לפני העלאת מחירים · השקת מ' דורשת א' גמור + הסרת השבתה.

## מיגרציות מתוכננות
| # | תוכן | שלב |
|---|------|------|
| 014 | `users.free_designs_used INT` (עמודה רגילה — לא JSONB, בגלל באג ה-dot-path) | א.5 |
| 015 | `project_purchases` | מ.3 |
| 016 | `design_plan_versions` | ד.2 |

## עקרונות רוחביים (חלים על כל שלב)
1. כל קריאת LLM חדשה נרשמת ב-`ai_usage_log` (התשתית חיה מהיום).
2. כל תוכן סטטי ב-prompt — לפני התוכן המשתנה, עם `cache_control` (כמו ב-planner).
3. כל בלוק DSL חדש — נתמך בשני הרנדררים או עם דגרדציה מוגדרת.
4. אין פיצ'ר UI שמוצג בלי מימוש (לקח SIMPLIFICATION_PLAN) — דגלים עד שמוכן.
5. `tsc --noEmit` לפני כל commit (ה-build לא בודק טיפוסים).
6. עדכוני JSONB על users — רק דרך findByIdAndUpdate או עמודות רגילות.

## מה לא בתוכנית (במודע)
OCR לסרוקים · המרת CMYK אמיתית (עד פידבק מבית הדפוס) · Google Docs ·
עריכת עיצוב ידנית חופשית (drag&drop) על תוצר auto-design · אפליקציה.
