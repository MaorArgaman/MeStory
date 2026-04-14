# Claude Cowork Execution Guide
## מדריך הפעלה לביצוע בדיקות ידניות

**למי:** Claude Cowork
**מטרה:** הרצת בדיקות ידניות על מערכת MeStory
**תאריך:** 2026-04-13

---

## שלב 0: הפעלת המערכת (CRITICAL - חובה לפני הכל!)

### 0.1 פתיחת השרת (Backend)

```bash
# Navigate to server directory
cd c:/Users/maora/OneDrive/שולחן\ העבודה/MeStory/server

# Install dependencies (if needed)
npm install

# Start the server
npm run dev
```

**וודא:**
- [ ] Server running on `http://localhost:5000`
- [ ] Console shows: "Server running on port 5000"
- [ ] MongoDB connected: "Connected to MongoDB"

### 0.2 פתיחת הלקוח (Frontend)

```bash
# Open NEW terminal
# Navigate to client directory
cd c:/Users/maora/OneDrive/שולחן\ העבודה/MeStory/client

# Install dependencies (if needed)
npm install

# Start the client
npm run dev
```

**וודא:**
- [ ] Client running on `http://localhost:5173` (or port shown)
- [ ] Console shows: "VITE ready"
- [ ] Browser opens automatically or navigate to URL

### 0.3 אימות שהמערכת עובדת

```bash
# Test server is responding
curl http://localhost:5000/api/health

# OR open in browser
http://localhost:5173
```

**Expected:** Landing page loads with MeStory branding

---

## שלב 1: הכנת סביבת בדיקות

### 1.1 משתמשי בדיקה

צור את המשתמשים הבאים דרך הממשק או ה-API:

| משתמש | Email | Password | Role | Purpose |
|-------|-------|----------|------|---------|
| Test Guest | - | - | - | בדיקות ללא התחברות |
| Test Free | free@test.com | Test1234! | FREE | בדיקות משתמש חינמי |
| Test Standard | standard@test.com | Test1234! | STANDARD | בדיקות משתמש סטנדרטי |
| Test Premium | premium@test.com | Test1234! | PREMIUM | בדיקות משתמש פרימיום |
| Test Admin | admin@test.com | Test1234! | ADMIN | בדיקות מנהל |

### 1.2 נתוני בדיקה

צור את הנתונים הבאים:

- [ ] ספר ריק (ללא תוכן)
- [ ] ספר עם 5 פרקים ותוכן
- [ ] ספר עם עיצוב מלא
- [ ] ספר מפורסם (חינמי)
- [ ] ספר מפורסם (בתשלום)

---

## שלב 2: ביצוע הבדיקות

### 2.1 פתח את קובץ ה-STD

```
File: docs/STD_MeStory_Testing.csv
Open with: Excel / Google Sheets / VS Code
```

### 2.2 לכל בדיקה:

```
1. קרא את Test_ID
2. קרא את Preconditions - וודא שהתנאים מתקיימים
3. בצע את Test_Steps - צעד אחרי צעד
4. השווה את Expected_Result לתוצאה בפועל
5. מלא את Actual_Result
6. סמן Status: PASS / FAIL / BLOCKED / SKIP
7. אם FAIL - צור Bug Report ומלא Bug_ID
```

### 2.3 סדר עדיפויות לביצוע

```
1. Priority: Critical (חובה)
   └── E2E-001 to E2E-010 (Authentication)
   └── E2E-060 to E2E-064 (Purchase)
   └── AUTH-* (Authorization Critical)
   └── SEC-* (Security)

2. Priority: High (מומלץ מאוד)
   └── E2E-020 to E2E-054 (Book workflow)
   └── CRUD-* (All CRUD tests)
   └── GUI-* (Critical pages)
   └── I18N-* (Localization)

3. Priority: Medium (לפי זמן)
   └── A11Y-* (Accessibility)
   └── COMPAT-* (Compatibility)
   └── PERF-* (Performance)

4. Priority: Low (אם נותר זמן)
   └── LOAD-* (Load testing)
   └── VOL-* (Volume testing)
```

---

## שלב 3: דיווח תקלות

### 3.1 כאשר בדיקה נכשלת (FAIL)

1. פתח קובץ: `docs/BUG_REPORTS.md`
2. צור entry חדש לפי התבנית
3. הקצה Bug_ID רציף (BUG-0001, BUG-0002...)
4. עדכן את ה-STD עם ה-Bug_ID

### 3.2 תבנית דיווח באג

```markdown
---

## BUG-XXXX: [כותרת קצרה]

**Test ID:** [מזהה הבדיקה שנכשלה]
**Severity:** Critical | High | Medium | Low
**Status:** Open
**Found by:** Claude Cowork
**Date Found:** 2026-04-13

### Description
[תיאור הבאג]

### Steps to Reproduce
1. [צעד 1]
2. [צעד 2]
3. [צעד 3]

### Expected Result
[מה היה צריך לקרות]

### Actual Result
[מה באמת קרה]

### Evidence
- Screenshot: [אם רלוונטי]
- Console Error: [שגיאות בקונסול]
- Network: [בעיות רשת]

### Environment
- URL: http://localhost:5173
- Browser: [Chrome/Firefox/Edge]
- User: [איזה משתמש בדיקה]
```

---

## שלב 4: סיום וסיכום

### 4.1 שמירת תוצאות

```bash
# Save the updated STD file
# Make sure all Actual_Result columns are filled
# Make sure all Status columns are set
```

### 4.2 סיכום ביצוע

בסוף הבדיקות, צור סיכום:

```markdown
## Test Execution Summary - [Date]

### Statistics
- Total Tests Executed: X
- Passed: X (X%)
- Failed: X (X%)
- Blocked: X
- Skipped: X

### Bugs Found
- Critical: X
- High: X
- Medium: X
- Low: X

### Categories Completed
- [x] E2E
- [x] CRUD
- [ ] GUI (partial)
- [ ] ...

### Notes
[הערות מיוחדות]
```

---

## Quick Commands Reference

### Terminal 1 - Server
```bash
cd "c:/Users/maora/OneDrive/שולחן העבודה/MeStory/server"
npm run dev
```

### Terminal 2 - Client
```bash
cd "c:/Users/maora/OneDrive/שולחן העבודה/MeStory/client"
npm run dev
```

### URLs
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

### Test Files
- **STD (Test Cases):** `docs/STD_MeStory_Testing.csv`
- **Bug Reports:** `docs/BUG_REPORTS.md`
- **Strategy:** `docs/CLAUDE_COWORK_TESTING_STRATEGY.md`
- **Workflow:** `docs/TESTING_WORKFLOW.md`

---

## Troubleshooting

### Server won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID [PID] /F

# Check environment variables
cat .env
```

### Client won't start
```bash
# Check if port 5173 is in use
netstat -ano | findstr :5173

# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### MongoDB connection failed
```bash
# Verify MONGODB_URI in server/.env
# Make sure MongoDB Atlas is accessible
# Check network connectivity
```

### Tests blocked
```markdown
If a test is BLOCKED:
1. Document the reason in Notes column
2. Mark as BLOCKED
3. Continue to next test
4. Return later if blocker resolved
```

---

## Contact

**After testing is complete:**
1. Save all changes to STD
2. Update BUG_REPORTS.md
3. Notify Claude Code to begin bug fixes

**Claude Code will:**
1. Read BUG_REPORTS.md
2. Fix all Open bugs by priority
3. Update bug status to Fixed
4. Request re-verification

---

*Ready to start? Run the server and client, then begin with E2E-001!*
