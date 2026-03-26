import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  ChevronDown,
  BookOpen,
  CreditCard,
  Sparkles,
  Upload,
  DollarSign,
  Star,
  FileText,
  Palette,
  Globe,
  Shield,
  Wallet,
  RefreshCw,
  UserCog,
  Search
} from 'lucide-react';
import { GlassCard } from '../components/ui';
import { FAQSchema, Breadcrumb } from '../components/seo';
import { useLanguage } from '../contexts/LanguageContext';

interface FAQItem {
  id: string;
  icon: React.ElementType;
  question: {
    en: string;
    he: string;
  };
  answer: {
    en: string;
    he: string;
  };
  category: string;
}

const faqItems: FAQItem[] = [
  // Getting Started
  {
    id: 'getting-started-1',
    icon: BookOpen,
    category: 'getting-started',
    question: {
      en: 'How do I get started with MeStory?',
      he: 'איך מתחילים עם MeStory?',
    },
    answer: {
      en: 'Getting started is easy! Simply create a free account, and you can immediately start writing your first book. Our AI-powered editor will guide you through the process, from the first word to the final chapter. You get free credits to try our AI features.',
      he: 'ההתחלה פשוטה! פשוט צרו חשבון חינם, ותוכלו מיד להתחיל לכתוב את הספר הראשון שלכם. העורך המופעל בבינה מלאכותית שלנו ילווה אתכם בתהליך, מהמילה הראשונה ועד לפרק האחרון. תקבלו קרדיטים חינמיים לנסות את תכונות ה-AI.',
    },
  },
  {
    id: 'getting-started-2',
    icon: UserCog,
    category: 'getting-started',
    question: {
      en: 'Do I need any writing experience to use MeStory?',
      he: 'האם צריך ניסיון בכתיבה כדי להשתמש ב-MeStory?',
    },
    answer: {
      en: 'Not at all! MeStory is designed for writers of all levels. Our AI assistant helps beginners get started with suggestions, plot development, and character creation. Experienced writers can use our advanced tools to enhance their workflow.',
      he: 'בכלל לא! MeStory מתוכנן לכותבים בכל הרמות. עוזר ה-AI שלנו עוזר למתחילים להתחיל עם הצעות, פיתוח עלילה ויצירת דמויות. כותבים מנוסים יכולים להשתמש בכלים המתקדמים שלנו לשיפור תהליך העבודה.',
    },
  },
  // Pricing & Plans
  {
    id: 'pricing-1',
    icon: CreditCard,
    category: 'pricing',
    question: {
      en: 'What plans does MeStory offer?',
      he: 'אילו תוכניות מציעה MeStory?',
    },
    answer: {
      en: 'We offer a Free plan to get started, plus Premium ($9.99/month) and Professional ($19.99/month) plans with more AI credits, advanced features, and priority support. All plans include access to our marketplace for selling your books.',
      he: 'אנו מציעים תוכנית חינמית להתחלה, בנוסף לתוכניות פרימיום ($9.99 לחודש) ופרופשיונל ($19.99 לחודש) עם יותר קרדיטים ל-AI, תכונות מתקדמות ותמיכה עדיפות. כל התוכניות כוללות גישה לשוק למכירת הספרים שלכם.',
    },
  },
  {
    id: 'pricing-2',
    icon: Sparkles,
    category: 'pricing',
    question: {
      en: 'What are AI credits and how do they work?',
      he: 'מה הם קרדיטי AI ואיך הם עובדים?',
    },
    answer: {
      en: 'AI credits are used when you interact with our AI writing assistant - for generating text, getting suggestions, improving your writing, or creating cover designs. Free users get limited monthly credits, while premium plans offer more credits. Credits reset monthly.',
      he: 'קרדיטי AI משמשים כאשר אתם משתמשים בעוזר הכתיבה ה-AI שלנו - ליצירת טקסט, קבלת הצעות, שיפור הכתיבה או יצירת עיצובי כריכה. משתמשים חינמיים מקבלים קרדיטים חודשיים מוגבלים, בעוד תוכניות פרימיום מציעות יותר קרדיטים. הקרדיטים מתאפסים מדי חודש.',
    },
  },
  // AI Writing
  {
    id: 'ai-1',
    icon: Sparkles,
    category: 'ai-writing',
    question: {
      en: 'How does AI writing assistance work?',
      he: 'איך עובד עוזר הכתיבה ה-AI?',
    },
    answer: {
      en: 'Our AI understands context and style. It can help you overcome writer\'s block, suggest plot twists, develop characters, improve dialogue, and even generate entire chapters. You always have full control - accept, modify, or reject any AI suggestion.',
      he: 'ה-AI שלנו מבין הקשר וסגנון. הוא יכול לעזור לכם להתגבר על חסימת סופר, להציע פיתולי עלילה, לפתח דמויות, לשפר דיאלוגים ואפילו ליצור פרקים שלמים. תמיד יש לכם שליטה מלאה - קבלו, שנו או דחו כל הצעה של ה-AI.',
    },
  },
  // Publishing
  {
    id: 'publishing-1',
    icon: Upload,
    category: 'publishing',
    question: {
      en: 'How do I publish my book on MeStory?',
      he: 'איך מפרסמים ספר ב-MeStory?',
    },
    answer: {
      en: 'Once your book is ready, go to the Publishing page. Add a description, select a genre, set your price (or make it free), design a cover, and submit for review. Our team reviews all books for quality before they go live in the marketplace.',
      he: 'ברגע שהספר שלכם מוכן, עברו לדף הפרסום. הוסיפו תיאור, בחרו ז\'אנר, קבעו מחיר (או הפכו אותו לחינמי), עצבו כריכה והגישו לבדיקה. הצוות שלנו בודק את כל הספרים לאיכות לפני שהם עולים לשוק.',
    },
  },
  {
    id: 'publishing-2',
    icon: Star,
    category: 'publishing',
    question: {
      en: 'What is the Quality Score system?',
      he: 'מהי מערכת ציון האיכות?',
    },
    answer: {
      en: 'The Quality Score evaluates your book on grammar, readability, structure, and engagement. Higher scores increase your book\'s visibility in the marketplace. Our AI provides suggestions to improve your score before publishing.',
      he: 'ציון האיכות מעריך את הספר שלכם על דקדוק, קריאות, מבנה ומעורבות. ציונים גבוהים יותר מגדילים את הנראות של הספר שלכם בשוק. ה-AI שלנו מספק הצעות לשיפור הציון לפני הפרסום.',
    },
  },
  // Earnings
  {
    id: 'earnings-1',
    icon: DollarSign,
    category: 'earnings',
    question: {
      en: 'How much do authors earn from book sales?',
      he: 'כמה מרוויחים מחברים ממכירות ספרים?',
    },
    answer: {
      en: 'Authors earn 50% of every sale. For example, if you price your book at $10, you receive $5 for each purchase. This is one of the highest royalty rates in the industry. Earnings are tracked in real-time in your dashboard.',
      he: 'מחברים מרוויחים 50% מכל מכירה. לדוגמה, אם אתם מתמחרים את הספר שלכם ב-$10, תקבלו $5 על כל רכישה. זה אחד משיעורי התמלוגים הגבוהים בתעשייה. הרווחים מעקבים בזמן אמת בדשבורד שלכם.',
    },
  },
  {
    id: 'earnings-2',
    icon: Wallet,
    category: 'earnings',
    question: {
      en: 'How and when can I withdraw my earnings?',
      he: 'איך ומתי אפשר למשוך רווחים?',
    },
    answer: {
      en: 'You can withdraw your earnings to PayPal once you reach the minimum threshold of $10. Withdrawals are processed within 3-5 business days. Connect your PayPal account in Settings to enable withdrawals.',
      he: 'תוכלו למשוך את הרווחים שלכם ל-PayPal ברגע שתגיעו לסף המינימום של $10. משיכות מעובדות תוך 3-5 ימי עסקים. חברו את חשבון ה-PayPal שלכם בהגדרות כדי לאפשר משיכות.',
    },
  },
  // Export Options
  {
    id: 'export-1',
    icon: FileText,
    category: 'export',
    question: {
      en: 'What export formats are available?',
      he: 'אילו פורמטי ייצוא זמינים?',
    },
    answer: {
      en: 'You can export your books as PDF (for printing or sharing), DOCX (for editing in Word), and EPUB (for e-readers). Premium users get access to advanced formatting options and print-ready PDF exports with professional layouts.',
      he: 'תוכלו לייצא את הספרים שלכם כ-PDF (להדפסה או שיתוף), DOCX (לעריכה ב-Word) ו-EPUB (לקוראים אלקטרוניים). משתמשי פרימיום מקבלים גישה לאפשרויות עיצוב מתקדמות וייצוא PDF מוכן להדפסה עם פריסות מקצועיות.',
    },
  },
  // Genres
  {
    id: 'genres-1',
    icon: Palette,
    category: 'genres',
    question: {
      en: 'What genres does MeStory support?',
      he: 'אילו ז\'אנרים MeStory תומכת?',
    },
    answer: {
      en: 'We support all major genres including Fiction, Non-Fiction, Romance, Mystery, Sci-Fi, Fantasy, Horror, Thriller, Biography, Self-Help, Children\'s Books, Poetry, and more. You can also add custom tags to help readers find your unique work.',
      he: 'אנו תומכים בכל הז\'אנרים העיקריים כולל פיקשן, נון-פיקשן, רומנטיקה, מסתורין, מדע בדיוני, פנטזיה, אימה, מותחן, ביוגרפיה, עזרה עצמית, ספרי ילדים, שירה ועוד. תוכלו גם להוסיף תגיות מותאמות אישית כדי לעזור לקוראים למצוא את היצירה הייחודית שלכם.',
    },
  },
  // Hebrew Support
  {
    id: 'hebrew-1',
    icon: Globe,
    category: 'hebrew',
    question: {
      en: 'Does MeStory support Hebrew writing?',
      he: 'האם MeStory תומכת בכתיבה בעברית?',
    },
    answer: {
      en: 'Yes! MeStory fully supports Hebrew with right-to-left (RTL) text direction. Our AI assistant understands Hebrew and can help with Hebrew content. The entire interface is available in Hebrew. You can write books in Hebrew, English, or mix languages.',
      he: 'כן! MeStory תומכת במלואה בעברית עם כיוון טקסט מימין לשמאל (RTL). עוזר ה-AI שלנו מבין עברית ויכול לעזור עם תוכן בעברית. כל הממשק זמין בעברית. תוכלו לכתוב ספרים בעברית, באנגלית או לערבב שפות.',
    },
  },
  // Privacy & Security
  {
    id: 'privacy-1',
    icon: Shield,
    category: 'privacy',
    question: {
      en: 'How is my content protected?',
      he: 'איך התוכן שלי מוגן?',
    },
    answer: {
      en: 'Your content is protected by industry-standard encryption. You own all rights to your work. We never share or sell your content. Unpublished drafts are private by default. Only published books are visible in the marketplace.',
      he: 'התוכן שלכם מוגן בהצפנה בתקן תעשייתי. אתם הבעלים של כל הזכויות על העבודה שלכם. אנחנו אף פעם לא משתפים או מוכרים את התוכן שלכם. טיוטות לא מפורסמות הן פרטיות כברירת מחדל. רק ספרים מפורסמים נראים בשוק.',
    },
  },
  // Payment
  {
    id: 'payment-1',
    icon: Wallet,
    category: 'payment',
    question: {
      en: 'What payment methods do you accept?',
      he: 'אילו אמצעי תשלום אתם מקבלים?',
    },
    answer: {
      en: 'We process all payments through PayPal, which supports credit cards, debit cards, and PayPal balance. This ensures secure transactions and automatic receipts for all purchases. Authors also receive payments through PayPal.',
      he: 'אנו מעבדים את כל התשלומים דרך PayPal, שתומכת בכרטיסי אשראי, כרטיסי חיוב ויתרת PayPal. זה מבטיח עסקאות מאובטחות וקבלות אוטומטיות לכל הרכישות. מחברים גם מקבלים תשלומים דרך PayPal.',
    },
  },
  // Refunds
  {
    id: 'refunds-1',
    icon: RefreshCw,
    category: 'refunds',
    question: {
      en: 'What is your refund policy?',
      he: 'מהי מדיניות ההחזרים שלכם?',
    },
    answer: {
      en: 'Refund requests are handled through PayPal within 14 days of purchase. Refunds are granted if you haven\'t significantly used the book. For subscription refunds, contact support within 7 days of your billing date.',
      he: 'בקשות החזר מטופלות דרך PayPal תוך 14 יום מהרכישה. החזרים ניתנים אם לא השתמשתם משמעותית בספר. להחזרי מנוי, צרו קשר עם התמיכה תוך 7 ימים מתאריך החיוב שלכם.',
    },
  },
  // Account
  {
    id: 'account-1',
    icon: UserCog,
    category: 'account',
    question: {
      en: 'How do I delete my account?',
      he: 'איך מוחקים את החשבון?',
    },
    answer: {
      en: 'You can delete your account from Settings. Please note that account deletion is permanent and removes all your data, including unpublished drafts. Published books will remain in the marketplace unless you unpublish them first.',
      he: 'תוכלו למחוק את החשבון שלכם מההגדרות. שימו לב שמחיקת חשבון היא סופית ומסירה את כל הנתונים שלכם, כולל טיוטות לא מפורסמות. ספרים מפורסמים יישארו בשוק אלא אם תסירו אותם מהפרסום קודם.',
    },
  },
];

// Category labels for filtering
const categories = [
  { id: 'all', label: { en: 'All Questions', he: 'כל השאלות' } },
  { id: 'getting-started', label: { en: 'Getting Started', he: 'התחלה' } },
  { id: 'pricing', label: { en: 'Pricing & Plans', he: 'מחירים ותוכניות' } },
  { id: 'ai-writing', label: { en: 'AI Writing', he: 'כתיבה עם AI' } },
  { id: 'publishing', label: { en: 'Publishing', he: 'פרסום' } },
  { id: 'earnings', label: { en: 'Earnings', he: 'רווחים' } },
  { id: 'export', label: { en: 'Export', he: 'ייצוא' } },
  { id: 'privacy', label: { en: 'Privacy', he: 'פרטיות' } },
];

export default function FAQPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter FAQ items
  const filteredItems = faqItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      item.question[language].toLowerCase().includes(searchLower) ||
      item.answer[language].toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  // Generate FAQ items for Schema component
  const faqSchemaItems = faqItems.map((item) => ({
    question: item.question.en,
    answer: item.answer.en,
  }));

  const pageTitle = isHebrew
    ? 'שאלות נפוצות - MeStory'
    : 'FAQ - Frequently Asked Questions | MeStory';

  const pageDescription = isHebrew
    ? 'מצאו תשובות לשאלות נפוצות על MeStory - פלטפורמת הכתיבה והפרסום המונעת בינה מלאכותית. למדו על תמחור, תכונות AI, פרסום ספרים, רווחים ועוד.'
    : 'Find answers to frequently asked questions about MeStory - the AI-powered book writing and publishing platform. Learn about pricing, AI features, book publishing, earnings, and more.';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href="https://mestory.co.il/faq" />
      </Helmet>

      {/* FAQ Structured Data for SEO */}
      <FAQSchema items={faqSchemaItems} />

      <div className="min-h-screen py-20 px-4 sm:px-8" dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Breadcrumb
              items={[
                { name: isHebrew ? 'שאלות נפוצות' : 'FAQ', url: '/faq' },
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
              <HelpCircle className="w-12 h-12 text-magic-gold" />
            </div>
            <h1 className="text-4xl font-display font-bold gradient-gold mb-4">
              {isHebrew ? 'שאלות נפוצות' : 'Frequently Asked Questions'}
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {isHebrew
                ? 'מצאו תשובות לשאלות הנפוצות ביותר על השימוש ב-MeStory'
                : 'Find answers to the most common questions about using MeStory'}
            </p>
          </motion.header>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <GlassCard hover={false} className="p-4">
              <div className="relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isHebrew ? 'right-4' : 'left-4'}`} />
                <input
                  type="text"
                  placeholder={isHebrew ? 'חפשו שאלה...' : 'Search questions...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full bg-white/5 border border-white/10 rounded-lg py-3 text-white placeholder-gray-500 focus:outline-none focus:border-magic-gold/50 transition-colors ${isHebrew ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                />
              </div>
            </GlassCard>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8 overflow-x-auto"
          >
            <div className="flex gap-2 pb-2 min-w-max">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-magic-gold text-deep-space'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {category.label[language]}
                </button>
              ))}
            </div>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            aria-label={isHebrew ? 'רשימת שאלות נפוצות' : 'FAQ List'}
          >
            <dl className="space-y-4">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isExpanded = expandedId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <GlassCard
                      hover={false}
                      className={`p-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'border-magic-gold/30' : ''}`}
                    >
                      {/* Question (dt) */}
                      <dt>
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className={`w-full p-6 flex items-center gap-4 text-${isHebrew ? 'right' : 'left'} transition-colors hover:bg-white/5`}
                          aria-expanded={isExpanded}
                          aria-controls={`answer-${item.id}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-magic-gold/20 to-cosmic-purple/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-magic-gold" />
                          </div>
                          <span className="flex-1 text-lg font-semibold text-white">
                            {item.question[language]}
                          </span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          </motion.div>
                        </button>
                      </dt>

                      {/* Answer (dd) */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.dd
                            id={`answer-${item.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className={`px-6 pb-6 ${isHebrew ? 'pr-20' : 'pl-20'}`}>
                              <p className="text-gray-300 leading-relaxed">
                                {item.answer[language]}
                              </p>
                            </div>
                          </motion.dd>
                        )}
                      </AnimatePresence>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </dl>

            {/* No results message */}
            {filteredItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  {isHebrew
                    ? 'לא נמצאו שאלות תואמות. נסו חיפוש אחר.'
                    : 'No matching questions found. Try a different search.'}
                </p>
              </motion.div>
            )}
          </motion.section>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <GlassCard glow="gold" className="text-center p-8">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                {isHebrew ? 'לא מצאתם את התשובה?' : "Didn't find your answer?"}
              </h2>
              <p className="text-gray-300 mb-6">
                {isHebrew
                  ? 'צוות התמיכה שלנו כאן כדי לעזור. צרו קשר ונחזור אליכם בהקדם.'
                  : 'Our support team is here to help. Contact us and we\'ll get back to you soon.'}
              </p>
              <a
                href="mailto:support@mestory.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-magic-gold to-yellow-500 text-deep-space font-semibold rounded-lg hover:brightness-110 transition-all"
              >
                {isHebrew ? 'צרו קשר' : 'Contact Support'}
              </a>
            </GlassCard>
          </motion.div>

          {/* Footer Links */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center text-gray-500 text-sm"
          >
            <p>
              {isHebrew ? 'מידע נוסף זמין ב' : 'More information available in our'}{' '}
              <a href="/terms" className="text-magic-gold hover:underline">
                {isHebrew ? 'תנאי שימוש' : 'Terms of Service'}
              </a>
              {' '}{isHebrew ? 'וב' : 'and'}{' '}
              <a href="/privacy" className="text-magic-gold hover:underline">
                {isHebrew ? 'מדיניות פרטיות' : 'Privacy Policy'}
              </a>
            </p>
          </motion.footer>
        </div>
      </div>
    </>
  );
}
