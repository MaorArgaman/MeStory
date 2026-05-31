import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Sparkles,
  Crown,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { GlassCard, GlowingButton, OptimizedImage } from '../components/ui';
import { SEO } from '../components/seo';
import { useLanguage } from '../contexts/LanguageContext';

interface PricingTier {
  id: 'free' | 'standard' | 'premium';
  icon: typeof Sparkles;
  image: string;
  highlighted?: boolean;
  nameHe: string;
  nameEn: string;
  taglineHe: string;
  taglineEn: string;
  priceILS: number | string;
  priceUSD: number | string;
  unitHe: string;
  unitEn: string;
  featuresHe: string[];
  featuresEn: string[];
  ctaHe: string;
  ctaEn: string;
  ctaPath: string;
}

const TIERS: PricingTier[] = [
  {
    id: 'free',
    icon: Sparkles,
    image: '/img/tier-free.png',
    nameHe: 'חינם',
    nameEn: 'Free',
    taglineHe: 'התחילו לכתוב, בלי כרטיס אשראי',
    taglineEn: 'Start writing without a credit card',
    priceILS: 0,
    priceUSD: 0,
    unitHe: 'לתמיד',
    unitEn: 'forever',
    featuresHe: [
      'יצירת ספר אחד',
      '50 קרדיטים של AI לחודש',
      'כלי כתיבה בסיסיים',
      'ייצוא ל־PDF (עם סימון מים)',
      'גלישה ב-Marketplace בלבד',
    ],
    featuresEn: [
      'Single book',
      '50 AI credits per month',
      'Basic writing tools',
      'PDF export (with watermark)',
      'Marketplace browsing only',
    ],
    ctaHe: 'התחילו עכשיו',
    ctaEn: 'Start now',
    ctaPath: '/register',
  },
  {
    id: 'standard',
    icon: Crown,
    image: '/img/tier-standard.png',
    highlighted: true,
    nameHe: 'סטנדרט',
    nameEn: 'Standard',
    taglineHe: 'לכותבים שמנציחים בקצב שלהם',
    taglineEn: 'For writers who preserve at their own pace',
    priceILS: 99,
    priceUSD: 25,
    unitHe: 'לחודש',
    unitEn: 'per month',
    featuresHe: [
      'עד 10 ספרים',
      '700 קרדיטים של AI לחודש',
      'כתיבה קולית + ראיון AI',
      'יצירת כריכות AI ועיצוב מלא',
      'תרגום פרקים',
      'פרסום ב-Marketplace (חלוקה 70/30)',
      '3 כריכות AI חינם בחודש',
      'ייצוא PDF/DOCX ללא watermark',
    ],
    featuresEn: [
      'Up to 10 books',
      '700 AI credits per month',
      'Voice writing + AI interview',
      'AI cover generation + full design',
      'Translation',
      'Marketplace publishing (70/30 split)',
      '3 free AI covers per month',
      'PDF/DOCX export, no watermark',
    ],
    ctaHe: 'שדרגו לסטנדרט',
    ctaEn: 'Upgrade to Standard',
    ctaPath: '/subscription',
  },
  {
    id: 'premium',
    icon: Crown,
    image: '/img/tier-premium.png',
    nameHe: 'פרימיום',
    nameEn: 'Premium',
    taglineHe: 'לפרויקטים גדולים, ללא הגבלות',
    taglineEn: 'For large projects, without limits',
    priceILS: 250,
    priceUSD: 65,
    unitHe: 'לחודש',
    unitEn: 'per month',
    featuresHe: [
      'ספרים ללא הגבלה',
      '2500 קרדיטים של AI לחודש',
      'הכל מ-Standard',
      'תור AI מועדף (Priority Queue)',
      '10 כריכות AI חינם בחודש',
      '3 ניתוחים מתקדמים חינם בחודש',
      'פרסום ב-Marketplace (חלוקה 85/15)',
      'תמיכה אישית, SLA 24 שעות',
    ],
    featuresEn: [
      'Unlimited books',
      '2500 AI credits per month',
      'Everything in Standard',
      'Priority AI queue',
      '10 free AI covers per month',
      '3 free advanced analyses per month',
      'Marketplace publishing (85/15 split)',
      'Priority support, 24h SLA',
    ],
    ctaHe: 'שדרגו לפרימיום',
    ctaEn: 'Upgrade to Premium',
    ctaPath: '/subscription',
  },
];

interface FAQItem {
  qHe: string;
  qEn: string;
  aHe: string;
  aEn: string;
}

const FAQS: FAQItem[] = [
  {
    qHe: 'האם אפשר לבטל בכל עת?',
    qEn: 'Can I cancel at any time?',
    aHe: 'כן. אפשר לבטל את המנוי בכל רגע מתוך הגדרות החשבון, ולא תיגבה חיוב נוסף. הגישה לתכונות הפרימיום נשארת עד תום תקופת החיוב.',
    aEn: 'Yes. You can cancel from your account settings at any time, with no additional charges. Premium access remains until the end of the billing period.',
  },
  {
    qHe: 'מה קורה לספרים שלי אם אני מבטל מנוי?',
    qEn: 'What happens to my books if I cancel?',
    aHe: 'הספרים שכבר יצרתם נשארים שלכם לתמיד. הצפייה והייצוא ל־PDF נשמרים גם במסלול החינם. תכונות פרימיום (כמו AI נוסף או תרגומים) פשוט לא יהיו זמינות עד שתחזרו למנוי.',
    aEn: 'Your existing books remain yours forever. Viewing and PDF export are kept on the free tier. Premium features (additional AI or translations) become unavailable until you resubscribe.',
  },
  {
    qHe: 'מהם "קרדיטים של AI"?',
    qEn: 'What are "AI credits"?',
    aHe: 'כל פעולת AI (יצירת תוכן, תרגום, יצירת תמונה וכו\') צורכת קרדיטים. הקרדיטים מתחדשים בתחילת כל חודש. אפשר לרכוש קרדיטים נוספים במידת הצורך.',
    aEn: 'Each AI action (text generation, translation, image generation, etc.) consumes credits. Credits renew at the start of each month. Additional credits can be purchased as needed.',
  },
  {
    qHe: 'האם יש מסלול חינם לעמותות?',
    qEn: 'Is there a free plan for nonprofits?',
    aHe: 'כן! עמותות וארגונים שעוסקים בהנצחה זכאים למסלול מיוחד. צרו קשר דרך עמוד "לעמותות" לקבלת פרטים.',
    aEn: 'Yes! Nonprofits and memorial organizations are eligible for a special plan. Contact us via the "For Organizations" page for details.',
  },
  {
    qHe: 'אילו אמצעי תשלום אתם מקבלים?',
    qEn: 'Which payment methods do you accept?',
    aHe: 'PayPal וכרטיסי אשראי מובילים. כל התשלומים מאובטחים בהצפנת SSL מלאה ומעובדים על ידי ספקי תשלום מוסמכים.',
    aEn: 'PayPal and major credit cards. All payments are secured with full SSL encryption and processed by certified payment providers.',
  },
];

export default function PricingPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isHebrew = language === 'he';
  const Arrow = isHebrew ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen relative pb-20">
      <SEO
        title={isHebrew ? 'תמחור ומסלולים | MeStory' : 'Pricing & Plans | MeStory'}
        description={isHebrew
          ? 'מסלולי תמחור פשוטים וגמישים: חינם, סטנדרט ופרימיום. בחרו את המסלול שמתאים לכם והתחילו להנציח.'
          : 'Simple, flexible pricing: Free, Standard, and Premium. Choose the plan that fits you and start preserving stories.'}
        type="website"
        locale={isHebrew ? 'he_IL' : 'en_US'}
        url="/pricing"
      />

      {/* Hero */}
      <div className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
        <div className="absolute inset-0">
          <OptimizedImage
            src="/img/pricing-hero.png"
            alt=""
            decorative
            lazy={false}
            className="w-full h-full object-cover opacity-30"
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
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {isHebrew ? 'מסלולי תמחור' : 'Pricing plans'}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {isHebrew ? 'תמחור פשוט וגמיש' : 'Simple, flexible pricing'}
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            {isHebrew
              ? 'התחילו בחינם, שדרגו רק כשתרצו. אין התחייבויות, אפשר לבטל בכל עת.'
              : 'Start free, upgrade when you choose. No commitments, cancel anytime.'}
          </p>
        </motion.header>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {TIERS.map((tier, idx) => {
            const Icon = tier.icon;
            const price = isHebrew ? tier.priceILS : tier.priceUSD;
            const symbol = isHebrew ? '₪' : '$';
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <GlassCard
                  className={`h-full flex flex-col relative overflow-hidden p-0 ${
                    tier.highlighted ? 'ring-2 ring-memorial-gold' : ''
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-memorial-gold text-deep-space text-xs font-bold rounded-full whitespace-nowrap shadow-lg">
                      {isHebrew ? 'הכי פופולרי' : 'Most popular'}
                    </div>
                  )}

                  <div className="relative h-40 overflow-hidden">
                    <OptimizedImage
                      src={tier.image}
                      alt=""
                      decorative
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-deep-space/40 to-transparent" />
                    <div className="absolute bottom-3 right-4 left-4 flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl backdrop-blur-sm ${
                          tier.highlighted
                            ? 'bg-memorial-gold/40 border border-memorial-gold/60'
                            : 'bg-white/10 border border-white/20'
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${tier.highlighted ? 'text-memorial-gold' : 'text-white'}`}
                          aria-hidden="true"
                        />
                      </div>
                      <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                        {isHebrew ? tier.nameHe : tier.nameEn}
                      </h2>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    <p className="text-gray-400 text-sm mb-5 min-h-[2.5em]">
                      {isHebrew ? tier.taglineHe : tier.taglineEn}
                    </p>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-bold text-white">
                          {symbol}
                          {price}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {isHebrew ? tier.unitHe : tier.unitEn}
                        </span>
                      </div>
                    </div>

                    <ul className="flex-1 space-y-2.5 mb-6">
                      {(isHebrew ? tier.featuresHe : tier.featuresEn).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                          <Check
                            className="w-4 h-4 text-memorial-gold flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <GlowingButton
                      variant={tier.highlighted ? 'gold' : 'primary'}
                      fullWidth
                      onClick={() => navigate(tier.ctaPath)}
                    >
                      {isHebrew ? tier.ctaHe : tier.ctaEn}
                      <Arrow className="w-4 h-4" aria-hidden="true" />
                    </GlowingButton>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-3xl mx-auto"
          aria-label={isHebrew ? 'שאלות נפוצות' : 'Frequently asked questions'}
        >
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-7 h-7 text-memorial-gold" aria-hidden="true" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {isHebrew ? 'שאלות נפוצות' : 'Frequently asked questions'}
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <details
                key={i}
                className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer text-white font-medium list-none hover:bg-white/5">
                  <span>{isHebrew ? item.qHe : item.qEn}</span>
                  <span
                    className="text-memorial-gold transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <div className="px-4 pb-4 text-gray-300 leading-relaxed text-sm">
                  {isHebrew ? item.aHe : item.aEn}
                </div>
              </details>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
