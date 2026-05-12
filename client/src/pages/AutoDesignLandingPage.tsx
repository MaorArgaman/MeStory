/**
 * AutoDesignLandingPage — landing page targeted at publishers, editors,
 * and anyone whose current workflow involves manually typesetting
 * manuscripts. Pitches the multi-agent auto-design feature.
 *
 * Route: /auto-design  (public — no auth required, CTAs route to signup).
 *
 * Sections:
 *   1. Hero with one-liner + primary CTA
 *   2. Before/after visualization (placeholder — will be replaced with
 *      real screenshots once the feature is generating output)
 *   3. How it works (3 agents pictured)
 *   4. The 10 design systems gallery
 *   5. Who it's for — publishers, editors, indie authors
 *   6. FAQ
 *   7. Bottom CTA
 *
 * Marketing copy is in Hebrew per the user's audience.
 */

import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, BookOpen, Wand2, Search, Layers, Download, Zap } from 'lucide-react';

const DESIGN_SYSTEMS = [
  { id: 'memoir-warm', label: 'זיכרון חם', bg: '#FBF6EE', text: '#2A1B0F', accent: '#B8651A', sample: 'אבא של אבא היה אופה' },
  { id: 'editorial-modern', label: 'מגזין רציני', bg: '#FFFFFF', text: '#0F0F0F', accent: '#C8102E', sample: 'מבט אל הסיפור' },
  { id: 'storybook-illustrated', label: 'ספר ילדים', bg: '#FFF9E8', text: '#3D2914', accent: '#E07B39', sample: 'הארנב שאהב כוכבים' },
  { id: 'playful-zine', label: 'שובב', bg: '#FFF8F0', text: '#1A1A2E', accent: '#E94560', sample: 'יומן הצעידה' },
  { id: 'romantic-vintage', label: 'רומנטי', bg: '#F8F0EA', text: '#3A2A2E', accent: '#A04060', sample: 'מכתבים שלא נשלחו' },
  { id: 'minimalist-nordic', label: 'נורדי', bg: '#FAFAFA', text: '#1C1C1C', accent: '#4A6FA5', sample: 'שקט' },
  { id: 'academic-formal', label: 'אקדמי', bg: '#FBFAF7', text: '#1A1A1A', accent: '#5C4A2E', sample: 'תולדות הרובע' },
  { id: 'bold-magazine', label: 'נועז', bg: '#FFFFFF', text: '#0A0A0A', accent: '#FF4500', sample: 'יציאה' },
  { id: 'fairytale-classic', label: 'אגדה', bg: '#FBF4E0', text: '#2A1F0E', accent: '#B8860B', sample: 'בממלכה רחוקה' },
  { id: 'poetry-quiet', label: 'שירה', bg: '#FCFCFA', text: '#2C2C2C', accent: '#6B5A4A', sample: 'נשימה' },
];

export default function AutoDesignLandingPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="px-6 pt-20 pb-16 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-800 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          חדש: אייג׳נטים מעצבים את הספר עבורך
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          העלאת כתב יד.
          <br />
          <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
            עיצוב ברמת מעצב.
          </span>
          <br />
          תוך פחות מדקה.
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          המערכת מפעילה צוות אייג׳נטים שבוחרים סגנון, פלטה, טיפוגרפיה ומיקום תמונות — ומעמדים את הספר שלך מקצה לקצה. ייצוא לוורד ול-PDF, באיכות הוצאה לאור.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            התחל בחינם
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link
            to="/features"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-300 text-gray-800 font-medium hover:border-gray-400"
          >
            כל הפיצ׳רים
          </Link>
        </div>
      </section>

      {/* For who */}
      <section className="px-6 py-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            מי משתמש בזה?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <AudienceCard
              icon={<BookOpen className="w-8 h-8 text-indigo-600" />}
              title="הוצאות לאור"
              body="העורכים שלכם מבזבזים ימים על עימוד? תייבאו את הטקסט, קבלו תוצאה ברמה מקצועית, ועברו לעריכת התוכן. שלוש גרסאות עיצוב שונות לכל ספר."
            />
            <AudienceCard
              icon={<Wand2 className="w-8 h-8 text-pink-600" />}
              title="עורכים ומעצבים"
              body="הכלי לא מחליף אתכם — הוא נותן לכם בסיס מצוין שאפשר לעדן. במקום להתחיל מאפס, התחילו ממקום של 80%."
            />
            <AudienceCard
              icon={<Layers className="w-8 h-8 text-emerald-600" />}
              title="כותבים עצמאיים"
              body="אין לכם תקציב למעצב? אל תוותרו על איכות. הקבלו ספר שנראה כאילו יצא מהוצאה — בלי לפתוח InDesign."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">איך זה עובד</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            לא תבנית אחת חוזרת — בכל פעם אייג׳נטים בוחרים את העיצוב המתאים לסיפור שלך מתוך 10 סגנונות שונים.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              n="1"
              icon={<Search className="w-7 h-7" />}
              title="אייג׳נט התכנון"
              body="קורא את הסיפור, מבין את האווירה והקהל, ובוחר את אחד מ-10 סגנונות העיצוב. מגדיר טיפוגרפיה, פלטה, מיקום תמונות וקצב עמודים."
            />
            <StepCard
              n="2"
              icon={<Zap className="w-7 h-7" />}
              title="אייג׳נט הביקורת"
              body="בודק שכל פרק יש לו פתיח, שאין תמונות חופפות, שהבחירות הגיוניות לסיפור. אם משהו לא טוב — מחזיר לתכנון לתיקון."
            />
            <StepCard
              n="3"
              icon={<Download className="w-7 h-7" />}
              title="הפקה"
              body="התוכנית מתורגמת לתצוגה במערכת, לקובץ Word ולקובץ PDF — שלושתם מאותו מקור, באותה איכות."
            />
          </div>
        </div>
      </section>

      {/* Design systems gallery */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">10 סגנונות עיצוב</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            כל סגנון פותח ידנית עם פלטה, טיפוגרפיה ואלמנטים דקורטיביים משלו. האייג׳נט בוחר את המתאים — או לחיצה נוספת מגלגלת לאחד אחר.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {DESIGN_SYSTEMS.map((ds) => (
              <div
                key={ds.id}
                className="aspect-[3/4] rounded-xl overflow-hidden shadow-md flex flex-col justify-between p-4 transition-transform hover:scale-105"
                style={{ background: ds.bg, color: ds.text }}
              >
                <div
                  className="self-center text-xs tracking-widest"
                  style={{ color: ds.accent, opacity: 0.8 }}
                >
                  ◆ ◆ ◆
                </div>
                <div className="text-center text-sm font-medium leading-tight" style={{ fontFamily: 'Frank Ruhl Libre, serif' }}>
                  {ds.sample}
                </div>
                <div
                  className="self-center text-xs font-bold tracking-wide"
                  style={{ color: ds.accent }}
                >
                  {ds.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">שאלות נפוצות</h2>
          <div className="space-y-6">
            <Faq
              q="כמה פעמים אפשר להריץ את העיצוב לאותו ספר?"
              a="עד 3 פעמים. כל הרצה בוחרת סגנון שונה ופלטה שונה, כך שיש לך 3 כיווני עיצוב לבחור מהם."
            />
            <Faq
              q="האם זה מחליף מעצב מקצועי?"
              a="לא לחלוטין. הכלי מביא אותך לרמה שמעצב מקצועי היה מגיע אליה אחרי כמה ימי עבודה — נקודת התחלה מצוינת לעריכה אנושית או לפרסום ישיר."
            />
            <Faq
              q="באיזה פורמטים אפשר לייצא?"
              a="Word (.docx) ו-PDF, שניהם מאותה תוכנית עיצוב. הקובץ Word ערוך לחלוטין; ה-PDF מוכן להדפסה."
            />
            <Faq
              q="האם זה תומך בעברית?"
              a="כן. כל 10 הסגנונות נבנו סביב טיפוגרפיה עברית (Frank Ruhl Libre, Heebo, Suez One, David Libre) ו-RTL נכון."
            />
            <Faq
              q="כמה זה עולה?"
              a="הפיצ׳ר זמין במסלולים Standard ו-Premium. כל הרצה צורכת קרדיטים מהמכסה החודשית שלך."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-20 bg-gradient-to-br from-orange-600 via-pink-600 to-violet-700 text-white text-center">
        <h2 className="text-4xl font-bold mb-6">מוכן לראות את הספר שלך מעוצב?</h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          המסלול החינמי כולל ספר אחד מלא. נסה את העיצוב — תקבל החלטה אחרי שתראה את התוצאה.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-orange-700 font-bold text-lg shadow-xl hover:shadow-2xl"
        >
          התחל בחינם
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}

function AudienceCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}

function StepCard({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="relative bg-white p-6 rounded-2xl border border-gray-200">
      <div className="absolute -top-4 right-6 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-white font-bold flex items-center justify-center shadow">
        {n}
      </div>
      <div className="mb-3 text-orange-700">{icon}</div>
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-sm">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-gray-200 bg-white p-5 cursor-pointer">
      <summary className="font-bold text-lg list-none flex justify-between items-center">
        {q}
        <span className="text-gray-400 group-open:rotate-45 transition-transform text-2xl">+</span>
      </summary>
      <p className="mt-3 text-gray-600 leading-relaxed">{a}</p>
    </details>
  );
}
