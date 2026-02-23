import { motion } from 'framer-motion';
import { FileText, Scale, Book, DollarSign, Users, Shield, AlertTriangle, Gavel, Mail, CheckCircle } from 'lucide-react';
import { GlassCard } from '../components/ui';

export default function TermsOfServicePage() {
  const lastUpdated = '23 בפברואר 2026';

  const sections = [
    {
      icon: CheckCircle,
      title: 'קבלת התנאים',
      content: `
        בגישה לאתר MeStory ובשימוש בו, הנך מסכים לתנאים אלו במלואם.

        **אם אינך מסכים לתנאים אלה, אנא הימנע משימוש באתר.**

        תנאים אלו מהווים הסכם משפטי מחייב בינך לבין MeStory Ltd.

        אנו שומרים לעצמנו את הזכות לעדכן תנאים אלה מעת לעת. שימוש מתמשך באתר לאחר עדכון התנאים מהווה הסכמה לתנאים המעודכנים.
      `,
    },
    {
      icon: Users,
      title: 'הרשמה וחשבון משתמש',
      content: `
        **דרישות גיל:**
        - עליך להיות בן 16 לפחות לשימוש באתר
        - משתמשים מתחת לגיל 18 זקוקים להסכמת הורה או אפוטרופוס

        **אחריות החשבון:**
        - הנך אחראי לשמור על סודיות פרטי החשבון שלך
        - כל פעילות בחשבונך היא באחריותך
        - עליך להודיע מיידית על חשד לגישה בלתי מורשית
        - אסור לשתף את פרטי ההתחברות שלך עם אחרים

        **מידע מדויק:**
        - עליך לספק מידע נכון ועדכני בעת ההרשמה
        - יש לעדכן את הפרטים בעת שינוי
      `,
    },
    {
      icon: Book,
      title: 'תוכן וזכויות יוצרים',
      content: `
        **בעלות על תוכן:**
        - אתה הבעלים של כל התוכן שאתה יוצר באתר (ספרים, פרקים, עיצובים)
        - בפרסום תוכן, אתה מעניק ל-MeStory רישיון שימוש לצורך הפעלת השירות

        **אחריות על תוכן:**
        - הנך אחראי לכך שהתוכן שלך אינו מפר זכויות יוצרים של אחרים
        - אסור לפרסם תוכן שנגנב, הועתק או שאין לך זכות להשתמש בו
        - הנך מתחייב לא לפרסם תוכן בלתי חוקי, פוגעני, או מזיק

        **תוכן אסור:**
        - תוכן פורנוגרפי או מיני מפורש (ללא סימון מתאים)
        - הסתה לאלימות או שנאה
        - הפרת פרטיות של אחרים
        - ספאם, פרסומות או תוכן מטעה
        - תוכן המפר את החוק הישראלי או הבינלאומי

        **זכויות MeStory:**
        - אנו רשאים להסיר תוכן המפר תנאים אלה
        - אנו רשאים להשעות או לבטל חשבונות מפרים
      `,
    },
    {
      icon: DollarSign,
      title: 'רכישות ותשלומים',
      content: `
        **רכישת ספרים:**
        - מחירי הספרים נקבעים על ידי המחברים (עד $25 לספר)
        - כל העסקאות מעובדות באמצעות PayPal
        - התשלום מתבצע במטבע דולר אמריקאי (USD)

        **חלוקת הכנסות:**
        - **50% מכל מכירה מועברים למחבר**
        - **50% נשארים אצל MeStory** (עמלת פלטפורמה)
        - חלוקת הרווחים מתבצעת אוטומטית בעת הרכישה

        **משיכת רווחים:**
        - מחברים יכולים למשוך רווחים לחשבון PayPal שלהם
        - סף משיכה מינימלי: $10
        - PayPal מנפיק קבלות אוטומטיות לכל עסקה

        **החזרים:**
        - בקשות להחזר יטופלו בהתאם למדיניות PayPal
        - החזרים אפשריים עד 14 יום מיום הרכישה
        - החזר יינתן רק אם לא נעשה שימוש משמעותי בספר

        **ספרים חינמיים:**
        - מחברים יכולים לבחור לפרסם ספרים בחינם
        - ספרים חינמיים אינם כפופים לחלוקת הכנסות
      `,
    },
    {
      icon: Scale,
      title: 'מדיניות פרסום ספרים',
      content: `
        **דרישות לפרסום:**
        - הספר חייב לכלול לפחות פרק אחד עם תוכן
        - יש להוסיף תקציר (מינימום 100 תווים)
        - יש להוסיף לפחות תגית אחת
        - יש לבחור קטגוריה וז'אנר מתאימים

        **בדיקת איכות:**
        - ספרים עוברים בדיקת איכות לפני פרסום
        - ציון איכות מינימלי עשוי להידרש לפרסום
        - תוכן באיכות נמוכה עלול להידחות

        **זכויות MeStory:**
        - אנו רשאים לסרב לפרסם ספר מכל סיבה
        - אנו רשאים להסיר ספרים מפורסמים שמפרים את התנאים
        - אנו רשאים לדרוש תיקונים לפני פרסום

        **התחייבויות המחבר:**
        - אתה מאשר שיש לך את כל הזכויות לפרסם את התוכן
        - אתה מסכים לקבל ביקורות מקוראים
        - אתה מתחייב לעדכן מידע שגוי על הספר
      `,
    },
    {
      icon: Shield,
      title: 'אחריות והגבלות',
      content: `
        **השירות מסופק "כפי שהוא":**
        - אנו לא מבטיחים שהשירות יהיה ללא תקלות או הפסקות
        - אנו לא אחראים לאובדן נתונים (מומלץ לגבות תוכן חשוב)
        - אנו לא אחראים להתאמת השירות לצרכיך הספציפיים

        **הגבלת אחריות:**
        - MeStory לא תהיה אחראית לנזקים עקיפים או תוצאתיים
        - אחריותנו מוגבלת לסכום ששילמת לנו ב-12 החודשים האחרונים
        - אנו לא אחראים לפעולות של משתמשים אחרים

        **שימוש על אחריותך:**
        - ההחלטה לרכוש ספרים או לפרסם תוכן היא שלך
        - אנו לא אחראים לתוכן שנוצר על ידי משתמשים
        - אנו לא מבטיחים רווחים ממכירת ספרים
      `,
    },
    {
      icon: AlertTriangle,
      title: 'שימוש אסור',
      content: `
        הנך מתחייב לא:

        - להפר זכויות יוצרים, סימני מסחר או קניין רוחני
        - לפרסם מידע שקרי או מטעה
        - לפגוע בפרטיות או בשם הטוב של אחרים
        - לנסות לפרוץ או לפגוע במערכות האתר
        - לשלוח ספאם או הודעות מטרידות
        - ליצור חשבונות מרובים לצורך הונאה
        - לעקוף מגבלות או אבטחת המערכת
        - להשתמש בבוטים או כלים אוטומטיים ללא אישור
        - להעתיק או להפיץ תוכן של אחרים ללא רשות
        - לבצע כל פעולה בלתי חוקית באמצעות האתר

        הפרה של תנאים אלה עלולה לגרום להשעיה או ביטול החשבון.
      `,
    },
    {
      icon: Gavel,
      title: 'יישוב סכסוכים',
      content: `
        **שלב ראשון - פנייה ישירה:**
        - במקרה של מחלוקת, פנה אלינו תחילה בדוא"ל
        - נשתדל לפתור את הבעיה תוך 30 יום

        **שלב שני - גישור:**
        - אם לא הגענו לפתרון, ניתן לפנות לגישור
        - עלויות הגישור יחולקו שווה בשווה

        **דין חל:**
        - הסכם זה כפוף לחוקי מדינת ישראל
        - סמכות השיפוט הבלעדית היא של בתי המשפט בישראל

        **תביעות ייצוגיות:**
        - הנך מוותר על הזכות להגיש תביעה ייצוגית נגד MeStory
        - כל תביעה תתנהל באופן אישי בלבד
      `,
    },
    {
      icon: FileText,
      title: 'שינויים בתנאים',
      content: `
        **זכות לעדכון:**
        - אנו רשאים לעדכן תנאים אלה בכל עת
        - שינויים מהותיים יפורסמו באתר ותישלח הודעה

        **המשך שימוש:**
        - המשך השימוש באתר לאחר עדכון מהווה הסכמה
        - אם אינך מסכים לשינויים, עליך להפסיק את השימוש

        **תוקף:**
        - תנאים אלה תקפים מרגע פרסומם
        - גרסאות קודמות לא יחולו על שימוש חדש
      `,
    },
    {
      icon: Mail,
      title: 'יצירת קשר',
      content: `
        לשאלות בנוגע לתנאי השימוש:

        **דוא"ל כללי:** support@mestory.com
        **דוא"ל משפטי:** legal@mestory.com

        **כתובת:**
        MeStory Ltd.
        ישראל

        **שעות מענה:** ימים א'-ה', 9:00-17:00 (שעון ישראל)

        אנו מתחייבים להשיב לפניות תוך 5 ימי עסקים.
      `,
    },
  ];

  return (
    <div className="min-h-screen py-20 px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-12 h-12 text-magic-gold" />
          </div>
          <h1 className="text-4xl font-display font-bold gradient-gold mb-4">
            תנאי שימוש
          </h1>
          <p className="text-gray-400">
            עודכן לאחרונה: {lastUpdated}
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6 mb-8">
            <p className="text-gray-300 leading-relaxed">
              ברוכים הבאים ל-MeStory - פלטפורמה לכתיבה, פרסום ומכירת ספרים דיגיטליים.
              תנאי שימוש אלה מגדירים את הכללים והמגבלות החלים על השימוש באתר ובשירותים שלנו.
              <br /><br />
              <strong className="text-magic-gold">חשוב:</strong> קרא תנאים אלה בעיון לפני השימוש באתר.
              בשימוש באתר, הנך מסכים לתנאים אלה במלואם.
            </p>
          </GlassCard>
        </motion.div>

        {/* Key Points Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <GlassCard className="p-6 mb-8 border-magic-gold/30">
            <h2 className="text-xl font-bold text-magic-gold mb-4">נקודות עיקריות</h2>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>אתה הבעלים של כל התוכן שאתה יוצר</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>מחברים מקבלים 50% מכל מכירה</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>PayPal מנפיק קבלות אוטומטיות</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>גיל מינימום לשימוש: 16</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>אסור לפרסם תוכן מפר זכויות יוצרים</span>
              </li>
            </ul>
          </GlassCard>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-magic-gold/20 to-cosmic-purple/20 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-magic-gold" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-4">{section.title}</h2>
                    <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {section.content.split('**').map((part, i) => (
                        i % 2 === 0 ? (
                          <span key={i}>{part}</span>
                        ) : (
                          <strong key={i} className="text-white">{part}</strong>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-gray-500 text-sm"
        >
          <p>
            בשימוש באתר MeStory, הנך מאשר שקראת, הבנת והסכמת לתנאי השימוש ולמדיניות הפרטיות שלנו.
            <br />
            <br />
            <a href="/privacy" className="text-magic-gold hover:underline">מדיניות פרטיות</a>
            {' | '}
            <a href="mailto:legal@mestory.com" className="text-magic-gold hover:underline">פנייה משפטית</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
