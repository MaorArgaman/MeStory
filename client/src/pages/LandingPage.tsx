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
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl"
      >
        <div className="glass-strong rounded-2xl border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          <div className="px-8 py-4 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center cursor-pointer"
              onClick={() => navigate('/')}
            >
              <img
                src={logoIcon}
                alt="MeStory"
                className="h-12 w-auto object-contain drop-shadow-lg"
              />
            </motion.div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-semibold transition-all"
              >
                Login
              </button>
              <GlowingButton variant="gold" size="md" onClick={() => navigate('/register')}>
                Get Started
                <ArrowRight className="w-4 h-4" />
              </GlowingButton>
            </div>
          </div>
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-magic-gold/10 blur-3xl -z-10 opacity-50" />
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-6 pt-32"
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-deep-space/90 via-deep-space/70 to-deep-space/95" />

        {/* Floating Book Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
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
                left: `${(i * 8) % 100}%`,
                top: `${(i * 15) % 80}%`,
              }}
            >
              <BookOpen className="w-16 h-16 text-magic-gold" />
            </motion.div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-7xl md:text-8xl font-display font-bold mb-6 leading-tight"
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
              className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Write, design, and publish professional books with AI assistance. Join thousands of
              authors earning from their stories on the world's most magical publishing platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <GlowingButton
                variant="gold"
                size="lg"
                onClick={() => navigate('/register')}
                className="px-12 py-5 text-xl"
              >
                <Feather className="w-6 h-6" />
                Start Writing for Free
              </GlowingButton>

              <GlowingButton
                variant="cosmic"
                size="lg"
                onClick={() => navigate('/marketplace')}
                className="px-12 py-5 text-xl"
              >
                <BookOpen className="w-6 h-6" />
                Explore Books
              </GlowingButton>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-magic-gold" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-magic-gold" />
                <span>100 Free AI Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-magic-gold" />
                <span>50,000+ Authors Trust Us</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20"
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
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-display font-bold gradient-gold mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From your first word to your first sale, MeStory provides professional-grade tools
              that make book publishing accessible to everyone.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
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
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center ${feature.glow} mb-6`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-display font-bold text-white mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>

                  <motion.div
                    whileHover={{ x: 5 }}
                    className="mt-6 flex items-center gap-2 text-magic-gold font-semibold cursor-pointer"
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-indigo-900/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-display font-bold gradient-gold mb-6">
              Join a Thriving Community
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Writers from around the world are already creating, publishing, and earning with
              MeStory.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <GlassCard className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-magic-gold/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-magic-gold" />
                  </div>
                  <div className="text-4xl font-bold gradient-gold mb-2">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <GlassCard glow="gold" className="text-center p-12">
              <Sparkles className="w-16 h-16 text-magic-gold mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-display font-bold gradient-gold mb-6">
                Ready to Write Your Story?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Start writing today with 100 free AI credits. No credit card required.
              </p>
              <GlowingButton
                variant="gold"
                size="lg"
                onClick={() => navigate('/register')}
                className="px-12 py-5 text-xl"
              >
                <Feather className="w-6 h-6" />
                Create Your Free Account
              </GlowingButton>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-magic-gold to-yellow-600 flex items-center justify-center shadow-glow-gold">
                  <Sparkles className="w-7 h-7 text-deep-space" />
                </div>
                <span className="text-3xl font-display font-bold gradient-gold">MeStory</span>
              </div>
              <p className="text-gray-400 max-w-md">
                The world's most magical AI-powered book writing and publishing platform.
                Democratizing storytelling for everyone.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h3 className="font-display font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
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
              <h3 className="font-display font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-magic-gold transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-magic-gold transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-magic-gold transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-magic-gold transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 MeStory. All rights reserved. Powered by Google Gemini 2.5 Flash.
            </p>
            <div className="flex items-center gap-6">
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
