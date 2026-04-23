# מסמך אסטרטגי: הפיכת MeStory לאפליקציה מותאמת ל-iOS ול-Android

**גרסה:** 1.0
**תאריך:** 21 באפריל 2026
**מחבר:** Claude (ייעוץ טכני)
**מטרה:** להגדיר מפת דרכים מלאה, בחירת טכנולוגיה, עלויות, סיכונים ושלבי עבודה להמרת MeStory מאפליקציית Web ל-Native Apps עבור iOS ו-Android.

---

## תוכן עניינים

1. [סיכום מנהלים (TL;DR)](#1-סיכום-מנהלים-tldr)
2. [מצב קיים – ארכיטקטורה נוכחית](#2-מצב-קיים--ארכיטקטורה-נוכחית)
3. [מיפוי פיצ׳רים וההשלכות על מובייל](#3-מיפוי-פיצרים-וההשלכות-על-מובייל)
4. [השוואת אסטרטגיות מימוש](#4-השוואת-אסטרטגיות-מימוש)
5. [המלצה מרכזית: Capacitor Hybrid](#5-המלצה-מרכזית-capacitor-hybrid)
6. [תוכנית מימוש בשלבים (Roadmap)](#6-תוכנית-מימוש-בשלבים-roadmap)
7. [שינויי קוד נדרשים בצד הלקוח](#7-שינויי-קוד-נדרשים-בצד-הלקוח)
8. [שינויי קוד נדרשים בצד השרת](#8-שינויי-קוד-נדרשים-בצד-השרת)
9. [תשתית, CI/CD ופרסום](#9-תשתית-cicd-ופרסום)
10. [נושאי רגולציה, תשלומים ומסחר](#10-נושאי-רגולציה-תשלומים-ומסחר)
11. [UX / UI ועיצוב Native](#11-ux--ui-ועיצוב-native)
12. [ביצועים, אופליין וסוללה](#12-ביצועים-אופליין-וסוללה)
13. [אבטחה ופרטיות](#13-אבטחה-ופרטיות)
14. [QA ובדיקות](#14-qa-ובדיקות)
15. [אומדן עלויות ולוחות זמנים](#15-אומדן-עלויות-ולוחות-זמנים)
16. [סיכונים ותכנית גיבוי](#16-סיכונים-ותכנית-גיבוי)
17. [החלטות פתוחות להכרעה](#17-החלטות-פתוחות-להכרעה)

---

## 1. סיכום מנהלים (TL;DR)

MeStory היא אפליקציית Web מבוססת **React 18 + Vite + TypeScript** עם שרת **Node/Express + Socket.io** ומסד נתונים **Supabase/Postgres**, המכילה פיצ׳רים מורכבים כמו עורך TipTap, דפדוף ספר (react-pageflip), AI (OpenAI + Gemini), TTS, תשלומים, צ׳אט Real-Time, יצוא PDF/DOCX ו-Marketplace.

**ההמלצה המרכזית:** שימוש ב-**Capacitor (של Ionic)** כ-Wrapper סביב קוד ה-Web הקיים, בשילוב רכיבים נייטיביים ממוקדים (Biometric Auth, Push Notifications, In-App Purchase, Share, File-System). גישה זו מאפשרת **שימוש חוזר של ~90%+ מהקוד**, זמן יציאה לשוק של **8–14 שבועות**, ועלות משמעותית נמוכה מ-Rewrite ל-React Native או Flutter.

**שלושה מסלולים מרכזיים** נשקלו:

| מסלול | זמן לפרסום | עלות יחסית | איכות UX | שימוש חוזר בקוד |
|---|---|---|---|---|
| **A. Capacitor (מומלץ)** | 8–14 שבועות | 1x | טובה עד טובה מאוד | ~90–95% |
| B. React Native / Expo | 5–9 חודשים | 2.5–3x | מעולה | ~40–60% (בעיקר לוגיקה/API) |
| C. PWA + TWA (Android בלבד מלא) | 3–5 שבועות | 0.3x | בינונית, מוגבלת iOS | ~100% |

בשלב ראשון מומלץ לצאת עם **Capacitor + PWA משופר**, ולשמור את React Native כאופציה עתידית אם יידרש UX נייטיבי מלא.

---

## 2. מצב קיים – ארכיטקטורה נוכחית

### 2.1 Frontend (`client/`)
- **Framework:** React 18 + Vite + TypeScript, Tailwind CSS
- **ניתוב:** React Router v6
- **State:** Zustand + React Query (TanStack)
- **עורך תוכן:** TipTap 3 (starter-kit + image/color/highlight/text-align/underline/character-count)
- **חווית קריאה:** `react-pageflip` לאפקט דפדוף ספר
- **Real-Time:** `socket.io-client`
- **i18n:** `i18next` + `react-i18next`
- **אנימציות:** Framer Motion
- **טפסים:** React Hook Form + Zod
- **עמודים עיקריים** ([client/src/pages](client/src/pages)): Landing, Login/Register, Dashboard, BookWriting, BookDesign, BookLayout, BookDetails, Reader, Library, Marketplace, Publishing, Subscription, Messaging, Admin, ועוד.

### 2.2 Backend (`server/`)
- **Framework:** Express 4 + TypeScript
- **Auth:** JWT + Passport (Google OAuth) + bcrypt + express-session
- **DB:** Supabase (`@supabase/supabase-js`) + Postgres (`pg`)
- **Real-Time:** Socket.io (צ׳אט + collaboration)
- **AI:** OpenAI SDK + Google Generative AI (Gemini)
- **תשלומים:** מסלולים ל-PayPal/Stripe (בהתאם ל-[routes/paymentRoutes.ts](server/src/routes/paymentRoutes.ts))
- **יצוא:** `docx`, `pdfkit`, `puppeteer-core` + `@sparticuz/chromium` (חשוב – רץ ב-Vercel)
- **מייל:** `nodemailer`
- **קבצים:** `multer` + `archiver`
- **Jobs:** `node-cron`
- **מסלולים:** `/api/auth`, `/api/books`, `/api/ai`, `/api/payments`, `/api/subscriptions`, `/api/messaging`, `/api/tts`, `/api/voice`, `/api/collaboration`, ועוד (ראה [server/src/routes](server/src/routes)).

### 2.3 פריסה
- פריסה אוטומטית ב-**Vercel** (גם ה-client וגם ה-server) על כל `git push` (~30 שניות). המשמעות: ה-API שישרת את האפליקציה הניידת הוא אותו backend שמוכן ופועל.

### 2.4 מה כבר מותאם מובייל
מקומיטים אחרונים: יש התאמה של UI למובייל (עורך, floating controls, כפתור Fullscreen). זו נקודת פתיחה מצוינת – המערכת "mobile-friendly" כבר היום.

---

## 3. מיפוי פיצ׳רים וההשלכות על מובייל

| פיצ׳ר | טכנולוגיה נוכחית | השלכה על Mobile App |
|---|---|---|
| עורך כתיבה עשיר | TipTap (ProseMirror) | רץ על WebView ללא בעיה. נדרש: מקלדת, Safe Area, גלילה, Undo/Redo עם gestures |
| דפדוף ספר | react-pageflip (Canvas/DOM) | עובד על מובייל; נדרש לוודא ביצועי Canvas ב-iOS |
| AI Writing | OpenAI + Gemini דרך השרת | ללא שינוי – השרת זה אותו שרת |
| TTS (Text-to-Speech) | API שרת | דורש תמיכה באודיו רקע (iOS/Android permissions) |
| Voice (הקלטה) | API שרת | דורש הרשאת `microphone` נייטיבית |
| Real-Time chat | Socket.io | חיבור WebSocket עובד ב-WebView; לשמור על חיבור ברקע → Push |
| PDF/DOCX export | שרת (Puppeteer) | מורידים קובץ – דורש גישה ל-FileSystem נייטיבי + Share Sheet |
| העלאת תמונות | `multer` | דורש גישה ל-Camera + Photo Library |
| תשלומים | PayPal/Stripe (Web) | **בעייתי** – Apple/Google דורשים IAP על "תוכן דיגיטלי" (ראה פרק 10) |
| Google OAuth | Passport | דורש להחליף Flow ל-`@capacitor-community/google-auth` או Sign In with Apple |
| התראות | WebSocket + email | יש להוסיף Push (FCM/APNs) |
| Marketplace (קניית ספרים) | Web checkout | אותה בעיית IAP |
| הדפסה | חבילת הדפסה | דורש gateway (Lulu/Printful) + Share או שליחה במייל |
| אחסון מקומי (טיוטות) | `localStorage`/Zustand | לעבור ל-SecureStorage/SQLite לעוצמה ואופליין |

---

## 4. השוואת אסטרטגיות מימוש

### 4.1 מסלול A – **Capacitor (Hybrid)**

**עיקרון:** האפליקציה היא Vite-build הקיים, ארוז בקונטיינר נייטיבי (WKWebView ב-iOS, WebView ב-Android). Capacitor מספק "גשר" ל-API נייטיבי: מצלמה, קבצים, ביומטרי, Push, IAP (דרך plugins), וכו׳.

**יתרונות:**
- קוד משותף אחד בין Web, iOS ו-Android.
- כל `npm run build` מעדכן גם את האפליקציה (עם Live Updates – ראה להלן).
- ל-TipTap/react-pageflip אין השפעה – הם כבר עובדים בדפדפן.
- קהילה מבוססת, Ionic, Capacitor 6/7, עשרות Plugins רשמיים.
- אפשרות ל-Live Updates ("Capgo" או "Ionic Appflow") = לדחוף עדכון UI מבלי לעבור שוב אישור Store.

**חסרונות:**
- ביצועי רינדור מעט נמוכים מ-Native (לרוב לא מורגש למשתמש).
- גוגל/אפל מחמירים בבדיקה של "אפליקציות שהן רק אתר" – יש לוודא שיש ערך מוסף נייטיבי (Push, Camera, Offline).
- Debug של Plugin נייטיבי מסובך יותר.

### 4.2 מסלול B – **React Native (Expo)**

**עיקרון:** כתיבה מחדש של ה-UI ב-React Native. השימוש החוזר הוא בלוגיקה עסקית, API calls, Zustand, i18next – לא ב-UI עצמו (אין DOM).

**אתגרים ספציפיים ל-MeStory:**
- **TipTap לא רץ ב-RN** – אין DOM. יידרש עורך חלופי (`@10play/tentap-editor` שמבוסס על TipTap-in-WebView – כלומר כבר לא ממש נייטיבי) או כתיבת עורך חדש.
- **react-pageflip** – לא עובד ברהמני. יש לממש דפדוף מחדש עם `react-native-reanimated` או `Skia`.
- **Framer Motion, Tailwind** – לא תואמים. יש לעבור ל-Reanimated + NativeWind.
- **Recharts** – לא תואם. יש חלופות (`victory-native`).

**יתרונות:**
- UX באמת נייטיבי, עקומת ביצועים גבוהה יותר, Animations חלקות.
- גישה ישירה ל-Native APIs ללא plugins.

**חסרונות:**
- זמן פיתוח ארוך משמעותית (5–9 חודשים).
- צוות ידרוש הכשרה.
- תחזוקה של שני קוד-בייסים (Web + RN) או נטישה של ה-Web.

### 4.3 מסלול C – **PWA + TWA**

**עיקרון:** Progressive Web App. ב-Android ניתן לעטוף ב-TWA (Trusted Web Activity) ולפרסם ב-Play Store. ב-iOS אין TWA – רק "Add to Home Screen".

**יתרונות:**
- זול, מהיר.
- כבר היום רוב המערכת כמעט PWA-ready.

**חסרונות:**
- iOS מוגבל מאוד (אין Push עד iOS 16.4, אין IAP, אין Biometric מלא).
- לא מתאים כערוץ ראשי אלא כתוספת.

### 4.4 המלצה: שילוב A + C

- **Capacitor** ל-iOS ו-Android (מוצר ראשי בחנויות).
- **PWA משופר** למשתמשים שיעדיפו לא להתקין.
- Roadmap עתידי: אם יהיה צורך ב-UX פרימיום יותר בקטעים ספציפיים (למשל עורך מתקדם), אפשר להשתלב React Native רק עבור אותו מודול (Hybrid-of-Hybrids).

---

## 5. המלצה מרכזית: Capacitor Hybrid

### 5.1 ארכיטקטורת היעד

```
┌─────────────────────────────────────────────────────────┐
│                    App Stores                           │
│         App Store (iOS)        Play Store (Android)     │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────▼─────────────┐
        │  Capacitor Native Shell  │  (Xcode / Android Studio projects)
        │  - Splash / Icon          │
        │  - Push (FCM/APNs)        │
        │  - IAP / Subscription     │
        │  - Biometric              │
        │  - Camera / Files         │
        │  - Deep Links             │
        └────────────┬─────────────┘
                     │  loads
        ┌────────────▼─────────────┐
        │ Vite-built React bundle  │  (אותו קוד שרץ ב-Web)
        │  - TipTap, PageFlip      │
        │  - Zustand, React Query  │
        │  - i18n, Tailwind        │
        └────────────┬─────────────┘
                     │  HTTPS / WSS
        ┌────────────▼─────────────┐
        │  Vercel-hosted Express   │  (אותו backend)
        │  + Supabase / Postgres    │
        └──────────────────────────┘
```

### 5.2 Plugins Capacitor נדרשים

| Plugin | מטרה |
|---|---|
| `@capacitor/app` | Deep links, life-cycle |
| `@capacitor/push-notifications` | Push (APNs/FCM) |
| `@capacitor/local-notifications` | התראות מקומיות |
| `@capacitor/camera` | צילום / בחירה מגלריה לעטיפות ספר |
| `@capacitor/filesystem` | שמירת PDF/DOCX אחרי יצוא |
| `@capacitor/share` | שיתוף ספר / קישור |
| `@capacitor/preferences` | אחסון העדפות (מחליף localStorage) |
| `@capacitor-community/sqlite` | טיוטות אופליין |
| `@capacitor/network` | זיהוי אופליין |
| `@capacitor/haptics` | פידבק מגע |
| `@capacitor/status-bar` + `@capacitor/splash-screen` | Look & Feel נייטיבי |
| `capacitor-native-biometric` | Touch/Face ID לאימות חוזר |
| `@capacitor-community/google-auth` + `Sign in with Apple` | הזדהות |
| `@capgo/capacitor-updater` או Ionic Appflow | Live Updates |
| `revenuecat-plugin` (Purchases) או `@capacitor-community/in-app-purchases` | IAP (ראה פרק 10) |

---

## 6. תוכנית מימוש בשלבים (Roadmap)

### שלב 0 – הכנה (שבוע 1)
- החלטה על Bundle IDs: `com.mestory.app` (Apple), `com.mestory.app` (Google).
- רישום חשבון Apple Developer (99$/שנה) ו-Google Play Developer (25$ חד-פעמי).
- הכנת חשבונות: Firebase (FCM), RevenueCat (IAP), Sentry (crash reporting).
- הקפאת פיצ׳רים גדולים ב-Web למשך תקופת ההמרה.

### שלב 1 – PWA Hardening (שבוע 2)
- הוספת `manifest.json` מלא עם icons (192/512), theme color, display: standalone, orientation.
- Service Worker עם Workbox לקאשינג של סטטי + אסטרטגיית `stale-while-revalidate` ל-API מסוימים.
- Offline-fallback page.
- בדיקת Lighthouse → ציון PWA 100.
- התוצאה: המשתמשים יכולים להתקין PWA מיד; משמשת בסיס ל-Capacitor.

### שלב 2 – Capacitor Integration (שבועות 3–4)
- `npm i @capacitor/core @capacitor/cli`, `npx cap init`.
- הוספת פלטפורמות: `npx cap add ios` + `npx cap add android`.
- הגדרת `capacitor.config.ts`:
  - `server.url` בזמן פיתוח לחיבור Hot Reload.
  - `ios.contentInset`, `backgroundColor`, `limitsNavigationsToAppBoundDomains: true`.
- בניית CI שבכל push רץ `vite build` → `cap sync`.

### שלב 3 – התאמות קריטיות ל-WebView (שבועות 4–5)
- עטיפת כל קריאת `localStorage` ב-wrapper שיפול ל-Capacitor Preferences במובייל.
- ניקוי `window.open` → Capacitor Browser / `InAppBrowser`.
- החלפת URLs יחסיים של API ל-`import.meta.env.VITE_API_URL` שמוגדר ל-Production URL (Vercel) גם במובייל.
- טיפול ב-Safe Area (notch): `env(safe-area-inset-*)` + Capacitor Status Bar.
- וידוא שהעורך של TipTap לא מוסתר ע״י מקלדת (Android `windowSoftInputMode=adjustResize`, iOS `KeyboardResize` מ-Capacitor).

### שלב 4 – פיצ׳רים נייטיביים (שבועות 5–8)
- **Push Notifications:**
  - רישום Token ב-FCM/APNs → שליחה ל-`/api/notifications/register-device` (חדש).
  - התאמת [server/src/routes/notificationRoutes.ts](server/src/routes/notificationRoutes.ts) לשליחת push דרך `firebase-admin`.
- **Camera/Gallery** לעטיפות ([BookDesignPage](client/src/pages/BookDesignPage.tsx)).
- **Share Sheet** לשיתוף קישור לספר מפורסם.
- **Filesystem + Share** לקבלת PDF אחרי יצוא במקום הורדת דפדפן.
- **Biometric Auth** כ-Layer שני מעל JWT.
- **Deep Links:** `mestory://book/:id` + Universal Links (iOS) ו-App Links (Android).

### שלב 5 – תשלומים ו-IAP (שבועות 8–10)
- שילוב **RevenueCat** (מומלץ בחום) לניהול IAP חוצה-פלטפורמות.
- מיפוי המסלולים (Free/Standard/Premium) ל-Products ב-App Store Connect וב-Play Console.
- Webhook מ-RevenueCat → `/api/webhooks/revenuecat` שמעדכן את Supabase.
- **שימור Web checkout** (PayPal/Stripe) – רק למשתמשי Web.
- ראה פרק 10 להסברים רגולטוריים.

### שלב 6 – Offline & Drafts (שבועות 9–11)
- טיוטות ספר → IndexedDB (כבר עובד ב-Web) + סנכרון SQLite ב-Capacitor.
- Queue של פעולות (save/upload) שנדחות כשאין רשת (`@capacitor/network`).
- מסך "אין חיבור" שמאפשר לערוך ולפרסם כשהחיבור חוזר.

### שלב 7 – QA, Beta, Launch (שבועות 11–14)
- **TestFlight** (iOS) ו-**Internal Testing / Closed Track** (Android).
- בדיקות רגרסיה על מכשירים אמיתיים (לפחות iPhone SE, iPhone 15, Pixel 7, Galaxy A54).
- סקירת App Store Review Guidelines (סעיף 3.1.1 – IAP, סעיף 4.2 – Minimum Functionality).
- הגשה → Rejections → תיקונים → פרסום.

---

## 7. שינויי קוד נדרשים בצד הלקוח

### 7.1 פריסת קבצים מוצעת
```
client/
├── src/
│   ├── platform/             # חדש – abstractions
│   │   ├── storage.ts        # Preferences vs localStorage
│   │   ├── files.ts          # Filesystem vs download
│   │   ├── push.ts           # Push registration
│   │   ├── share.ts          # Share Sheet vs navigator.share
│   │   ├── auth.ts           # Capacitor Google/Apple auth
│   │   └── iap.ts            # RevenueCat wrapper
│   └── ...
├── capacitor.config.ts       # חדש
├── ios/                      # נוצר ע"י cap add
└── android/                  # נוצר ע"י cap add
```

### 7.2 דוגמאות מפתח

**wrapper ל-storage** – יחליף כל `localStorage.getItem/setItem`:
```ts
// client/src/platform/storage.ts
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

export const storage = {
  get: async (k: string) =>
    isNative ? (await Preferences.get({ key: k })).value : localStorage.getItem(k),
  set: async (k: string, v: string) =>
    isNative ? Preferences.set({ key: k, value: v }) : localStorage.setItem(k, v),
  remove: async (k: string) =>
    isNative ? Preferences.remove({ key: k }) : localStorage.removeItem(k),
};
```

**רישום Push Token:**
```ts
// client/src/platform/push.ts
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from '@/services/api';

export async function registerPush() {
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;
  await PushNotifications.register();
  PushNotifications.addListener('registration', async (token) => {
    await api.post('/notifications/register-device', {
      token: token.value,
      platform: Capacitor.getPlatform(),
    });
  });
}
```

**יצוא PDF במובייל** – במקום `<a download>`:
```ts
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function savePdfBlob(blob: Blob, filename: string) {
  const base64 = await blobToBase64(blob);
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Documents,
  });
  await Share.share({ title: filename, url: uri });
}
```

### 7.3 נקודות UX קריטיות
- עורך TipTap – לוודא שהסרגל תמיד נגיש מעל המקלדת (`visualViewport` API + padding דינמי).
- Pull-to-refresh לעמוד Library ו-Marketplace.
- Back button של אנדרואיד → routing ב-React Router + יציאה מסודרת.
- Status bar: light-content על מסכי hero, dark על מסכי עריכה.
- Haptics קצרים ב-AI auto-complete, save success, turn-page.

---

## 8. שינויי קוד נדרשים בצד השרת

### 8.1 תמיכת Push
- להוסיף `firebase-admin` (חסר היום).
- הרחבת [server/src/routes/notificationRoutes.ts](server/src/routes/notificationRoutes.ts):
  - `POST /notifications/register-device { token, platform, userId }` → טבלת `device_tokens`.
  - שירות `notificationService.sendPush(userId, payload)` ששולח דרך FCM לכל ה-tokens.
- Triggers: הודעת צ׳אט חדשה, הודעה על מכירה, חשבונית, קמפיין.

### 8.2 CORS + App Domains
- ב-[server/src/server.ts](server/src/server.ts) להוסיף ל-CORS origins את:
  - `capacitor://localhost` (iOS)
  - `http://localhost` ו-`https://localhost` (Android)
  - ה-custom scheme אם הוגדר.
- Content-Security-Policy: לאפשר `connect-src` של Supabase, Vercel, FCM.

### 8.3 Webhook ל-IAP
- route חדש: `POST /api/webhooks/revenuecat` (HMAC verify) → עדכון `users.subscriptionTier` + `subscriptions` + כמות קרדיטים.
- עקיפה עצמאית של Apple/Google verify (אם לא משתמשים ב-RevenueCat): `@apple/app-store-server-library` + Google Play Developer API.

### 8.4 Deep Link Association
- `well-known/apple-app-site-association` (iOS Universal Links) ו-`.well-known/assetlinks.json` (Android App Links) – יש להגיש מ-Vercel בשני ה-paths ה-well-known.

### 8.5 Socket.io – ping intervals
- להקטין `pingTimeout` ולהגדיל `pingInterval` כדי לשרוד מעברי רשת נפוצים במובייל (Wifi↔LTE).

---

## 9. תשתית, CI/CD ופרסום

### 9.1 ארגון Repository
- נשארים ב-monorepo. מוסיפים `client/capacitor.config.ts`, `client/ios/`, `client/android/`.
- מומלץ להוסיף תיקיית `mobile/fastlane/` לאוטומציה.

### 9.2 צינור בנייה
- **Build אחד של Web** נותר כמו היום (Vercel Deploy).
- **Build מובייל** בגיטהאב אקשנס:
  - `runs-on: macos-latest` ל-iOS + `ubuntu-latest` ל-Android.
  - `npm ci && npm run build -w client && npx cap sync`.
  - iOS: `fastlane beta` → TestFlight.
  - Android: `fastlane internal` → Internal track.
- חתימה: Match (Fastlane) לניהול Certificates + Profiles.

### 9.3 Versioning
- `package.json version` = מקור האמת.
- סקריפט שמעדכן `Info.plist` ו-`build.gradle` אוטומטית.

### 9.4 Live Updates
- **Capgo** (open-source friendly) או **Ionic Appflow**. כל תיקון UI קטן אפשר לדחוף ללא גרסה חדשה בחנות.
- **חשוב:** לא לדחוף שינויי "פונקציונליות מהותית" דרך OTA – אפל אוסרת על שינוי מהותי בין גרסאות.

---

## 10. נושאי רגולציה, תשלומים ומסחר

### 10.1 הכלל הבעייתי ביותר: IAP
- Apple (סעיף 3.1.1) ו-Google Play (Payments Policy) דורשים שעל כל **תוכן דיגיטלי הנצרך בתוך האפליקציה** (מנוי, קרדיטים AI, קניית ספר דיגיטלי) יעבור דרך IAP, עם עמלת 15–30%.
- יש חריג: מוצרים פיזיים (ספרים מודפסים ומשלוח) יכולים להישאר עם Stripe/PayPal.
- **המשמעות ל-MeStory:**
  - **מנויים (Standard/Premium):** חובה IAP באפליקציה.
  - **קניית ספר דיגיטלי / קרדיטים:** חובה IAP.
  - **ספר מודפס פיזי / משלוח:** ניתן להישאר Stripe.

### 10.2 אסטרטגיית תשלומים מומלצת
1. **במובייל:** RevenueCat → IAP לכל המנויים והקרדיטים.
2. **ב-Web:** להמשיך עם PayPal/Stripe.
3. **סנכרון Tier:** RevenueCat Webhook → Server → Supabase → כל הפלטפורמות מעודכנות.
4. **מחיר Parity:** להשאיר את אותם מחירים + עמלה → או לוותר על 15–30% ברווח מ-Mobile.

### 10.3 "Reader App" חריג (Apple)
- אם האפליקציה תעבור קטגוריזציה כ-"Reader App" (Amazon Kindle-style), ניתן לבקש External Link Account Entitlement ולהפנות את המשתמש לאתר לרכישה. **זה רלוונטי מאוד ל-MeStory** ויכול לחסוך את עמלת 30%. דורש בקשה פורמלית מאפל.

### 10.4 הגנת נתונים ופרטיות
- **App Privacy Labels** (Apple) + **Data Safety Form** (Google) – יש למלא.
- **ATT (App Tracking Transparency)** – אם יהיה Analytics עם IDFA, חובה prompt.
- **GDPR + CCPA** – מסמך פרטיות זמין מתוך האפליקציה (יש כבר [PrivacyPolicyPage](client/src/pages/PrivacyPolicyPage.tsx)).
- **COPPA** – יש לקבוע מדיניות גיל מינימום (13+ או 16+).
- **Content Moderation** (חוק KOSA באפל/גוגל ב-2025) – חובה מערכת דיווח על תוכן פוגעני; MeStory מכילה UGC → חובה `/report-content` endpoint + UI.

### 10.5 רישיונות
- Fonts, Icons, AI-generated content – לוודא רישיון מסחרי.
- תוכן משתמשים מבוסס-AI (OpenAI/Gemini): לבדוק את ה-TOS לשימוש מסחרי (ברוב המקרים מותר אך יש להעביר disclaimer).

---

## 11. UX / UI ועיצוב Native

### 11.1 עקרונות
- **Bottom Navigation** בסיסי ל-Mobile (Home, Write, Library, Marketplace, Profile) במקום הסיידבר/Header הנוכחי.
- **Floating Action Button** ליצירת ספר חדש.
- **Gestures:** Swipe לחזרה (iOS), swipe-to-delete ברשימות.
- **Skeleton Loaders** תמיד – רשתות ניידות איטיות.
- **Dark Mode** מלא (כבר יש תשתית Tailwind, להשלים ב-Reader).

### 11.2 נכסים
- **App Icon:** 1024x1024 + כל הגדלים. מומלץ להשתמש ב-`@capacitor/assets` שמייצר הכל אוטומטית.
- **Splash Screen:** PNG + SVG.
- **Store Screenshots:**
  - iOS: 6.7" (iPhone 15 Pro Max), 6.5" (iPhone 11 Pro Max), 5.5" (iPhone 8 Plus), 12.9" iPad Pro.
  - Android: Phone + 7" + 10" tablet.
- **App Preview videos** (15–30 שניות).

### 11.3 Localization
- תרגומי i18n כבר במקום. יש להוסיף:
  - Store Listing בעברית ואנגלית.
  - תאריכים/שעות דרך `Intl` עם locale של המכשיר.
  - RTL בטוח: לוודא ב-WebView שאין overflow אופקי (bug recent: "editor paper to 100vw" – זה בדיוק המקרה).

---

## 12. ביצועים, אופליין וסוללה

### 12.1 גודל Bundle
- כיום `react-pageflip`, `recharts`, `framer-motion` יחד = bundle גדול. לפצל:
  - `React.lazy` לכל עמוד.
  - להעמיס Recharts רק ב-EarningsPage.
  - להעמיס Puppeteer/PDF רק כשצריך.
- יעד: < 500KB initial chunk.

### 12.2 Preloading
- Capacitor תומך ב-`capacitor-assets` לאחסון assets מקומית (אין צורך להוריד מחדש).

### 12.3 אופליין
- Service Worker + IndexedDB לטיוטות.
- רשימת ספרים שנקנו → cache עם זמן תפוגה של 24 שעות.
- Reader: אם המשתמש פתח ספר, לשמור אותו ל-IndexedDB לקריאה אופליין.

### 12.4 סוללה
- Socket.io – להתנתק כשהאפליקציה ברקע (`@capacitor/app` state change) ולהתחבר מחדש ב-Resume.
- להפסיק polling כשהמסך כבוי.

---

## 13. אבטחה ופרטיות

- **JWT Storage:** במובייל להשתמש ב-Keychain (iOS) / Keystore (Android) דרך `@capacitor-community/secure-storage`. לא ב-localStorage.
- **Certificate Pinning** (אופציונלי): `@nativescript-community/https` או SSL pinning דרך plugin.
- **Root/Jailbreak detection:** `@capacitor-community/device-check` – להגביל תכונות רגישות.
- **App Transport Security (iOS):** כל API דרך HTTPS בלבד.
- **Content-Security-Policy:** להגדיר ב-`capacitor.config.ts` `allowNavigation` רק ל-domains שלנו.
- **Biometric re-auth** לפעולות רגישות (תשלום, מחיקת חשבון).
- **Obfuscation** ב-Android (R8) – ברירת מחדל.
- **Backup exclusion:** `android:allowBackup="false"` כדי לא לשמור טוקנים ב-cloud backup.

---

## 14. QA ובדיקות

### 14.1 מכשירי יעד (מינימום)
- **iOS:** iPhone SE 2020 (iOS 16), iPhone 13, iPhone 15 Pro Max, iPad Air.
- **Android:** Pixel 6, Galaxy A54, Xiaomi Redmi (CN market), Tablet 10".

### 14.2 מטריצות בדיקה
- Cold start < 3 שניות.
- Hot reload מוכן לכתיבה < 1 שניה.
- עורך TipTap תחת מקלדת – טקסט לא נחתך.
- Offline mode – טיוטה נשמרת ו-sync בחזרה.
- Push מופיע כשהאפליקציה ברקע/closed.
- IAP flow מלא (Sandbox Apple + Test Track Google).
- Deep Link מתוך SMS / Safari פותח במקום הנכון.

### 14.3 כלים
- **Detox / Appium** לאוטומציה.
- **BrowserStack / Sauce Labs** למכשירים ענן.
- **Sentry** – crash reporting חוצה-פלטפורמה.
- **Firebase Crashlytics** – נייטיבי, חינם.
- **Charles Proxy** לניטור רשת.

---

## 15. אומדן עלויות ולוחות זמנים

### 15.1 עלויות חד-פעמיות
| פריט | עלות (USD) |
|---|---|
| Apple Developer Program | $99/שנה |
| Google Play Developer | $25 חד-פעמי |
| Design (Icons, Screenshots, Store artwork) | $500–$2,000 |
| גרסת Translator חיצונית (אם נדרש) | $300–$1,000 |
| ייעוץ משפטי (Privacy, Terms, Content moderation) | $500–$3,000 |

### 15.2 עלויות חודשיות
| שירות | עלות משוערת |
|---|---|
| Vercel (כבר פועל) | $0–$20 |
| Supabase | $0–$25 |
| Firebase FCM | חינם |
| RevenueCat | חינם עד $2.5K MTR, אז 1% |
| Sentry | $26+ |
| Ionic Appflow / Capgo (אופציונלי) | $49–$199 |

### 15.3 Effort (מפתח בכיר אחד)
| שלב | ימי עבודה |
|---|---|
| PWA Hardening | 5 |
| Capacitor baseline | 7 |
| התאמות WebView + storage/files | 12 |
| Push notifications | 5 |
| IAP + RevenueCat | 10 |
| Offline + SQLite | 8 |
| UI נייטיבי (navigation, gestures) | 10 |
| Store assets + texts + submission | 6 |
| QA + Beta fixes | 12 |
| **סה"כ** | **~75 ימי עבודה (~15 שבועות)** |

עם פיצול בין שני מפתחים (Web + Mobile) אפשר להגיע ל-**8–10 שבועות**.

---

## 16. סיכונים ותכנית גיבוי

| סיכון | הסתברות | השפעה | מיגון |
|---|---|---|---|
| דחייה מ-App Store על סעיף 4.2 ("Just a website") | בינונית | גבוהה | הוספת ערך נייטיבי (Push, Camera, Offline, IAP) לפני ההגשה |
| דחייה על סעיף 3.1.1 (תשלומים מחוץ ל-IAP) | גבוהה | גבוהה | מימוש מלא של IAP ב-Release הראשון; לא להשאיר כפתורי Stripe במובייל |
| ביצועי TipTap נמוכים במכשירים ישנים | בינונית | בינונית | Profiler + lazy-load, חלוקה לעמודים קצרים |
| מקלדת מסתירה תוכן (בייחוד iOS) | גבוהה | בינונית | Capacitor Keyboard plugin + padding דינמי |
| תוכן UGC מפר קווי מדיניות | בינונית | גבוהה | Moderation server-side + report UI + rate limit |
| עלות Puppeteer ל-PDF תגבר משמעותית | נמוכה | בינונית | לבצע יצוא PDF מראש בשרת ולשמור ב-CDN |
| RTL + עברית ב-WKWebView – bidi edge cases | בינונית | בינונית | QA ייעודי + חבילת `bidi-js` (כבר מותקנת בשרת) |
| עדכוני Capacitor שוברים Plugins | נמוכה | בינונית | pinning גרסאות + renovate bot |

---

## 17. החלטות פתוחות להכרעה

יש להחליט לפני תחילת עבודה:

1. **מודל תשלום במובייל:** האם לקבל את עמלת 15–30% דרך IAP, או לנסות Reader App Entitlement? (ממליץ: IAP + בקשת Entitlement במקביל.)
2. **גיל מינימום:** 13, 16 או 18? משפיע על ATT ו-Data Safety.
3. **Live Updates:** כן (Capgo/Appflow) או בלי? משפיע על זמן תיקון באגים.
4. **App Name בחנויות:** "MeStory" או עם tagline? צריך לוודא שאין קונפליקט.
5. **שוק יעד ראשון:** ישראל בלבד, גלובלי מלא, או לוקליזציה שלב-אחר-שלב?
6. **תמיכה ב-iPad/Tablet:** native layout או phone-style בלבד? (ממליץ: tablet native; MeStory היא אפליקציית קריאה/כתיבה – מסך גדול הוא יתרון.)
7. **משבר Offline:** האם קריאת ספר שנרכש חייבת להיות אופליין-מלאה? (ממליץ: כן, זה מתחרה ב-Kindle.)
8. **האם להשאיר PWA כערוץ פרסום** או להפנות את כל המשתמשים לאפליקציה?

---

## נספחים (מוצע להוסיף בעדכונים הבאים)

- **A.** מפה מלאה של כל API endpoint → plugin נייטיבי נדרש.
- **B.** Checklist של App Store Review Guidelines.
- **C.** Checklist של Google Play Policy.
- **D.** מסמך Threat Model מלא.
- **E.** תרגום כל מחרוזות ה-Store ל-5 שפות.

---

**בשורה התחתונה:** MeStory במצבה הנוכחי מתאימה באופן יוצא דופן למסלול Capacitor – יש React+Vite מודרני, backend מוכן, ו-UI כבר עבר אופטימיזציה למובייל. המסלול הריאלי הוא **~10 שבועות עבודה ממוקדת** ו-**< $5,000** בעלויות חיצוניות להגיע לאפליקציה מפורסמת בשתי החנויות, תוך שמירה על פלטפורמת ה-Web כערוץ מרכזי שני.
