import { motion } from 'framer-motion';
import { Accessibility, CheckCircle, AlertTriangle, Mail, Phone, FileText } from 'lucide-react';
import { GlassCard, OptimizedImage } from '../components/ui';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO } from '../components/seo';

const COORDINATOR_NAME = 'מאור ארגמן';
const COORDINATOR_EMAIL = 'mestory.tec@gmail.com';
const COORDINATOR_PHONE = '050-222-4036';
const COORDINATOR_PHONE_TEL = '+972502224036';
const LAST_AUDIT_DATE_HE = '23 באפריל 2026';
const LAST_AUDIT_DATE_EN = 'April 23, 2026';

export default function AccessibilityStatementPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const heContent = (
    <>
      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Accessibility className="w-8 h-8 text-memorial-gold" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">המחויבות שלנו לנגישות</h2>
        </div>
        <p className="text-gray-300 leading-relaxed">
          אתר MeStory רואה חשיבות עליונה בהנגשת השירות לכלל הציבור, כולל אנשים עם מוגבלות.
          אנו פועלים בהתאם להוראות <strong>חוק שוויון זכויות לאנשים עם מוגבלות, התשנ״ח-1998</strong> ול
          <strong> תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג-2013</strong>,
          ומחויבים לעמוד בתקן הישראלי <strong>ת״י 5568</strong> לנגישות תכנים באינטרנט ברמה AA,
          המבוסס על הנחיות <strong>WCAG 2.1</strong> של ארגון W3C.
        </p>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-7 h-7 text-green-400" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">התאמות הנגישות הקיימות באתר</h2>
        </div>
        <ul className="text-gray-300 leading-relaxed space-y-2 list-disc pr-5">
          <li>תפריט נגישות צף הנפתח באמצעות לחצן בפינת המסך, ומאפשר: הגדלה והקטנה של גודל הטקסט, מצב ניגודיות גבוהה, מצב גווני אפור (חד-גוון), הדגשת קישורים, הפסקת אנימציות והגדלת סמן העכבר.</li>
          <li>קישור "דלג לתוכן הראשי" (skip to content) הזמין במקלדת לקוראי מסך ולגולשים שלא משתמשים בעכבר.</li>
          <li>תיוג סמנטי של מבנה האתר: כותרות, תפריטים ראשיים, תוכן עיקרי וכותרת תחתונה.</li>
          <li>כל קישורי ניווט וכפתורי המערכת נגישים מהמקלדת בעזרת מקש Tab, עם סימון מיקוד (focus) ויזואלי.</li>
          <li>טקסט חלופי (alt) לתמונות בעלות ערך מידעי, ואי-תיוג של תמונות דקורטיביות בלבד.</li>
          <li>תמיכה מלאה בעברית עם כיווניות RTL וקווי טקסט קריאים.</li>
          <li>תאימות לדפדפנים מודרניים (Chrome, Firefox, Edge, Safari) ולקוראי מסך (NVDA, JAWS, VoiceOver).</li>
          <li>ניגודיות צבעים נבדקת לעמידה בדרישות WCAG 2.1 AA.</li>
          <li>טפסי האתר כוללים תוויות (label) לכל שדה והודעות שגיאה ברורות.</li>
        </ul>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-400" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">חריגים והגבלות</h2>
        </div>
        <p className="text-gray-300 leading-relaxed mb-3">
          על אף מאמצינו, ייתכנו בחלק מדפי האתר תכנים או רכיבים שאינם נגישים במלואם, ובהם:
        </p>
        <ul className="text-gray-300 leading-relaxed space-y-2 list-disc pr-5">
          <li>תכנים שנוצרו על ידי משתמשים אחרים (ספרים שמחברים העלו) – אנו פועלים מול היוצרים להנגשת התוכן ככל האפשר.</li>
          <li>תוכן צד שלישי (כדוגמת תשלומים מאובטחים של PayPal/Stripe) – הנגשתו באחריות הספק.</li>
          <li>סטודיו עיצוב ועריכה גרפית של ספרים – פעולות גרפיות מורכבות עשויות להיות פחות נגישות לקוראי מסך מטבען.</li>
        </ul>
        <p className="text-gray-300 leading-relaxed mt-3">
          אם נתקלת ברכיב לא נגיש, נשמח לקבל פנייה ולתקן בהקדם.
        </p>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-7 h-7 text-blue-400" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">רכז הנגישות</h2>
        </div>
        <p className="text-gray-300 leading-relaxed mb-3">
          לפניות, בקשות לסיוע, דיווח על תקלות נגישות או הצעות לשיפור, ניתן לפנות אל רכז הנגישות:
        </p>
        <div className="space-y-2 text-gray-300">
          <p><strong>שם:</strong> {COORDINATOR_NAME}</p>
          <p>
            <strong>דוא"ל:</strong>{' '}
            <a href={`mailto:${COORDINATOR_EMAIL}`} className="text-memorial-gold hover:underline">
              {COORDINATOR_EMAIL}
            </a>
          </p>
          {COORDINATOR_PHONE && (
            <p>
              <strong>טלפון:</strong>{' '}
              <a href={`tel:${COORDINATOR_PHONE_TEL}`} className="text-memorial-gold hover:underline">
                {COORDINATOR_PHONE}
              </a>
            </p>
          )}
          <p className="text-sm text-gray-400 pt-2">
            אנו מתחייבים להגיב לכל פנייה תוך 5 ימי עסקים.
          </p>
        </div>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-7 h-7 text-purple-400" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">פרטים על ההצהרה</h2>
        </div>
        <div className="space-y-2 text-gray-300">
          <p><strong>תאריך הבדיקה האחרון:</strong> {LAST_AUDIT_DATE_HE}</p>
          <p><strong>רמת תאימות נטענת:</strong> WCAG 2.1 AA / ת״י 5568 רמה AA</p>
          <p className="text-sm text-gray-400 pt-2">
            הצהרה זו תעודכן באופן שוטף כחלק מתהליך השיפור המתמיד של האתר.
          </p>
        </div>
      </GlassCard>
    </>
  );

  const enContent = (
    <>
      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Accessibility className="w-8 h-8 text-memorial-gold" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">Our Commitment to Accessibility</h2>
        </div>
        <p className="text-gray-300 leading-relaxed">
          MeStory is committed to making its services accessible to everyone, including people with disabilities.
          We strive to comply with <strong>WCAG 2.1 Level AA</strong> guidelines published by W3C,
          as well as the <strong>Israeli Equal Rights for Persons with Disabilities Law (1998)</strong> and its
          accessibility regulations (2013), and Israeli Standard <strong>IS 5568 Level AA</strong>.
        </p>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-7 h-7 text-green-400" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">Accessibility Features</h2>
        </div>
        <ul className="text-gray-300 leading-relaxed space-y-2 list-disc pl-5">
          <li>A floating accessibility menu with controls for: text size, high-contrast mode, grayscale mode, link highlighting, motion reduction, and enlarged cursor.</li>
          <li>"Skip to main content" link available via keyboard for screen reader and keyboard users.</li>
          <li>Semantic HTML structure: headings, navigation landmarks, main and footer regions.</li>
          <li>Full keyboard navigation with visible focus indicators.</li>
          <li>Alternative text for all informational images, with decorative images marked accordingly.</li>
          <li>Right-to-left (RTL) support for Hebrew with readable typography.</li>
          <li>Tested against WCAG 2.1 AA color contrast requirements.</li>
          <li>Compatibility with modern browsers (Chrome, Firefox, Edge, Safari) and screen readers (NVDA, JAWS, VoiceOver).</li>
          <li>Forms include labels and clear error messages for every field.</li>
        </ul>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-400" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">Known Limitations</h2>
        </div>
        <p className="text-gray-300 leading-relaxed mb-3">
          Despite our best efforts, some areas may not be fully accessible:
        </p>
        <ul className="text-gray-300 leading-relaxed space-y-2 list-disc pl-5">
          <li>User-generated content (books uploaded by authors): we work with creators to make their content accessible whenever possible.</li>
          <li>Third-party services (e.g. PayPal/Stripe payment forms): accessibility is the responsibility of the provider.</li>
          <li>The graphical design and layout studio: complex graphical operations may be less accessible to screen readers by their nature.</li>
        </ul>
        <p className="text-gray-300 leading-relaxed mt-3">
          If you encounter an inaccessible component, please let us know and we will fix it as soon as possible.
        </p>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-7 h-7 text-blue-400" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">Accessibility Coordinator</h2>
        </div>
        <p className="text-gray-300 leading-relaxed mb-3">
          For accessibility inquiries, assistance, bug reports, or improvement suggestions, please contact:
        </p>
        <div className="space-y-2 text-gray-300">
          <p><strong>Name:</strong> {COORDINATOR_NAME}</p>
          <p>
            <strong>Email:</strong>{' '}
            <a href={`mailto:${COORDINATOR_EMAIL}`} className="text-memorial-gold hover:underline">
              {COORDINATOR_EMAIL}
            </a>
          </p>
          {COORDINATOR_PHONE && (
            <p>
              <strong>Phone:</strong>{' '}
              <a href={`tel:${COORDINATOR_PHONE_TEL}`} className="text-memorial-gold hover:underline">
                {COORDINATOR_PHONE}
              </a>
            </p>
          )}
          <p className="text-sm text-gray-400 pt-2">
            We commit to responding to every inquiry within 5 business days.
          </p>
        </div>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-7 h-7 text-purple-400" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">Statement Details</h2>
        </div>
        <div className="space-y-2 text-gray-300">
          <p><strong>Last reviewed:</strong> {LAST_AUDIT_DATE_EN}</p>
          <p><strong>Conformance level:</strong> WCAG 2.1 AA / IS 5568 Level AA</p>
          <p className="text-sm text-gray-400 pt-2">
            This statement is reviewed and updated as part of our ongoing accessibility improvement program.
          </p>
        </div>
      </GlassCard>
    </>
  );

  return (
    <div className="min-h-screen relative pb-20">
      <SEO
        title={isHebrew ? 'הצהרת נגישות | MeStory' : 'Accessibility Statement | MeStory'}
        description={isHebrew
          ? 'הצהרת הנגישות של MeStory בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות ולתקן הישראלי 5568.'
          : 'MeStory accessibility statement, conforming to WCAG 2.1 AA and Israeli Standard 5568.'}
        type="website"
        locale={isHebrew ? 'he_IL' : 'en_US'}
        url="/accessibility"
      />

      {/* Hero */}
      <div className="relative overflow-hidden py-16 sm:py-20 px-4 sm:px-6">
        <div className="absolute inset-0">
          <OptimizedImage
            src="/img/new/texture-paper-2.png"
            alt=""
            decorative
            lazy={false}
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-space/70 via-deep-space/60 to-deep-space" />
        </div>
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-5 rounded-full bg-memorial-gold/20 border border-memorial-gold/40 text-memorial-gold text-sm">
            <Accessibility className="w-4 h-4" aria-hidden="true" />
            {isHebrew ? 'נגישות' : 'Accessibility'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
            {isHebrew ? 'הצהרת נגישות' : 'Accessibility Statement'}
          </h1>
          <p className="text-gray-400">
            {isHebrew ? `עודכן לאחרונה: ${LAST_AUDIT_DATE_HE}` : `Last updated: ${LAST_AUDIT_DATE_EN}`}
          </p>
        </motion.header>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {isHebrew ? heContent : enContent}
        </motion.div>
      </div>
    </div>
  );
}
