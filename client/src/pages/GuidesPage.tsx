import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import {
  BookOpen,
  Upload,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  FileText
} from 'lucide-react';
import { GlassCard } from '../components/ui';
import { Breadcrumb } from '../components/seo';
import { useLanguage } from '../contexts/LanguageContext';

interface GuideItem {
  id: string;
  slug: string;
  icon: React.ElementType;
  title: {
    en: string;
    he: string;
  };
  description: {
    en: string;
    he: string;
  };
  duration: {
    en: string;
    he: string;
  };
  steps: number;
  color: string;
}

const guides: GuideItem[] = [
  {
    id: 'write-book',
    slug: 'write-book',
    icon: BookOpen,
    title: {
      en: 'How to Write a Book with AI',
      he: 'איך לכתוב ספר עם AI',
    },
    description: {
      en: 'Learn how to use AI-powered tools to write your first book, from idea to final draft.',
      he: 'למדו איך להשתמש בכלים מונעי AI לכתיבת הספר הראשון שלכם, מרעיון לטיוטה סופית.',
    },
    duration: {
      en: '15 min read',
      he: '15 דקות קריאה',
    },
    steps: 8,
    color: 'from-magic-gold to-yellow-500',
  },
  {
    id: 'publish-book',
    slug: 'publish-book',
    icon: Upload,
    title: {
      en: 'How to Publish Your Book',
      he: 'איך לפרסם את הספר שלך',
    },
    description: {
      en: 'Step-by-step guide to publishing your book on the MeStory marketplace.',
      he: 'מדריך צעד אחר צעד לפרסום הספר שלכם בשוק של MeStory.',
    },
    duration: {
      en: '10 min read',
      he: '10 דקות קריאה',
    },
    steps: 7,
    color: 'from-cosmic-purple to-purple-500',
  },
  {
    id: 'earn-money',
    slug: 'earn-money',
    icon: DollarSign,
    title: {
      en: 'How to Earn Money as an Author',
      he: 'איך להרוויח כסף כסופר',
    },
    description: {
      en: 'Discover how to maximize your earnings from book sales on MeStory.',
      he: 'גלו איך למקסם את הרווחים שלכם ממכירות ספרים ב-MeStory.',
    },
    duration: {
      en: '8 min read',
      he: '8 דקות קריאה',
    },
    steps: 6,
    color: 'from-green-500 to-emerald-400',
  },
];

export default function GuidesPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const ArrowIcon = isHebrew ? ArrowLeft : ArrowRight;

  const pageTitle = isHebrew
    ? 'מדריכים - MeStory'
    : 'Guides - How to Use MeStory | MeStory';

  const pageDescription = isHebrew
    ? 'מדריכים מקיפים לכתיבה, פרסום והרווחה מספרים עם MeStory. למדו איך להשתמש ב-AI לכתיבת ספרים, לפרסם בשוק ולהרוויח כסף כסופר.'
    : 'Comprehensive guides for writing, publishing, and earning from books with MeStory. Learn how to use AI for book writing, publish to the marketplace, and earn money as an author.';

  const pageKeywords = isHebrew
    ? ['מדריך כתיבת ספר', 'איך לכתוב ספר', 'פרסום ספר', 'הרווחה מספרים', 'AI כתיבה', 'MeStory מדריך']
    : ['book writing guide', 'how to write a book', 'publish a book', 'earn from books', 'AI writing', 'MeStory guide'];

  useSEO({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl: 'https://mestory.co.il/guides',
    keywords: pageKeywords,
  });

  return (
    <div className="min-h-screen py-20 px-4 sm:px-8" dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Breadcrumb
              items={[
                { name: isHebrew ? 'מדריכים' : 'Guides', url: '/guides' },
              ]}
            />
          </div>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="w-12 h-12 text-magic-gold" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-gold mb-4">
              {isHebrew ? 'מדריכים' : 'Guides & Tutorials'}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              {isHebrew
                ? 'למדו איך להפיק את המקסימום מ-MeStory עם המדריכים המפורטים שלנו'
                : 'Learn how to get the most out of MeStory with our detailed guides'}
            </p>
          </motion.header>

          {/* Guides Grid */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            aria-label={isHebrew ? 'רשימת מדריכים' : 'Guide List'}
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {guides.map((guide, index) => {
                const Icon = guide.icon;

                return (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link to={`/guides/${guide.slug}`}>
                      <GlassCard
                        hover
                        className="h-full p-8 group transition-all duration-300 hover:border-magic-gold/30"
                      >
                        {/* Icon */}
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${guide.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-display font-bold text-white mb-3 group-hover:text-magic-gold transition-colors">
                          {guide.title[language]}
                        </h2>

                        {/* Description */}
                        <p className="text-gray-400 mb-6 leading-relaxed">
                          {guide.description[language]}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{guide.duration[language]}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            <span>
                              {guide.steps} {isHebrew ? 'צעדים' : 'steps'}
                            </span>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center gap-2 text-magic-gold font-medium group-hover:gap-3 transition-all">
                          <span>{isHebrew ? 'קרא עכשיו' : 'Read Now'}</span>
                          <ArrowIcon className="w-4 h-4" />
                        </div>
                      </GlassCard>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Additional Info Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <GlassCard glow="gold" className="p-8 text-center">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                {isHebrew ? 'צריכים עזרה נוספת?' : 'Need More Help?'}
              </h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                {isHebrew
                  ? 'לא מצאתם את מה שחיפשתם? בדקו את דף השאלות הנפוצות שלנו או צרו קשר עם התמיכה.'
                  : "Can't find what you're looking for? Check out our FAQ page or contact our support team."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/faq"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
                >
                  {isHebrew ? 'שאלות נפוצות' : 'View FAQ'}
                </Link>
                <a
                  href="mailto:support@mestory.com"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-magic-gold to-yellow-500 text-deep-space font-semibold rounded-lg hover:brightness-110 transition-all"
                >
                  {isHebrew ? 'צרו קשר' : 'Contact Support'}
                </a>
              </div>
            </GlassCard>
          </motion.section>
        </div>
      </div>
  );
}
