import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck, Mail, Globe, FileText } from 'lucide-react';
import { GlassCard } from '../components/ui';

export default function PrivacyPolicyPage() {
  const lastUpdated = '23 בפברואר 2026';

  const sections = [
    {
      icon: Database,
      title: 'מידע שאנו אוספים',
      content: `
        אנו אוספים את המידע הבא:

        **מידע אישי:**
        - שם מלא וכתובת דוא"ל
        - תמונת פרופיל (אופציונלי)
        - פרטי חשבון PayPal לצורך קבלת תשלומים (למחברים)

        **מידע על שימוש:**
        - ספרים שנכתבו, נרכשו ונקראו
        - היסטוריית קריאה והתקדמות
        - העדפות שפה ועיצוב
        - נתוני אינטראקציה (לייקים, תגובות, שיתופים)

        **מידע טכני:**
        - כתובת IP ונתוני גלישה
        - סוג דפדפן ומערכת הפעלה
        - זמני גישה לאתר
      `,
    },
    {
      icon: Eye,
      title: 'כיצד אנו משתמשים במידע',
      content: `
        המידע שלך משמש אותנו ל:

        - **ניהול החשבון שלך** - יצירת ותחזוקת חשבון המשתמש
        - **מתן שירותים** - כתיבת ספרים, קריאה, רכישה ופרסום
        - **עיבוד תשלומים** - ביצוע עסקאות רכישה וחלוקת רווחים
        - **שיפור השירות** - ניתוח שימוש ושיפור חוויית המשתמש
        - **תקשורת** - שליחת עדכונים, הודעות על מכירות וחדשות
        - **המלצות מותאמות** - הצגת ספרים רלוונטיים עבורך
        - **אבטחה** - הגנה מפני שימוש לרעה והונאות
      `,
    },
    {
      icon: Lock,
      title: 'אבטחת מידע',
      content: `
        אנו מיישמים אמצעי אבטחה מתקדמים:

        - **הצפנת SSL/TLS** - כל התקשורת מוצפנת
        - **הצפנת סיסמאות** - סיסמאות מאוחסנות בהצפנה חד-כיוונית (bcrypt)
        - **אימות דו-שלבי** - אפשרות לאבטחה נוספת
        - **גישה מוגבלת** - רק צוות מורשה יכול לגשת למידע
        - **גיבויים מאובטחים** - שמירת נתונים בגיבויים מוצפנים
        - **עדכוני אבטחה** - עדכון שוטף של מערכות האבטחה

        למרות מאמצינו, אין שיטת העברה באינטרנט או אחסון אלקטרוני מאובטחת ב-100%. אנו שואפים להגן על המידע שלך אך לא יכולים להבטיח אבטחה מוחלטת.
      `,
    },
    {
      icon: UserCheck,
      title: 'שיתוף מידע עם צדדים שלישיים',
      content: `
        אנו משתפים מידע רק במקרים הבאים:

        **ספקי שירות:**
        - **PayPal** - לעיבוד תשלומים ומשיכת רווחים
        - **Google** - לאימות משתמשים (Google OAuth)
        - **ספקי אחסון ענן** - לאחסון נתונים מאובטח

        **מידע ציבורי:**
        - שם המחבר, תמונת פרופיל וביוגרפיה מוצגים בעמודי ספרים
        - ספרים מפורסמים וסקירות הם ציבוריים

        **דרישות חוקיות:**
        - ציות לצווי בית משפט או דרישות רשויות
        - הגנה על זכויותינו או בטיחות משתמשים

        **אנו לא מוכרים את המידע האישי שלך לצדדים שלישיים.**
      `,
    },
    {
      icon: Globe,
      title: 'קובצי Cookies',
      content: `
        האתר משתמש בקובצי Cookies ל:

        - **אימות** - שמירת מצב ההתחברות שלך
        - **העדפות** - זכירת הגדרות שפה ועיצוב
        - **ניתוח** - הבנת אופן השימוש באתר

        **סוגי Cookies:**
        - Cookies הכרחיים - נדרשים לתפקוד האתר
        - Cookies אנליטיים - עוזרים לנו לשפר את השירות

        באפשרותך לחסום Cookies בהגדרות הדפדפן, אך חלק מהתכונות עלולות לא לעבוד כראוי.
      `,
    },
    {
      icon: FileText,
      title: 'זכויות המשתמש',
      content: `
        יש לך את הזכויות הבאות:

        - **גישה** - לבקש עותק של המידע שלך
        - **תיקון** - לעדכן מידע שגוי או חסר
        - **מחיקה** - לבקש מחיקת החשבון והמידע שלך
        - **הגבלה** - להגביל את עיבוד המידע שלך
        - **ניידות** - לקבל את המידע שלך בפורמט נפוץ
        - **התנגדות** - להתנגד לסוגים מסוימים של עיבוד
        - **ביטול הסכמה** - לבטל הסכמה לקבלת הודעות שיווקיות

        למימוש זכויותיך, פנה אלינו בכתובת: privacy@mestory.com
      `,
    },
    {
      icon: Shield,
      title: 'שמירת מידע',
      content: `
        אנו שומרים את המידע שלך:

        - **מידע חשבון** - כל עוד החשבון פעיל
        - **ספרים ותוכן** - לצמיתות או עד בקשת מחיקה
        - **נתוני עסקאות** - 7 שנים לצרכי חשבונאות ומס
        - **לוגים טכניים** - עד 90 יום

        לאחר מחיקת חשבון, המידע יימחק תוך 30 יום, למעט מידע שנדרש לשמור על פי חוק.
      `,
    },
    {
      icon: Mail,
      title: 'יצירת קשר',
      content: `
        לשאלות בנוגע למדיניות הפרטיות:

        **דוא"ל:** privacy@mestory.com

        **כתובת:**
        MeStory Ltd.
        ישראל

        אנו מתחייבים להשיב לפניות תוך 30 יום.
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
            <Shield className="w-12 h-12 text-magic-gold" />
          </div>
          <h1 className="text-4xl font-display font-bold gradient-gold mb-4">
            מדיניות פרטיות
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
              ברוכים הבאים ל-MeStory. אנו מחויבים להגן על פרטיותך ולשמור על המידע האישי שלך.
              מדיניות זו מסבירה כיצד אנו אוספים, משתמשים, משתפים ומגנים על המידע שלך בעת השימוש בפלטפורמה שלנו.
              <br /><br />
              בשימוש באתר ובשירותים שלנו, הנך מסכים לאיסוף ושימוש במידע בהתאם למדיניות זו.
            </p>
          </GlassCard>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
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
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-gray-500 text-sm"
        >
          <p>
            מדיניות זו כפופה לשינויים. שינויים מהותיים יפורסמו באתר ותישלח הודעה למשתמשים.
            <br />
            המשך השימוש באתר לאחר שינויים מהווה הסכמה למדיניות המעודכנת.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
