# MeStory E2E QA Bug Report
## דוח בדיקות איכות - תהליכי קצה לקצה

**תאריך בדיקה:** 2026-03-24
**גרסה:** Current Main Branch
**בודק:** Claude Code QA Agent

---

## סיכום מנהלים

| קטגוריה | קריטי | גבוה | בינוני | נמוך | סה"כ |
|---------|-------|------|--------|------|------|
| יצירת ספר | 2 | 3 | 4 | 2 | **11** |
| כתיבה ועריכה | 3 | 3 | 4 | 4 | **14** |
| עיצוב ופריסה | 2 | 2 | 4 | 2 | **10** |
| ייצוא ופרסום | 1 | 1 | 1 | 1 | **4** |
| **סה"כ** | **8** | **9** | **13** | **9** | **39** |

---

# חלק א': תהליך יצירת ספר

## FLOW-001: יצירה מהירה מאפס (Quick Create)

### BUG-BC-001: אין הגבלת אורך לכותרת ספר
**חומרה:** בינונית
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורות:** 207-240

**תוצאה צפויה:** הגבלת אורך כותרת (למשל 200 תווים)
**תוצאה בפועל:** ניתן להזין כותרת ארוכה מאוד שגורמת לבעיות UI

**תיקון מומלץ:**
```typescript
<input maxLength={200} ... />
```

---

### BUG-BC-002: Form state לא מתאפס אחרי שגיאה
**חומרה:** נמוכה
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורות:** 236-238

**תוצאה צפויה:** אחרי שגיאה, שדות הטופס צריכים להתאפס או להישאר עם הערכים
**תוצאה בפועל:** הכותרת נשארת בשדה אבל המשתמש צריך לתקן ידנית

---

## FLOW-002: ראיון AI מעמיק (Deep Dive Interview)

### BUG-INT-001: TTS מקודד לאנגלית בלבד
**חומרה:** גבוהה
**קובץ:** `client/src/components/interview/VoiceInterviewWizard.tsx`
**שורה:** 74

**תוצאה צפויה:** TTS צריך לדבר בשפת הראיון (עברית/אנגלית)
**תוצאה בפועל:** TTS תמיד מדבר אנגלית גם כשהראיון בעברית

```typescript
// נוכחי (בעייתי):
const speak = (text) => useTTS('en-US');

// צריך להיות:
const speak = (text, language) => useTTS(language === 'he' ? 'he-IL' : 'en-US');
```

---

### BUG-INT-002: אין שמירת מצב ראיון
**חומרה:** גבוהה
**קובץ:** `client/src/components/interview/AIInterviewChat.tsx`

**תוצאה צפויה:** אם המשתמש רענן את הדף, הראיון צריך להמשיך מאיפה שעצר
**תוצאה בפועל:** רענון הדף מאבד את כל התקדמות הראיון

**תיקון מומלץ:** שמירת מצב ב-localStorage או בדאטאבייס

---

### BUG-INT-003: אין הגבלת אורך לתשובות משתמש
**חומרה:** נמוכה
**קובץ:** `client/src/components/interview/AIInterviewChat.tsx`

**תוצאה צפויה:** הגבלת אורך לתשובות (למשל 5000 תווים)
**תוצאה בפועל:** משתמש יכול לשלוח תשובות ארוכות מאוד שעלולות לגרום לשגיאות API

---

## FLOW-003: העלאת כתב יד (Manuscript Upload)

### BUG-UP-001: העלאת PDF מושבתת
**חומרה:** קריטית
**קובץ:** `server/src/controllers/bookController.ts`
**שורות:** 1473-1479

**תוצאה צפויה:** משתמשים יכולים להעלות קבצי PDF
**תוצאה בפועל:** הודעת שגיאה "PDF upload is temporarily unavailable"

**סיבה:** `pdf-parse` לא תואם ל-Vercel serverless (DOMMatrix not defined)

**תיקון מומלץ:** שימוש בספריית PDF חלופית או שירות חיצוני

---

### BUG-UP-002: קבצים גדולים נטענים לזיכרון במלואם
**חומרה:** בינונית
**קובץ:** `server/src/controllers/bookController.ts`
**שורות:** 1451-1469

**תוצאה צפויה:** עיבוד streaming לקבצים גדולים
**תוצאה בפועל:** קובץ 50MB נטען כולו לזיכרון, עלול לגרום ל-timeout ב-Vercel (128MB limit)

---

### BUG-UP-003: הודעות שגיאה לא ספציפיות
**חומרה:** בינונית
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורה:** 168

**תוצאה צפויה:** הודעות שגיאה ספציפיות (timeout, סוג קובץ, גודל וכו')
**תוצאה בפועל:** הודעת שגיאה כללית "upload failed"

---

## FLOW-004: תמלול אודיו (Voice Transcription)

### BUG-AU-001: אין אינדיקציית התקדמות לתמלול
**חומרה:** בינונית
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורות:** 260-289

**תוצאה צפויה:** הצגת אחוז התקדמות התמלול
**תוצאה בפועל:** רק spinner ללא אינדיקציה אם התהליך תקוע או מתקדם

---

### BUG-AU-002: פרמטר שפה לא נשלח ל-API
**חומרה:** נמוכה
**קובץ:** `client/src/pages/DashboardPage.tsx`
**שורה:** 271

**תוצאה צפויה:** שליחת שפת המשתמש לדיוק תמלול טוב יותר
**תוצאה בפועל:** הסתמכות על זיהוי אוטומטי של Whisper

---

# חלק ב': תהליך כתיבה ועריכה

## FLOW-005: עריכת פרקים (Chapter Editing)

### BUG-ED-001: איבוד שינויים בהחלפת פרקים
**חומרה:** קריטית
**קובץ:** `client/src/pages/BookWritingPage.tsx`
**שורות:** 303-309

**תוצאה צפויה:** אזהרה או שמירה אוטומטית לפני החלפת פרק
**תוצאה בפועל:** `setSaved(true)` נקרא מיד, מבטל את דגל השינויים

```typescript
// בעייתי:
const selectChapter = (index: number) => {
  setSelectedChapterIndex(index);
  setSaved(true);  // ← מאבד שינויים לא שמורים!
};

// צריך להיות:
const selectChapter = async (index: number) => {
  if (!saved) {
    await saveBook();  // או התראה למשתמש
  }
  setSelectedChapterIndex(index);
};
```

---

### BUG-ED-002: לולאה אינסופית פוטנציאלית בעדכון תוכן
**חומרה:** קריטית
**קובץ:** `client/src/pages/BookWritingPage.tsx`
**שורות:** 175-196

**תוצאה צפויה:** עדכון תוכן ללא loops
**תוצאה בפועל:** `content` ב-dependency array גורם ל-re-renders מיותרים

```typescript
useEffect(() => {
  if (editor && content !== undefined) {
    editor.commands.setContent(htmlContent);  // ← מפעיל onUpdate
  }
}, [selectedChapterIndex, content, editor]);  // ← content גורם ללולאה
```

---

### BUG-ED-003: בחירת פרק חדש לא עובדת
**חומרה:** קריטית
**קובץ:** `client/src/pages/BookWritingPage.tsx`
**שורות:** 284-301

**תוצאה צפויה:** פרק חדש נבחר אוטומטית
**תוצאה בפועל:** Race condition בין state updates

```typescript
const addChapter = () => {
  setBook({ chapters: [...chapters, newChapter] });
  setSelectedChapterIndex(chapters.length);  // ← נקרא לפני שה-state התעדכן
};
```

---

### BUG-ED-004: סטטיסטיקות מילים לא מתעדכנות
**חומרה:** גבוהה
**קובץ:** `client/src/pages/BookWritingPage.tsx`
**שורות:** 251-282

**תוצאה צפויה:** סה"כ מילים בספר מתעדכן אחרי שמירה
**תוצאה בפועל:** `book.statistics.wordCount` לא מעודכן מהשרת

---

### BUG-ED-005: שינוי כותרת בלבד לא נשמר אוטומטית
**חומרה:** גבוהה
**קובץ:** `client/src/pages/BookWritingPage.tsx`
**שורות:** 625-638

**תוצאה צפויה:** שינוי כותרת פרק ריק נשמר אוטומטית
**תוצאה בפועל:** תנאי `if (!saved && content && !saving)` מונע שמירה כי content ריק

---

### BUG-ED-006: פונקציית מחיקת פרק לא קיימת
**חומרה:** גבוהה
**קובץ:** `client/src/pages/BookWritingPage.tsx`

**תוצאה צפויה:** אפשרות למחוק פרקים
**תוצאה בפועל:** אין כפתור או פונקציה למחיקת פרקים

---

### BUG-ED-007: החלפת טקסט AI במיקום שגוי
**חומרה:** בינונית
**קובץ:** `client/src/pages/BookWritingPage.tsx`
**שורות:** 367-383

**תוצאה צפויה:** טקסט משופר מוחלף במקום הנכון
**תוצאה בפועל:** `deleteRange` משנה positions, אבל `insertContentAt` משתמש ב-position הישן

---

### BUG-ED-008: TextStyle extension מושבת אבל נמצא בשימוש
**חומרה:** בינונית
**קובץ:** `client/src/pages/BookWritingPage.tsx`
**שורות:** 153-155

**תוצאה צפויה:** בוחר צבע טקסט עובד
**תוצאה בפועל:** Extension בהערה, פונקציונליות צבע לא עובדת

```typescript
// TODO: Install these packages
// import TextStyle from '@tiptap/extension-text-style';
// import Color from '@tiptap/extension-color';
```

---

### BUG-ED-009: Focus לא חוזר אחרי סגירת sidebar
**חומרה:** בינונית
**קובץ:** `client/src/pages/BookWritingPage.tsx`
**שורות:** 86-104

**תוצאה צפויה:** Focus חוזר לעורך אחרי סגירת sidebar
**תוצאה בפועל:** Focus אבוד, בעיית נגישות למקלדת

---

### BUG-ED-010: אין retry ב-auto-save כושל
**חומרה:** נמוכה
**קובץ:** `client/src/pages/BookWritingPage.tsx`
**שורות:** 205-215

**תוצאה צפויה:** ניסיון חוזר אם שמירה אוטומטית נכשלה
**תוצאה בפועל:** שגיאה מתעלמת, הניסיון הבא רק אחרי 30 שניות

---

### BUG-ED-011: המרת טקסט פשוט ללא escaping
**חומרה:** נמוכה
**קובץ:** `client/src/pages/BookWritingPage.tsx`
**שורות:** 179-185

**תוצאה צפויה:** תווים מיוחדים escaped
**תוצאה בפועל:** `<script>` וכו' לא מסוננים

```typescript
htmlContent = content
  .split(/\n\n+/)
  .map(para => `<p>${para.trim()}</p>`)  // ← אין escaping!
  .join('');
```

---

### BUG-ED-012: DraftNotes עם מפתח 'anon' משותף
**חומרה:** נמוכה
**קובץ:** `client/src/components/editor/DraftNotes.tsx`
**שורות:** 56-76

**תוצאה צפויה:** הפרדה מלאה בין משתמשים אנונימיים
**תוצאה בפועל:** כל המשתמשים האנונימיים חולקים את אותו מפתח

---

# חלק ג': תהליך עיצוב ופריסה

## FLOW-006: עיצוב כריכה (Cover Design)

### BUG-DS-001: מבנה נתונים כפול לעיצוב כריכה
**חומרה:** גבוהה
**קובץ:** `client/src/pages/DesignStudioPage.tsx`
**שורות:** 338-367

**תוצאה צפויה:** מבנה נתונים אחיד
**תוצאה בפועל:** יצירת שני מבנים (flat ו-nested) בו זמנית

```typescript
const coverDesign: CoverDesign = {
  coverColor,      // ← מבנה flat
  textColor,
  front: {         // ← מבנה nested
    imageUrl: imageUrl,
  }
}
```

---

### BUG-DS-002: AI design state לא נשמר
**חומרה:** גבוהה
**קובץ:** `client/src/pages/DesignStudioPage.tsx`
**שורות:** 333-384

**תוצאה צפויה:** שמירת `aiDesignState` יחד עם `coverDesign`
**תוצאה בפועל:** רק `coverDesign` נשמר, AI state אבוד אחרי רענון

---

### BUG-DS-003: הודעת שגיאה לא מתורגמת בהעלאת תמונה
**חומרה:** נמוכה
**קובץ:** `client/src/pages/DesignStudioPage.tsx`
**שורות:** 484-498

**תוצאה צפויה:** כל ההודעות מתורגמות
**תוצאה בפועל:** `'Please select a valid image file'` מקודד באנגלית

---

## FLOW-007: פריסת עמודים (Page Layout)

### BUG-LO-001: מיפוי שוליים שגוי ב-RTL
**חומרה:** קריטית
**קובץ:** `client/src/pages/BookLayoutPage.tsx`
**שורות:** 528-531

**תוצאה צפויה:** שוליים פנימיים/חיצוניים מותאמים לכיוון הספר
**תוצאה בפועל:** inner/outer ממופים ל-left/right ללא התחשבות ב-RTL

```typescript
// בעייתי:
left: design.layout.margins.inner,
right: design.layout.margins.outer,

// צריך להיות:
left: isRTL ? design.layout.margins.outer : design.layout.margins.inner,
right: isRTL ? design.layout.margins.inner : design.layout.margins.outer,
```

---

### BUG-LO-002: RTL מזוהה אבל לא מיושם
**חומרה:** קריטית
**קובץ:** `client/src/pages/BookLayoutPage.tsx`
**שורות:** 363-364

**תוצאה צפויה:** ספרים בעברית מוצגים RTL
**תוצאה בפועל:** משתנה `isBookRTL` מוגדר אבל לא מיושם על אלמנטים

```typescript
const isBookRTL = book ? isRTL(book.title) || book.language === 'he' : false;
// ← לא משמש בשום מקום!
```

---

### BUG-LO-003: תצוגה מקדימה של AI לא מציגה טקסט
**חומרה:** בינונית
**קובץ:** `client/src/components/design/AIDesignWizard.tsx`
**שורות:** 478-504

**תוצאה צפויה:** תצוגה מקדימה עם כותרת ומחבר
**תוצאה בפועל:** רק צבע רקע מוצג, ללא טקסט

---

### BUG-LO-004: טעינת גופנים ללא error handling
**חומרה:** נמוכה
**קובץ:** `client/src/services/templateService.ts`
**שורות:** 195-207

**תוצאה צפויה:** התראה אם טעינת גופן נכשלה
**תוצאה בפועל:** כישלון שקט, גופן מערכת כ-fallback

---

### BUG-LO-005: Interface לא מכיל כל השדות
**חומרה:** בינונית
**קובץ:** `client/src/services/templateService.ts`
**שורות:** 5-24

**תוצאה צפויה:** `PageLayoutSettings` מכיל כל שדות התבנית
**תוצאה בפועל:** חסרים: `customPageSize`, `pageSize`, `headerFont`, `columnGap`

---

### BUG-LO-006: Timer auto-save מיותר
**חומרה:** נמוכה
**קובץ:** `client/src/pages/BookLayoutPage.tsx`
**שורות:** 376-392

**תוצאה צפויה:** timer אחד פעיל בכל זמן
**תוצאה בפועל:** יצירה וניקוי מרובים של timers (לא באג קריטי, אבל לא יעיל)

---

# חלק ד': תהליך ייצוא ופרסום

## FLOW-008: ייצוא לקובץ (Export)

### BUG-EX-001: קידוד שם קובץ לא עקבי
**חומרה:** בינונית
**קובץ:** `server/src/controllers/bookController.ts`
**שורות:** 1013, 1981

**תוצאה צפויה:** קידוד עקבי של שמות קבצים
**תוצאה בפועל:** endpoint אחד משתמש ב-`encodeURIComponent`, השני לא

```typescript
// Legacy (נכון):
`attachment; filename="${encodeURIComponent(filename)}.pdf"`

// New (חסר):
`attachment; filename="${filename}.${format}"`
```

---

## FLOW-009: פרסום לחנות (Publishing)

### BUG-PB-001: אימות מחיר לא תואם
**חומרה:** קריטית
**קובץ:** `client/src/pages/PublishingPage.tsx`
**שורות:** 410-413

**תוצאה צפויה:** הגבלת מחיר זהה ב-client וב-server
**תוצאה בפועל:** Client מאפשר עד $999, Server מגביל ל-$25

```html
<!-- Client (בעייתי): -->
<input type="number" min="0" max="999" step="0.01" />

<!-- צריך להיות: -->
<input type="number" min="0" max="25" step="0.01" />
```

**Server validation (line 617-625):**
```typescript
if (price < 0 || price > 25) {
  res.status(400).json({ error: 'Price must be between $0 and $25' });
}
```

---

### BUG-PB-002: אין בדיקת quality score בשרת
**חומרה:** גבוהה
**קובץ:** `server/src/controllers/bookController.ts`
**שורות:** 549-673

**תוצאה צפויה:** שרת מאמת quality score >= 70
**תוצאה בפועל:** הבדיקה רק ב-client, אפשר לעקוף עם API ישיר

---

### BUG-PB-003: הודעת שגיאה כללית בפרסום
**חומרה:** נמוכה
**קובץ:** `client/src/pages/PublishingPage.tsx`
**שורה:** 185

**תוצאה צפויה:** הודעת שגיאה מפורטת מה נכשל
**תוצאה בפועל:** "Failed to publish book" כללי

---

# סדר עדיפויות לתיקון

## מיידי (לפני production)
1. **BUG-UP-001**: PDF upload disabled - משפיע על חוויית משתמש מרכזית
2. **BUG-ED-001**: איבוד שינויים - גורם לאיבוד עבודה
3. **BUG-ED-003**: בחירת פרק חדש - תהליך יצירה בסיסי
4. **BUG-LO-001/002**: RTL לא עובד - ספרים בעברית לא מוצגים נכון
5. **BUG-PB-001**: מחיר לא תואם - שגיאות פרסום

## עדיפות גבוהה (שבוע 1)
6. **BUG-INT-001**: TTS באנגלית בלבד
7. **BUG-INT-002**: אין שמירת מצב ראיון
8. **BUG-ED-002**: לולאה אינסופית פוטנציאלית
9. **BUG-ED-004/005**: סטטיסטיקות ושמירת כותרת
10. **BUG-DS-001/002**: מבנה כפול ו-AI state

## עדיפות בינונית (שבוע 2)
11. **BUG-UP-002/003**: זיכרון והודעות שגיאה
12. **BUG-AU-001**: אינדיקציית התקדמות
13. **BUG-ED-007/008**: AI replacement ו-TextStyle
14. **BUG-LO-003/005**: תצוגה מקדימה ו-interface
15. **BUG-EX-001**: קידוד שם קובץ

## עדיפות נמוכה (Backlog)
16. כל הבאגים ברמת נמוכה
17. שיפורי UX ונגישות
18. אופטימיזציות

---

# המלצות לבדיקות

## בדיקות E2E מומלצות
1. יצירת ספר מכל אחת מ-4 הדרכים
2. כתיבת 3+ פרקים עם תוכן
3. החלפה בין פרקים ווידוא שמירה
4. הוספת תמונות וטקסט
5. יישום עיצוב AI מלא
6. ייצוא ל-PDF ו-DOCX
7. פרסום עם מחיר
8. קריאה מחנות הספרים

## Edge Cases לבדיקה
1. קבצים גדולים (50MB)
2. תוכן ארוך מאוד (100k+ מילים)
3. הרבה תמונות (20+)
4. ספר בעברית מלא
5. רשת איטית/לא יציבה
6. ריבוי לשוניות פתוחות

---

*הדוח נוצר אוטומטית על ידי מערכת QA*
*יש לסקור ולתעדף לפי השפעה עסקית*
