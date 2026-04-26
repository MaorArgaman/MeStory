import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Palette,
  BookOpen,
  Users,
  Globe,
  Mic,
  ShieldCheck,
  Printer,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { GlassCard, GlowingButton, OptimizedImage } from '../components/ui';
import { SEO } from '../components/seo';
import { useLanguage } from '../contexts/LanguageContext';

interface Feature {
  icon: typeof Sparkles;
  image: string;
  titleHe: string;
  titleEn: string;
  descHe: string;
  descEn: string;
  bulletsHe: string[];
  bulletsEn: string[];
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    image: '/img/feature-ai-writing.png',
    titleHe: 'כתיבה עם בינה מלאכותית',
    titleEn: 'AI-guided writing',
    descHe: 'שאלות מנחות, ניסוח עדין ושיפור סגנוני, כל זה תוך כדי הכתיבה, בלי להחליף את הקול שלך.',
    descEn: 'Guided prompts, gentle phrasing and stylistic enhancements, all while you write, without replacing your voice.',
    bulletsHe: [
      'יצירת ראשי פרקים אוטומטית מסיפור גלם',
      'הצעות לשיפור משפטים בעברית טבעית',
      'תרגום אוטומטי לאנגלית ולשפות נוספות',
    ],
    bulletsEn: [
      'Auto-generated chapter outlines from raw notes',
      'Sentence-level improvement suggestions',
      'Automatic translation to multiple languages',
    ],
  },
  {
    icon: Palette,
    image: '/img/feature-cover-studio.png',
    titleHe: 'סטודיו עיצוב לעטיפות',
    titleEn: 'Cover design studio',
    descHe: 'עיצוב עטיפה מקצועי בכמה קליקים, עם תבניות, גופנים, גרדיאנטים ותמונות AI.',
    descEn: 'Professional cover design in a few clicks, with templates, fonts, gradients, and AI imagery.',
    bulletsHe: [
      'מאות תבניות מותאמות לספרי הנצחה ואוטוביוגרפיה',
      'יצירת תמונות עטיפה בהתאמה אישית עם AI',
      'עטיפה קדמית, אחורית ושדרה, מוכן לדפוס',
    ],
    bulletsEn: [
      'Hundreds of templates for memorial books and autobiographies',
      'Custom AI-generated cover imagery',
      'Front, back and spine, print-ready',
    ],
  },
  {
    icon: BookOpen,
    image: '/img/feature-workspace.png',
    titleHe: 'פריסת עמודים מקצועית',
    titleEn: 'Professional page layout',
    descHe: 'עורך לייאאוט מלא: גודלי עמוד, שוליים, ראשי פרקים, אותיות פתיחה, תמונות פנימיות ועוד.',
    descEn: 'Full layout editor: page sizes, margins, chapter heads, drop caps, inline images and more.',
    bulletsHe: [
      'תמיכה מלאה ב־RTL לעברית',
      'תבניות עיצוב מובנות לטקסטים ארוכים',
      'תצוגה מקדימה אינטראקטיבית של הספר',
    ],
    bulletsEn: [
      'Full RTL support for Hebrew',
      'Built-in design templates for long-form text',
      'Interactive book preview',
    ],
  },
  {
    icon: Users,
    image: '/img/community-group.png',
    titleHe: 'כתיבה משותפת',
    titleEn: 'Collaborative writing',
    descHe: 'הזמינו בני משפחה וחברים לתרום פרקים, סיפורים ותמונות. כולם תורמים, אתם עורכים ומנציחים.',
    descEn: 'Invite family and friends to contribute chapters, stories and photos. Everyone contributes, you edit and preserve.',
    bulletsHe: [
      'הזמנות בקישור ייחודי, ללא צורך ברישום',
      'ניהול הרשאות ואישור תרומות',
      'התראות ועדכונים בזמן אמת',
    ],
    bulletsEn: [
      'Unique invite links, no registration required',
      'Permission management and contribution approvals',
      'Real-time notifications and updates',
    ],
  },
  {
    icon: Mic,
    image: '/img/voice-interview.png',
    titleHe: 'הקלטת סיפורים בהקלדה קולית',
    titleEn: 'Voice-to-text storytelling',
    descHe: 'הקליטו זיכרונות וסיפורים, ו־MeStory יתמלל ויסדר אותם בפרקי ספר מובנים.',
    descEn: 'Record memories and stories, and MeStory will transcribe and arrange them into structured chapters.',
    bulletsHe: [
      'תמלול אוטומטי בעברית ובאנגלית',
      'סידור אוטומטי לפי נושא וכרונולוגיה',
      'שמירת קובץ קול לצד הטקסט',
    ],
    bulletsEn: [
      'Automatic transcription in Hebrew and English',
      'Topic and chronology-based auto-arrangement',
      'Audio kept alongside the text',
    ],
  },
  {
    icon: Globe,
    image: '/img/feature-marketplace.png',
    titleHe: 'חנות ספרים ציבורית',
    titleEn: 'Public bookstore',
    descHe: 'פרסמו את הספר שלכם לעיני קהל רחב, או שמרו אותו פרטי. אתם בוחרים.',
    descEn: 'Publish your book to a wide audience, or keep it private. You decide.',
    bulletsHe: [
      'בחירה בין פרסום ציבורי או פרטי',
      'תמחור גמיש: חינם, בתשלום או מתנה',
      'הכנסות מהמכירות ישירות לחשבונכם',
    ],
    bulletsEn: [
      'Choice of public or private publishing',
      'Flexible pricing: free, paid, or gift',
      'Sales revenue directly to your account',
    ],
  },
  {
    icon: Printer,
    image: '/img/launch-day.png',
    titleHe: 'ייצוא PDF מוכן לדפוס',
    titleEn: 'Print-ready PDF export',
    descHe: 'הספר שלכם מוכן להדפסה בכל בית דפוס, גם דיגיטלית וגם פיזית.',
    descEn: 'Your book is ready for printing at any printer, both digital and physical.',
    bulletsHe: [
      'PDF איכותי ב־300 DPI',
      'תמיכה בגדלים סטנדרטיים (A4, A5, פוקט-בוק)',
      'הזמנת הדפסה ישירה דרך שותפים',
    ],
    bulletsEn: [
      'High-quality PDF at 300 DPI',
      'Standard sizes (A4, A5, pocket)',
      'Direct print ordering via partners',
    ],
  },
  {
    icon: ShieldCheck,
    image: '/img/new/texture-paper.png',
    titleHe: 'אבטחה ופרטיות',
    titleEn: 'Security & privacy',
    descHe: 'הסיפורים שלכם, שלכם בלבד. הצפנה מלאה, גיבויים אוטומטיים ובעלות מלאה על התוכן.',
    descEn: 'Your stories are yours alone. Full encryption, automatic backups, and full content ownership.',
    bulletsHe: [
      'הצפנת SSL/TLS בכל התקשורת',
      'גיבויים יומיים בענן',
      'אפשרות מחיקה מלאה של החשבון והתוכן',
    ],
    bulletsEn: [
      'SSL/TLS encryption on all communication',
      'Daily cloud backups',
      'Full account and content deletion option',
    ],
  },
];

export default function FeaturesPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isHebrew = language === 'he';
  const Arrow = isHebrew ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen relative pb-20">
      <SEO
        title={isHebrew ? 'תכונות הפלטפורמה | MeStory' : 'Platform Features | MeStory'}
        description={isHebrew
          ? 'גלו את כל התכונות של MeStory: כתיבה עם בינה מלאכותית, סטודיו עיצוב, פריסת עמודים מקצועית, כתיבה משותפת, הקלטות קוליות ועוד.'
          : 'Discover MeStory features: AI-guided writing, design studio, professional layout, collaboration, voice recording, and more.'}
        type="website"
        locale={isHebrew ? 'he_IL' : 'en_US'}
        url="/features"
      />

      {/* Hero */}
      <div className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
        <div className="absolute inset-0">
          <OptimizedImage
            src="/img/landing-hero-new.png"
            alt=""
            decorative
            lazy={false}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-space/70 via-deep-space/60 to-deep-space" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-5 rounded-full bg-memorial-gold/20 border border-memorial-gold/40 text-memorial-gold text-sm">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {isHebrew ? 'תכונות הפלטפורמה' : 'Platform features'}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {isHebrew ? 'כל מה שצריך כדי להנציח סיפור' : 'Everything you need to preserve a story'}
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              {isHebrew
                ? 'MeStory היא פלטפורמה שלמה ליצירת ספרי הנצחה, אוטוביוגרפיה וספרי משפחה, מהרעיון הראשון ועד לספר המודפס.'
                : 'MeStory is a complete platform for creating memorial books, autobiographies, and family books, from the first idea to the printed book.'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <GlassCard className="h-full overflow-hidden p-0">
                  <div className="relative h-44 sm:h-52 overflow-hidden">
                    <OptimizedImage
                      src={feature.image}
                      alt=""
                      decorative
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-deep-space/40 to-transparent" />
                    <div className="absolute bottom-3 right-3 left-3 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-memorial-gold/30 border border-memorial-gold/50 backdrop-blur-sm">
                        <Icon className="w-6 h-6 text-memorial-gold" aria-hidden="true" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                        {isHebrew ? feature.titleHe : feature.titleEn}
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-300 leading-relaxed mb-4">
                      {isHebrew ? feature.descHe : feature.descEn}
                    </p>
                    <ul className="space-y-1.5 text-gray-400 text-sm">
                      {(isHebrew ? feature.bulletsHe : feature.bulletsEn).map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-memorial-gold mt-1" aria-hidden="true">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            {isHebrew ? 'מוכנים להתחיל?' : 'Ready to get started?'}
          </h2>
          <p className="text-gray-300 mb-6">
            {isHebrew ? 'התחילו לכתוב את הסיפור שלכם, בחינם.' : 'Start writing your story, for free.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <GlowingButton variant="gold" size="lg" onClick={() => navigate('/register')}>
              {isHebrew ? 'הרשמה חינם' : 'Sign up free'}
              <Arrow className="w-4 h-4" aria-hidden="true" />
            </GlowingButton>
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors text-sm"
            >
              {isHebrew ? 'מסלולי תמחור' : 'View pricing'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
