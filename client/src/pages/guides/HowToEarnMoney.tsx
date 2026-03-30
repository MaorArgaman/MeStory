import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '../../hooks/useSEO';
import {
  DollarSign,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Clock,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { GlassCard } from '../../components/ui';
import { HowToSchema, Breadcrumb, ArticleSchema } from '../../components/seo';
import { useLanguage } from '../../contexts/LanguageContext';

interface Step {
  number: number;
  icon: React.ElementType;
  title: {
    en: string;
    he: string;
  };
  description: {
    en: string;
    he: string;
  };
  tips: {
    en: string[];
    he: string[];
  };
}

const steps: Step[] = [
  {
    number: 1,
    icon: DollarSign,
    title: {
      en: 'Understand the Revenue Split',
      he: 'הבינו את חלוקת ההכנסות',
    },
    description: {
      en: 'MeStory offers one of the most competitive revenue shares in the industry. You earn 50% of every book sale. For example, if you sell a book for $10, you receive $5. This split covers platform hosting, payment processing, and marketplace services.',
      he: 'MeStory מציעה אחת מחלוקות ההכנסות התחרותיות ביותר בתעשייה. אתם מרוויחים 50% מכל מכירת ספר. לדוגמה, אם אתם מוכרים ספר ב-$10, אתם מקבלים $5. חלוקה זו מכסה אירוח פלטפורמה, עיבוד תשלומים ושירותי שוק.',
    },
    tips: {
      en: ['50% is among the highest in the industry', 'No hidden fees or charges', 'Earnings calculated on final sale price'],
      he: ['50% הוא מהגבוהים בתעשייה', 'אין עמלות נסתרות', 'הרווחים מחושבים על מחיר המכירה הסופי'],
    },
  },
  {
    number: 2,
    icon: TrendingUp,
    title: {
      en: 'Set Strategic Pricing',
      he: 'קבעו תמחור אסטרטגי',
    },
    description: {
      en: 'Price your book strategically to maximize earnings. Consider your book\'s length, genre standards, and target audience. You can offer promotional pricing, bundle deals, or keep some books free to attract readers to your paid titles.',
      he: 'תמחרו את הספר שלכם באופן אסטרטגי למקסום הרווחים. שקלו את אורך הספר, סטנדרטים של הז\'אנר וקהל היעד. תוכלו להציע תמחור מבצעי, חבילות או לשמור חלק מהספרים חינמיים כדי למשוך קוראים לכותרים בתשלום.',
    },
    tips: {
      en: ['Research similar books in your genre', 'Start lower to build reviews', 'Raise prices as popularity grows', 'Free first book can drive series sales'],
      he: ['חקרו ספרים דומים בז\'אנר שלכם', 'התחילו נמוך כדי לבנות ביקורות', 'העלו מחירים ככל שהפופולריות גדלה', 'ספר ראשון חינמי יכול להניע מכירות סדרה'],
    },
  },
  {
    number: 3,
    icon: BarChart3,
    title: {
      en: 'Track Your Earnings',
      he: 'עקבו אחר הרווחים',
    },
    description: {
      en: 'Monitor your earnings in real-time through the Earnings Dashboard. View sales by book, track daily/weekly/monthly revenue, and analyze which titles perform best. Use these insights to inform your writing and pricing decisions.',
      he: 'עקבו אחר הרווחים שלכם בזמן אמת דרך לוח בקרת הרווחים. צפו במכירות לפי ספר, עקבו אחר הכנסות יומיות/שבועיות/חודשיות ונתחו אילו כותרים מצליחים ביותר. השתמשו בתובנות אלה כדי לקבל החלטות כתיבה ותמחור.',
    },
    tips: {
      en: ['Check earnings weekly', 'Note which genres sell best for you', 'Track seasonal trends', 'Set revenue goals'],
      he: ['בדקו רווחים שבועית', 'שימו לב אילו ז\'אנרים נמכרים הכי טוב', 'עקבו אחר מגמות עונתיות', 'קבעו יעדי הכנסה'],
    },
  },
  {
    number: 4,
    icon: Wallet,
    title: {
      en: 'Connect PayPal for Withdrawals',
      he: 'חברו PayPal למשיכות',
    },
    description: {
      en: 'To receive your earnings, you need to connect a PayPal account. Go to Settings and link your PayPal email address. This is a one-time setup that enables all future withdrawals. PayPal is secure and widely available.',
      he: 'כדי לקבל את הרווחים שלכם, עליכם לחבר חשבון PayPal. עברו להגדרות וקשרו את כתובת האימייל של PayPal שלכם. זוהי הגדרה חד פעמית שמאפשרת את כל המשיכות העתידיות. PayPal מאובטח וזמין באופן נרחב.',
    },
    tips: {
      en: ['Use a verified PayPal account', 'Ensure email matches your PayPal', 'PayPal supports multiple currencies', 'Keep PayPal info updated'],
      he: ['השתמשו בחשבון PayPal מאומת', 'ודאו שהאימייל תואם ל-PayPal שלכם', 'PayPal תומכת במטבעות מרובים', 'שמרו על מידע PayPal מעודכן'],
    },
  },
  {
    number: 5,
    icon: PiggyBank,
    title: {
      en: 'Reach the Payout Threshold',
      he: 'הגיעו לסף המשיכה',
    },
    description: {
      en: 'You can withdraw earnings once you reach the minimum threshold of $10. This threshold exists to ensure efficient payment processing. Your earnings accumulate until you\'re ready to withdraw - there\'s no expiration.',
      he: 'תוכלו למשוך רווחים ברגע שתגיעו לסף המינימום של $10. סף זה קיים כדי להבטיח עיבוד תשלומים יעיל. הרווחים שלכם מצטברים עד שאתם מוכנים למשוך - אין תפוגה.',
    },
    tips: {
      en: ['$10 minimum withdrawal', 'No maximum withdrawal limit', 'Earnings never expire', 'Withdraw as often as you like'],
      he: ['משיכה מינימלית $10', 'אין הגבלת משיכה מקסימלית', 'הרווחים לא פגים', 'משכו כמה פעמים שתרצו'],
    },
  },
  {
    number: 6,
    icon: CreditCard,
    title: {
      en: 'Request a Withdrawal',
      he: 'בקשו משיכה',
    },
    description: {
      en: 'When you\'re ready to withdraw, go to Earnings and click "Withdraw". Select the amount you want to withdraw and confirm. Payments are processed within 3-5 business days and sent directly to your PayPal account.',
      he: 'כשאתם מוכנים למשוך, עברו לרווחים ולחצו "משיכה". בחרו את הסכום שברצונכם למשוך ואשרו. תשלומים מעובדים תוך 3-5 ימי עסקים ונשלחים ישירות לחשבון ה-PayPal שלכם.',
    },
    tips: {
      en: ['Withdrawals process in 3-5 days', 'You\'ll get email confirmation', 'Check PayPal for arrival', 'Keep records for taxes'],
      he: ['משיכות מעובדות תוך 3-5 ימים', 'תקבלו אישור באימייל', 'בדקו ב-PayPal שהגיע', 'שמרו רשומות למיסים'],
    },
  },
];

// Generate schema steps for structured data
const schemaSteps = steps.map((step) => ({
  name: step.title.en,
  text: step.description.en,
}));

export default function HowToEarnMoney() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const ArrowIcon = isHebrew ? ArrowLeft : ArrowRight;

  const pageTitle = isHebrew
    ? 'איך להרוויח כסף כסופר - מדריך שלב אחר שלב | MeStory'
    : 'How to Earn Money as an Author - Step by Step Guide | MeStory';

  const pageDescription = isHebrew
    ? 'למדו איך להרוויח כסף ממכירות ספרים ב-MeStory. מדריך מפורט על חלוקת 50/50, חיבור PayPal, סף משיכה ומקסום הרווחים שלכם כסופר.'
    : 'Learn how to earn money from book sales on MeStory. Detailed guide on 50/50 split, PayPal connection, payout threshold, and maximizing your earnings as an author.';

  const pageKeywords = isHebrew
    ? ['איך להרוויח כסף מספרים', 'הכנסה מכתיבה', 'תמלוגי סופר', 'פרסום עצמי הכנסה', 'PayPal סופרים', 'MeStory']
    : ['how to earn money from books', 'writing income', 'author royalties', 'self-publishing income', 'PayPal authors', 'MeStory'];

  useSEO({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl: 'https://mestory.co.il/guides/earn-money',
    keywords: pageKeywords,
    ogType: 'article',
  });

  return (
    <>
      {/* Article Schema for SEO/GEO/AEO */}
      <ArticleSchema
        headline={isHebrew ? 'איך להרוויח כסף ממכירת ספרים' : 'How to Earn Money from Selling Books'}
        description={pageDescription}
        datePublished="2024-02-01"
        dateModified="2024-12-01"
        url="https://mestory.co.il/guides/earn-money"
        articleType="HowTo"
        wordCount={1800}
        speakable={['.gradient-gold', 'h2', 'h3']}
      />

      {/* HowTo Schema for AEO/SEO */}
      <HowToSchema
        name={isHebrew ? 'איך להרוויח כסף כסופר' : 'How to Earn Money as an Author'}
        description={pageDescription}
        steps={schemaSteps}
        estimatedDuration="PT20M"
        tool={['MeStory Platform', 'PayPal Account', 'Earnings Dashboard']}
      />

      <div className="min-h-screen py-20 px-4 sm:px-8" dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Breadcrumb
              items={[
                { name: isHebrew ? 'מדריכים' : 'Guides', url: '/guides' },
                { name: isHebrew ? 'איך להרוויח כסף' : 'How to Earn Money', url: '/guides/earn-money' },
              ]}
            />
          </div>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-gold mb-4">
              {isHebrew ? 'איך להרוויח כסף כסופר' : 'How to Earn Money as an Author'}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
              {isHebrew
                ? 'מדריך מקיף למקסום הרווחים שלכם ממכירות ספרים ב-MeStory'
                : 'A comprehensive guide to maximizing your earnings from book sales on MeStory'}
            </p>
            <div className="flex items-center justify-center gap-6 text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{isHebrew ? '8 דקות קריאה' : '8 min read'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>{isHebrew ? '6 צעדים' : '6 steps'}</span>
              </div>
            </div>
          </motion.header>

          {/* Key Info Cards */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="grid md:grid-cols-3 gap-6">
              <GlassCard className="p-6 text-center" glow="gold">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-magic-gold/20 to-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-7 h-7 text-magic-gold" />
                </div>
                <h3 className="text-3xl font-bold text-magic-gold mb-2">50%</h3>
                <p className="text-gray-400 text-sm">
                  {isHebrew ? 'מכל מכירה שלכם' : 'of every sale you make'}
                </p>
              </GlassCard>

              <GlassCard className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-400/20 flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="w-7 h-7 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold text-green-500 mb-2">$10</h3>
                <p className="text-gray-400 text-sm">
                  {isHebrew ? 'סף משיכה מינימלי' : 'minimum payout threshold'}
                </p>
              </GlassCard>

              <GlassCard className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-3xl font-bold text-blue-500 mb-2">3-5</h3>
                <p className="text-gray-400 text-sm">
                  {isHebrew ? 'ימי עסקים לעיבוד' : 'business days to process'}
                </p>
              </GlassCard>
            </div>
          </motion.section>

          {/* Important Notice */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            <GlassCard className="p-6 border-l-4 border-magic-gold">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-magic-gold flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {isHebrew ? 'מידע חשוב על תשלומים' : 'Important Payment Information'}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {isHebrew
                      ? 'כל התשלומים מעובדים דרך PayPal. אתם אחראים לדיווח על ההכנסות שלכם לרשויות המס המקומיות. MeStory לא מנכה מס במקור.'
                      : 'All payments are processed through PayPal. You are responsible for reporting your earnings to your local tax authorities. MeStory does not withhold taxes.'}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.section>

          {/* Steps */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            aria-label={isHebrew ? 'צעדי המדריך' : 'Guide Steps'}
          >
            <div className="space-y-8">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <motion.article
                    key={step.number}
                    initial={{ opacity: 0, x: isHebrew ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <GlassCard className="p-8 relative overflow-hidden">
                      {/* Step Number Background */}
                      <div className={`absolute ${isHebrew ? 'left-4' : 'right-4'} top-4 text-8xl font-bold text-white/5`}>
                        {step.number}
                      </div>

                      <div className="relative">
                        {/* Step Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-400/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <span className="text-green-500 text-sm font-medium">
                              {isHebrew ? `צעד ${step.number}` : `Step ${step.number}`}
                            </span>
                            <h3 className="text-xl font-display font-bold text-white">
                              {step.title[language]}
                            </h3>
                          </div>
                        </div>

                        {/* Step Description */}
                        <p className="text-gray-300 leading-relaxed mb-6">
                          {step.description[language]}
                        </p>

                        {/* Tips */}
                        <div className="bg-white/5 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-green-500 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            {isHebrew ? 'טיפים' : 'Tips'}
                          </h4>
                          <ul className="space-y-2">
                            {step.tips[language].map((tip, tipIndex) => (
                              <li key={tipIndex} className="flex items-start gap-2 text-gray-400 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.article>
                );
              })}
            </div>
          </motion.section>

          {/* Earnings Example */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <GlassCard className="p-8">
              <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">
                {isHebrew ? 'דוגמאות לרווחים' : 'Earnings Examples'}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className={`py-3 px-4 text-gray-400 font-medium ${isHebrew ? 'text-right' : 'text-left'}`}>
                        {isHebrew ? 'מחיר ספר' : 'Book Price'}
                      </th>
                      <th className={`py-3 px-4 text-gray-400 font-medium ${isHebrew ? 'text-right' : 'text-left'}`}>
                        {isHebrew ? 'חלקכם (50%)' : 'Your Share (50%)'}
                      </th>
                      <th className={`py-3 px-4 text-gray-400 font-medium ${isHebrew ? 'text-right' : 'text-left'}`}>
                        {isHebrew ? '10 מכירות' : '10 Sales'}
                      </th>
                      <th className={`py-3 px-4 text-gray-400 font-medium ${isHebrew ? 'text-right' : 'text-left'}`}>
                        {isHebrew ? '100 מכירות' : '100 Sales'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">$4.99</td>
                      <td className="py-3 px-4 text-green-500">$2.50</td>
                      <td className="py-3 px-4 text-white">$25</td>
                      <td className="py-3 px-4 text-magic-gold font-semibold">$250</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">$9.99</td>
                      <td className="py-3 px-4 text-green-500">$5.00</td>
                      <td className="py-3 px-4 text-white">$50</td>
                      <td className="py-3 px-4 text-magic-gold font-semibold">$500</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">$14.99</td>
                      <td className="py-3 px-4 text-green-500">$7.50</td>
                      <td className="py-3 px-4 text-white">$75</td>
                      <td className="py-3 px-4 text-magic-gold font-semibold">$750</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-white">$19.99</td>
                      <td className="py-3 px-4 text-green-500">$10.00</td>
                      <td className="py-3 px-4 text-white">$100</td>
                      <td className="py-3 px-4 text-magic-gold font-semibold">$1,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            <GlassCard glow="gold" className="p-8 text-center">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                {isHebrew ? 'מוכנים להתחיל להרוויח?' : 'Ready to Start Earning?'}
              </h2>
              <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                {isHebrew
                  ? 'הצטרפו לאלפי סופרים שכבר מרוויחים מהספרים שלהם ב-MeStory. כתבו, פרסמו והתחילו להרוויח היום!'
                  : 'Join thousands of authors already earning from their books on MeStory. Write, publish, and start earning today!'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold rounded-lg hover:brightness-110 transition-all text-lg"
                >
                  {isHebrew ? 'התחילו להרוויח' : 'Start Earning'}
                  <ArrowIcon className="w-5 h-5" />
                </Link>
                <Link
                  to="/earnings"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all text-lg"
                >
                  {isHebrew ? 'לוח בקרת הרווחים' : 'Earnings Dashboard'}
                  <ArrowIcon className="w-5 h-5" />
                </Link>
              </div>
            </GlassCard>
          </motion.section>

          {/* Navigation */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex justify-between items-center"
          >
            <Link
              to="/guides/publish-book"
              className="flex items-center gap-2 text-gray-400 hover:text-magic-gold transition-colors"
            >
              {isHebrew ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isHebrew ? 'איך לפרסם ספר' : 'How to Publish'}</span>
            </Link>
            <Link
              to="/guides"
              className="flex items-center gap-2 text-gray-400 hover:text-magic-gold transition-colors"
            >
              <span>{isHebrew ? 'כל המדריכים' : 'All Guides'}</span>
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </motion.nav>
        </div>
      </div>
    </>
  );
}
