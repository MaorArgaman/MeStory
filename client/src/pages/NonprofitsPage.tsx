import { motion } from 'framer-motion';
import {
  HeartHandshake,
  Users,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Mail,
  Phone,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { GlassCard, OptimizedImage } from '../components/ui';
import { SEO } from '../components/seo';
import { useLanguage } from '../contexts/LanguageContext';

const CONTACT_EMAIL = 'mestory.tec@gmail.com';
const CONTACT_PHONE_DISPLAY = '050-222-4036';
const CONTACT_PHONE_TEL = '+972502224036';

interface BenefitItem {
  icon: typeof HeartHandshake;
  titleHe: string;
  titleEn: string;
  descHe: string;
  descEn: string;
}

const BENEFITS: BenefitItem[] = [
  {
    icon: HeartHandshake,
    titleHe: 'מסלול עמותות מסובסד',
    titleEn: 'Subsidized nonprofit plan',
    descHe: 'עמותות מוכרות מקבלות הנחה משמעותית על כל מסלולי הפלטפורמה, כולל ספרים ללא הגבלה, קרדיטי AI מורחבים והדרכה אישית.',
    descEn: 'Recognized nonprofits receive a significant discount on all platform tiers, including unlimited books, expanded AI credits, and personal training.',
  },
  {
    icon: Users,
    titleHe: 'יצירה משותפת בקהילה',
    titleEn: 'Community co-creation',
    descHe: 'אספו עדויות ממאות בני משפחה במקביל. כל אחד תורם דרך קישור פרטי, וצוות העמותה עורך ומאחד לספר אחד מכובד.',
    descEn: 'Collect testimonies from hundreds of family members in parallel. Each contributes via a private link, and the organization team edits and combines into one dignified book.',
  },
  {
    icon: BookOpen,
    titleHe: 'פרויקטים של הנצחה רחבי היקף',
    titleEn: 'Large-scale memorial projects',
    descHe: 'מתאים במיוחד לעמותות הנצחת חללים, ארגוני שואה, קהילות וגופי שימור מורשת. כלי מקצועי לפרויקטים מהותיים.',
    descEn: 'Especially suited for fallen-soldier memorial organizations, Holocaust groups, communities, and heritage preservation bodies. A professional tool for meaningful projects.',
  },
  {
    icon: Sparkles,
    titleHe: 'עזרה של בינה מלאכותית',
    titleEn: 'AI assistance',
    descHe: 'AI שמנחה את התורמים בשאלות עדינות, משפר ניסוח, ומסייע לסדר זיכרונות לפרקים, וחוסך עשרות שעות עבודה.',
    descEn: 'AI guides contributors with gentle prompts, improves phrasing, and helps arrange memories into chapters, saving dozens of hours of work.',
  },
  {
    icon: ShieldCheck,
    titleHe: 'פרטיות ובעלות מלאה',
    titleEn: 'Privacy & full ownership',
    descHe: 'הסיפורים שייכים לעמותה ולמשפחות בלבד. אפשרויות פרסום מלא, חלקי או פרטי. ייצוא מלא של כל התכנים בכל עת.',
    descEn: 'Stories belong solely to the organization and the families. Public, partial, or private publication options. Full content export available at any time.',
  },
];

interface UseCaseItem {
  image: string;
  titleHe: string;
  titleEn: string;
  descHe: string;
  descEn: string;
}

const USE_CASES: UseCaseItem[] = [
  {
    image: '/img/new/hero-soldiers-unit.png',
    titleHe: 'הנצחת חללי צה"ל ופעולות איבה',
    titleEn: 'Memorializing fallen soldiers and victims of terror',
    descHe: 'יצירת ספרי זיכרון לכל חלל, ובהם שילוב סיפורי משפחה, חברים, מפקדים וחיילים, ועיצוב מכבד התואם את רוח האדם.',
    descEn: 'Creating memorial books for each fallen soldier, combining stories from family, friends, commanders, and fellow soldiers, with respectful design fitting the person.',
  },
  {
    image: '/img/new/hero-grandma-grandkids.png',
    titleHe: 'ארגוני ניצולי שואה והעדה',
    titleEn: 'Holocaust survivor and testimony organizations',
    descHe: 'תיעוד עדויות שאי-אפשר להחליף: הקלטות קוליות של ניצולים, תרגום לאנגלית ושמירה לדורות הבאים.',
    descEn: 'Documenting irreplaceable testimonies: voice recordings of survivors, translation to English, preservation for future generations.',
  },
  {
    image: '/img/community-workshop.png',
    titleHe: 'קהילות וארגוני מורשת',
    titleEn: 'Communities and heritage organizations',
    descHe: 'תיעוד היסטוריית הקהילה, סיפורי מייסדים ודמויות מפתח, בספר אחד שייצג את הקהילה למאות שנים.',
    descEn: 'Documenting community history, founder stories and key figures, in one book representing the community for hundreds of years.',
  },
  {
    image: '/img/new/social-grandma-yemenite.png',
    titleHe: 'בתי אבות ודיור מוגן',
    titleEn: 'Senior homes and assisted living',
    descHe: 'פעילות הנצחה משמעותית עם הדיירים: סיפורי חיים אישיים, מתנת אהבה למשפחות, ופעילות טיפולית רגשית.',
    descEn: 'Meaningful preservation activity with residents: personal life stories, a love-gift for families, and emotional therapeutic activity.',
  },
];

export default function NonprofitsPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const Arrow = isHebrew ? ArrowLeft : ArrowRight;

  const subjectHe = encodeURIComponent('פניית עמותה ל־MeStory');
  const subjectEn = encodeURIComponent('Nonprofit inquiry to MeStory');
  const mailHref = `mailto:${CONTACT_EMAIL}?subject=${isHebrew ? subjectHe : subjectEn}`;

  return (
    <div className="min-h-screen relative pb-20">
      <SEO
        title={isHebrew ? 'לעמותות וארגונים | MeStory' : 'For Nonprofits & Organizations | MeStory'}
        description={isHebrew
          ? 'MeStory לעמותות הנצחה, ארגוני שואה, קהילות וגופי מורשת. כלי מקצועי ליצירת ספרי זיכרון בקנה מידה רחב, במחיר מסובסד.'
          : 'MeStory for memorial nonprofits, Holocaust organizations, communities, and heritage bodies. A professional tool for large-scale memorial books, at a subsidized price.'}
        type="website"
        locale={isHebrew ? 'he_IL' : 'en_US'}
        url="/nonprofits"
      />

      {/* Hero */}
      <div className="relative overflow-hidden py-20 sm:py-32 px-4 sm:px-6">
        <div className="absolute inset-0">
          <OptimizedImage
            src="/img/new/hero-bereaved-herzl.png"
            alt=""
            decorative
            lazy={false}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-space/70 via-deep-space/60 to-deep-space" />
        </div>
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-5xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-5 rounded-full bg-memorial-gold/20 border border-memorial-gold/40 text-memorial-gold text-sm">
            <HeartHandshake className="w-4 h-4" aria-hidden="true" />
            {isHebrew ? 'תוכנית עמותות' : 'Nonprofit program'}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {isHebrew ? 'הנצחה בקנה מידה רחב' : 'Memorial work at scale'}
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            {isHebrew
              ? 'MeStory עובדת עם עמותות הנצחה, ארגוני שואה, קהילות וגופי מורשת כדי להפוך אלפי סיפורים לספרים מכובדים, במחיר מסובסד וליווי אישי.'
              : 'MeStory partners with memorial nonprofits, Holocaust organizations, communities, and heritage bodies to turn thousands of stories into dignified books, at a subsidized price and with personal support.'}
          </p>
        </motion.header>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12">
        <section
          aria-label={isHebrew ? 'יתרונות' : 'Benefits'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {BENEFITS.map((b, idx) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <GlassCard className="p-6 h-full">
                  <div className="p-3 mb-3 inline-flex rounded-xl bg-memorial-gold/20 border border-memorial-gold/30">
                    <Icon className="w-6 h-6 text-memorial-gold" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {isHebrew ? b.titleHe : b.titleEn}
                  </h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {isHebrew ? b.descHe : b.descEn}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          aria-label={isHebrew ? 'מי משתמש ב־MeStory' : 'Who uses MeStory'}
          className="mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
            {isHebrew ? 'איפה זה עובד הכי טוב' : 'Where it works best'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {USE_CASES.map((u, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <GlassCard className="overflow-hidden p-0 h-full">
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <OptimizedImage
                      src={u.image}
                      alt=""
                      decorative
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-deep-space/30 to-transparent" />
                    <h3 className="absolute bottom-4 right-4 left-4 text-xl font-bold text-memorial-gold drop-shadow-lg">
                      {isHebrew ? u.titleHe : u.titleEn}
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {isHebrew ? u.descHe : u.descEn}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          aria-label={isHebrew ? 'יצירת קשר' : 'Contact us'}
        >
          <GlassCard className="overflow-hidden p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-48 md:h-auto min-h-[280px] overflow-hidden">
                <OptimizedImage
                  src="/img/new/military-hands-book.png"
                  alt=""
                  decorative
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-deep-space/30 to-deep-space/80 md:bg-gradient-to-l md:from-transparent md:to-deep-space" />
              </div>
              <div className="p-8 sm:p-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  {isHebrew ? 'מתחילים שיחה' : 'Let\'s start a conversation'}
                </h2>
                <p className="text-gray-300 mb-6">
                  {isHebrew
                    ? 'ספרו לנו על הפרויקט שלכם: מספר אנשים שצריכים תיעוד, היקף הסיפורים, לוח זמנים. נחזור אליכם תוך יום עסקים עם הצעה מותאמת.'
                    : 'Tell us about your project: number of people to document, scope of stories, timeline. We\'ll get back to you within one business day with a tailored proposal.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <a
                    href={mailHref}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-memorial-gold text-deep-space font-bold hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-memorial-gold focus:ring-offset-2 focus:ring-offset-deep-space"
                  >
                    <Mail className="w-5 h-5" aria-hidden="true" />
                    {isHebrew ? 'שלחו מייל' : 'Send email'}
                    <Arrow className="w-4 h-4" aria-hidden="true" />
                  </a>
                  <a
                    href={`tel:${CONTACT_PHONE_TEL}`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    <Phone className="w-5 h-5" aria-hidden="true" />
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                </div>

                <p className="text-gray-400 text-sm">
                  {isHebrew ? 'או בדוא"ל ישירות:' : 'Or email directly:'}{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-memorial-gold hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      </div>
    </div>
  );
}
