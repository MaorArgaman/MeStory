# דוח בדיקות E2E — תהליכי הליבה של MeStory

תאריך הרצה: 2026-05-31
סביבה: שרת מקומי `http://localhost:5001` (`NODE_ENV=development`), מחובר ל‑Supabase, Gemini, Anthropic, OpenAI ו‑PayPal (sandbox) האמיתיים.
שיטה: סקריפט E2E שמריץ את כל התהליכים דרך ה‑API האמיתי. משתמש בדיקה בודד הוקם כ‑`PREMIUM` (כדי לעבור את שערי התוכנית/קרדיטים), וכל נתוני הבדיקה נמחקו בסוף (כולל מהחנות הציבורית).

הסקריפט: [server/src/scripts/e2eFullFlow.ts](server/src/scripts/e2eFullFlow.ts)
הרצה חוזרת: `cd server && npx ts-node --transpile-only src/scripts/e2eFullFlow.ts`

---

## תקציר מנהלים

| תהליך | תוצאה |
|------|--------|
| 1. כתיבת ספר (יצירה, עריכת פרקים, שמירה, שליפה, רשימה) | ✅ עובד |
| 2. עיצוב (תצוגה מקדימה, צבעי כריכה, עיצוב AI מלא, החלת עיצוב) | ✅ עובד |
| 3. עימוד אוטומטי (Auto-Design / "עצב לי הכל") | ❌ **נכשל — קריטי** |
| 4. ייצוא לקובץ (PDF סינכרוני, PDF א-סינכרוני, DOCX) | ✅ עובד |
| 5. פרסום + ולידציות + חנות | ✅ עובד |
| 6. אינטראקציות חנות (לייק, סטטיסטיקות, צפייה ציבורית) | ✅ עובד |

**סה"כ: 29 עברו, 1 נכשל, 1 אזהרה, 1 דולג (מתוך 32 בדיקות).**

נמצאו **3 תקלות אמיתיות**. **BUG‑2 ו‑BUG‑3 תוקנו ואומתו** (ראו למטה). **BUG‑1 דורש פעולה שלך** (טעינת יתרה בחשבון Anthropic — לא ניתן לתיקון בקוד).

### סטטוס תיקונים (עדכון)
| באג | חומרה | סטטוס |
|-----|-------|--------|
| BUG‑1 — עימוד אוטומטי נכשל (יתרת Anthropic) | קריטי | ⏳ **דורש פעולה שלך** — טען יתרה ב‑console.anthropic.com |
| BUG‑2 — מונה ספרים שפורסמו לא מתעדכן | גבוה | ✅ **תוקן ואומת** |
| BUG‑3 — סטטיסטיקות כתיבה לא נשמרות | גבוה | ✅ **תוקן ואומת** |

**התיקון:** [server/src/models/User.ts](server/src/models/User.ts) — `findByIdAndUpdate` כעת מזהה מפתחות בסגנון נתיב‑נקודה (`'profile.x.y'`), עושה read‑modify‑write לעמודת ה‑JSONB ושומר את הערך המקונן. תיקון מרכזי אחד שמכסה את כל ~9 מקומות השימוש (פרסום, יצירה, עריכה, היסטוריית קריאה, רווחים). אומת ב‑[server/src/scripts/verifyUserUpdate.ts](server/src/scripts/verifyUserUpdate.ts) (כל 5 הבדיקות עברו, כולל שמירת שדות אחים), ובהרצה חוזרת של ה‑E2E המלא — **אפס שגיאות PGRST204** בלוג השרת.

---

## 🔴 תקלות לתיקון

> ## ✅ עדכון סופי — העימוד האוטומטי עובד מקצה לקצה (E2E מלא: **32/32 ירוק**)
> אחרי טעינת יתרה ב‑Anthropic, התגלו ותוקנו **שני באגים נוספים** שחסמו את העימוד (נחשפו רק כשהחיוב התחיל לעבוד):
> - **BUG-4 (תוקן):** הנתיב `/api/auto-design/` לא היה ברשימת ה‑AI הארוכים ב‑[server.ts:374](server/src/server.ts#L374), אז קיבל timeout של 55 שניות בלבד — אבל העימוד (Claude planner+critic) לוקח 60–180ש' → **504**. הוספתי את `/auto-design/` ל‑`LONG_AI_PATHS` (270ש').
> - **BUG-5 (תוקן):** `LITE_COLUMNS` ב‑[Book.ts:661](server/src/models/Book.ts#L661) לא כלל את `auto_design_uses`, אז מידלוור הקאפ ומסך הסטטוס תמיד קראו 0 → **מגבלת 3 שימושים/ספר לא נאכפה** והסטטוס תמיד הציג 3 נותרו. הוספתי את העמודה. (`DESIGN_COLUMNS` חסר את `auto_design_plan` תוקן במקביל.)
> - אומת ב‑[verifyAutoDesignLive.ts](server/src/scripts/verifyAutoDesignLive.ts) (6/6): יצירה→200, התוכנית ומונה השימושים נשמרים ב‑DB, הסטטוס נכון, `export.docx` עובד, והקאפ נאכף (ניסיון רביעי→429). הרצת E2E מלאה אחריה: **32 PASS / 0 FAIL / 0 WARN**.

### BUG-1 — עימוד אוטומטי (Auto-Design / עימוד) קרס: יתרת Anthropic API אזלה — **תוקן (יתרה נטענה)**

* **תהליך:** עימוד אוטומטי (הפיצ'ר שהושק לאחרונה, רב‑סוכני: planner → critic).
* **קריאה:** `POST /api/auto-design/:bookId` → **HTTP 500** `{"error":"Auto-design generation failed"}`.
* **שורש הבעיה (מתוך לוג השרת):**
  ```
  [autoDesign] generate failed: 400 {"type":"error","error":{"type":"invalid_request_error",
  "message":"Your credit balance is too low to access the Anthropic API.
  Please go to Plans & Billing to upgrade or purchase credits."}}
      at planDesign (server/src/services/autoDesign/plannerAgent.ts:165)
      at generateDesign (server/src/services/autoDesign/orchestrator.ts:53)
      at server/src/routes/autoDesignRoutes.ts:61
  ```
* **המשמעות:** **חשבון ה‑Anthropic ללא יתרה**, ולכן סוכן ה‑planner (Claude) לא יכול לרוץ. כתוצאה מכך **פיצ'ר העימוד האוטומטי לא עובד כרגע בכלל** — לא מקומית ולא בפרודקשן (אותו מפתח). זו תקלה תפעולית/חיובית, לא באג בקוד.
* **מה לתקן:**
  1. **לטעון יתרה/לעדכן חיוב בחשבון Anthropic** (console.anthropic.com → Plans & Billing). זה התיקון העיקרי.
  2. לוודא ש‑`ANTHROPIC_API_KEY` בפרודקשן (Vercel) שייך לחשבון עם יתרה.
* **נקודות חיוביות שכן עבדו כראוי:**
  * המערכת **לא חייבה את קרדיטי המשתמש** על כישלון (`res.locals.skipCreditCharge = true` ב‑[autoDesignRoutes.ts:89](server/src/routes/autoDesignRoutes.ts#L89)). מצוין.
  * מונה השימושים לא ירד (`usesRemaining` נשאר 3) — המשתמש לא "מבזבז" ניסיון על כישלון. תקין.
* **שיפור מומלץ (UX):** ב‑[autoDesignRoutes.ts:91-95](server/src/routes/autoDesignRoutes.ts#L91) ההודעה למשתמש גנרית ("Auto-design generation failed"). כדאי להבחין בין כשל ספק AI (להציג "השירות אינו זמין כרגע, נסו שוב מאוחר יותר") לבין שגיאת קלט, כדי שמשתמשי קצה לא יחשבו שהספר שלהם תקול. *(לא לחשוף את הודעת החיוב הפנימית למשתמש.)*

---

### BUG-2 — מונה "ספרים שפורסמו" של המחבר לא מתעדכן בפרסום — **גבוה / שלמות נתונים (כשל שקט)**

* **תהליך:** פרסום ספר.
* **תצפית:** `POST /api/books/:id/publish` מחזיר **200 (הצלחה)**, אבל בלוג השרת מופיע:
  ```
  Error updating user: {
    code: 'PGRST204',
    message: "Could not find the 'profile.authorProfile.publishedBooks' column of 'users' in the schema cache"
  }
  ```
* **שורש הבעיה:** ב‑[bookController.ts:1297-1299](server/src/controllers/bookController.ts#L1297) הקוד קורא:
  ```ts
  await User.findByIdAndUpdate(req.user.id, {
    'profile.authorProfile.publishedBooks': newPublishedBooks,
  });
  ```
  זוהי **תחביר נתיב‑נקודה בסגנון MongoDB**. אבל `User.findByIdAndUpdate` ([User.ts:322-375](server/src/models/User.ts#L322)) מעביר את המפתחות **כמות שהם** ל‑`supabaseAdmin.from('users').update(...)`. ב‑Postgres/PostgREST המפתח `'profile.authorProfile.publishedBooks'` מתפרש כשם עמודה מילולי שלא קיים → השגיאה PGRST204. `profile` היא עמודת JSONB אחת, וכדי לעדכן שדה מקונן צריך read‑modify‑write של כל אובייקט ה‑`profile`.
* **המשמעות:** **מונה הספרים שפורסמו של המחבר אף פעם לא עולה.** כל מקום שמסתמך עליו (פרופיל מחבר, סטטיסטיקות, אולי תצוגות שיווקיות) מציג נתון שגוי. הכשל "שקט" — המשתמש רואה פרסום מוצלח.
* **מה לתקן:** לעדכן את `profile` בשיטת read‑modify‑write (לשלוף `user.profile`, לשנות את `profile.authorProfile.publishedBooks`, ולשלוח את כל אובייקט `profile`), או להוסיף ל‑`User.findByIdAndUpdate` טיפול בנתיבי‑נקודה (פיצול והרכבת ה‑JSONB) כפי שקיים ב‑`Book.findByIdAndUpdate` עבור `$inc`.

---

### BUG-3 — סטטיסטיקות כתיבה של המשתמש לא נשמרות (יצירה/עריכה) — **גבוה / שלמות נתונים (כשל שקט)**

* **תהליך:** יצירת ספר ועריכתו.
* **תצפית:** `POST /api/books` ו‑`PUT /api/books/:id` מחזירים 200/201, אבל הלוג מראה:
  ```
  Error updating user: {
    code: 'PGRST204',
    message: "Could not find the 'profile.writingStatistics.booksWritten' column of 'users' in the schema cache"
  }
  ```
* **שורש הבעיה:** אותו דפוס בדיוק כמו BUG-2 — נתיב‑נקודה אל עמודת JSONB. מופעים:
  * [bookController.ts:542](server/src/controllers/bookController.ts#L542) — `'profile.writingStatistics'` (ב‑`createBook`)
  * [bookController.ts:947](server/src/controllers/bookController.ts#L947) — `'profile.writingStatistics.totalWords'` (ב‑`updateBook`)
  * [bookController.ts:1138](server/src/controllers/bookController.ts#L1138) — `'profile.writingStatistics.booksWritten'`
* **המשמעות:** **כל סטטיסטיקות הכתיבה של המשתמש (מס' ספרים, סה"כ מילים) אינן נשמרות לעולם.** דשבורד/פרופיל יציגו אפסים.
* **מה לתקן:** כמו BUG-2. מומלץ **תיקון מרכזי אחד** ב‑`User.findByIdAndUpdate` שמטפל בנתיבי‑נקודה אל עמודות JSONB — יתקן את BUG-2, BUG-3, ואת המופעים הנוספים למטה בבת אחת.

#### מקומות נוספים מאותו דפוס שבורים (אותו שורש — `users` + נתיב‑נקודה), לא נצפו ישירות בריצה אך ייכשלו זהה:
* [bookController.ts:1444](server/src/controllers/bookController.ts#L1444) — `'profile.readingHistory'`
* [bookController.ts:1472-1473](server/src/controllers/bookController.ts#L1472) — `'profile.earnings'`, `'profile.authorProfile'`
* [bookController.ts:2801](server/src/controllers/bookController.ts#L2801), [bookController.ts:3008](server/src/controllers/bookController.ts#L3008) — `'profile.writingStatistics'`
* [bookPurchaseController.ts:602](server/src/controllers/bookPurchaseController.ts#L602) — `'profile.readingHistory'`

> הערה: מופעים כמו `'publishingStatus.status'` המופיעים ברחבי הקוד הם **פילטרים לשאילתות** (query), וה‑`Book` model מתרגם אותם נכון (`publishing_status->>status`). הם **אינם** מושפעים מהבאג הזה. הבעיה היא רק ב‑**עדכון** (update) של טבלת `users`.

---

## 🟡 הערות ושיפורים (לא חוסמים)

### NOTE-1 — אי‑התאמה בין enum התפקיד בקוד למסד הנתונים
ה‑enum בקוד ([User.ts:25-30](server/src/models/User.ts#L25)) כולל `ADMIN`, אך ניסיון לכתוב ערך תפקיד שאינו תואם ל‑enum של מסד הנתונים נדחה (`invalid input value for enum user_role`). ערכי ה‑DB הם באותיות גדולות (`FREE`/`STANDARD`/`PREMIUM`). כדאי לוודא שהגדרת ה‑enum במסד תואמת לקוד (כולל `ADMIN` אם משתמשים בו), אחרת הענקת הרשאות אדמין דרך עדכון תפקיד תיכשל.

### NOTE-2 — פונט Rubik חסר בייצוא
בלוג הייצוא: `[Export Warning] Rubik font not available or invalid, using NotoSans as fallback.` הייצוא עובד (fallback ל‑NotoSans), אך Rubik (פונט עברי נפוץ) אינו זמין למנוע הייצוא. אם העיצוב בוחר Rubik, ה‑PDF/DOCX ייראה שונה מהתצוגה במסך. כדאי לצרף את הפונט או למפות אותו במפורש.

### NOTE-3 — לא ניתן למחוק ספר שפורסם
`DELETE /api/books/:id` על ספר שפורסם מחזיר 400 "Cannot delete a published book. Unpublish it first." זו ככל הנראה התנהגות מכוונת, אך כדאי לוודא שקיים בממשק מסלול "ביטול פרסום" נגיש למשתמש, אחרת משתמשים "ייתקעו" עם ספר שלא ניתן למחוק. (לאחר ביטול פרסום דרך `PUT publishingStatus.status='draft'`, המחיקה עובדת — נבדק ✅.)

---

## ✅ מה נבדק ועבר בהצלחה (פירוט)

### תהליך 1 — כתיבת ספר
* `POST /api/books` — יצירה (HTTP 201) ✅
* `PUT /api/books/:id` — שמירת 3 פרקים עם תוכן (HTTP 200) ✅
* `GET /api/books/:id` — הפרקים נשמרו ונשלפים (chapters=3) ✅
* `GET /api/books` — הספר מופיע ברשימת המשתמש ✅

### תהליך 2 — עיצוב
* `GET /api/ai/design-state/:id` — מצב עיצוב ✅
* `POST /api/ai/design-preview/:id` — תצוגה מקדימה מהירה (Gemini), החזיר typography/layout/colorPalette/coverPrompt ✅
* `POST /api/ai/generate-cover-colors` — ערכת צבעים (Gemini), עברית ✅
* `POST /api/ai/design-book/:id` — עיצוב AI מלא (typography/layout/cover/imagePlacements/overallStyle) ✅
* `POST /api/ai/apply-design/:id` — החלת העיצוב על הספר ✅

### תהליך 4 — ייצוא לקובץ
* `GET /api/books/:id/export` — PDF סינכרוני, 25,558 bytes, חתימת `%PDF` תקינה ✅
* `POST /api/books/:id/export-async` → job → poll `/api/jobs/:id` → הורדה מ‑URL חתום (Supabase), 44,340 bytes ✅
* `GET /api/books/:id/export/docx` — DOCX תקין (חתימת ZIP `PK`), 9,969 bytes ✅
* `GET /api/books/:id/export/pdf` — PDF תקין ✅

### תהליך 5 — פרסום
* דחיית פרסום ללא תקציר — 400 עם הודעה נכונה ✅
* דחיית פרסום ללא תגיות — 400 ✅
* דחיית פרסום ללא כריכה — 400 ✅
* `POST /api/books/:id/publish` (חינמי, אחרי השלמת השדות) — פורסם בהצלחה ✅
* דחיית מחיר לא תקין (>$25) — 400 ✅

### תהליך 6 — חנות / אינטראקציות
* `GET /api/books/public` — הספר שפורסם מופיע בחנות ✅
* `GET /api/books/public/:id` — פרטי ספר ציבורי (כולל פרקים) ✅
* `POST /api/books/:id/like` — לייק ✅
* `GET /api/books/:id/social-stats` — סטטיסטיקות (likes=1) ✅

---

## ⚠️ מה לא נבדק (לידיעה — דורש קלט/הקשר נוסף)

* **העלאת קבצים** (`POST /api/books/upload` כתב‑יד DOCX/MD, `POST /api/books/upload-audio` תמלול Whisper, `POST /api/books/:id/upload-cover`) — דורש קבצים אמיתיים; לא נכלל בריצה האוטומטית.
* **יצירת תמונות בפועל** (כריכות/תמונות פנים עם nano-banana/DALL-E) — נמנע בכוונה כדי לחסוך עלות; נבדק רק העיצוב הטקסטואלי. `POST /api/ai/generate-cover`, `design-complete`, `premium-design` לא הופעלו עם `generateImages:true`.
* **רכישה ותשלום אמיתי** (`POST /api/books/:id/purchase`, PayPal) — דורש משתמש קונה שני וזרימת תשלום; לא נבדק.
* **שכבת ה‑UI (React)** — נבדק שכבת ה‑API/שרת מקצה לקצה. בדיקת דפדפן (Playwright) של אשף היצירה, `BookLayoutPage` ומודאל ה‑Auto-Design לא בוצעה בריצה זו. (בזיכרון הפרויקט מצוינים באגי פריסה פתוחים ב‑`BookLayoutPage` — לא אומתו כאן.)
* **קיבולת העימוד (3/ספר)** — לא מוצתה (דורש 4 ריצות בתשלום); הלוגיקה נבדקה בקוד בלבד.

---

## 🧭 ביקורת מיגרציה MongoDB → Supabase (סריקה נוספת)

הבאג המקורי (BUG‑2/3) היה שריד ממיגרציה מ‑MongoDB ל‑Supabase. סרקתי את כל הקוד לחפש עוד מקומות כאלה. **אין יותר תלות אמיתית ב‑mongoose** (אין `import mongoose`, אין `.populate()`/`.lean()`/`.save()`/`.exec()`), אבל כל מודל ב‑`server/src/models/*.ts` הוא מחלקה מותאמת ש**מחקה** את ה‑API של Mongoose מעל Supabase — וחלק מהאופרטורים/מפתחות לא מתורגמים, ונכשלים בשקט.

### ✅ תוקן — צד הכתיבה (Update) — באגים של אובדן/שיבוש נתונים
תוקן מרכזית בשני האדפטרים, עם בדיקות רגרסיה ([verifyUserUpdate.ts](server/src/scripts/verifyUserUpdate.ts), [verifyBookUpdate.ts](server/src/scripts/verifyBookUpdate.ts) — כולן עברו):

| # | מיקום | מה היה נכשל בשקט | סטטוס |
|---|-------|------------------|--------|
| U | `users` profile dot-paths | מונה ספרים שפורסמו + סטטיסטיקות כתיבה לא נשמרו (BUG‑2/3) | ✅ תוקן ב‑[User.ts](server/src/models/User.ts) |
| 1 | [webhookController.ts:605](server/src/controllers/webhookController.ts#L605) | `$set:{'statistics.purchases','statistics.revenue'}` על Book — **החזר כספי לא גלגל אחורה רכישות/הכנסות** | ✅ תוקן ב‑[Book.ts](server/src/models/Book.ts) |
| 2 | [bookPurchaseController.ts:614](server/src/controllers/bookPurchaseController.ts#L614) | `'statistics.completionRate'` (עדכון ישיר) — **אחוז ההשלמה לא מתעדכן** | ✅ תוקן |
| 3 | [adminController.ts:471](server/src/controllers/adminController.ts#L471) | `'publishingStatus.status'/'isPublic'` ישיר — **פעולת "בטל פרסום/דחה" של אדמין לא עשתה כלום** | ✅ תוקן |
| 4 | [autoDesignRoutes.ts:67](server/src/routes/autoDesignRoutes.ts#L67) | `$set`+`$inc` יחד — Book התעלם מ‑`$inc`, ולכן **`autoDesignUses` לא עלה ומגבלת 3 שימושים/ספר לא נאכפה** (שימוש בלתי מוגבל) | ✅ תוקן |
| 5 | [collaborationController.ts:561](server/src/controllers/collaborationController.ts#L561) | `$set:{author}` — מופה ל‑`author` במקום `author_id`, **העברת בעלות לא נשמרה** | ✅ תוקן (מיפוי author→author_id) |

**התיקון:** `Book.findByIdAndUpdate` ([Book.ts](server/src/models/Book.ts)) מטפל כעת בנתיבי‑נקודה אל עמודות JSONB (ב‑`$set` ובעדכון ישיר), מאפשר `$set`+`$inc` יחד, וממפה `author`→`author_id`.

### ✅ תוקן — צד הקריאה (Query) — מספרים/סינונים שגויים בשקט
כל החמישה תוקנו ואומתו ([verifyQueryFixes.ts](server/src/scripts/verifyQueryFixes.ts) — כל 8 הבדיקות עברו, `tsc --noEmit` נקי):

| # | מיקום | הבעיה שתוקנה | התיקון |
|---|-------|--------------|--------|
| Q1 | [bookController.ts:1551](server/src/controllers/bookController.ts#L1551) | סינון קטגוריה בחנות התעלם בשקט | `Book.find` מתרגם כעת את הקטגוריה ל‑JSONB `cs` (contains) על `publishing_status->marketingStrategy->categories` |
| Q2 | [adminController.ts:50,59](server/src/controllers/adminController.ts#L50) | "נרשמים ב‑7/30 ימים" ספר את כולם | `User.find`/`countDocuments` מטפלים כעת ב‑`createdAt:{$gte/$gt/$lte/$lt}` (helper `applyDateRange`) |
| Q3 | [adminController.ts:397](server/src/controllers/adminController.ts#L397) | מודרציה הציגה את כל הספרים | סינון האיכות (0<score<60) עובר ל‑JS בקונטרולר + `_limit:500` |
| Q4 | [mlRecommendationService.ts:498](server/src/services/mlRecommendationService.ts#L498) | אות המלצה שיתופי מת | `UserActivity.find` תומך כעת ב‑`{userId:{$in:[...]}}` (משתמש ב‑`.in()`) |
| Q5 | [analyticsService.ts](server/src/services/analyticsService.ts) | אנליטיקה חושבה מ‑200 ספרים בלבד | נוסף `Book.findAll()` עם pagination אמיתי (`_offset`/`.range`); כל 9 קריאות האנליטיקה הומרו אליו |

**הערה ל‑Q5:** ‏`bookPromotionService` ו‑`ttsController` משתמשים באותו דפוס (200 שורות), אבל **לא** המרתי אותם כי שם זה לא רק מדד אלא משפיע על התנהגות מוצר (כמות מיילים שיווקיים / יצירת TTS). כדאי לבחון אותם בנפרד.

---

## 🎯 אחידות מקצה-לקצה (WYSIWYG) — שלבים 1–3 מומשו (Backend + דפי הדפסה)

יעד: **מה שהמשתמש בונה (כתיבה → כריכה → עימוד) = בדיוק מה שיוצא לקובץ.** הבעיה שהייתה: שני צינורות עיצוב + 5 מנועי רינדור + אין לוגיקת עדיפות, כך שהייצוא תלוי באיזה כפתור לחצת.

מומש ואומת ([verifyWysiwyg.ts](server/src/scripts/verifyWysiwyg.ts) — 7/7 עברו, `tsc` נקי בשרת ובקבצים שנגעתי בלקוח):

| שלב | מה נעשה | קבצים |
|-----|---------|--------|
| **1 — דגל activeDesign** | נוסף `activeDesign` ('manual'/'auto') שנשמר ב‑`ai_design_state` (בלי מיגרציה). נקבע אוטומטית: 'manual' בשמירת `pageLayout`/`coverDesign`, 'auto' בריצת עימוד. `resolveActiveDesign()` מסיק נכון גם בלי דגל | [utils/activeDesign.ts](server/src/utils/activeDesign.ts), [bookController.ts updateBook](server/src/controllers/bookController.ts), [autoDesignRoutes.ts](server/src/routes/autoDesignRoutes.ts) |
| **2 — PDF אחיד WYSIWYG** | `renderBookToPdf` קיבל `variant` ('manual'/'designed'). נוסף endpoint `GET /api/auto-design/:id/export.pdf` שמרנדר את **אותו דף** `/print/:id/designed` שהמשתמש רואה. ייצוא ה‑PDF הראשי מנתב לפי `activeDesign` | [puppeteerExportService.ts](server/src/services/puppeteerExportService.ts), [autoDesignRoutes.ts](server/src/routes/autoDesignRoutes.ts), [bookController.ts exportBookPDFAsync](server/src/controllers/bookController.ts) |
| **3 — כריכה בכל ייצוא** | ה‑Word של העימוד כולל כעת את הכריכה (43KB מול 8.5KB — אומת). דף ה‑`/print/:id/designed` מרנדר את הכריכה → גם ה‑PDF של העימוד כולל אותה. נוסף כפתור "הורד כ-PDF" במודאל העימוד | [renderDocx.ts](server/src/services/autoDesign/renderDocx.ts), [PrintDesignedBookPage.tsx](client/src/pages/PrintDesignedBookPage.tsx), [AutoDesignModal.tsx](client/src/components/autoDesign/AutoDesignModal.tsx) |

### שלב 4–5 (UX) — מומש
- **מודאל הייצוא בעורך מנתב לפי `activeDesign`:** כפתור PDF וכפתור Word מייצאים את העיצוב שהמשתמש בנה אחרון — אם עשה עימוד, יוצא העימוד (PDF דרך `/auto-design/:id/export.pdf`, Word דרך `/auto-design/:id/export.docx`); אחרת הצינור הידני. [BookLayoutPage.tsx](client/src/pages/BookLayoutPage.tsx)
- **חיווי "מעוצב עם: עימוד אוטומטי / עיצוב ידני"** במודאל, עם הבטחה שהייצוא זהה לתצוגה.
- **הבהרת ציפיות Word מול PDF** בטקסט במודאל (PDF = עותק ויזואלי מדויק; Word = קובץ עריכה).
- ייצוא ה‑PDF הא‑סינכרוני מהדשבורד כבר מנתב לפי `activeDesign` בצד השרת — אין צורך בשינוי לקוח שם.

### אחידות צבע בין הכריכה לעימוד — תוקן
ה‑planner של העימוד בחר פלטה/טיפוגרפיה **בלי לדעת את צבעי הכריכה** → הפנים התנגש עם הכריכה. הוספתי ל‑prompt של ה‑planner ([plannerAgent.ts](server/src/services/autoDesign/plannerAgent.ts)) בלוק "COVER DESIGN" עם צבעי הכריכה + הוראה להרמוניה. אומת ([verifyCoverHarmony.ts](server/src/scripts/verifyCoverHarmony.ts)): כריכה חומה → פלטת פנים `accent #a67c52` (צבע מהכריכה), 4/4 גוונים חמים.

### סתירת המודאל ("העיצוב מוכן" מול "אין עיצוב אוטומטי") — כבר מתוקן בקוד
הסיבה: דף התצוגה `/print/:id/designed` שולף `GET /books/:id`, וזה לא החזיר `autoDesignPlan` → התצוגה (וה‑PDF של העימוד) הציגו "אין עיצוב". `getBookById` כעת מחזיר `autoDesignPlan`+`autoDesignUses` ([bookController.ts:476](server/src/controllers/bookController.ts#L476)). אומת ([verifyPreviewPlan.ts](server/src/scripts/verifyPreviewPlan.ts)). **הצילום מראה מצב לפני שהתיקון נכנס לתוקף — צריך redeploy/רענון חזק כדי לראות.**

**מה נשאר (לא חוסם):**
- ליטוש: רכיב תצוגה-מקדימה אחד שמשמש את כל המסכים (כרגע כל מסך טוען את דף ההדפסה הנכון, אך אין רכיב משותף יחיד).
- אימות runtime של ה‑PDF של העימוד דורש את הקליינט רץ (Puppeteer טוען את דף ההדפסה) — אומת ברמת קוד/קומפילציה; כדאי הרצת קצה-לקצה אחת מול הקליינט.
- הערה: BUG-1 (Anthropic) עדיין חוסם יצירת *תוכנית* עימוד חדשה עד טעינת יתרה; כל מנגנון ה‑WYSIWYG כבר מוכן לה.

---

## איך להריץ שוב
```bash
cd server
npx ts-node --transpile-only src/scripts/e2eFullFlow.ts
# להשארת נתוני הבדיקה לצורך דיבוג:  E2E_KEEP=1 npx ts-node --transpile-only src/scripts/e2eFullFlow.ts
```
הסקריפט מקים משתמש בדיקה (PREMIUM), מריץ את כל התהליכים, ומוחק את כל נתוני הבדיקה בסוף (כולל מהחנות הציבורית).
