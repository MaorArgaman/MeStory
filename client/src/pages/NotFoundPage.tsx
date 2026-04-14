import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BookOpen, Search, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../components/ui';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';

export default function NotFoundPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const ArrowIcon = isHebrew ? ArrowLeft : ArrowRight;

  useSEO({
    title: isHebrew ? 'הדף לא נמצא - 404 | MeStory' : 'Page Not Found - 404 | MeStory',
    description: isHebrew
      ? 'הדף שחיפשת לא נמצא. חזרו לדף הבית של MeStory או חפשו ספרים בשוק שלנו.'
      : 'The page you were looking for was not found. Return to MeStory home or search for books in our marketplace.',
    canonicalUrl: 'https://mestory.co.il/404',
  });

  const content = {
    title: {
      en: 'Page Not Found',
      he: 'הדף לא נמצא',
    },
    subtitle: {
      en: "Oops! The page you're looking for doesn't exist.",
      he: 'אופס! הדף שחיפשת לא קיים.',
    },
    description: {
      en: "It looks like you've wandered off the beaten path. Don't worry, even the best authors sometimes lose their way. Let us help you get back on track.",
      he: 'נראה שסטית מהדרך. אל דאגה, גם הסופרים הטובים ביותר לפעמים הולכים לאיבוד. בואו נעזור לך לחזור למסלול.',
    },
    homeButton: {
      en: 'Back to Home',
      he: 'חזרה לדף הבית',
    },
    marketplaceButton: {
      en: 'Browse Books',
      he: 'עיינו בספרים',
    },
    dashboardButton: {
      en: 'Go to Dashboard',
      he: 'עברו לדשבורד',
    },
    suggestions: {
      title: {
        en: 'You might be looking for:',
        he: 'אולי חיפשתם:',
      },
      items: [
        {
          title: { en: 'Write a Book', he: 'כתבו ספר' },
          description: { en: 'Start your writing journey with AI assistance', he: 'התחילו את מסע הכתיבה עם עזרת AI' },
          link: '/dashboard',
          icon: BookOpen,
        },
        {
          title: { en: 'Browse Marketplace', he: 'עיינו בשוק' },
          description: { en: 'Discover amazing books from other authors', he: 'גלו ספרים מדהימים מסופרים אחרים' },
          link: '/marketplace',
          icon: Search,
        },
      ],
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-8" dir={isHebrew ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <span className="text-[120px] sm:text-[180px] font-display font-bold gradient-gold leading-none">
              404
            </span>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2"
            >
              <AlertTriangle className="w-12 h-12 text-memorial-gold" />
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
            {content.title[language]}
          </h1>
          <p className="text-xl text-memorial-gold mb-4">
            {content.subtitle[language]}
          </p>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            {content.description[language]}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-memorial-gold to-yellow-500 text-deep-space font-semibold rounded-lg hover:brightness-110 transition-all"
          >
            <Home className="w-5 h-5" />
            {content.homeButton[language]}
          </Link>
          <Link
            to="/marketplace"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
          >
            <Search className="w-5 h-5" />
            {content.marketplaceButton[language]}
          </Link>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-gray-500 mb-6">{content.suggestions.title[language]}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {content.suggestions.items.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={index} to={item.link}>
                  <GlassCard hover className="p-6 text-left group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-memorial-gold/20 to-cosmic-purple/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-memorial-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1 group-hover:text-memorial-gold transition-colors flex items-center gap-2">
                          {item.title[language]}
                          <ArrowIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-gray-400 text-sm">{item.description[language]}</p>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Error Code Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-gray-600 text-sm"
        >
          Error Code: 404 | {isHebrew ? 'הדף המבוקש לא נמצא' : 'The requested page could not be found'}
        </motion.p>
      </div>
    </div>
  );
}
