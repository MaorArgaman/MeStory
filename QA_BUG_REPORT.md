# MeStory QA Bug Report
## דוח בדיקות איכות - רשימת תקלות לתיקון

**תאריך בדיקה:** 2026-03-24
**גרסה:** Current Main Branch
**בודק:** Claude Code QA Agent

---

## סיכום מנהלים

| קטגוריה | קריטי | גבוה | בינוני | נמוך | סה"כ |
|---------|-------|------|--------|------|------|
| אבטחה | 3 | 5 | 8 | 2 | **18** |
| פונקציונלי | 1 | 3 | 5 | 2 | **11** |
| I18N | 0 | 2 | 8 | 3 | **13** |
| עיצוב/UI | 0 | 1 | 4 | 3 | **8** |
| CRUD | 0 | 2 | 3 | 1 | **6** |
| חוויית משתמש | 0 | 1 | 3 | 2 | **6** |
| **סה"כ** | **4** | **14** | **31** | **13** | **62** |

---

# 1. בעיות אבטחה (Security)

## SEC-001: מצב תשלום מדומה בפרודקשן
**חומרה:** קריטית
**קובץ:** `server/src/controllers/paymentController.ts`
**שורות:** 86-119
**עמוד:** Payment System

**תוצאה צפויה:** בפרודקשן חייב להיות PayPal אמיתי
**תוצאה בפועל:** אם NODE_ENV לא מוגדר במפורש כ-production, תשלומים מדומים עובדים

```typescript
if (process.env.NODE_ENV === 'development') {
  // Mock payment mode - מסוכן אם NODE_ENV לא מוגדר!
}
```

**תיקון:** הוסף בדיקה מפורשת: `if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_MOCK_PAYMENTS === 'true')`

---

## SEC-002: טוקן JWT חשוף ב-URL
**חומרה:** קריטית
**קובץ:** `server/src/routes/authRoutes.ts`
**שורות:** ~139
**עמוד:** OAuth Callback

**תוצאה צפויה:** טוקן צריך לעבור דרך HTTP-only cookie מאובטח
**תוצאה בפועל:** הטוקן מועבר ב-URL, חשוף בהיסטוריית הדפדפן, לוגים, ו-referer headers

```typescript
res.redirect(`${CLIENT_URL}/auth-success?token=${token}`);
```

**תיקון:** השתמש ב-HTTP-only cookies או POST message לחלון האב

---

## SEC-003: Session Secret עם ברירת מחדל חלשה
**חומרה:** קריטית
**קובץ:** `server/src/server.ts`
**שורה:** ~158

**תוצאה צפויה:** השרת צריך להיכשל אם JWT_SECRET לא מוגדר בפרודקשן
**תוצאה בפועל:** משתמש ב-'fallback-secret-key' חלש

```typescript
secret: process.env.JWT_SECRET || 'fallback-secret-key'
```

**תיקון:** זרוק שגיאה אם JWT_SECRET חסר בפרודקשן

---

## SEC-004: חסר אימות קלט - קרדיטים באדמין
**חומרה:** גבוהה
**קובץ:** `server/src/controllers/adminController.ts`
**שורות:** 263-265
**עמוד:** Admin Panel

**תוצאה צפויה:** שדה קרדיטים צריך ולידציה של min/max
**תוצאה בפועל:** אין ולידציה, אפשר להגדיר ערכים שליליים או גבוהים מאוד

```typescript
if (credits !== undefined) {
  updateData.credits = Number(credits);  // בלי ולידציה!
}
```

**תיקון:** הוסף: `Math.max(0, Math.min(999999, Number(credits)))`

---

## SEC-005: חסר אימות קלט - פרופיל משתמש
**חומרה:** גבוהה
**קובץ:** `server/src/controllers/authController.ts`
**שורות:** 433-488
**עמוד:** Settings / Profile

**תוצאה צפויה:** שדות bio ו-name צריכים אורך מקסימלי, avatar צריך ולידציית URL
**תוצאה בפועל:** אין הגבלות אורך, אין סניטציה

```typescript
const { name, bio, avatar } = req.body;
// אין ולידציה על אף שדה
```

**תיקון:** הוסף ולידציית אורך (name: 100, bio: 500), ולידציית URL ל-avatar

---

## SEC-006: סיכון להזרקת Regex
**חומרה:** גבוהה
**קובץ:** `server/src/controllers/adminController.ts`
**שורות:** 163-168
**עמוד:** Admin Users Search

**תוצאה צפויה:** קלט חיפוש צריך להיות escaped לפני שימוש ב-regex
**תוצאה בפועל:** קלט משתמש עובר ישירות ל-regex pattern

```typescript
query.$or = [
  { name: { $regex: search, $options: 'i' } },
  { email: { $regex: search, $options: 'i' } },
];
```

**תיקון:** בצע escape לתווים מיוחדים של regex או השתמש בחיפוש מילולי

---

## SEC-007: חסרות הגבלות Pagination
**חומרה:** גבוהה
**קובץ:** `server/src/controllers/messagingController.ts`
**שורות:** 258-260
**עמוד:** Messages API

**תוצאה צפויה:** Pagination צריך הגבלת מקסימום למניעת DoS
**תוצאה בפועל:** אין הגבלה עליונה - משתמש יכול לבקש מספר בלתי מוגבל של רשומות

```typescript
const limit = parseInt(req.query.limit as string) || 20;
// אפשר לבקש limit=999999
```

**תיקון:** `const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));`

---

## SEC-008: איפוס סיסמה אדמין לא מיושם
**חומרה:** גבוהה
**קובץ:** `server/src/controllers/adminController.ts`
**שורות:** 272-275
**עמוד:** Admin Panel

**תוצאה צפויה:** צריך לשלוח מייל איפוס מאובטח עם טוקן שפג תוקף
**תוצאה בפועל:** הפעולה מאושרת אבל לא עושה כלום

```typescript
} else if (action === 'reset-password') {
  // In production, send password reset email
  // For now, just return success  <- בעיית אבטחה
}
```

**תיקון:** יש ליישם תהליך איפוס סיסמה מאובטח עם טוקן

---

## SEC-009: הגדרת CORS רחבה מדי
**חומרה:** בינונית
**קובץ:** `server/src/server.ts`
**שורות:** 127-146

**תוצאה צפויה:** פרודקשן צריך לדחות מקורות לא מוכרים
**תוצאה בפועל:** כל המקורות מותרים גם בפרודקשן

```typescript
console.warn(`CORS request from origin: ${origin}`);
callback(null, true); // מאפשר הכל!
```

**תיקון:** `callback(new Error('Not allowed by CORS'))` למקורות לא מוכרים בפרודקשן

---

## SEC-010: מידע רגיש בלוגים
**חומרה:** בינונית
**קובץ:** `server/src/middleware/errorMiddleware.ts`
**שורות:** 35-41

**תוצאה צפויה:** body של הבקשה צריך להיות מנוקה לפני לוגים
**תוצאה בפועל:** כל ה-body נרשם, עלול לכלול סיסמאות

```typescript
console.error('Error occurred:', {
  body: req.body,  // עלול להכיל סיסמאות!
});
```

**תיקון:** נקה שדות רגישים (password, token וכו') לפני הלוגים

---

## SEC-011: מחיקת קבצים בלי טיפול בשגיאות
**חומרה:** בינונית
**קובץ:** `server/src/controllers/voiceController.ts`
**שורות:** 178-179, 287-288

**תוצאה צפויה:** מחיקת קבצים צריכה טיפול שגיאות תקין
**תוצאה בפועל:** Fire-and-forget עם callback ריק

```typescript
fs.unlink(audioFile.path, () => {});  // שגיאות מתעלמות
```

**תיקון:** רשום שגיאות: `fs.unlink(path, (err) => err && console.error('Delete failed:', err))`

---

## SEC-012: Race Condition במצב ראיון
**חומרה:** בינונית
**קובץ:** `server/src/controllers/voiceController.ts`
**שורות:** 105, 221

**תוצאה צפויה:** מצב צריך להישמר אטומית בדאטאבייס
**תוצאה בפועל:** Map בזיכרון בלי נעילה, בעייתי עבור serverless

```typescript
interviewStates.set(interviewId, state);  // אפשרי race condition
```

**תיקון:** העבר מצב ראיון לדאטאבייס או Redis עם פעולות אטומיות

---

## SEC-013: Race Condition בספירת הודעות שלא נקראו
**חומרה:** בינונית
**קובץ:** `server/src/controllers/messagingController.ts`
**שורות:** 194-195

**תוצאה צפויה:** הגדלת ספירה צריכה להיות אטומית
**תוצאה בפועל:** Read-modify-write בלי נעילה

```typescript
const currentCount = conversation.unreadCount[otherParticipantId] || 0;
conversation.unreadCount[otherParticipantId] = currentCount + 1;
// שתי הודעות במקביל = הגדלה אבודה
```

**תיקון:** השתמש בפעולת increment אטומית

---

## SEC-014: ערכי קסם מקודדים
**חומרה:** בינונית
**קובץ:** קבצים מרובים

**תוצאה צפויה:** ערכי קונפיגורציה צריכים להיות במשתני סביבה
**תוצאה בפועל:** ערכים מקודדים פזורים בקוד

**דוגמאות:**
- `authController.ts:32` - סיבובי bcrypt: `12`
- `authController.ts:36` - תפוגת אימות: `15 * 60 * 1000`
- `authController.ts:50` - משך מנוי: `365 * 24 * 60 * 60 * 1000`
- `uploadMiddleware.ts:151` - גודל תמונה: `10 * 1024 * 1024`
- `messagingController.ts:162` - אורך הודעה: `5000`

**תיקון:** העבר לקובץ config או משתני סביבה

---

## SEC-015: חסר טיפול בשגיאות בפעולות בצובר
**חומרה:** בינונית
**קובץ:** `server/src/controllers/messagingController.ts`
**שורות:** 389-397

**תוצאה צפויה:** פעולות בצובר צריכות לטפל בכשלונות חלקיים
**תוצאה בפועל:** Promise.all בלי התאוששות משגיאות

```typescript
await Promise.all(
  unreadMessages.map((msg) => Message.findByIdAndUpdate(...))
);
// אם אחד נכשל, מה קורה לשאר?
```

**תיקון:** השתמש ב-Promise.allSettled וטפל בכשלונות חלקיים

---

## SEC-016: פורמט תגובת שגיאה לא עקבי
**חומרה:** בינונית
**קובץ:** Controllers מרובים

**תוצאה צפויה:** פורמט עקבי של תגובות שגיאה ב-API
**תוצאה בפועל:** ערבוב של שדות `error` ו-`message`

- `authController.ts:95` - משתמש ב-`error`
- `aiController.ts:44` - משתמש ב-`message`
- `paymentController.ts:256` - משתמש ב-`error`

**תיקון:** סטנדרטיזציה לפורמט אחיד: `{ success: false, error: string }`

---

## SEC-017: חסר אימות בחלק מנקודות קצה AI
**חומרה:** בינונית
**קובץ:** `server/src/routes/aiRoutes.ts`

**תוצאה צפויה:** נקודות קצה AI צריכות אימות (משתמשות בקרדיטים)
**תוצאה בפועל:** חלק מהנקודות עשויות להיות נגישות בלי auth

**תיקון:** ודא שלכל נקודות הקצה AI יש middleware `authenticate`

---

## SEC-018: אינטגרציית PayPal לא מיושמת
**חומרה:** נמוכה (מגבלה ידועה)
**קובץ:** `server/src/controllers/paymentController.ts`
**שורות:** 122-126, 327-331

**תוצאה צפויה:** עיבוד תשלומים אמיתי
**תוצאה בפועל:** מחזיר 501 Not Implemented

```typescript
res.status(501).json({
  error: 'PayPal integration not yet implemented...',
});
```

**תיקון:** יש ליישם אינטגרציית PayPal לפני עליה לפרודקשן

---

# 2. בעיות פונקציונליות (Functional)

## FUNC-001: מנתח PDF מנוטרל
**חומרה:** קריטית
**קובץ:** `server/src/controllers/bookController.ts`
**שורות:** 8-9

**תוצאה צפויה:** ייבוא PDF צריך לעבוד
**תוצאה בפועל:** pdf-parse מנוטרל לתאימות Vercel

```typescript
// pdf-parse is temporarily disabled for Vercel serverless compatibility
// import PDFParser from 'pdf-parse';
```

**תיקון:** מצא מנתח PDF תואם serverless או השתמש בשירות חיצוני

---

## FUNC-002: הרחבות צבע TipTap לא פעילות
**חומרה:** גבוהה
**קובץ:** `client/src/pages/BookWritingPage.tsx`

**תוצאה צפויה:** תכונת צבע טקסט צריכה לעבוד בעורך
**תוצאה בפועל:** הרחבות נוספו ל-package.json אבל הייבואים מעומתים בגלל שגיאת npm install

**תיקון:** הרץ `npm install` ובטל הערה לייבואי הרחבות צבע TipTap

---

## FUNC-003: פרק 1 מקודד באנגלית
**חומרה:** גבוהה
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורה:** 181

**תוצאה צפויה:** כותרת פרק צריכה להיות מתורגמת
**תוצאה בפועל:** תמיד "Chapter 1" באנגלית

```typescript
chapters: [{
  title: 'Chapter 1',  // צריך להיות t('chapter_1') או "פרק 1"
  ...
}]
```

**תיקון:** השתמש ב-`t('dashboard.default_chapter_title')` או "פרק 1" בעברית

---

## FUNC-004: מצב ראיון קולי אבד ב-Serverless
**חומרה:** גבוהה
**קובץ:** `server/src/controllers/voiceController.ts`

**תוצאה צפויה:** התקדמות ראיון נשמרת בין בקשות
**תוצאה בפועל:** Map בזיכרון מתאפס בין הפעלות serverless

```typescript
const interviewStates = new Map();  // אבד ב-cold start
```

**תיקון:** שמור מצב ראיון בדאטאבייס

---

## FUNC-005: יצירת PDF לספר
**חומרה:** בינונית
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורה:** 100

**תוצאה צפויה:** ייצוא PDF צריך לעבוד באופן אמין
**תוצאה בפועל:** toast כללי מוצג, אין טיפול בשגיאות ספציפי למצבי כשל שונים

**תיקון:** הוסף טיפול ספציפי בשגיאות ליצירת PDF

---

## FUNC-006: אי התאמה בולידציית סוגי קבצים
**חומרה:** בינונית
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורות:** 126-131, 207-213

**תוצאה צפויה:** לקוח ושרת צריכים לקבל אותם סוגי קבצים
**תוצאה בפועל:** הלקוח מאפשר `.doc` אבל השרת עשוי לא לעבד אותו

**תיקון:** ודא שרשימות סוגי הקבצים תואמות בין לקוח לשרת

---

## FUNC-007: ז'אנר מקודד כ-"Fiction"
**חומרה:** בינונית
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורות:** 144, 230

**תוצאה צפויה:** משתמש צריך לבחור ז'אנר לקבצים שהועלו
**תוצאה בפועל:** תמיד ברירת מחדל "Fiction" בלי אפשרות לשנות

```typescript
formData.append('genre', 'Fiction'); // ז'אנר ברירת מחדל - לא ניתן להתאמה
```

**תיקון:** הוסף בחירת ז'אנר למודל העלאה

---

## FUNC-008: הערות localStorage עלולות להתנגש
**חומרה:** בינונית
**קובץ:** `client/src/components/editor/DraftNotes.tsx`
**שורות:** 52-68

**תוצאה צפויה:** הערות צריכות להיות מבודדות לכל משתמש
**תוצאה בפועל:** מפתח localStorage משתמש רק ב-bookId ו-chapterIndex, לא userId

```typescript
const key = `draft-notes-${bookId}-${chapterIndex}`;  // חסר userId!
```

**תיקון:** כלול userId במפתח: `draft-notes-${userId}-${bookId}-${chapterIndex}`

---

## FUNC-009: חסר Error Boundary
**חומרה:** בינונית
**קובץ:** אפליקציית לקוח

**תוצאה צפויה:** שגיאות צריכות להיתפס בחן עם UI חלופי
**תוצאה בפועל:** אין React Error Boundary מיושם

**תיקון:** הוסף רכיב Error Boundary שעוטף את הנתיבים הראשיים

---

## FUNC-010: סטטוס ספר לא מתורגם
**חומרה:** נמוכה
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורות:** 547-554

**תוצאה צפויה:** badge סטטוס צריך להציג טקסט מתורגם
**תוצאה בפועל:** מציג מחרוזת סטטוס גולמית ("published", "draft")

```typescript
<span className={`badge ...`}>
  {book.publishingStatus.status}  // לא מתורגם
</span>
```

**תיקון:** השתמש ב-`t(`status.${book.publishingStatus.status}`)`

---

## FUNC-011: בדיקת שפה בשכפול תמונה
**חומרה:** נמוכה
**קובץ:** `client/src/pages/BookLayoutPage.tsx`
**שורה:** 990

**תוצאה צפויה:** טיפול שפה עקבי ב-toast
**תוצאה בפועל:** בדיקת שפה inline במקום שימוש בפונקציית תרגום

```typescript
toast.success(language === 'he' ? 'התמונה שוכפלה' : 'Image duplicated');
```

**תיקון:** השתמש ב-`t('layout.image_duplicated')`

---

# 3. בעיות I18N (בינלאומיות)

## I18N-001: דף התחברות - אנגלית מקודדת
**חומרה:** גבוהה
**קובץ:** `client/src/pages/LoginPage.tsx`
**שורות מרובות**

**תוצאה צפויה:** כל הטקסט צריך להשתמש במפתחות תרגום
**תוצאה בפועל:** מחרוזות מקודדות מרובות

| שורה | טקסט | צריך להיות |
|------|------|------------|
| 118 | "Email" | t('auth.email') |
| 129 | "you@example.com" | t('auth.email_placeholder') |
| 138 | "Password" | t('auth.password') |
| 164 | "Signing in..." | t('auth.signing_in') |
| 167 | "Sign In" | t('auth.sign_in') |
| 178 | "OR" | t('auth.or') |
| 205 | "Continue with Google" | t('auth.google_signin') |
| 210 | "Don't have an account?" | t('auth.no_account') |
| 211 | "Create one" | t('auth.create_account') |
| 219 | Terms/Privacy text | t('auth.terms_agreement') |

---

## I18N-002: דף הרשמה - אנגלית מקודדת
**חומרה:** גבוהה
**קובץ:** `client/src/pages/RegisterPage.tsx`
**שורות מרובות**

| שורה | טקסט | צריך להיות |
|------|------|------------|
| 24-35 | שגיאות ולידציית סיסמה | t('validation.password_*') |
| 74 | "Start your writing journey" | t('auth.tagline') |
| 79 | "Create Account" | t('auth.create_account') |
| 91 | "Full Name" | t('auth.full_name') |
| 101 | "John Doe" | t('auth.name_placeholder') |
| 131 | "Password" | t('auth.password') |
| 148-150 | דרישות סיסמה | t('auth.password_requirements') |
| 155 | "Confirm Password" | t('auth.confirm_password') |
| 182 | "Creating account..." | t('auth.creating') |
| 223 | "Continue with Google" | t('auth.google_signin') |
| 228 | "Already have an account?" | t('auth.have_account') |
| 229 | "Sign in" | t('auth.sign_in') |

---

## I18N-003: הודעות Toast מקודדות
**חומרה:** בינונית
**קובץ:** קבצי לקוח מרובים

**דוגמאות שנמצאו:**
- `AuthorProfilePage.tsx:88` - "Failed to load profile"
- `AuthorProfilePage.tsx:97` - "Please login to follow authors"
- `BookLayoutPage.tsx:495` - "Error loading book"
- `BookLayoutPage.tsx:772` - "Error saving layout"
- `BookLayoutPage.tsx:834` - "Please select an image file"
- `BookLayoutPage.tsx:1005` - "Blank page added"
- `BookLayoutPage.tsx:1015` - "Only blank pages can be removed"
- `BookDetailsPage.tsx:109` - "Failed to load book details"
- `BookDetailsPage.tsx:127` - "Please login to like books"
- `BookDetailsPage.tsx:152` - "Please select a rating"

**תיקון:** החלף הכל במפתחות תרגום

---

## I18N-004: תרגומים inline בדף Layout
**חומרה:** בינונית
**קובץ:** `client/src/pages/BookLayoutPage.tsx`
**שורות:** 1460-1700

**תוצאה צפויה:** שימוש עקבי בפונקציית t()
**תוצאה בפועל:** ternary inline עבור עברית/אנגלית

```typescript
{language === 'he' ? 'הגדרות פריסה' : 'Layout Settings'}
{language === 'he' ? 'גודל גופן' : 'Font Size'}
{language === 'he' ? 'צבע טקסט' : 'Text Color'}
// ... ועוד רבים
```

**תיקון:** העבר הכל לקבצי תרגום והשתמש בפונקציית t()

---

## I18N-005: תרגומים inline ב-DraftNotes
**חומרה:** בינונית
**קובץ:** `client/src/components/editor/DraftNotes.tsx`
**שורות מרובות**

**תוצאה צפויה:** שימוש בפונקציית t()
**תוצאה בפועל:** בדיקות ternary inline

```typescript
{isHebrew ? 'טיוטות' : 'Draft Notes'}
{isHebrew ? 'הוסף טיוטה' : 'Add Note'}
{isHebrew ? 'כתוב את הרעיון שלך...' : 'Write your idea...'}
```

**תיקון:** השתמש בפונקציית תרגום מ-useTranslation hook

---

## I18N-006: תרגומים inline ב-ImageEditToolbar
**חומרה:** בינונית
**קובץ:** `client/src/components/layout/ImageEditToolbar.tsx`
**שורות מרובות**

**תוצאה צפויה:** שימוש בפונקציית t()
**תוצאה בפועל:** ternary inline לכל התוויות

**תיקון:** השתמש בפונקציית תרגום

---

## I18N-007: שמות צבעי הערות לא מתורגמים
**חומרה:** בינונית
**קובץ:** `client/src/components/editor/DraftNotes.tsx`
**שורות:** 30-37

**תוצאה צפויה:** שמות צבעים צריכים להיות מתורגמים
**תוצאה בפועל:** אנגלית בלבד

```typescript
const NOTE_COLORS = [
  { color: '#FEF08A', name: 'Yellow' },  // צריך להיות t('colors.yellow')
  { color: '#BBF7D0', name: 'Green' },
  ...
];
```

---

## I18N-008: תבניות מייל בעברית בלבד
**חומרה:** בינונית
**קובץ:** `server/src/controllers/paymentController.ts`
**שורות:** 257-281

**תוצאה צפויה:** מיילים צריכים להתאים להעדפת שפת המשתמש
**תוצאה בפועל:** כל תוכן המייל מקודד בעברית

```typescript
`שדרוג לחבילת ${planLabel}`
// צריך לבדוק user.language ולהשתמש בתבנית המתאימה
```

---

## I18N-009: כפתור Read Now בדף BookDetails
**חומרה:** נמוכה
**קובץ:** `client/src/pages/BookDetailsPage.tsx`
**שורה:** 349

**תוצאה צפויה:** טקסט כפתור מתורגם
**תוצאה בפועל:** מקודד "Read Now"

```typescript
? 'Read Now'
```

---

## I18N-010: פורמט תאריך/שעה
**חומרה:** נמוכה
**קובץ:** קבצים מרובים

**תוצאה צפויה:** תאריכים מפורמטים לפי locale
**תוצאה בפועל:** שימוש ב-toISOString() או פורמט בסיסי

**תיקון:** השתמש ב-Intl.DateTimeFormat או date-fns עם locale

---

## I18N-011: פורמט מספרים
**חומרה:** נמוכה
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורה:** 542

**תוצאה צפויה:** מספרים מפורמטים לפי locale
**תוצאה בפועל:** שימוש ב-toLocaleString() בלי locale ספציפי

```typescript
{book.statistics.wordCount.toLocaleString()}
```

**תיקון:** ציין locale: `toLocaleString(language === 'he' ? 'he-IL' : 'en-US')`

---

## I18N-012: משפחת גופנים מקודדת
**חומרה:** נמוכה
**קובץ:** `client/src/pages/BookLayoutPage.tsx`
**שורות:** 314-316

**תוצאה צפויה:** גופן ברירת מחדל צריך להתאים לשפה
**תוצאה בפועל:** תמיד "David Libre"

```typescript
fontFamily: 'David Libre',  // גופן עברי גם לספרים באנגלית
```

**תיקון:** ברירת מחדל לפי שפת הספר

---

## I18N-013: טיפול בכיוון
**חומרה:** נמוכה
**קובץ:** רכיבים מרובים

**תוצאה צפויה:** טיפול עקבי ב-RTL/LTR
**תוצאה בפועל:** חלק מהרכיבים בודקים `language === 'he'`, אחרים משתמשים ב-context

**תיקון:** סטנדרטיזציה של טיפול בכיוון באמצעות LanguageContext

---

# 4. בעיות עיצוב/UI

## UI-001: סגנונות כפתורים לא עקביים
**חומרה:** גבוהה
**קובץ:** רכיבים מרובים

**תוצאה צפויה:** עיצוב כפתורים עקבי באפליקציה
**תוצאה בפועל:** ערבוב של מחלקות כפתור שונות

**דוגמאות:**
- `btn-primary`, `btn-secondary`, `btn-ghost` (עקבי)
- מחלקות Tailwind inline (לא עקבי)
- חלק מהכפתורים חסרים hover states

**תיקון:** צור רכיב כפתור מאוחד עם variants

---

## UI-002: אי עקביות רקע Modal
**חומרה:** בינונית
**קובץ:** רכיבי modal מרובים

**תוצאה צפויה:** לכל המודלים צריך להיות רקע עקבי
**תוצאה בפועל:** ערכי opacity ו-blur שונים

- `bg-black/80 backdrop-blur-sm` (DashboardPage)
- `bg-black/70 backdrop-blur-md` (מודלים אחרים)

**תיקון:** צור רכיב Modal לשימוש חוזר עם עיצוב עקבי

---

## UI-003: התנגשויות Z-Index
**חומרה:** בינונית
**קובץ:** רכיבים מרובים

**תוצאה צפויה:** שכבות z-index עקביות
**תוצאה בפועל:** ערכי z-index שרירותיים

- `ImageEditToolbar: z-[9999]`
- `DraftNotes: z-30`
- מודלים שונים: z-50

**תיקון:** צור מערכת z-index בקונפיגורציית Tailwind

---

## UI-004: פערים בעיצוב רספונסיבי
**חומרה:** בינונית
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורות:** 309-435

**תוצאה צפויה:** כרטיסים צריכים לעבוד טוב בכל גדלי מסך
**תוצאה בפועל:** grid הכרטיסים עשוי לא להתאים היטב לגדלי טאבלט

**תיקון:** הוסף breakpoints ביניים (md) לתמיכה טובה יותר בטאבלט

---

## UI-005: מצבי טעינה לא עקביים
**חומרה:** בינונית
**קובץ:** דפים מרובים

**תוצאה צפויה:** spinners/skeletons טעינה עקביים
**תוצאה בפועל:** ערבוב של מחווני טעינה שונים

- חלק משתמשים ב-`<Loader2 className="animate-spin" />`
- חלק משתמשים במצבי טעינה מותאמים
- חלק לא מראים כלום בזמן טעינה

**תיקון:** צור רכיב LoadingSpinner ו-LoadingSkeleton לתוכן

---

## UI-006: נגישות בוחר צבעים
**חומרה:** נמוכה
**קובץ:** `client/src/components/editor/DraftNotes.tsx`
**שורות:** 198-209

**תוצאה צפויה:** כפתורי צבע צריכים תוויות נגישות
**תוצאה בפועל:** אין aria-label על כפתורי בוחר הצבע

```typescript
<button
  onClick={() => changeNoteColor(note.id, c.color)}
  // חסר: aria-label={c.name}
>
```

---

## UI-007: מצבי Focus חסרים
**חומרה:** נמוכה
**קובץ:** רכיבים מרובים

**תוצאה צפויה:** לכל האלמנטים האינטראקטיביים צריכים להיות מצבי focus גלויים
**תוצאה בפועל:** חלק מהכפתורים/inputs חסרים עיצוב focus-visible

**תיקון:** הוסף `focus-visible:ring-2 focus-visible:ring-offset-2` לאלמנטים אינטראקטיביים

---

## UI-008: מצב כהה בלבד
**חומרה:** נמוכה
**קובץ:** האפליקציה כולה

**תוצאה צפויה:** אפשרות מצב בהיר להעדפת משתמש
**תוצאה בפועל:** רק מצב כהה זמין

**תיקון:** הוסף toggle נושא (עדיפות נמוכה)

---

# 5. בעיות CRUD

## CRUD-001: מחיקת ספר בלי אישור
**חומרה:** גבוהה
**קובץ:** Admin panel / Book management

**תוצאה צפויה:** מחיקת ספר צריכה לדרוש אישור
**תוצאה בפועל:** המחיקה קורית מיד (אם מיושם)

**תיקון:** הוסף מודל אישור לפעולות הרסניות

---

## CRUD-002: אין Soft Delete לספרים
**חומרה:** גבוהה
**קובץ:** `server/src/controllers/adminController.ts`
**שורה:** 339

**תוצאה צפויה:** ספרים צריכים להימחק ב-soft-delete (ניתנים לשחזור)
**תוצאה בפועל:** hard delete מסיר נתונים לצמיתות

```typescript
await Book.deleteMany({ author: id });  // מחיקה קבועה
```

**תיקון:** יש ליישם soft delete עם חותמת זמן `deletedAt`

---

## CRUD-003: אין עדכונים אופטימיים
**חומרה:** בינונית
**קובץ:** רכיבי לקוח מרובים

**תוצאה צפויה:** UI צריך להתעדכן מיד, לחזור אחורה בשגיאה
**תוצאה בפועל:** ממתין לתגובת שרת לפני עדכון UI

**תיקון:** יש ליישם עדכונים אופטימיים ל-UX טוב יותר

---

## CRUD-004: שדות Created/Updated By חסרים
**חומרה:** בינונית
**קובץ:** מודלים של דאטאבייס

**תוצאה צפויה:** מעקב אחר מי יצר/שינה רשומות
**תוצאה בפועל:** רק timestamps, בלי reference למשתמש

**תיקון:** הוסף שדות `createdBy` ו-`updatedBy` למודלים

---

## CRUD-005: Cascade Delete לא מיושם
**חומרה:** בינונית
**קובץ:** `server/src/controllers/adminController.ts`
**שורות:** 338-342

**תוצאה צפויה:** מחיקת משתמש צריכה לנקות את כל הנתונים הקשורים
**תוצאה בפועל:** רק ספרים נמחקים, הודעות/עסקאות עלולות להישאר

```typescript
await Book.deleteMany({ author: id });
// חסר: ניקוי Message, Transaction, Notification
await User.findByIdAndDelete(id);
```

---

## CRUD-006: אין Pagination על פרקי ספר
**חומרה:** נמוכה
**קובץ:** Book API

**תוצאה צפויה:** ספרים גדולים צריכים pagination לפרקים
**תוצאה בפועל:** כל הפרקים מוחזרים בבת אחת

**תיקון:** הוסף pagination לספרים עם פרקים רבים

---

# 6. בעיות חוויית משתמש (UX)

## UX-001: אין מחוון שמירה אוטומטית
**חומרה:** גבוהה
**קובץ:** `client/src/pages/BookWritingPage.tsx`

**תוצאה צפויה:** המשתמש צריך לראות מתי העבודה נשמרת
**תוצאה בפועל:** אין משוב ויזואלי לסטטוס שמירה אוטומטית

**תיקון:** הוסף מחוון סטטוס שמירה (שומר/נשמר/שגיאה)

---

## UX-002: אין תמיכה ב-Undo/Redo
**חומרה:** בינונית
**קובץ:** רכיבי עורך

**תוצאה צפויה:** העורך צריך לתמוך ב-undo/redo עם Ctrl+Z/Y
**תוצאה בפועל:** תמיכת undo מוגבלת או ללא

**תיקון:** ודא שהרחבת history של TipTap מוגדרת

---

## UX-003: אין עזרה לקיצורי מקלדת
**חומרה:** בינונית
**קובץ:** כלל האפליקציה

**תוצאה צפויה:** משתמשים צריכים לראות קיצורים זמינים
**תוצאה בפועל:** אין תיעוד קיצורי מקלדת

**תיקון:** הוסף מודל/tooltip קיצורי מקלדת

---

## UX-004: מצבים ריקים יכולים להיות מועילים יותר
**חומרה:** בינונית
**קובץ:** רכיבים מרובים

**תוצאה צפויה:** מצבים ריקים צריכים לכוון משתמשים לפעולה
**תוצאה בפועל:** חלק מהמצבים הריקים פשוט מראים "אין פריטים"

**תיקון:** הוסף הודעות מועילות וכפתורי CTA

---

## UX-005: שליחת טופס ארוכה בלי משוב
**חומרה:** נמוכה
**קובץ:** הרשמה, יצירת ספר

**תוצאה צפויה:** נטרל כפתור שליחה והצג התקדמות
**תוצאה בפועל:** הכפתור מנוטרל אבל אין התקדמות ויזואלית לפעולות ארוכות

**תיקון:** הוסף מחווני התקדמות לפעולות ארוכות

---

## UX-006: אין אזהרת תפוגת Session
**חומרה:** נמוכה
**קובץ:** מערכת אימות

**תוצאה צפויה:** הזהר משתמש לפני תפוגת session
**תוצאה בפועל:** Session פג בשקט

**תיקון:** הוסף מודל אזהרת תפוגת session

---

# סדר עדיפויות לתיקון

## מיידי (לפני פרודקשן)
1. SEC-001: סיכון מצב תשלום מדומה
2. SEC-002: טוקן JWT ב-URL
3. SEC-003: Session Secret חלש
4. FUNC-001: מנתח PDF מנוטרל

## עדיפות גבוהה (שבוע 1)
5. SEC-004 עד SEC-008: בעיות אימות קלט
6. FUNC-002: הרחבות צבע TipTap
7. FUNC-003: פרק 1 מקודד
8. I18N-001, I18N-002: טקסט מקודד בהתחברות/הרשמה
9. CRUD-001, CRUD-002: אישור מחיקה ו-soft delete

## עדיפות בינונית (שבוע 2-3)
10. בעיות אבטחה SEC-009 עד SEC-016
11. בעיות פונקציונליות FUNC-005 עד FUNC-009
12. בעיות I18N I18N-003 עד I18N-008
13. בעיות UI UI-001 עד UI-005
14. בעיות UX UX-001 עד UX-004

## עדיפות נמוכה (Backlog)
15. בעיות חומרה נמוכה שנותרו
16. אופטימיזציות ביצועים
17. שיפורי נגישות

---

# המלצות בדיקה

## בדיקות אבטחה
- הרץ סריקת OWASP ZAP
- בדוק rate limiting ידנית
- ודא שכל נקודות הקצה דורשות אימות תקין
- בדוק SQL/NoSQL injection

## בדיקות פונקציונליות
- צור בדיקות E2E עם Playwright
- בדוק את כל תהליכי המשתמש
- בדוק edge cases (קלטים ריקים, קבצים גדולים וכו')

## בדיקות I18N
- סקור את כל המחרוזות עם דובר עברית
- בדוק layout RTL ביסודיות
- בדוק פורמט תאריך/מספר בשני ה-locales

## בדיקות UI
- בדיקות cross-browser (Chrome, Firefox, Safari, Edge)
- בדיקות רספונסיביות מובייל
- בדיקת נגישות עם Lighthouse

---

*הדוח נוצר על ידי מערכת QA AI*
*סקור ותעדף תיקונים לפי השפעה עסקית*
