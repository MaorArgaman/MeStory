import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '../../hooks/useSEO';
import {
  Upload,
  FileText,
  Palette,
  DollarSign,
  Tags,
  Image,
  Send,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { GlassCard } from '../../components/ui';
import { HowToSchema, Breadcrumb, ArticleSchema, CourseSchema } from '../../components/seo';
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
    icon: FileText,
    title: {
      en: 'Prepare Your Book Description',
      he: 'הכינו את תיאור הספר',
    },
    description: {
      en: 'Write a compelling book description that will attract readers. Your description should hook readers, explain what the book is about, and make them want to buy. Use keywords that readers might search for.',
      he: 'כתבו תיאור ספר משכנע שימשוך קוראים. התיאור שלכם צריך "לתפוס" קוראים, להסביר על מה הספר, ולגרום להם לרצות לקנות. השתמשו במילות מפתח שקוראים עשויים לחפש.',
    },
    tips: {
      en: ['Keep it under 500 words', 'Start with a hook', 'Include genre-specific keywords', 'End with a call to action'],
      he: ['שמרו על פחות מ-500 מילים', 'התחילו עם משפט "תופס"', 'כללו מילות מפתח ספציפיות לז\'אנר', 'סיימו עם קריאה לפעולה'],
    },
  },
  {
    number: 2,
    icon: Tags,
    title: {
      en: 'Select Genre and Categories',
      he: 'בחרו ז\'אנר וקטגוריות',
    },
    description: {
      en: 'Choose the right genre and categories for your book. This helps readers find your book when browsing the marketplace. Select a primary genre and up to 3 additional categories.',
      he: 'בחרו את הז\'אנר והקטגוריות הנכונים לספר שלכם. זה עוזר לקוראים למצוא את הספר בעת עיון בשוק. בחרו ז\'אנר ראשי ועד 3 קטגוריות נוספות.',
    },
    tips: {
      en: ['Research bestsellers in your genre', 'Be specific with subcategories', 'Don\'t choose irrelevant categories just for visibility'],
      he: ['חקרו רבי מכר בז\'אנר שלכם', 'היו ספציפיים עם תת-קטגוריות', 'אל תבחרו קטגוריות לא רלוונטיות רק בשביל נראות'],
    },
  },
  {
    number: 3,
    icon: DollarSign,
    title: {
      en: 'Set Your Book Price',
      he: 'קבעו את מחיר הספר',
    },
    description: {
      en: 'Decide on a price for your book. You can set any price from free to premium. Remember, you earn 50% of every sale. Consider your target audience and compare with similar books in the market.',
      he: 'החליטו על מחיר לספר שלכם. אתם יכולים לקבוע כל מחיר מחינם ועד פרימיום. זכרו, אתם מרוויחים 50% מכל מכירה. שקלו את קהל היעד שלכם והשוו עם ספרים דומים בשוק.',
    },
    tips: {
      en: ['Research competitor pricing', 'Consider launch promotions', 'Free books can build an audience', 'Price based on book length and value'],
      he: ['חקרו תמחור של מתחרים', 'שקלו מבצעי השקה', 'ספרים חינמיים יכולים לבנות קהל', 'תמחרו לפי אורך הספר והערך'],
    },
  },
  {
    number: 4,
    icon: Image,
    title: {
      en: 'Upload or Create Cover Art',
      he: 'העלו או צרו עטיפה',
    },
    description: {
      en: 'A great cover is essential for book sales. Upload your own professional cover or use our AI-powered cover designer to create one. Make sure it looks good as a thumbnail.',
      he: 'עטיפה מעולה חיונית למכירות ספרים. העלו עטיפה מקצועית משלכם או השתמשו במעצב העטיפות המונע ב-AI שלנו ליצירת אחת. ודאו שהיא נראית טוב כתמונה ממוזערת.',
    },
    tips: {
      en: ['Use high-resolution images (1600x2560px)', 'Make the title readable at small sizes', 'Match the cover style to your genre', 'Test how it looks as a thumbnail'],
      he: ['השתמשו בתמונות ברזולוציה גבוהה (1600x2560px)', 'ודאו שהכותרת קריאה בגדלים קטנים', 'התאימו את סגנון העטיפה לז\'אנר', 'בדקו איך זה נראה כתמונה ממוזערת'],
    },
  },
  {
    number: 5,
    icon: Palette,
    title: {
      en: 'Review Book Layout',
      he: 'בדקו את פריסת הספר',
    },
    description: {
      en: 'Before publishing, review your book\'s layout one more time. Check fonts, margins, chapter headings, and page breaks. Preview how it will look on different devices.',
      he: 'לפני הפרסום, בדקו את פריסת הספר שלכם פעם נוספת. בדקו גופנים, שוליים, כותרות פרקים ושבירת עמודים. צפו בתצוגה מקדימה של איך זה ייראה במכשירים שונים.',
    },
    tips: {
      en: ['Check for formatting errors', 'Preview on mobile and desktop', 'Ensure chapter starts are consistent', 'Verify table of contents links'],
      he: ['בדקו שגיאות עיצוב', 'צפו בתצוגה מקדימה בנייד ובמחשב', 'ודאו שהתחלות פרקים עקביות', 'אמתו שקישורי תוכן העניינים עובדים'],
    },
  },
  {
    number: 6,
    icon: CheckCircle,
    title: {
      en: 'Check Quality Score',
      he: 'בדקו ציון איכות',
    },
    description: {
      en: 'Review your book\'s quality score before publishing. The score evaluates grammar, readability, and structure. Higher scores mean better visibility in the marketplace.',
      he: 'בדקו את ציון האיכות של הספר לפני הפרסום. הציון מעריך דקדוק, קריאות ומבנה. ציונים גבוהים יותר משמעם נראות טובה יותר בשוק.',
    },
    tips: {
      en: ['Aim for a score above 80%', 'Use AI suggestions to improve', 'Fix critical issues first', 'Re-check after making changes'],
      he: ['שאפו לציון מעל 80%', 'השתמשו בהצעות AI לשיפור', 'תקנו בעיות קריטיות קודם', 'בדקו שוב אחרי שינויים'],
    },
  },
  {
    number: 7,
    icon: Send,
    title: {
      en: 'Submit for Publishing',
      he: 'שלחו לפרסום',
    },
    description: {
      en: 'When everything is ready, click "Publish" to submit your book. Our team reviews all books for quality and compliance. Most books are approved within 24-48 hours.',
      he: 'כשהכל מוכן, לחצו "פרסם" כדי לשלוח את הספר. הצוות שלנו בודק את כל הספרים לאיכות ותאימות. רוב הספרים מאושרים תוך 24-48 שעות.',
    },
    tips: {
      en: ['Double-check all metadata', 'Ensure you own rights to all content', 'Prepare marketing materials', 'Plan your launch announcement'],
      he: ['בדקו שוב את כל המטא-דאטה', 'ודאו שיש לכם זכויות לכל התוכן', 'הכינו חומרי שיווק', 'תכננו את הכרזת ההשקה'],
    },
  },
];

// Generate schema steps for structured data
const schemaSteps = steps.map((step) => ({
  name: step.title.en,
  text: step.description.en,
}));

export default function HowToPublishBook() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const ArrowIcon = isHebrew ? ArrowLeft : ArrowRight;

  const pageTitle = isHebrew
    ? 'איך לפרסם את הספר שלך - מדריך שלב אחר שלב | MeStory'
    : 'How to Publish Your Book - Step by Step Guide | MeStory';

  const pageDescription = isHebrew
    ? 'למדו איך לפרסם את הספר שלכם בשוק של MeStory. מדריך מפורט לתמחור, עיצוב כריכה, בדיקת איכות ושליחה לפרסום. 7 צעדים להפיכת הספר שלכם לספר מפורסם.'
    : 'Learn how to publish your book on the MeStory marketplace. Detailed guide for pricing, cover design, quality check, and submission. 7 steps to getting your book published.';

  const pageKeywords = isHebrew
    ? ['איך לפרסם ספר', 'פרסום עצמי', 'מדריך פרסום', 'תמחור ספר', 'עיצוב כריכה', 'MeStory']
    : ['how to publish a book', 'self-publishing', 'publishing guide', 'book pricing', 'cover design', 'MeStory'];

  useSEO({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl: 'https://mestory-ai.com/guides/publish-book',
    keywords: pageKeywords,
    ogType: 'article',
  });

  return (
    <>
      {/* Article Schema for SEO/GEO/AEO */}
      <ArticleSchema
        headline={isHebrew ? 'איך לפרסם ספר ב-MeStory - מדריך מלא' : 'How to Publish a Book on MeStory - Complete Guide'}
        description={pageDescription}
        datePublished="2024-01-20"
        dateModified="2024-12-01"
        url="https://mestory-ai.com/guides/publish-book"
        articleType="HowTo"
        wordCount={2000}
        speakable={['.gradient-gold', 'h2', 'h3']}
      />

      {/* HowTo Schema for AEO/SEO */}
      <HowToSchema
        name={isHebrew ? 'איך לפרסם את הספר שלך' : 'How to Publish Your Book'}
        description={pageDescription}
        steps={schemaSteps}
        estimatedDuration="PT30M"
        tool={['MeStory Platform', 'Cover Designer', 'Quality Score Tool']}
      />

      {/* Course Schema */}
      <CourseSchema
        name={isHebrew ? 'איך לפרסם ספר ב-MeStory' : 'How to Publish a Book on MeStory'}
        description={pageDescription}
        url="https://mestory-ai.com/guides/publish-book"
        inLanguage={isHebrew ? 'he' : 'en'}
        educationalLevel="Beginner"
        timeRequired="PT30M"
      />

      <div className="min-h-screen py-20 px-4 sm:px-8" dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Breadcrumb
              items={[
                { name: isHebrew ? 'מדריכים' : 'Guides', url: '/guides' },
                { name: isHebrew ? 'איך לפרסם ספר' : 'How to Publish', url: '/guides/publish-book' },
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cosmic-purple to-purple-500 flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-gold mb-4">
              {isHebrew ? 'איך לפרסם את הספר שלך' : 'How to Publish Your Book'}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
              {isHebrew
                ? 'מדריך מקיף לפרסום הספר שלכם בשוק של MeStory והגעה לקוראים חדשים'
                : 'A comprehensive guide to publishing your book on the MeStory marketplace and reaching new readers'}
            </p>
            <div className="flex items-center justify-center gap-6 text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{isHebrew ? '10 דקות קריאה' : '10 min read'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>{isHebrew ? '7 צעדים' : '7 steps'}</span>
              </div>
            </div>
          </motion.header>

          {/* Introduction */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <GlassCard className="p-8">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                {isHebrew ? 'פרסום מקצועי בלחיצת כפתור' : 'Professional Publishing at the Click of a Button'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {isHebrew
                  ? 'עם MeStory, אתם לא צריכים מו"ל מסורתי כדי להגיע לקוראים. פלטפורמת הפרסום העצמי שלנו נותנת לכם שליטה מלאה על הספר שלכם - מתמחור ועד שיווק.'
                  : 'With MeStory, you don\'t need a traditional publisher to reach readers. Our self-publishing platform gives you complete control over your book - from pricing to marketing.'}
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-memorial-gold">50%</div>
                  <div className="text-sm text-gray-400">{isHebrew ? 'מכל מכירה' : 'of every sale'}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-memorial-gold">24-48h</div>
                  <div className="text-sm text-gray-400">{isHebrew ? 'זמן אישור' : 'approval time'}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-memorial-gold">100%</div>
                  <div className="text-sm text-gray-400">{isHebrew ? 'בעלות על הזכויות' : 'rights ownership'}</div>
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
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cosmic-purple/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-cosmic-purple" />
                          </div>
                          <div>
                            <span className="text-cosmic-purple text-sm font-medium">
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
                          <h4 className="text-sm font-semibold text-cosmic-purple mb-3 flex items-center gap-2">
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

          {/* CTA Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <GlassCard glow="purple" className="p-8 text-center">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                {isHebrew ? 'מוכנים לפרסם?' : 'Ready to Publish?'}
              </h2>
              <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                {isHebrew
                  ? 'הספר שלכם יכול להיות בשוק כבר היום. התחילו את תהליך הפרסום עכשיו!'
                  : 'Your book could be on the marketplace today. Start the publishing process now!'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cosmic-purple to-purple-500 text-white font-semibold rounded-lg hover:brightness-110 transition-all text-lg"
                >
                  {isHebrew ? 'פרסמו עכשיו' : 'Publish Now'}
                  <ArrowIcon className="w-5 h-5" />
                </Link>
                <Link
                  to="/guides/earn-money"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all text-lg"
                >
                  {isHebrew ? 'איך להרוויח כסף' : 'How to Earn Money'}
                  <ArrowIcon className="w-5 h-5" />
                </Link>
              </div>
            </GlassCard>
          </motion.section>

          {/* Navigation */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex justify-between items-center"
          >
            <Link
              to="/guides/write-book"
              className="flex items-center gap-2 text-gray-400 hover:text-memorial-gold transition-colors"
            >
              {isHebrew ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isHebrew ? 'איך לכתוב ספר' : 'How to Write a Book'}</span>
            </Link>
            <Link
              to="/guides/earn-money"
              className="flex items-center gap-2 text-gray-400 hover:text-memorial-gold transition-colors"
            >
              <span>{isHebrew ? 'המדריך הבא' : 'Next Guide'}</span>
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </motion.nav>
        </div>
      </div>
    </>
  );
}
