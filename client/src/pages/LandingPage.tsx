import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import heroBg from '../assets/images/hero-bg.jpg';
import logoIcon from '../assets/images/logo-icon.png';

export default function LandingPage() {
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
      title: 'AI Co-Pilot',
      description:
        'Never face writer\'s block again. Our Gemini-powered AI assists you with plot development, character creation, and real-time writing suggestions.',
      color: 'from-yellow-400 to-yellow-600',
      glow: 'shadow-glow-gold',
    },
    {
      icon: Palette,
      title: '3D Cover Studio',
      description:
        'Transform your manuscript into a professional book with AI-generated covers, customizable layouts, and print-ready export capabilities.',
      color: 'from-purple-400 to-purple-600',
      glow: 'shadow-glow-cosmic',
    },
    {
      icon: Globe,
      title: 'Global Marketplace',
      description:
        'Publish and sell your books to readers worldwide. Set your own price, earn 50% revenue share, and build your author brand with our social features.',
      color: 'from-blue-400 to-blue-600',
      glow: 'shadow-lg',
    },
  ];

  const stats = [
    { icon: Users, value: '50K+', label: 'Active Authors' },
    { icon: BookOpen, value: '200K+', label: 'Books Published' },
    { icon: Star, value: '4.9/5', label: 'Average Rating' },
    { icon: TrendingUp, value: '$2M+', label: 'Author Earnings' },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Transparent Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-3 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl"
      >
        <div className="glass-strong rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <img
                src={logoIcon}
                alt="MeStory"
                className="h-8 sm:h-10 lg:h-12 w-auto object-contain drop-shadow-lg"
              />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold gradient-gold" style={{ fontFamily: "'Cinzel', serif" }}>
                MeStory
              </span>
            </motion.div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-semibold transition-all text-sm sm:text-base"
              >
                Login
              </button>
              <GlowingButton variant="gold" size="md" onClick={() => navigate('/register')} className="text-sm sm:text-base px-3 sm:px-4">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </GlowingButton>
            </div>
          </div>
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-magic-gold/10 blur-3xl -z-10 opacity-50" />
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-24 sm:pt-32"
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-deep-space/90 via-deep-space/70 to-deep-space/95" />

        {/* Floating Book Elements - Hidden on small mobile for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1] hidden sm:block">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                opacity: 0.1,
              }}
              animate={{
                y: [0, -40, 0],
                rotate: [0, 10, -10, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 8 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              style={{
                left: `${(i * 12) % 100}%`,
                top: `${(i * 15) % 80}%`,
              }}
            >
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-magic-gold" />
            </motion.div>
          ))}
        </div>

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
              Unleash Your Inner Author
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2"
            >
              Write, design, and publish professional books with AI assistance. Join thousands of
              authors earning from their stories on the world's most magical publishing platform.
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
                Start Writing for Free
              </GlowingButton>

              <GlowingButton
                variant="cosmic"
                size="lg"
                onClick={() => navigate('/marketplace')}
                className="px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-xl w-full sm:w-auto"
              >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                Explore Books
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
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-magic-gold" />
                <span>100 Free AI Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-magic-gold" />
                <span>50,000+ Authors Trust Us</span>
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
                  <span className="text-magic-gold">{booksPublishedToday}</span> books published
                  today
                </span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">
                  Authors earned <span className="text-green-400">$47,823</span> this week
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">
                  <span className="text-yellow-400">342</span> 5-star reviews today
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
              Everything You Need to Succeed
            </h2>
            <p className="text-sm sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">
              From your first word to your first sale, MeStory provides professional-grade tools
              that make book publishing accessible to everyone.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              >
                <GlassCard hover glow={index === 0 ? 'gold' : index === 1 ? 'purple' : 'cosmic'}>
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center ${feature.glow} mb-4 sm:mb-6`}
                  >
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>

                  <h3 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-white mb-2 sm:mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{feature.description}</p>

                  <motion.div
                    whileHover={{ x: 5 }}
                    className="mt-4 sm:mt-6 flex items-center gap-2 text-magic-gold font-semibold cursor-pointer text-sm sm:text-base"
                  >
                    Learn More
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </motion.div>
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
              Join a Thriving Community
            </h2>
            <p className="text-sm sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">
              Writers from around the world are already creating, publishing, and earning with
              MeStory.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
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
                  <div className="text-gray-400 text-xs sm:text-sm">{stat.label}</div>
                </GlassCard>
              </motion.div>
            ))}
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
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-magic-gold mx-auto mb-4 sm:mb-6" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold gradient-gold mb-4 sm:mb-6">
                Ready to Write Your Story?
              </h2>
              <p className="text-sm sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Start writing today with 100 free AI credits. No credit card required.
              </p>
              <GlowingButton
                variant="gold"
                size="lg"
                onClick={() => navigate('/register')}
                className="px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-xl w-full sm:w-auto"
              >
                <Feather className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                Create Your Free Account
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
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-magic-gold to-yellow-600 flex items-center justify-center shadow-glow-gold">
                  <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-deep-space" />
                </div>
                <span className="text-xl sm:text-2xl lg:text-3xl font-display font-bold gradient-gold">MeStory</span>
              </div>
              <p className="text-gray-400 text-sm sm:text-base max-w-md">
                The world's most magical AI-powered book writing and publishing platform.
                Democratizing storytelling for everyone.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h3 className="font-display font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Platform</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-magic-gold transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-magic-gold transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/marketplace" className="hover:text-magic-gold transition-colors">
                    Marketplace
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-magic-gold transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-display font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="/terms" className="hover:text-magic-gold transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-magic-gold transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/library" className="hover:text-magic-gold transition-colors">
                    My Library
                  </a>
                </li>
                <li>
                  <a href="mailto:support@mestory.com" className="hover:text-magic-gold transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
              © 2026 MeStory. All rights reserved. Powered by Google Gemini 2.5 Flash.
            </p>
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-magic-gold transition-colors">
                Twitter
              </a>
              <a href="#" className="text-gray-400 hover:text-magic-gold transition-colors">
                LinkedIn
              </a>
              <a href="#" className="text-gray-400 hover:text-magic-gold transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
