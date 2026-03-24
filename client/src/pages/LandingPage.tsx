import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
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
} from 'lucide-react';
import { GlassCard, GlowingButton } from '../components/ui';
// Use new realistic images from public folder
const heroBg = '/img/landing-hero-new.png';
const logoIcon = '/img/logo-glow.png';

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [booksPublishedToday, setBooksPublishedToday] = useState(127);
  const { scrollY } = useScroll();

  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.8]);

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
      image: '/img/feature-ai-writing.png',
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
      color: 'from-purple-400 to-purple-600',
      glow: 'shadow-glow-cosmic',
    },
    {
      icon: Globe,
      image: '/img/young-writers.png',
      titleKey: 'landing.features.marketplace.title',
      descriptionKey: 'landing.features.marketplace.description',
      color: 'from-blue-400 to-blue-600',
      glow: 'shadow-lg',
    },
  ];

  // Success stories with real images
  const successStories = [
    {
      image: '/img/success-author.png',
      name: 'Sarah Jenkins',
      book: 'The Whispering Oak',
      quote: 'From first draft to bookstore shelf - my book now stands in the Local Authors section. MeStory made it possible!',
    },
    {
      image: '/img/author-portrait.png',
      name: 'רות כהן',
      book: 'שירי החזית',
      quote: 'כתבתי את סיפור המשפחה שלי ועכשיו הנכדים קוראים אותו. רגע מרגש!',
    },
    {
      image: '/img/launch-day.png',
      name: 'מרגרט לוי',
      book: 'המסע שלי',
      quote: 'יום ההשקה! לראות את הספר שלי עולה לחנות של MeStory ומגיע לקוראים בכל העולם - חלום שהתגשם!',
    },
  ];

  // Community image
  const communityImage = '/img/community-group.png';

  const stats = [
    { icon: Users, value: '50K+', labelKey: 'landing.stats.active_authors' },
    { icon: BookOpen, value: '200K+', labelKey: 'landing.stats.books_published' },
    { icon: Star, value: '4.9/5', labelKey: 'landing.stats.average_rating' },
    { icon: TrendingUp, value: '$2M+', labelKey: 'landing.stats.author_earnings' },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Transparent Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 w-full"
      >
        <div className="glass-strong border-b-2 border-magic-gold/30 shadow-lg shadow-magic-gold/10 backdrop-blur-2xl bg-gradient-to-r from-[#0a0a12] via-[#0d0d18] to-[#0a0a12]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer flex items-center"
              onClick={() => navigate('/')}
            >
              <img
                src={logoIcon}
                alt="MeStory"
                className="h-12 sm:h-14 w-auto object-cover"
                style={{
                  clipPath: 'inset(15% 5% 15% 5%)',
                  transform: 'scale(1.4)',
                }}
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
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20"
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-deep-space/90 via-deep-space/70 to-deep-space/95" />

        {/* Floating Logo Watermark - Subtle background decoration */}
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none z-[1] hidden lg:flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.03 }}
          transition={{ duration: 2 }}
        >
          <img
            src={logoIcon}
            alt=""
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
          >
            <motion.h1
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold mb-4 sm:mb-6 leading-tight"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              style={{
                background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
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
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6"
            >
              <GlowingButton
                variant="gold"
                size="lg"
                onClick={() => navigate('/register')}
                className="px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-xl w-full sm:w-auto"
              >
                <Feather className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                {t('landing.hero.cta_primary')}
              </GlowingButton>

              <GlowingButton
                variant="cosmic"
                size="lg"
                onClick={() => navigate('/marketplace')}
                className="px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-xl w-full sm:w-auto"
              >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                {t('landing.hero.cta_secondary')}
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
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-magic-gold" />
                <span>{t('landing.trust.no_credit_card')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-magic-gold" />
                <span>{t('landing.trust.free_credits')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-magic-gold" />
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
          <div className="w-6 h-10 rounded-full border-2 border-magic-gold/50 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-magic-gold"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Live Ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden bg-gradient-to-r from-magic-gold/20 via-purple-500/20 to-magic-gold/20 border-y border-white/10"
      >
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap py-4"
        >
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-12">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-magic-gold" />
                <span className="text-white font-semibold">
                  <span className="text-magic-gold">{booksPublishedToday}</span> {t('landing.ticker.books_today')}
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
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold gradient-gold mb-4 sm:mb-6">
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
                <GlassCard hover glow={index === 0 ? 'gold' : index === 1 ? 'purple' : 'cosmic'} className="overflow-hidden p-0">
                  {/* Feature Image */}
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={t(feature.titleKey)}
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
                      className="mt-4 sm:mt-6 flex items-center gap-2 text-magic-gold font-semibold cursor-pointer text-sm sm:text-base"
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

      {/* Stats Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-transparent via-indigo-900/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold gradient-gold mb-4 sm:mb-6">
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
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-magic-gold/20 to-purple-500/20 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-magic-gold" />
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
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold gradient-gold mb-4 sm:mb-6">
              {t('landing.success.title', 'Success Stories')}
            </h2>
            <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto">
              {t('landing.success.subtitle', 'Real authors, real books, real success')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              >
                <GlassCard className="overflow-hidden p-0">
                  <div className="relative h-48 sm:h-56">
                    <img
                      src={story.image}
                      alt={story.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/50 to-transparent" />
                  </div>
                  <div className="p-4 sm:p-6">
                    <p className="text-gray-300 italic mb-4">"{story.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-white font-semibold">{story.name}</p>
                        <p className="text-magic-gold text-sm">{story.book}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
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
              <img
                src={communityImage}
                alt="MeStory Writers Community"
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
              <h2 className="text-2xl sm:text-4xl font-display font-bold gradient-gold mb-4 sm:mb-6">
                {t('landing.writers_community.title', 'Join Our Writers Community')}
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('landing.writers_community.description', 'Connect with fellow authors, share your journey, get feedback, and grow together. Our community spans across ages and genres, united by the love of storytelling.')}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-magic-gold">
                  <Users className="w-5 h-5" />
                  <span>50K+ Writers</span>
                </div>
                <div className="flex items-center gap-2 text-magic-gold">
                  <BookOpen className="w-5 h-5" />
                  <span>Daily Workshops</span>
                </div>
                <div className="flex items-center gap-2 text-magic-gold">
                  <Star className="w-5 h-5" />
                  <span>Expert Feedback</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <GlassCard glow="gold" className="text-center p-6 sm:p-8 lg:p-12">
              <img
                src={logoIcon}
                alt="MeStory"
                className="h-16 sm:h-20 lg:h-24 w-auto mx-auto mb-4 sm:mb-6 object-cover opacity-90"
                style={{
                  clipPath: 'inset(15% 5% 15% 5%)',
                  transform: 'scale(1.4)',
                }}
              />
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold gradient-gold mb-4 sm:mb-6">
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

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-10 sm:py-12 lg:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <img
                  src={logoIcon}
                  alt="MeStory"
                  className="h-14 sm:h-16 w-auto object-cover"
                  style={{
                    clipPath: 'inset(10% 3% 10% 3%)',
                    transform: 'scale(1.25)',
                  }}
                />
              </div>
              <p className="text-gray-400 text-sm sm:text-base max-w-md">
                {t('landing.footer.description')}
              </p>
            </div>

            {/* Platform */}
            <div>
              <h3 className="font-display font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">{t('landing.footer.platform')}</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="/features" className="hover:text-magic-gold transition-colors" aria-label="View platform features">
                    {t('landing.footer.features')}
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="hover:text-magic-gold transition-colors" aria-label="View pricing plans">
                    {t('landing.footer.pricing')}
                  </a>
                </li>
                <li>
                  <a href="/marketplace" className="hover:text-magic-gold transition-colors" aria-label="Browse the marketplace">
                    {t('landing.footer.marketplace')}
                  </a>
                </li>
                <li>
                  <a href="/api-docs" className="hover:text-magic-gold transition-colors" aria-label="View API documentation">
                    {t('landing.footer.api')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-display font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">{t('landing.footer.legal')}</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="/terms" className="hover:text-magic-gold transition-colors" aria-label="Read terms of service">
                    {t('footer.terms')}
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-magic-gold transition-colors" aria-label="Read privacy policy">
                    {t('footer.privacy')}
                  </a>
                </li>
                <li>
                  <a href="/library" className="hover:text-magic-gold transition-colors" aria-label="View your library">
                    {t('nav.library')}
                  </a>
                </li>
                <li>
                  <a href="mailto:support@mestory.com" className="hover:text-magic-gold transition-colors" aria-label="Contact support via email">
                    {t('footer.contact')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
              {t('landing.footer.copyright')}
            </p>
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <a
                href="https://twitter.com/mestory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-magic-gold transition-colors"
                aria-label="Follow MeStory on Twitter"
              >
                Twitter
              </a>
              <a
                href="https://linkedin.com/company/mestory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-magic-gold transition-colors"
                aria-label="Connect with MeStory on LinkedIn"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/mestory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-magic-gold transition-colors"
                aria-label="View MeStory on GitHub"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
