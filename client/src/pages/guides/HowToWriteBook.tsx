import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '../../hooks/useSEO';
import {
  BookOpen,
  Lightbulb,
  Users,
  FileText,
  Sparkles,
  Edit3,
  CheckCircle,
  Layers,
  ArrowRight,
  ArrowLeft,
  Clock
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
    icon: Users,
    title: {
      en: 'Create Your MeStory Account',
      he: 'צרו חשבון MeStory',
    },
    description: {
      en: 'Sign up for a free MeStory account to access our AI-powered writing tools. Registration is quick and easy - just enter your email or sign in with Google.',
      he: 'הירשמו לחשבון MeStory חינמי כדי לגשת לכלי הכתיבה המונעים ב-AI שלנו. ההרשמה מהירה וקלה - פשוט הזינו את האימייל שלכם או התחברו עם Google.',
    },
    tips: {
      en: ['Use a professional email for your author profile', 'Complete your author bio for better marketplace visibility'],
      he: ['השתמשו באימייל מקצועי לפרופיל הסופר שלכם', 'השלימו את הביוגרפיה שלכם לנראות טובה יותר בשוק'],
    },
  },
  {
    number: 2,
    icon: Lightbulb,
    title: {
      en: 'Choose Your Book Concept',
      he: 'בחרו את הרעיון לספר',
    },
    description: {
      en: 'Start with a clear idea for your book. Our AI can help you brainstorm concepts, develop themes, and outline your story structure. Choose a genre that fits your vision.',
      he: 'התחילו עם רעיון ברור לספר שלכם. ה-AI שלנו יכול לעזור לכם לסיעור מוחות, לפתח נושאים ולתכנן את מבנה הסיפור. בחרו ז\'אנר שמתאים לחזון שלכם.',
    },
    tips: {
      en: ['Write down your core message', 'Consider your target audience', 'Research similar books in your genre'],
      he: ['רשמו את המסר המרכזי שלכם', 'חשבו על קהל היעד שלכם', 'חקרו ספרים דומים בז\'אנר שלכם'],
    },
  },
  {
    number: 3,
    icon: FileText,
    title: {
      en: 'Create a New Book Project',
      he: 'צרו פרויקט ספר חדש',
    },
    description: {
      en: 'From your dashboard, click "New Book" to start a new project. Give your book a working title and select a template or start from scratch. You can always change these later.',
      he: 'מלוח הבקרה שלכם, לחצו על "ספר חדש" כדי להתחיל פרויקט חדש. תנו לספר שלכם שם עבודה ובחרו תבנית או התחילו מאפס. תמיד תוכלו לשנות את אלה מאוחר יותר.',
    },
    tips: {
      en: ['Use templates for structured writing', 'Set realistic chapter goals', 'Enable auto-save for peace of mind'],
      he: ['השתמשו בתבניות לכתיבה מובנית', 'קבעו יעדי פרקים ריאליסטיים', 'הפעילו שמירה אוטומטית לשקט נפשי'],
    },
  },
  {
    number: 4,
    icon: Sparkles,
    title: {
      en: 'Use AI to Generate Content',
      he: 'השתמשו ב-AI ליצירת תוכן',
    },
    description: {
      en: 'Our AI assistant can help you write paragraphs, develop dialogue, overcome writer\'s block, and suggest plot twists. Simply highlight text and use the AI toolbar for suggestions.',
      he: 'עוזר ה-AI שלנו יכול לעזור לכם לכתוב פסקאות, לפתח דיאלוגים, להתגבר על חסימת סופר ולהציע פיתולי עלילה. פשוט סמנו טקסט והשתמשו בסרגל הכלים של AI להצעות.',
    },
    tips: {
      en: ['Review and edit AI suggestions to match your voice', 'Use AI for first drafts, then personalize', 'Experiment with different AI prompts'],
      he: ['בדקו וערכו את הצעות ה-AI כדי להתאים לקול שלכם', 'השתמשו ב-AI לטיוטות ראשונות, ואז התאימו אישית', 'התנסו בפרומפטים שונים של AI'],
    },
  },
  {
    number: 5,
    icon: Edit3,
    title: {
      en: 'Write and Structure Your Chapters',
      he: 'כתבו ובנו את הפרקים',
    },
    description: {
      en: 'Organize your book into chapters using our intuitive editor. Add, rearrange, and delete chapters easily. Use the outline view to see your book structure at a glance.',
      he: 'ארגנו את הספר שלכם לפרקים באמצעות העורך האינטואיטיבי שלנו. הוסיפו, סדרו מחדש ומחקו פרקים בקלות. השתמשו בתצוגת המתווה כדי לראות את מבנה הספר במבט אחד.',
    },
    tips: {
      en: ['Keep chapters consistent in length', 'End chapters with hooks to keep readers engaged', 'Use clear chapter titles'],
      he: ['שמרו על אורך עקבי של פרקים', 'סיימו פרקים עם "וו" כדי לשמור על מעורבות הקוראים', 'השתמשו בכותרות פרקים ברורות'],
    },
  },
  {
    number: 6,
    icon: CheckCircle,
    title: {
      en: 'Edit and Improve Your Draft',
      he: 'ערכו ושפרו את הטיוטה',
    },
    description: {
      en: 'Use our AI editing tools to improve grammar, readability, and flow. The quality score feature helps identify areas for improvement before publishing.',
      he: 'השתמשו בכלי העריכה של AI שלנו לשיפור דקדוק, קריאות וזרימה. תכונת ציון האיכות עוזרת לזהות תחומים לשיפור לפני הפרסום.',
    },
    tips: {
      en: ['Read your book aloud to catch errors', 'Take breaks between editing sessions', 'Consider getting feedback from beta readers'],
      he: ['קראו את הספר שלכם בקול רם כדי לתפוס שגיאות', 'קחו הפסקות בין מפגשי עריכה', 'שקלו לקבל משוב מקוראי בטא'],
    },
  },
  {
    number: 7,
    icon: Layers,
    title: {
      en: 'Design Your Book Layout',
      he: 'עצבו את פריסת הספר',
    },
    description: {
      en: 'Access the Layout Studio to customize your book\'s appearance. Choose fonts, adjust margins, add headers and footers, and preview how your book will look to readers.',
      he: 'גשו לסטודיו העיצוב כדי להתאים אישית את מראה הספר שלכם. בחרו גופנים, התאימו שוליים, הוסיפו כותרות עליונות ותחתונות, וצפו בתצוגה מקדימה של איך הספר ייראה לקוראים.',
    },
    tips: {
      en: ['Use readable fonts for body text', 'Ensure proper spacing for comfortable reading', 'Preview on different devices'],
      he: ['השתמשו בגופנים קריאים לטקסט הגוף', 'ודאו ריווח נכון לקריאה נוחה', 'צפו בתצוגה מקדימה במכשירים שונים'],
    },
  },
  {
    number: 8,
    icon: BookOpen,
    title: {
      en: 'Finalize and Prepare for Publishing',
      he: 'סיימו והכינו לפרסום',
    },
    description: {
      en: 'Review your completed book one final time. Check the quality score, ensure all chapters are properly formatted, and prepare your book metadata for publishing on the marketplace.',
      he: 'בדקו את הספר המושלם שלכם פעם אחרונה. בדקו את ציון האיכות, ודאו שכל הפרקים מעוצבים כראוי, והכינו את המטא-דאטה של הספר לפרסום בשוק.',
    },
    tips: {
      en: ['Double-check your author bio', 'Prepare a compelling book description', 'Have a cover design ready'],
      he: ['בדקו שוב את הביוגרפיה שלכם', 'הכינו תיאור ספר משכנע', 'הכינו עיצוב כריכה'],
    },
  },
];

// Generate schema steps for structured data
const schemaSteps = steps.map((step) => ({
  name: step.title.en,
  text: step.description.en,
}));

export default function HowToWriteBook() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const ArrowIcon = isHebrew ? ArrowLeft : ArrowRight;

  const pageTitle = isHebrew
    ? 'איך לכתוב ספר עם AI - מדריך שלב אחר שלב | MeStory'
    : 'How to Write a Book with AI - Step by Step Guide | MeStory';

  const pageDescription = isHebrew
    ? 'למדו איך לכתוב ספר באמצעות כלי AI של MeStory. מדריך מפורט מהרעיון הראשון ועד לספר מוכן לפרסום. 8 צעדים פשוטים לכתיבת הספר שלכם.'
    : 'Learn how to write a book using MeStory AI tools. Detailed guide from first idea to publish-ready book. 8 simple steps to writing your book.';

  const pageKeywords = isHebrew
    ? ['איך לכתוב ספר', 'כתיבת ספר עם AI', 'מדריך כתיבה', 'כלי כתיבה AI', 'MeStory', 'פרסום ספר']
    : ['how to write a book', 'AI book writing', 'writing guide', 'AI writing tools', 'MeStory', 'book publishing'];

  useSEO({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl: 'https://mestory.co.il/guides/write-book',
    keywords: pageKeywords,
    ogType: 'article',
  });

  return (
    <>
      {/* Article Schema for SEO/GEO/AEO */}
      <ArticleSchema
        headline={isHebrew ? 'איך לכתוב ספר עם AI - מדריך שלב אחר שלב' : 'How to Write a Book with AI - Step by Step Guide'}
        description={pageDescription}
        datePublished="2024-01-15"
        dateModified="2024-12-01"
        url="https://mestory.co.il/guides/write-book"
        articleType="HowTo"
        wordCount={2500}
        speakable={['.gradient-gold', 'h2', 'h3']}
      />

      {/* HowTo Schema for AEO/SEO */}
      <HowToSchema
        name={isHebrew ? 'איך לכתוב ספר עם AI' : 'How to Write a Book with AI'}
        description={pageDescription}
        steps={schemaSteps}
        estimatedDuration="PT1H"
        tool={['MeStory Platform', 'AI Writing Assistant']}
      />

      <div className="min-h-screen py-20 px-4 sm:px-8" dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Breadcrumb
              items={[
                { name: isHebrew ? 'מדריכים' : 'Guides', url: '/guides' },
                { name: isHebrew ? 'איך לכתוב ספר' : 'How to Write a Book', url: '/guides/write-book' },
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-magic-gold to-yellow-500 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-gold mb-4">
              {isHebrew ? 'איך לכתוב ספר עם AI' : 'How to Write a Book with AI'}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
              {isHebrew
                ? 'מדריך מקיף לכתיבת הספר הראשון שלכם באמצעות כלי הבינה המלאכותית של MeStory'
                : 'A comprehensive guide to writing your first book using MeStory AI tools'}
            </p>
            <div className="flex items-center justify-center gap-6 text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{isHebrew ? '15 דקות קריאה' : '15 min read'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>{isHebrew ? '8 צעדים' : '8 steps'}</span>
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
                {isHebrew ? 'למה לכתוב ספר עם AI?' : 'Why Write a Book with AI?'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {isHebrew
                  ? 'כתיבת ספר יכולה להיות משימה מאתגרת, אבל עם כלי AI של MeStory, התהליך הופך לנגיש ומהנה יותר. ה-AI שלנו לא מחליף את הקול הייחודי שלכם - הוא מעצים אותו.'
                  : 'Writing a book can be a challenging task, but with MeStory AI tools, the process becomes more accessible and enjoyable. Our AI doesn\'t replace your unique voice - it amplifies it.'}
              </p>
              <p className="text-gray-300 leading-relaxed">
                {isHebrew
                  ? 'במדריך זה, נלווה אתכם צעד אחר צעד מהרעיון הראשון ועד לספר מוכן לפרסום. בואו נתחיל!'
                  : 'In this guide, we\'ll walk you through step by step from the first idea to a publish-ready book. Let\'s get started!'}
              </p>
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
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-magic-gold/20 to-cosmic-purple/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-magic-gold" />
                          </div>
                          <div>
                            <span className="text-magic-gold text-sm font-medium">
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
                          <h4 className="text-sm font-semibold text-magic-gold mb-3 flex items-center gap-2">
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
            <GlassCard glow="gold" className="p-8 text-center">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                {isHebrew ? 'מוכנים להתחיל לכתוב?' : 'Ready to Start Writing?'}
              </h2>
              <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                {isHebrew
                  ? 'הצטרפו לאלפי סופרים שכבר יצרו ספרים מדהימים עם MeStory. התחילו היום בחינם!'
                  : 'Join thousands of authors who have already created amazing books with MeStory. Start today for free!'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-magic-gold to-yellow-500 text-deep-space font-semibold rounded-lg hover:brightness-110 transition-all text-lg"
                >
                  {isHebrew ? 'התחילו לכתוב עכשיו' : 'Start Writing Now'}
                  <ArrowIcon className="w-5 h-5" />
                </Link>
                <Link
                  to="/guides/publish-book"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all text-lg"
                >
                  {isHebrew ? 'איך לפרסם ספר' : 'How to Publish'}
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
              to="/guides"
              className="flex items-center gap-2 text-gray-400 hover:text-magic-gold transition-colors"
            >
              {isHebrew ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isHebrew ? 'חזרה למדריכים' : 'Back to Guides'}</span>
            </Link>
            <Link
              to="/guides/publish-book"
              className="flex items-center gap-2 text-gray-400 hover:text-magic-gold transition-colors"
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
