import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Palette,
  TrendingUp,
  Zap,
  Globe,
  ArrowRight,
  Users,
  Star,
  Feather,
  Award,
  Sparkles,
  Heart,
  Shield,
  Mic,
} from 'lucide-react';
import { GlassCard, GlowingButton, OptimizedImage } from '../components/ui';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO } from '../components/seo';
// Memorial-themed images from public folder
const logoIcon = '/img/new/logo-mestory-large.png';

// Hero carousel images
const heroImages = [
  { src: '/img/new/hero-soldiers-unit.png', alt: 'soldiers creating memorial book' },
  { src: '/img/new/hero-grandma-grandkids.png', alt: 'grandmother with grandchildren' },
  { src: '/img/new/hero-couple-love.png', alt: 'young couple with love story' },
  { src: '/img/new/hero-bereaved-herzl.png', alt: 'bereaved family at Mount Herzl' },
];

// Social proof portraits — 3 focused stories representing core audience
const socialProofHe = [
  { image: '/img/new/social-bereaved-brother.png', name: 'יוסי אברהם', bookType: 'ספר זיכרון לאח', quote: 'האח שלי היה גיבור שקט. הספר הזה נותן לו את הבמה שמגיעה לו.' },
  { image: '/img/new/social-grandma-yemenite.png', name: 'מרים שושן', bookType: 'מורשת תימנית', quote: 'בגיל 82, סוף סוף סיפרתי לנכדים על תימן. הם לא מפסיקים לקרוא.' },
  { image: '/img/new/social-young-father.png', name: 'עומר לוי', bookType: 'ספר לילדים', quote: 'כתבתי ספר לבת שלי על סבא רבא שלה, שנפל במלחמת יום כיפור.' },
];

const socialProofEn = [
  { image: '/img/new/social-bereaved-brother.png', name: 'Yossi Abraham', bookType: 'Brother\'s Memorial', quote: 'My brother was a quiet hero. This book gives him the stage he deserves.' },
  { image: '/img/new/social-grandma-yemenite.png', name: 'Miriam Shoshan', bookType: 'Yemenite Heritage', quote: 'At 82, I finally told my grandchildren about Yemen. They can\'t stop reading.' },
  { image: '/img/new/social-young-father.png', name: 'Omer Levy', bookType: 'Book for Children', quote: 'I wrote a book for my daughter about her great-grandfather who fell in the Yom Kippur War.' },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const [booksPublishedToday, setBooksPublishedToday] = useState(127);
  const [heroIndex, setHeroIndex] = useState(0);
  const [storiesWritten] = useState(3847);
  const { scrollY } = useScroll();

  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.8]);

  const socialProof = isHebrew ? socialProofHe : socialProofEn;

  // Hero carousel – fade between images every 5 seconds
  const nextHeroImage = useCallback(() => {
    setHeroIndex((prev) => (prev + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    const heroInterval = setInterval(nextHeroImage, 5000);
    return () => clearInterval(heroInterval);
  }, [nextHeroImage]);

  useEffect(() => {
    // Simulate real-time book counter
    const interval = setInterval(() => {
      setBooksPublishedToday((prev) => prev + Math.floor(Math.random() * 3));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Zap,
      image: '/img/memorial-family.png',
      titleKey: 'landing.features.ai_copilot.title',
      descriptionKey: 'landing.features.ai_copilot.description',
      color: 'from-yellow-400 to-yellow-600',
      glow: 'shadow-glow-gold',
    },
    {
      icon: Palette,
      image: '/img/feature-cover-studio.png',
      titleKey: 'landing.features.cover_studio.title',
      descriptionKey: 'landing.features.cover_studio.description',
      color: 'from-amber-400 to-amber-600',
      glow: 'shadow-glow-gold',
    },
    {
      icon: Globe,
      image: '/img/community-group.png',
      titleKey: 'landing.features.marketplace.title',
      descriptionKey: 'landing.features.marketplace.description',
      color: 'from-blue-400 to-blue-600',
      glow: 'shadow-lg',
    },
  ];

  // Success stories with real images - language aware (memorial-focused)
  const successStoriesHe = [
    {
      image: '/img/new/hero-bereaved-herzl.png',
      name: 'רחל לוי',
      book: 'לזכר אבא',
      quote: 'יצרנו ספר הנצחה לאבא ז"ל עם כל המשפחה. כל אחד תרם זיכרון, והתוצאה מרגשת עד דמעות.',
    },
    {
      image: '/img/new/hero-soldiers-unit.png',
      name: 'משפחת כהן',
      book: 'גיבור שלנו',
      quote: 'הנצחנו את בננו שנפל בקרב. הספר הפך למקור נחמה למשפחה ולחברים.',
    },
    {
      image: '/img/new/hero-grandma-grandkids.png',
      name: 'שרה גולדשטיין',
      book: 'מסע חיים',
      quote: 'בגיל 87 סיפרתי את סיפור השואה שלי. הנכדים עכשיו יידעו מאיפה הם באו.',
    },
  ];

  const successStoriesEn = [
    {
      image: '/img/new/hero-bereaved-herzl.png',
      name: 'Rachel Levy',
      book: 'In Memory of Father',
      quote: 'We created a memorial book for our late father with the whole family. Everyone contributed a memory, and the result is deeply moving.',
    },
    {
      image: '/img/new/hero-soldiers-unit.png',
      name: 'The Cohen Family',
      book: 'Our Hero',
      quote: 'We commemorated our son who fell in battle. The book became a source of comfort for family and friends.',
    },
    {
      image: '/img/new/hero-grandma-grandkids.png',
      name: 'Sarah Goldstein',
      book: 'A Life\'s Journey',
      quote: 'At 87, I told my Holocaust story. My grandchildren will now know where they came from.',
    },
  ];

  const successStories = isHebrew ? successStoriesHe : successStoriesEn;

  // Community image - memorial community
  const communityImage = '/img/new/military-unit-sunset.png';

  const stats = [
    { icon: Users, value: '50K+', labelKey: 'landing.stats.active_authors' },
    { icon: BookOpen, value: '200K+', labelKey: 'landing.stats.books_published' },
    { icon: Star, value: '4.9/5', labelKey: 'landing.stats.average_rating' },
    { icon: TrendingUp, value: '$2M+', labelKey: 'landing.stats.author_earnings' },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <SEO
        title="MeStory - Memorial Book Writing Platform"
        description="Create meaningful memorial books to honor your loved ones. AI-guided writing, respectful design, and print-ready PDF export. Preserve their memory for generations."
        type="website"
        locale={language === 'he' ? 'he_IL' : 'en_US'}
        url="/"
      />

      {/* Transparent Navbar */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 w-full"
        role="banner"
      >
        <nav className="glass-strong border-b border-memorial-gold/20 shadow-lg shadow-memorial-gold/5 backdrop-blur-2xl bg-gradient-to-r from-deep-space via-[#1e2436] to-deep-space" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer flex items-center"
              onClick={() => navigate('/')}
            >
              <OptimizedImage
                src={logoIcon}
                alt="MeStory - Home"
                lazy={false}
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </motion.div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-semibold transition-all text-sm sm:text-base"
              >
                {t('nav.login')}
              </button>
              <GlowingButton variant="gold" size="md" onClick={() => navigate('/register')} className="text-sm sm:text-base px-3 sm:px-4">
                <span className="hidden sm:inline">{t('nav.register')}</span>
                <span className="sm:hidden">{t('nav.register')}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </GlowingButton>
            </div>
          </div>
        </nav>
      </motion.header>

      <main role="main">

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20"
        aria-labelledby="hero-heading"
      >
        {/* Background Image Carousel — crossfade (both images overlap during transition) */}
        <div className="absolute inset-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={heroIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${heroImages[heroIndex].src})` }}
            />
          </AnimatePresence>
        </div>

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-deep-space/90 via-deep-space/70 to-deep-space/95" />

        {/* Floating Logo Watermark - Subtle background decoration */}
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none z-[1] hidden lg:flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.03 }}
          transition={{ duration: 2 }}
        >
          <OptimizedImage
            src={logoIcon}
            alt=""
            decorative
            lazy={false}
            className="w-[800px] h-auto object-contain"
            style={{ filter: 'grayscale(100%) brightness(2)' }}
          />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-20 text-center max-w-5xl px-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="warm-enter"
          >
            {/* Stories counter */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-memorial-gold/10 border border-memorial-gold/30 rounded-full px-4 py-2 mb-6 sm:mb-8"
            >
              <Heart className="w-4 h-4 text-memorial-gold animate-pulse" />
              <span className="text-memorial-gold font-semibold text-sm sm:text-base">
                {storiesWritten.toLocaleString()} {t('landing.hero.stories_written')}
              </span>
            </motion.div>

            <motion.h1
              id="hero-heading"
              className="text-reveal text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold mb-4 sm:mb-6 leading-tight"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              style={{
                background: 'linear-gradient(90deg, #c9a227, #e3c56f, #c9a227)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('landing.hero.title')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2"
            >
              {t('landing.hero.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex items-center justify-center"
            >
              <GlowingButton
                variant="gold"
                size="lg"
                onClick={() => navigate('/register')}
                className="px-8 sm:px-12 lg:px-16 py-4 sm:py-5 lg:py-6 text-base sm:text-lg lg:text-2xl w-full sm:w-auto"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                {t('landing.hero.cta_primary')}
              </GlowingButton>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-8 sm:mt-12 lg:mt-16 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-memorial-gold" />
                <span>{t('landing.trust.no_credit_card')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-memorial-gold" />
                <span>{t('landing.trust.free_credits')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-memorial-gold" />
                <span>{t('landing.trust.authors_trust')}</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator - Hidden on mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
          className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 z-20 hidden sm:block"
        >
          <div className="w-6 h-10 rounded-full border-2 border-memorial-gold/50 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-memorial-gold"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* How It Works Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-deep-space via-[#111827] to-deep-space" aria-labelledby="how-it-works-heading">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 id="how-it-works-heading" className="text-2xl sm:text-4xl md:text-5xl font-display font-bold gradient-gold">
              {t('landing.how_it_works.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 lg:gap-8 items-start relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden sm:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-memorial-gold/20 via-memorial-gold/50 to-memorial-gold/20" />

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0, duration: 0.6 }}
              className="flex flex-col items-center text-center relative z-10"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-memorial-gold/20 to-memorial-gold/5 border-2 border-memorial-gold/40 flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-memorial-gold/10">
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-memorial-gold" />
              </div>
              <span className="text-memorial-gold font-bold text-sm mb-2">01</span>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
                {t('landing.how_it_works.step1_title')}
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                {t('landing.how_it_works.step1_desc')}
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col items-center text-center relative z-10"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-memorial-gold/20 to-memorial-gold/5 border-2 border-memorial-gold/40 flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-memorial-gold/10">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-memorial-gold" />
              </div>
              <span className="text-memorial-gold font-bold text-sm mb-2">02</span>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
                {t('landing.how_it_works.step2_title')}
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                {t('landing.how_it_works.step2_desc')}
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col items-center text-center relative z-10"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-memorial-gold/20 to-memorial-gold/5 border-2 border-memorial-gold/40 flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-memorial-gold/10">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-memorial-gold" />
              </div>
              <span className="text-memorial-gold font-bold text-sm mb-2">03</span>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
                {t('landing.how_it_works.step3_title')}
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                {t('landing.how_it_works.step3_desc')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden bg-gradient-to-r from-memorial-gold/10 via-primary-900/30 to-memorial-gold/10 border-y border-memorial-gold/10"
      >
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap py-4"
        >
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-12">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-memorial-gold" />
                <span className="text-white font-semibold">
                  <span className="text-memorial-gold">{booksPublishedToday}</span> {t('landing.ticker.books_today')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">
                  {t('landing.ticker.authors_earned')} <span className="text-green-400">$47,823</span> {t('landing.ticker.this_week')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">
                  <span className="text-yellow-400">342</span> {t('landing.ticker.reviews_today')}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10 sm:mb-16 lg:mb-20"
          >
            <h2 id="features-heading" className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold gradient-gold mb-4 sm:mb-6">
              {t('landing.features.title')}
            </h2>
            <p className="text-sm sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">
              {t('landing.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              >
                <GlassCard hover glow={index === 0 ? 'gold' : index === 1 ? 'purple' : 'cosmic'} className="overflow-hidden p-0 card-3d-hover">
                  {/* Feature Image */}
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <OptimizedImage
                      src={feature.image}
                      alt={`Illustration for ${t(feature.titleKey)}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent" />
                    {/* Icon Badge */}
                    <div
                      className={`absolute bottom-3 left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center ${feature.glow}`}
                    >
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-white mb-2 sm:mb-4">
                      {t(feature.titleKey)}
                    </h3>

                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{t(feature.descriptionKey)}</p>

                    <motion.div
                      whileHover={{ x: 5 }}
                      className="mt-4 sm:mt-6 flex items-center gap-2 text-memorial-gold font-semibold cursor-pointer text-sm sm:text-base"
                    >
                      {t('landing.features.learn_more')}
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </motion.div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Military Memorial "Lezikhram" Section */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-[#0a0e1a] via-[#111827] to-[#0a0e1a] overflow-hidden"
        aria-labelledby="memorial-heading"
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <OptimizedImage
            src="/img/new/military-bereaved-cemetery.png"
            alt=""
            decorative
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a] via-[#0a0e1a]/80 to-[#0a0e1a]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Image side */}
            <motion.div
              initial={{ opacity: 0, x: isHebrew ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
            >
              <OptimizedImage
                src="/img/new/military-hands-book.png"
                alt={t('landing.memorial.image_alt', isHebrew ? 'ידיים מחזיקות ספר הנצחה' : 'Hands holding a memorial book')}
                className="w-full h-64 sm:h-80 lg:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </motion.div>

            {/* Content side */}
            <motion.div
              initial={{ opacity: 0, x: isHebrew ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-start"
            >
              <div className="inline-flex items-center gap-2 bg-memorial-gold/10 border border-memorial-gold/30 rounded-full px-4 py-1.5 mb-4 sm:mb-6">
                <Shield className="w-4 h-4 text-memorial-gold" />
                <span className="text-memorial-gold font-semibold text-sm">
                  {t('landing.memorial.badge', isHebrew ? 'לזכרם' : 'In Their Memory')}
                </span>
              </div>

              <h2
                id="memorial-heading"
                className="text-2xl sm:text-4xl md:text-5xl font-display font-bold gradient-gold mb-4 sm:mb-6"
              >
                {t('landing.memorial.title', isHebrew ? 'הנציחו את הגיבורים שלנו' : 'Commemorate Our Heroes')}
              </h2>

              <p className="text-gray-300 text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                {t('landing.memorial.description', isHebrew
                  ? 'כל חייל, כל חיילת, כל סיפור ראוי להישמר. צרו ספר הנצחה שישמור את הזיכרון חי לדורות הבאים - גם בלי ניסיון בכתיבה.'
                  : 'Every soldier, every story deserves to be preserved. Create a memorial book that keeps the memory alive for future generations - no writing experience needed.'
                )}
              </p>

              <GlowingButton
                variant="gold"
                size="lg"
                onClick={() => navigate('/register')}
                className="px-6 sm:px-10 py-3 sm:py-4 text-sm sm:text-base lg:text-lg"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                {t('landing.memorial.cta', isHebrew ? 'צרו ספר הנצחה' : 'Create a Memorial Book')}
              </GlowingButton>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-transparent via-indigo-900/20 to-transparent" aria-labelledby="community-heading">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10 sm:mb-16 lg:mb-20"
          >
            <h2 id="community-heading" className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold gradient-gold mb-4 sm:mb-6">
              {t('landing.community.title')}
            </h2>
            <p className="text-sm sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">
              {t('landing.community.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.labelKey}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <GlassCard className="text-center p-3 sm:p-4 lg:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-memorial-gold/20 to-primary-900/30 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-memorial-gold" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-4xl font-bold gradient-gold mb-1 sm:mb-2">{stat.value}</div>
                  <div className="text-gray-400 text-xs sm:text-sm">{t(stat.labelKey)}</div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6" aria-labelledby="success-stories-heading">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 id="success-stories-heading" className="text-2xl sm:text-4xl md:text-5xl font-display font-bold gradient-gold mb-4 sm:mb-6">
              {t('landing.success.title', 'Success Stories')}
            </h2>
            <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto">
              {t('landing.success.subtitle', 'Real authors, real books, real success')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {successStories.slice(0, 3).map((story, index) => (
              <motion.article
                key={story.name}
                initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              >
                <GlassCard className="overflow-hidden p-0">
                  <div className="relative h-48 sm:h-56">
                    <OptimizedImage
                      src={story.image}
                      alt={`${story.name}, author of ${story.book}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/50 to-transparent" />
                  </div>
                  <div className="p-4 sm:p-6">
                    <blockquote className="text-gray-300 italic mb-4">"{story.quote}"</blockquote>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-white font-semibold">{story.name}</p>
                        <p className="text-memorial-gold text-sm">{story.book}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-transparent via-memorial-gold/5 to-transparent"
        aria-labelledby="social-proof-heading"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2
              id="social-proof-heading"
              className="text-2xl sm:text-4xl md:text-5xl font-display font-bold gradient-gold mb-4 sm:mb-6"
            >
              {t('landing.social_proof.title', isHebrew ? 'אנשים רגילים, סיפורים יוצאי דופן' : 'Ordinary People, Extraordinary Stories')}
            </h2>
            <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto">
              {t('landing.social_proof.subtitle', isHebrew
                ? 'לא צריך להיות סופר כדי לכתוב ספר. צריך רק סיפור שחשוב לך.'
                : 'You don\'t need to be a writer to write a book. You just need a story that matters to you.'
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-children"
          >
            {socialProof.map((person) => (
              <div
                key={person.name}
                className="group"
              >
                <GlassCard className="p-3 sm:p-4 text-center card-3d-hover overflow-hidden">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 rounded-full overflow-hidden ring-2 ring-memorial-gold/30 group-hover:ring-memorial-gold/60 transition-all">
                    <OptimizedImage
                      src={person.image}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-white font-semibold text-sm sm:text-base mb-0.5">{person.name}</h3>
                  <p className="text-memorial-gold text-xs sm:text-sm mb-2">{person.bookType}</p>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed italic">"{person.quote}"</p>
                </GlassCard>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Community Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" aria-labelledby="writers-community-heading">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative rounded-2xl overflow-hidden"
            >
              <OptimizedImage
                src={communityImage}
                alt="MeStory Writers Community - authors collaborating and sharing their work"
                className="w-full h-64 sm:h-80 lg:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-deep-space/60 to-transparent" />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 id="writers-community-heading" className="text-2xl sm:text-4xl font-display font-bold gradient-gold mb-4 sm:mb-6">
                {t('landing.writers_community.title', 'Join Our Writers Community')}
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('landing.writers_community.description', 'Connect with fellow authors, share your journey, get feedback, and grow together. Our community spans across ages and genres, united by the love of storytelling.')}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-memorial-gold">
                  <Users className="w-5 h-5" />
                  <span>{t('landing.writers_community.writers_count', '50K+ Writers')}</span>
                </div>
                <div className="flex items-center gap-2 text-memorial-gold">
                  <BookOpen className="w-5 h-5" />
                  <span>{t('landing.writers_community.workshops', 'Daily Workshops')}</span>
                </div>
                <div className="flex items-center gap-2 text-memorial-gold">
                  <Star className="w-5 h-5" />
                  <span>{t('landing.writers_community.feedback', 'Expert Feedback')}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6" aria-labelledby="cta-heading">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <GlassCard glow="gold" className="text-center p-6 sm:p-8 lg:p-12">
              <OptimizedImage
                src={logoIcon}
                alt="MeStory logo"
                className="h-16 sm:h-20 lg:h-24 w-auto mx-auto mb-4 sm:mb-6 object-contain"
              />
              <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold gradient-gold mb-4 sm:mb-6">
                {t('landing.cta.title')}
              </h2>
              <p className="text-sm sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                {t('landing.cta.subtitle')}
              </p>
              <GlowingButton
                variant="gold"
                size="lg"
                onClick={() => navigate('/register')}
                className="px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-xl w-full sm:w-auto"
              >
                <Feather className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                {t('landing.cta.button')}
              </GlowingButton>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-10 sm:py-12 lg:py-16 px-4 sm:px-6" role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <OptimizedImage
                  src={logoIcon}
                  alt="MeStory logo"
                  className="h-12 sm:h-14 w-auto object-contain"
                />
              </div>
              <p className="text-gray-400 text-sm sm:text-base max-w-md">
                {t('landing.footer.description')}
              </p>
            </div>

            {/* Platform */}
            <nav aria-label="Platform links">
              <h3 className="font-display font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">{t('landing.footer.platform')}</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="/features" className="hover:text-memorial-gold transition-colors" aria-label="View platform features">
                    {t('landing.footer.features')}
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="hover:text-memorial-gold transition-colors" aria-label="View pricing plans">
                    {t('landing.footer.pricing')}
                  </a>
                </li>
                <li>
                  <a href="/marketplace" className="hover:text-memorial-gold transition-colors" aria-label="Browse the marketplace">
                    {t('landing.footer.marketplace')}
                  </a>
                </li>
                <li>
                  <a href="/api-docs" className="hover:text-memorial-gold transition-colors" aria-label="View API documentation">
                    {t('landing.footer.api')}
                  </a>
                </li>
              </ul>
            </nav>

            {/* Legal */}
            <nav aria-label="Legal links">
              <h3 className="font-display font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">{t('landing.footer.legal')}</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="/terms" className="hover:text-memorial-gold transition-colors" aria-label="Read terms of service">
                    {t('footer.terms')}
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-memorial-gold transition-colors" aria-label="Read privacy policy">
                    {t('footer.privacy')}
                  </a>
                </li>
                <li>
                  <a href="/library" className="hover:text-memorial-gold transition-colors" aria-label="View your library">
                    {t('nav.library')}
                  </a>
                </li>
                <li>
                  <a href="mailto:support@mestory.com" className="hover:text-memorial-gold transition-colors" aria-label="Contact support via email">
                    {t('footer.contact')}
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
              {t('landing.footer.copyright')}
            </p>
            <nav aria-label="Social media links" className="flex items-center gap-4 sm:gap-6 text-sm">
              <a
                href="https://twitter.com/mestory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-memorial-gold transition-colors"
                aria-label="Follow MeStory on Twitter"
              >
                Twitter
              </a>
              <a
                href="https://linkedin.com/company/mestory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-memorial-gold transition-colors"
                aria-label="Connect with MeStory on LinkedIn"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/mestory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-memorial-gold transition-colors"
                aria-label="View MeStory on GitHub"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
