import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Search, Sparkles, Star, DollarSign, User, BookOpen, Eye, Heart, Shield, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton, NeonInput } from '../components/ui';
import {
  RecommendedForYou,
  ContinueReading,
  TrendingBooks,
  FeaturedBooks,
} from '../components/recommendations';
import fantasyBanner from '../assets/images/fantasy-banner.png';
import scifiBanner from '../assets/images/marketplace-banner-scifi.png';
import mysteryBanner from '../assets/images/marketplace-banner-mystery.png';

// Check if user is logged in
const isAuthenticated = () => !!localStorage.getItem('token');

interface BookItem {
  _id: string;
  title: string;
  genre: string;
  description?: string;
  author: {
    _id: string;
    name: string;
  };
  coverDesign?: {
    front?: {
      imageUrl?: string;
      backgroundColor?: string;
      gradientColors?: string[];
      title?: {
        color?: string;
      };
    };
  };
  publishingStatus: {
    price: number;
    isFree: boolean;
    marketingStrategy?: {
      categories?: string[];
    };
  };
  qualityScore?: {
    overallScore: number;
    rating: number;
  };
  statistics: {
    views: number;
    purchases: number;
  };
}

// Base categories for all languages
const BASE_CATEGORIES = [
  'All',
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Mystery',
  'Thriller',
  'Horror',
  'Historical',
  'Literary Fiction',
  'Young Adult',
  'Adventure',
];

// Israeli-specific categories for Hebrew users (with trauma-informed design)
const ISRAELI_CATEGORIES = [
  { id: 'October7', name: 'אירועי השבעה באוקטובר', icon: 'candle', hasSubcategories: true, isMemorial: true },
  { id: 'IsraelWars', name: 'מלחמות ישראל', icon: 'shield', hasSubcategories: true },
  { id: 'HolocaustSurvivors', name: 'סיפורי ניצולי שואה', icon: 'users', hasSubcategories: true, isMemorial: true },
];

// October 7th subcategories - trauma-informed taxonomy
const OCTOBER7_SUBCATEGORIES = [
  { id: 'October7_Hostages', name: 'סיפורי חטופים ושבים', icon: 'heart' },
  { id: 'October7_Soldiers', name: 'סיפורי לוחמים וחיילים', icon: 'shield' },
  { id: 'October7_BereavedFamilies', name: 'משפחות שכולות', icon: 'candle' },
  { id: 'October7_HostageFamilies', name: 'משפחות החטופים', icon: 'heart' },
  { id: 'October7_MissingFamilies', name: 'משפחות נעדרים', icon: 'search' },
  { id: 'October7_EvacuatedCommunities', name: 'קהילות מפונות', icon: 'home' },
  { id: 'October7_Rescue', name: 'חילוץ והצלה', icon: 'first-aid' },
  { id: 'October7_CommunityResilience', name: 'חוסן קהילתי והתנדבות', icon: 'hands' },
  { id: 'October7_Memorial', name: 'הנצחה וזיכרון', icon: 'candle' },
];

// Subcategories for Israel Wars
const ISRAEL_WARS_SUBCATEGORIES = [
  { id: 'IsraelWars_Independence', name: 'מלחמת העצמאות', icon: 'flag' },
  { id: 'IsraelWars_SixDay', name: 'מלחמת ששת הימים', icon: 'star' },
  { id: 'IsraelWars_YomKippur', name: 'מלחמת יום כיפור', icon: 'shield' },
  { id: 'IsraelWars_Lebanon', name: 'מלחמות לבנון', icon: 'shield' },
  { id: 'IsraelWars_Operations', name: 'מבצעים צבאיים', icon: 'target' },
  { id: 'IsraelWars_IDF', name: 'סיפורי צה"ל', icon: 'shield' },
  { id: 'IsraelWars_Memorial', name: 'הנצחה וזיכרון', icon: 'candle' },
];

// Subcategories for Holocaust Survivors
const HOLOCAUST_SUBCATEGORIES = [
  { id: 'Holocaust_Testimonies', name: 'עדויות', icon: 'mic' },
  { id: 'Holocaust_Survival', name: 'סיפורי הישרדות', icon: 'heart' },
  { id: 'Holocaust_Families', name: 'סיפורי משפחות', icon: 'users' },
  { id: 'Holocaust_Children', name: 'ילדי השואה', icon: 'child' },
  { id: 'Holocaust_SecondGen', name: 'דור שני ושלישי', icon: 'generations' },
  { id: 'Holocaust_Heritage', name: 'מורשת וזיכרון', icon: 'candle' },
];

export default function MarketplacePage() {
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedIsraeliCategory, setExpandedIsraeliCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);

  // Determine if we should show Israeli categories (only in Hebrew)
  const isHebrew = language === 'he';

  // Get the appropriate subcategories for the expanded Israeli category
  const getSubcategories = (categoryId: string) => {
    switch (categoryId) {
      case 'October7':
        return OCTOBER7_SUBCATEGORIES;
      case 'IsraelWars':
        return ISRAEL_WARS_SUBCATEGORIES;
      case 'HolocaustSurvivors':
        return HOLOCAUST_SUBCATEGORIES;
      default:
        return [];
    }
  };

  // Handle Israeli category click - toggle subcategories
  const handleIsraeliCategoryClick = (categoryId: string) => {
    if (expandedIsraeliCategory === categoryId) {
      // If clicking on already expanded category, collapse it and select the main category
      setExpandedIsraeliCategory(null);
      setSelectedCategory(categoryId);
    } else {
      // Expand this category to show subcategories
      setExpandedIsraeliCategory(categoryId);
      setSelectedCategory(categoryId);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [selectedCategory, sortBy]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const params: any = {
        sortBy,
        order: 'desc',
      };

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery;
      }

      const response = await api.get('/books/public', { params });

      if (response.data.success) {
        setBooks(response.data.data.books);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
      toast.error(t('marketplace.messages.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBooks();
  };

  const getBookCoverStyle = (book: BookItem) => {
    const cover = book.coverDesign?.front;
    if (!cover) {
      return {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      };
    }

    if (cover.imageUrl) {
      return {
        backgroundImage: `url(${cover.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }

    if (cover.gradientColors && cover.gradientColors.length > 0) {
      return {
        background: `linear-gradient(135deg, ${cover.gradientColors.join(', ')})`,
      };
    }

    if (cover.backgroundColor) {
      return {
        backgroundColor: cover.backgroundColor,
      };
    }

    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    };
  };

  return (
    <div className="min-h-screen relative">
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8">
        {/* Floating Book Icons Background - hide some on mobile */}
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${(i * 12) + 5}%`,
                top: `${(i % 2) * 30 + 10}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 10, -10, 0],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 8 + (i * 0.5),
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            >
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-magic-gold" />
            </motion.div>
          ))}
        </div>

        {/* Radial Glow Effect */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, rgba(255, 215, 0, 0.2) 0%, transparent 50%)',
          }}
        />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold gradient-gold mb-3 sm:mb-6 majestic-heading">
              {t('marketplace.hero.title')}
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-gray-300 font-light max-w-3xl mx-auto px-2">
              {t('marketplace.hero.subtitle')}
              <br />
              <span className="text-magic-gold">{t('marketplace.hero.highlight')}</span>
            </p>
          </motion.div>

          {/* Search Bar with NeonInput */}
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <NeonInput
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('marketplace.search.placeholder')}
                glowColor="gold"
                icon={<Search className="w-5 h-5" />}
                className="flex-1"
              />
              <GlowingButton
                type="submit"
                variant="gold"
                size="lg"
              >
                <Sparkles className="w-5 h-5" />
                <span className="hidden sm:inline">{t('marketplace.search.button')}</span>
                <span className="sm:hidden">Search</span>
              </GlowingButton>
            </div>
          </motion.form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 pb-12 sm:pb-20">
        {/* Personalized Recommendation Sections (for logged-in users) */}
        {isAuthenticated() && (
          <div className="mb-8 sm:mb-12">
            {/* Continue Reading */}
            <ContinueReading limit={4} />

            {/* Recommended For You */}
            <RecommendedForYou limit={8} showReasons={true} />
          </div>
        )}

        {/* Featured Books - Editor's Choice */}
        <FeaturedBooks limit={4} />

        {/* Trending Books */}
        <TrendingBooks limit={6} />

        {/* Glowing Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 sm:mb-12"
        >
          {/* Base Categories */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            {BASE_CATEGORIES.map((category, index) => (
              <motion.button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setExpandedIsraeliCategory(null);
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="relative px-3 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium whitespace-nowrap text-sm sm:text-base"
              >
                {/* Sliding pill background for active tab */}
                {selectedCategory === category && !expandedIsraeliCategory && (
                  <motion.div
                    layoutId="activeCategoryIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-amber-500/90 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                    style={{ zIndex: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}

                {/* Hover glow effect for inactive tabs */}
                {selectedCategory !== category && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white/0 hover:bg-white/10 transition-colors duration-200"
                    style={{ zIndex: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  />
                )}

                {/* Tab text - always on top */}
                <span
                  className={`relative font-semibold transition-colors duration-200 ${
                    selectedCategory === category && !expandedIsraeliCategory
                      ? 'text-white drop-shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  style={{ zIndex: 10 }}
                >
                  {category}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Israeli Memorial Categories Section (Hebrew only) */}
          {isHebrew && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <span className="text-amber-400/80 text-sm font-medium flex items-center gap-2">
                  <span className="text-amber-400">🕯️</span>
                  סיפורים ישראליים
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              </div>

              {/* Israeli Categories */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                {ISRAELI_CATEGORIES.map((category, index) => (
                  <motion.button
                    key={category.id}
                    onClick={() => handleIsraeliCategoryClick(category.id)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={`relative px-5 py-3 rounded-xl font-medium whitespace-nowrap text-sm transition-all duration-300 ${
                      category.isMemorial
                        ? 'border border-amber-500/40 hover:border-amber-400/60'
                        : 'border border-white/20 hover:border-white/40'
                    } ${
                      selectedCategory === category.id || expandedIsraeliCategory === category.id
                        ? category.isMemorial
                          ? 'bg-gradient-to-r from-amber-900/40 to-amber-800/30 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                          : 'bg-gradient-to-r from-purple-900/40 to-blue-900/30 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {category.isMemorial && <span className="text-amber-400">🕯️</span>}
                      {category.id === 'IsraelWars' && <Shield className="w-4 h-4" />}
                      {category.name}
                      {category.hasSubcategories && (
                        <motion.span
                          animate={{ rotate: expandedIsraeliCategory === category.id ? 180 : 0 }}
                          className="text-xs opacity-60"
                        >
                          ▼
                        </motion.span>
                      )}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Subcategories (expandable) */}
              <AnimatePresence>
                {expandedIsraeliCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-amber-500/20">
                      <div className="flex flex-wrap justify-center gap-2">
                        {getSubcategories(expandedIsraeliCategory).map((sub, index) => (
                          <motion.button
                            key={sub.id}
                            onClick={() => setSelectedCategory(sub.id)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              selectedCategory === sub.id
                                ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-200'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {sub.icon === 'candle' && <span>🕯️</span>}
                              {sub.icon === 'heart' && <Heart className="w-3.5 h-3.5" />}
                              {sub.icon === 'shield' && <Shield className="w-3.5 h-3.5" />}
                              {sub.icon === 'users' && <Users className="w-3.5 h-3.5" />}
                              {sub.name}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        {/* Fantasy Category Banner */}
        {selectedCategory === 'Fantasy' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="mb-12 relative overflow-hidden"
          >
            <div
              className="relative w-full h-48 md:h-56 lg:h-64 rounded-2xl bg-cover bg-center shadow-2xl"
              style={{
                backgroundImage: `url(${fantasyBanner})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Glowing Border */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-magic-gold/30 shadow-glow-gold" />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-deep-space/95 via-deep-space/50 to-transparent rounded-2xl" />

              {/* Sparkle Animations */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${15 + i * 15}%`,
                      top: `${20 + (i % 2) * 40}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-magic-gold" />
                  </motion.div>
                ))}
              </div>

              {/* Category Title with Magical Styling */}
              <div className="relative z-10 h-full flex items-end p-4 sm:p-6 md:p-8">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-gold mb-2 sm:mb-3"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {t('marketplace.banners.fantasy.title')}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 font-light max-w-2xl"
                  >
                    {t('marketplace.banners.fantasy.subtitle')}
                  </motion.p>
                </div>
              </div>

              {/* Floating Magic Particles Effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-1 h-1 bg-magic-gold rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      bottom: '0%',
                    }}
                    animate={{
                      y: [0, -250],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 4 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sci-Fi Category Banner */}
        {selectedCategory === 'Sci-Fi' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="mb-12 relative overflow-hidden"
          >
            <div
              className="relative w-full h-48 md:h-56 lg:h-64 rounded-2xl bg-cover bg-center shadow-2xl"
              style={{
                backgroundImage: `url(${scifiBanner})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Glowing Border */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.3)]" />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-deep-space/95 via-deep-space/50 to-transparent rounded-2xl" />

              {/* Digital Circuit Animations */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${15 + i * 15}%`,
                      top: `${20 + (i % 2) * 40}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 90, 180],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <div className="w-6 h-6 border-2 border-cyan-400 rounded-sm" />
                  </motion.div>
                ))}
              </div>

              {/* Category Title */}
              <div className="relative z-10 h-full flex items-end p-4 sm:p-6 md:p-8">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 sm:mb-3"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {t('marketplace.banners.scifi.title')}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 font-light max-w-2xl"
                  >
                    {t('marketplace.banners.scifi.subtitle')}
                  </motion.p>
                </div>
              </div>

              {/* Floating Tech Particles Effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      bottom: '0%',
                    }}
                    animate={{
                      y: [0, -250],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 4 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* October 7th Memorial Banner (Hebrew only) */}
        {isHebrew && (selectedCategory === 'October7' || selectedCategory.startsWith('October7_')) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="mb-12 relative overflow-hidden"
          >
            <div
              className="relative w-full h-48 md:h-56 lg:h-64 rounded-2xl shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
              }}
            >
              {/* Subtle gold border glow */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]" />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-2xl" />

              {/* Floating candle flames */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${10 + i * 13}%`,
                      bottom: '20%',
                    }}
                    animate={{
                      y: [0, -8, 0],
                      opacity: [0.6, 1, 0.6],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'easeInOut',
                    }}
                  >
                    <div className="text-2xl">🕯️</div>
                  </motion.div>
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex items-end p-4 sm:p-6 md:p-8">
                <div className="text-right w-full">
                  <motion.h1
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-amber-200 mb-2 sm:mb-3"
                    style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                  >
                    {t('marketplace.banners.october7.title')}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-sm sm:text-base md:text-lg text-gray-300 font-light max-w-2xl mr-auto"
                  >
                    {t('marketplace.banners.october7.subtitle')}
                  </motion.p>
                </div>
              </div>

              {/* Rising light particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-1 h-1 bg-amber-400/60 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      bottom: '0%',
                    }}
                    animate={{
                      y: [0, -200],
                      opacity: [0, 0.8, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 4 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Holocaust Survivors Memorial Banner (Hebrew only) */}
        {isHebrew && (selectedCategory === 'HolocaustSurvivors' || selectedCategory.startsWith('Holocaust_')) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="mb-12 relative overflow-hidden"
          >
            <div
              className="relative w-full h-48 md:h-56 lg:h-64 rounded-2xl shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #1f1f3a 50%, #0f0f23 100%)',
              }}
            >
              {/* Subtle border */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-amber-600/20" />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-2xl" />

              {/* Six memorial candles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${15 + i * 14}%`,
                      bottom: '25%',
                    }}
                    animate={{
                      y: [0, -6, 0],
                      opacity: [0.5, 0.9, 0.5],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: 'easeInOut',
                    }}
                  >
                    <div className="text-2xl">🕯️</div>
                  </motion.div>
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex items-end p-4 sm:p-6 md:p-8">
                <div className="text-right w-full">
                  <motion.h1
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-amber-100 mb-2 sm:mb-3"
                    style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                  >
                    {t('marketplace.banners.holocaust_survivors.title')}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-sm sm:text-base md:text-lg text-gray-300 font-light max-w-2xl mr-auto"
                  >
                    {t('marketplace.banners.holocaust_survivors.subtitle')}
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Israel Wars Banner (Hebrew only) */}
        {isHebrew && (selectedCategory === 'IsraelWars' || selectedCategory.startsWith('IsraelWars_')) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="mb-12 relative overflow-hidden"
          >
            <div
              className="relative w-full h-48 md:h-56 lg:h-64 rounded-2xl shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #1a2744 0%, #1e3a5f 50%, #0d1b2a 100%)',
              }}
            >
              {/* Subtle border */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-blue-500/20" />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-2xl" />

              {/* Shield icon animation */}
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute top-1/4 right-8 sm:right-16"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Shield className="w-24 h-24 sm:w-32 sm:h-32 text-blue-400/20" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex items-end p-4 sm:p-6 md:p-8">
                <div className="text-right w-full">
                  <motion.h1
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-200 mb-2 sm:mb-3"
                    style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                  >
                    {t('marketplace.banners.israel_wars.title')}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-sm sm:text-base md:text-lg text-gray-300 font-light max-w-2xl mr-auto"
                  >
                    {t('marketplace.banners.israel_wars.subtitle')}
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mystery Category Banner */}
        {selectedCategory === 'Mystery' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="mb-12 relative overflow-hidden"
          >
            <div
              className="relative w-full h-48 md:h-56 lg:h-64 rounded-2xl bg-cover bg-center shadow-2xl"
              style={{
                backgroundImage: `url(${mysteryBanner})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Glowing Border */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.3)]" />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-deep-space/95 via-deep-space/50 to-transparent rounded-2xl" />

              {/* Mysterious Fog Animations */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${15 + i * 15}%`,
                      top: `${20 + (i % 2) * 40}%`,
                    }}
                    animate={{
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: i * 0.7,
                      ease: 'easeInOut',
                    }}
                  >
                    <div className="w-8 h-8 bg-purple-500/30 rounded-full blur-sm" />
                  </motion.div>
                ))}
              </div>

              {/* Category Title */}
              <div className="relative z-10 h-full flex items-end p-4 sm:p-6 md:p-8">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-transparent mb-2 sm:mb-3"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {t('marketplace.banners.mystery.title')}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 font-light max-w-2xl"
                  >
                    {t('marketplace.banners.mystery.subtitle')}
                  </motion.p>
                </div>
              </div>

              {/* Floating Shadow Particles Effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-1 h-1 bg-purple-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      bottom: '0%',
                    }}
                    animate={{
                      y: [0, -250],
                      opacity: [0, 0.8, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 5 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sort and Count */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400 font-medium text-sm sm:text-base"
          >
            {books.length} <span className="text-magic-gold">{t('marketplace.results.stellar')}</span>{' '}
            {books.length === 1 ? t('marketplace.results.count_singular', { count: books.length }).split(' ').slice(-2).join(' ') : t('marketplace.results.count_plural', { count: books.length }).split(' ').slice(-2).join(' ')}
          </motion.p>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <span className="text-gray-400 text-xs sm:text-sm font-medium">{t('marketplace.sort.label')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-magic-gold text-white cursor-pointer"
              style={{ backgroundColor: '#1a1a2e' }}
            >
              <option value="createdAt" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>{t('marketplace.sort.newest')}</option>
              <option value="popularity" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>{t('marketplace.sort.popular')}</option>
              <option value="quality" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>{t('marketplace.sort.rated')}</option>
              <option value="price" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>{t('marketplace.sort.price')}</option>
            </select>
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-strong rounded-xl p-3 sm:p-4 animate-pulse">
                <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-3 sm:mb-4" />
                <div className="h-3 sm:h-4 bg-gray-700 rounded mb-2" />
                <div className="h-2 sm:h-3 bg-gray-700 rounded w-2/3 mb-2" />
                <div className="h-2 sm:h-3 bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 sm:py-24 md:py-32"
          >
            <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-600 mx-auto mb-4 sm:mb-6 opacity-50" />
            <h3 className="text-lg sm:text-xl md:text-2xl font-display font-semibold text-gray-400 mb-2 sm:mb-3">
              {t('marketplace.empty.title')}
            </h3>
            <p className="text-gray-500 text-sm sm:text-base md:text-lg">
              {t('marketplace.empty.subtitle')}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {books.map((book, index) => (
              <motion.div
                key={book._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredBook(book._id)}
                onMouseLeave={() => setHoveredBook(null)}
              >
                <GlassCard
                  hover={true}
                  glow={(book.qualityScore?.overallScore ?? 0) >= 90 ? 'gold' : 'cosmic'}
                  className="h-full flex flex-col relative overflow-visible"
                >
                  {/* Masterpiece Badge */}
                  {book.qualityScore && book.qualityScore.overallScore >= 90 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + index * 0.05, type: 'spring' }}
                      className="absolute -top-3 -right-3 z-20"
                    >
                      <div className="relative">
                        <div className="badge-gold px-3 py-1 shadow-glow-gold animate-pulse-glow">
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          {t('marketplace.book.masterpiece')}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Book Cover with 2:3 Aspect Ratio */}
                  <div className="relative mb-2 sm:mb-4 rounded-lg overflow-hidden group/cover">
                    <div
                      className="aspect-[2/3] relative"
                      style={getBookCoverStyle(book)}
                    >
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Quality Score Badge */}
                      {book.qualityScore && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                          <div
                            className={`
                              w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center
                              font-bold text-white shadow-lg backdrop-blur-sm
                              ${
                                book.qualityScore.overallScore >= 90
                                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                                  : book.qualityScore.overallScore >= 80
                                  ? 'bg-gradient-to-br from-green-400 to-green-600'
                                  : 'bg-gradient-to-br from-blue-400 to-blue-600'
                              }
                            `}
                          >
                            <div className="text-center">
                              <div className="text-sm sm:text-lg leading-none">
                                {book.qualityScore.overallScore}
                              </div>
                              <div className="text-[6px] sm:text-[8px] opacity-80">{t('marketplace.book.score')}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Book Title on Cover */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4">
                        <h3 className="font-display font-bold text-white text-sm sm:text-xl line-clamp-2 drop-shadow-lg">
                          {book.title}
                        </h3>
                      </div>

                      {/* Quick Preview Button (shows on hover) */}
                      <AnimatePresence>
                        {hoveredBook === book._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                          >
                            <GlowingButton
                              variant="gold"
                              size="md"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/read/${book._id}`, '_blank');
                              }}
                            >
                              <Eye className="w-5 h-5" />
                              {t('marketplace.book.quick_preview')}
                            </GlowingButton>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 flex flex-col">
                    {/* Author */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{book.author.name}</span>
                    </div>

                    {/* Description - hide on mobile for cleaner look */}
                    {book.description && (
                      <p className="hidden sm:block text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                        {book.description}
                      </p>
                    )}

                    {/* Price and Rating */}
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      {/* Price */}
                      {book.publishingStatus.isFree ? (
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500/20 text-green-400 rounded-full text-xs sm:text-sm font-bold border border-green-500/40">
                          {t('marketplace.book.free')}
                        </span>
                      ) : (
                        <div className="flex items-center gap-0.5 sm:gap-1 text-magic-gold font-bold text-sm sm:text-lg">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>{book.publishingStatus.price.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Rating */}
                      {book.qualityScore && (
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {book.qualityScore.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <GlowingButton
                      variant={book.publishingStatus.isFree ? 'cosmic' : 'primary'}
                      size="md"
                      fullWidth
                      onClick={() => {
                        window.location.href = `/book/${book._id}`;
                      }}
                      className="text-xs sm:text-sm py-2 sm:py-2.5"
                    >
                      <span className="hidden sm:inline">{t('marketplace.book.view_details')}</span>
                      <span className="sm:hidden">View</span>
                    </GlowingButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
