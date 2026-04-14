# MeStory - Claude Cowork Testing Strategy
## מסמך אפיון אסטרטגי לתוכנית בדיקות

**תאריך:** 2026-04-13
**גרסה:** 1.0
**מחבר:** Claude Code
**מבצע:** Claude Cowork

---

## ⚠️ CRITICAL: הפעלת המערכת לפני הבדיקות

**לפני שמתחילים בדיקות, חובה להפעיל את המערכת ב-localhost!**

### הפעלת השרת (Terminal 1):
```bash
cd "c:/Users/maora/OneDrive/שולחן העבודה/MeStory/server"
npm install  # רק בפעם הראשונה
npm run dev
```
✓ Server running on: **http://localhost:5000**

### הפעלת הלקוח (Terminal 2):
```bash
cd "c:/Users/maora/OneDrive/שולחן העבודה/MeStory/client"
npm install  # רק בפעם הראשונה
npm run dev
```
✓ Client running on: **http://localhost:5173**

### אימות:
- [ ] פתח http://localhost:5173 בדפדפן
- [ ] וודא שדף הנחיתה נטען
- [ ] וודא שאין שגיאות בקונסול

**📖 למדריך מפורט ראה: [COWORK_EXECUTION_GUIDE.md](COWORK_EXECUTION_GUIDE.md)**

---

## 1. סקירה כללית

### 1.1 מטרת המסמך
מסמך זה מגדיר את האסטרטגיה המלאה לביצוע בדיקות ידניות על מערכת MeStory באמצעות Claude Cowork. המסמך כולל חלוקה לאיג'נטים וסב-איג'נטים, הגדרת סוגי בדיקות, ותוכנית ביצוע מפורטת.

### 1.2 היקף הבדיקות
- **בדיקות פונקציונליות:** E2E, CRUD, GUI, הרשאות
- **בדיקות לא-פונקציונליות:** i18n, UX, נגישות, תאימות, ביצועים, עומסים, נפחים, גיבוי ושחזור

### 1.3 סביבות בדיקה
| סביבה | כתובת | תיאור |
|--------|--------|---------|
| Development | http://localhost:5173 (Client) + http://localhost:5000 (API) | פיתוח מקומי - **זו הסביבה לבדיקות** |
| Staging | staging.mestory.app | טרום-ייצור |
| Production | mestory.app | ייצור |

---

## 2. ארכיטקטורת האיג'נטים

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLAUDE COWORK - MASTER ORCHESTRATOR              │
│                         (תיאום ובקרה כללית)                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  FUNCTIONAL AGENT │   │ NON-FUNCTIONAL    │   │   REPORTING       │
│   (בדיקות פונקציו) │   │     AGENT         │   │     AGENT         │
│                   │   │ (בדיקות לא-פונקצ) │   │   (דיווח ומעקב)    │
└───────────────────┘   └───────────────────┘   └───────────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
   Sub-Agents              Sub-Agents               Sub-Agents
```

---

## 3. הגדרת איג'נטים וסב-איג'נטים

### 3.1 MASTER ORCHESTRATOR (איג'נט ראשי)

**תפקיד:** תיאום כל פעולות הבדיקה, ניהול תורים, איסוף תוצאות, קבלת החלטות

**אחריות:**
- הפעלת איג'נטים משניים לפי סדר עדיפויות
- ניטור התקדמות בדיקות
- טיפול בחריגות ותקלות
- הפקת דו"חות סיכום
- החלטה על עצירת/המשך בדיקות

**פקודות:**
```
/start-testing [scope] - התחלת מחזור בדיקות
/status - סטטוס נוכחי
/pause - השהיית בדיקות
/resume - המשך בדיקות
/abort - ביטול מחזור
/report - הפקת דו"ח
```

---

### 3.2 FUNCTIONAL TESTING AGENT (איג'נט בדיקות פונקציונליות)

**תפקיד:** ניהול כל הבדיקות הפונקציונליות

#### Sub-Agent 3.2.1: E2E Testing Agent
**תחום אחריות:** בדיקות מקצה לקצה

| מזהה | תרחיש | עדיפות |
|------|--------|---------|
| E2E-001 | User Registration Flow | Critical |
| E2E-002 | Book Creation to Publishing | Critical |
| E2E-003 | Book Purchase Flow | Critical |
| E2E-004 | Author Earnings & Payout | High |
| E2E-005 | AI Interview to Book | High |
| E2E-006 | Design Wizard Complete Flow | High |
| E2E-007 | Subscription Upgrade Flow | Medium |
| E2E-008 | Refund Request Flow | Medium |

#### Sub-Agent 3.2.2: CRUD Testing Agent
**תחום אחריות:** בדיקות יצירה, קריאה, עדכון, מחיקה

| אובייקט | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| User | CRUD-U01 | CRUD-U02 | CRUD-U03 | CRUD-U04 |
| Book | CRUD-B01 | CRUD-B02 | CRUD-B03 | CRUD-B04 |
| Chapter | CRUD-C01 | CRUD-C02 | CRUD-C03 | CRUD-C04 |
| Review | CRUD-R01 | CRUD-R02 | CRUD-R03 | CRUD-R04 |
| Message | CRUD-M01 | CRUD-M02 | CRUD-M03 | CRUD-M04 |
| Template | CRUD-T01 | CRUD-T02 | CRUD-T03 | CRUD-T04 |
| Notification | CRUD-N01 | CRUD-N02 | CRUD-N03 | CRUD-N04 |

#### Sub-Agent 3.2.3: GUI Testing Agent
**תחום אחריות:** בדיקות ממשק משתמש

**דפים לבדיקה:**
- דפים ציבוריים: Landing, Login, Register, Marketplace, Book Details, FAQ, About
- דפים מוגנים: Dashboard, Editor, Design Studio, Layout, Publish, Library, Earnings, Settings
- דפי Admin: Admin Dashboard, Analytics, User Management

**בדיקות לכל דף:**
- רנדור תקין של כל הקומפוננטות
- Responsive Design (Mobile, Tablet, Desktop)
- אינטראקציות (לחיצות, hover, focus)
- טעינת תמונות ונכסים
- אנימציות ומעברים
- טפסים וולידציה

#### Sub-Agent 3.2.4: Authorization Testing Agent
**תחום אחריות:** בדיקות הרשאות

| רמת הרשאה | מזהה בדיקה | תיאור |
|-----------|-------------|--------|
| Guest | AUTH-G01-G10 | גישה ללא התחברות |
| FREE User | AUTH-F01-F20 | משתמש חינמי |
| STANDARD User | AUTH-S01-S20 | משתמש סטנדרטי |
| PREMIUM User | AUTH-P01-P20 | משתמש פרימיום |
| ADMIN | AUTH-A01-A30 | מנהל מערכת |

**תרחישי בדיקה:**
- ניסיון גישה לדפים מוגנים ללא התחברות
- ניסיון גישה לפעולות מוגבלות לפי רמת מנוי
- ניסיון גישה לדפי Admin ללא הרשאה
- Token expiration וטיפול בו
- Cross-user access (ניסיון עריכת ספר של משתמש אחר)

---

### 3.3 NON-FUNCTIONAL TESTING AGENT (איג'נט בדיקות לא-פונקציונליות)

#### Sub-Agent 3.3.1: i18n Testing Agent
**תחום אחריות:** בדיקות בינלאומיות ותרגום

**בדיקות:**
| מזהה | בדיקה | תיאור |
|------|--------|---------|
| I18N-001 | Hebrew UI | כל הטקסטים בעברית מוצגים נכון |
| I18N-002 | English UI | כל הטקסטים באנגלית מוצגים נכון |
| I18N-003 | RTL Layout | תמיכה בכיוון RTL בעברית |
| I18N-004 | LTR Layout | תמיכה בכיוון LTR באנגלית |
| I18N-005 | Language Switch | מעבר בין שפות |
| I18N-006 | Date Format | פורמט תאריכים לפי שפה |
| I18N-007 | Number Format | פורמט מספרים לפי שפה |
| I18N-008 | Currency Display | תצוגת מטבע (USD/ILS) |
| I18N-009 | Missing Translations | זיהוי מפתחות חסרים |
| I18N-010 | Book Translation | תרגום ספר עברית↔אנגלית |

#### Sub-Agent 3.3.2: UX Testing Agent
**תחום אחריות:** בדיקות חווית משתמש

**קריטריונים:**
| מזהה | קריטריון | מדד |
|------|----------|-----|
| UX-001 | זמן למשימה ראשונה | < 30 שניות |
| UX-002 | מספר קליקים ליעד | < 5 קליקים |
| UX-003 | Feedback ויזואלי | מיידי (<100ms) |
| UX-004 | Error Recovery | אפשרות לתקן טעויות |
| UX-005 | הנחיות והדרכה | בהירות הוראות |
| UX-006 | עקביות עיצובית | סגנון אחיד |
| UX-007 | Loading States | מצבי טעינה ברורים |
| UX-008 | Empty States | מצבים ריקים מובנים |
| UX-009 | Success States | אישור הצלחה ברור |
| UX-010 | Error Messages | הודעות שגיאה מועילות |

#### Sub-Agent 3.3.3: Usability Testing Agent
**תחום אחריות:** בדיקות שימושיות

**תרחישי משתמש:**
1. **משתמש חדש** - הרשמה ויצירת ספר ראשון
2. **סופר מתחיל** - שימוש בכלי AI לכתיבה
3. **סופר מנוסה** - עיצוב ופרסום ספר
4. **קורא** - חיפוש ורכישת ספר
5. **מנהל** - ניהול פלטפורמה

#### Sub-Agent 3.3.4: Accessibility Testing Agent (WCAG 2.1)
**תחום אחריות:** בדיקות נגישות

| קטגוריה | מזהה | בדיקה | רמה |
|---------|------|--------|-----|
| Perceivable | A11Y-P01 | Alt text לתמונות | A |
| Perceivable | A11Y-P02 | Color contrast | AA |
| Perceivable | A11Y-P03 | Text resize | AA |
| Operable | A11Y-O01 | Keyboard navigation | A |
| Operable | A11Y-O02 | Focus indicators | AA |
| Operable | A11Y-O03 | Skip links | A |
| Understandable | A11Y-U01 | Form labels | A |
| Understandable | A11Y-U02 | Error identification | A |
| Robust | A11Y-R01 | Valid HTML | A |
| Robust | A11Y-R02 | ARIA landmarks | AA |

#### Sub-Agent 3.3.5: Compatibility Testing Agent
**תחום אחריות:** בדיקות תאימות

**דפדפנים:**
| דפדפן | גרסאות | עדיפות |
|--------|---------|---------|
| Chrome | 100+ | Critical |
| Firefox | 100+ | High |
| Safari | 15+ | High |
| Edge | 100+ | Medium |
| Mobile Safari | iOS 14+ | Critical |
| Chrome Mobile | Android 10+ | Critical |

**מכשירים:**
| סוג | רזולוציות | עדיפות |
|-----|-----------|---------|
| Mobile | 375x667, 414x896 | Critical |
| Tablet | 768x1024, 834x1194 | High |
| Desktop | 1366x768, 1920x1080 | Critical |
| 4K | 3840x2160 | Low |

#### Sub-Agent 3.3.6: Performance Testing Agent
**תחום אחריות:** בדיקות ביצועים

**מדדי Web Vitals:**
| מדד | יעד | בדיקה |
|-----|-----|--------|
| LCP | < 2.5s | PERF-001 |
| FID | < 100ms | PERF-002 |
| CLS | < 0.1 | PERF-003 |
| TTFB | < 600ms | PERF-004 |
| FCP | < 1.8s | PERF-005 |

**בדיקות ספציפיות:**
| מזהה | בדיקה | יעד |
|------|--------|-----|
| PERF-010 | טעינת Dashboard | < 3s |
| PERF-011 | טעינת Editor | < 4s |
| PERF-012 | טעינת Marketplace | < 2s |
| PERF-013 | חיפוש ספרים | < 500ms |
| PERF-014 | שמירת פרק | < 2s |
| PERF-015 | יצירת תמונה AI | < 30s |
| PERF-016 | ייצוא PDF | < 10s |

#### Sub-Agent 3.3.7: Load Testing Agent
**תחום אחריות:** בדיקות עומסים

**תרחישי עומס:**
| מזהה | תרחיש | משתמשים | משך |
|------|--------|----------|-----|
| LOAD-001 | Normal Load | 100 | 30 min |
| LOAD-002 | Peak Load | 500 | 15 min |
| LOAD-003 | Stress Test | 1000 | 10 min |
| LOAD-004 | Spike Test | 0→500→0 | 5 min |
| LOAD-005 | Endurance | 200 | 4 hours |

**פעולות לסימולציה:**
- גלישה בMarketplace
- קריאת ספרים
- כתיבה ושמירה
- שימוש ב-AI
- העלאת קבצים

#### Sub-Agent 3.3.8: Volume Testing Agent
**תחום אחריות:** בדיקות נפחים

| מזהה | תרחיש | נפח |
|------|--------|-----|
| VOL-001 | ספר עם פרקים רבים | 100 פרקים |
| VOL-002 | פרק ארוך | 50,000 מילים |
| VOL-003 | ספרייה גדולה | 1000 ספרים |
| VOL-004 | הודעות רבות | 10,000 הודעות |
| VOL-005 | ביקורות רבות | 500 ביקורות/ספר |
| VOL-006 | תמונות רבות | 100 תמונות/ספר |
| VOL-007 | משתמשים רבים | 100,000 משתמשים |

#### Sub-Agent 3.3.9: Backup & Recovery Testing Agent
**תחום אחריות:** בדיקות גיבוי ושחזור

| מזהה | בדיקה | תיאור |
|------|--------|---------|
| BR-001 | Auto-save | שמירה אוטומטית של טיוטות |
| BR-002 | Version History | גרסאות קודמות של פרקים |
| BR-003 | DB Backup | גיבוי מסד נתונים |
| BR-004 | DB Restore | שחזור מגיבוי |
| BR-005 | File Recovery | שחזור קבצים שנמחקו |
| BR-006 | Session Recovery | שחזור אחרי נפילת session |
| BR-007 | Transaction Rollback | ביטול עסקה שנכשלה |
| BR-008 | Data Export | ייצוא נתוני משתמש (GDPR) |

---

### 3.4 REPORTING AGENT (איג'נט דיווח)

**תפקיד:** איסוף תוצאות, יצירת דו"חות, מעקב מגמות

**דו"חות:**
| סוג | תדירות | פורמט |
|-----|---------|--------|
| Daily Summary | יומי | Markdown |
| Test Results | בזמן אמת | JSON |
| Bug Report | לפי צורך | Markdown |
| Coverage Report | סיום מחזור | Excel |
| Trend Analysis | שבועי | Charts |

---

## 4. מתודולוגיית ביצוע

### 4.1 סדר עדיפויות

```
Priority 1 (Critical) - חובה לפני כל Release
├── Authentication flows
├── Book purchase flow
├── Payment processing
└── Data integrity

Priority 2 (High) - חובה לפני Major Release
├── E2E core flows
├── CRUD operations
├── Authorization
└── i18n

Priority 3 (Medium) - מומלץ
├── Performance
├── Usability
├── Compatibility
└── Accessibility

Priority 4 (Low) - לפי זמן פנוי
├── Edge cases
├── Volume testing
├── Stress testing
└── Backup & Recovery
```

### 4.2 תהליך ביצוע בדיקה

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Prepare   │────▶│   Execute   │────▶│   Verify    │
│  (הכנה)     │     │  (ביצוע)    │     │  (אימות)    │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                    ┌─────────────┐              │
                    │   Report    │◀─────────────┘
                    │  (דיווח)    │
                    └─────────────┘
```

### 4.3 מצבי בדיקה

| מצב | תיאור | פעולה |
|-----|--------|--------|
| PASS | עבר בהצלחה | המשך לבדיקה הבאה |
| FAIL | נכשל | דיווח באג, המשך |
| BLOCKED | חסום | דיווח, דלג, חזור מאוחר |
| SKIP | דילוג | תעד סיבה, המשך |
| N/A | לא רלוונטי | סמן וסיים |

---

## 5. קריטריוני כניסה ויציאה

### 5.1 קריטריוני כניסה (Entry Criteria)

- [ ] Build עובר בהצלחה
- [ ] סביבת בדיקות זמינה
- [ ] נתוני בדיקה מוכנים
- [ ] גישה לכל הכלים נדרשים
- [ ] תיעוד דרישות זמין

### 5.2 קריטריוני יציאה (Exit Criteria)

- [ ] 100% Critical tests passed
- [ ] ≥95% High priority tests passed
- [ ] ≥90% Medium priority tests passed
- [ ] אין באגים Critical פתוחים
- [ ] ≤3 באגים High פתוחים
- [ ] דו"ח סיכום מאושר

---

## 6. ניהול באגים

### 6.1 רמות חומרה

| רמה | תיאור | SLA |
|-----|--------|-----|
| Critical | מערכת לא עובדת | 4 שעות |
| High | פונקציונליות מרכזית פגועה | 24 שעות |
| Medium | פגיעה בחוויה | 72 שעות |
| Low | קוסמטי | לפי עדיפות |

### 6.2 מבנה דיווח באג

```markdown
## Bug Report

**ID:** BUG-XXXX
**Title:** [תיאור קצר]
**Severity:** Critical/High/Medium/Low
**Component:** [קומפוננטה]
**Found by:** [Agent ID]
**Date:** YYYY-MM-DD

### Steps to Reproduce
1. ...
2. ...
3. ...

### Expected Result
...

### Actual Result
...

### Evidence
- Screenshot: [link]
- Console log: [log]
- Network: [HAR file]

### Environment
- Browser: ...
- OS: ...
- User type: ...
```

---

## 7. כלים וטכנולוגיות

| כלי | שימוש |
|-----|--------|
| Playwright/Puppeteer | אוטומציה דפדפן |
| Lighthouse | ביצועים ונגישות |
| axe-core | בדיקות נגישות |
| k6/Artillery | בדיקות עומס |
| BrowserStack | Cross-browser |
| Chrome DevTools | Debug & Performance |

---

## 8. לוח זמנים מוצע

| שבוע | פעילות | איג'נטים פעילים |
|------|---------|------------------|
| 1 | E2E Critical + CRUD | Functional Agent |
| 2 | GUI + Authorization | Functional Agent |
| 3 | i18n + UX + Usability | Non-Functional Agent |
| 4 | Accessibility + Compatibility | Non-Functional Agent |
| 5 | Performance + Load | Non-Functional Agent |
| 6 | Volume + Backup | Non-Functional Agent |
| 7 | Regression + Bug Fixes | All Agents |
| 8 | Final Report | Reporting Agent |

---

## 9. הפעלת Claude Cowork

### 9.1 פקודת התחלה

```bash
claude-cowork start --config mestory-testing.yaml
```

### 9.2 קובץ קונפיגורציה

```yaml
project: MeStory
version: 1.0
test_document: STD_MeStory_Testing.xlsx

agents:
  master:
    name: Master Orchestrator
    priority: critical

  functional:
    name: Functional Testing Agent
    sub_agents:
      - e2e
      - crud
      - gui
      - authorization

  non_functional:
    name: Non-Functional Testing Agent
    sub_agents:
      - i18n
      - ux
      - usability
      - accessibility
      - compatibility
      - performance
      - load
      - volume
      - backup_recovery

  reporting:
    name: Reporting Agent
    output: ./reports/

execution:
  parallel_agents: 3
  retry_failed: true
  screenshot_on_fail: true
  video_recording: true
```

---

## 10. נספחים

### נספח א' - קובץ STD
ראה קובץ: `STD_MeStory_Testing.xlsx`

### נספח ב' - Test Data
ראה קובץ: `test_data.json`

### נספח ג' - Environment Setup
ראה קובץ: `environment_setup.md`

---

**סוף מסמך**

*מסמך זה נכתב ע"י Claude Code לביצוע ע"י Claude Cowork*
