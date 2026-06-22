import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Search, Sparkles, Star, User, BookOpen, Eye, Shield, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton, NeonInput, OptimizedImage, getAuthorProfileAlt } from '../components/ui';
import {
  TrendingBooks,
  FeaturedBooks,
} from '../components/recommendations';
import { SEO, CollectionPageSchema, BreadcrumbSchema } from '../components/seo';
// Memorial book genre banners from public folder
const genreBanners: Record<string, string> = {
  'fallen_soldier': '/img/october7.png',
  'life_story': '/img/Biography.png',
  'family_legacy': '/img/memorial-family.png',
  'tribute': '/img/memorial-hero.png',
  'holocaust_survivor': '/img/holo.png',
  'shared_memories': '/img/community-group.png',
  'letters_and_words': '/img/TrueStory2.png',
  'testimony': '/img/TrueStory3.png',
  // Legacy mappings for old data
  'TrueStory': '/img/TrueStory2.png',
  'Biography': '/img/Biography.png',
  'Historical': '/img/Historical.png',
};
const marketplaceHero = '/img/memorial-hero.png';

interface BookItem {
  _id: string;
  title: string;
  genre: string;
  description?: string;
  author: {
    _id: string;
    name: string;
    profile?: {
      avatar?: string;
    };
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
    imageUrl?: string;
    coverColor?: string;
    backgroundColor?: string;
    gradientColors?: string[];
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

// Memorial book categories for all languages with translations
const BASE_CATEGORIES: Record<string, Record<'en' | 'he', string>> = {
  'All': { en: 'All', he: 'הכל' },
  'fallen_soldier': { en: 'Fallen Soldiers', he: 'חללי צה"ל' },
  'life_story': { en: 'Life Story', he: 'סיפור חיים' },
  'family_legacy': { en: 'Family Legacy', he: 'מורשת משפחתית' },
  'tribute': { en: 'Tribute & Honor', he: 'מחווה והוקרה' },
  'holocaust_survivor': { en: 'Holocaust Survivors', he: 'ניצולי שואה' },
  'shared_memories': { en: 'Shared Memories', he: 'זיכרונות משותפים' },
  'letters_and_words': { en: 'Letters & Words', he: 'מכתבים ודברים' },
  'testimony': { en: 'Testimony', he: 'עדות' },
};

// Memorial book subcategories
const TRUE_STORY_SUBCATEGORIES = [
  { id: 'Memorial_Parents', name: { en: 'In Memory of Parents', he: 'לזכר הורים' }, icon: '🕯️' },
  { id: 'Memorial_Spouse', name: { en: 'In Memory of Spouse', he: 'לזכר בן/בת זוג' }, icon: '💑' },
  { id: 'Memorial_Child', name: { en: 'In Memory of Child', he: 'לזכר ילד' }, icon: '🌟' },
  { id: 'Memorial_Sibling', name: { en: 'In Memory of Sibling', he: 'לזכר אח/אחות' }, icon: '👫' },
  { id: 'Memorial_Soldier', name: { en: 'Fallen Soldier', he: 'חלל צה"ל' }, icon: '🎖️' },
  { id: 'Memorial_Holocaust', name: { en: 'Holocaust Memory', he: 'זיכרון השואה' }, icon: '✡️' },
  { id: 'Memorial_Community', name: { en: 'Community Memorial', he: 'הנצחה קהילתית' }, icon: '🤝' },
  { id: 'TrueStory_Growth', name: { en: 'Personal Growth', he: 'צמיחה אישית' }, icon: '🌱' },
  { id: 'TrueStory_Childhood', name: { en: 'Childhood Memories', he: 'זיכרונות ילדות' }, icon: '💎' },
];

const CATEGORY_KEYS = Object.keys(BASE_CATEGORIES);

// Quick filter pills with emoji icons for visual browsing
const QUICK_FILTER_PILLS = [
  { id: 'All', icon: '📚', label: { en: 'All', he: 'הכל' } },
  { id: 'life_story', icon: '📖', label: { en: 'Life Stories', he: 'סיפורי חיים' } },
  { id: 'tribute', icon: '🕯️', label: { en: 'Memorial', he: 'הנצחה' } },
  { id: 'family_legacy', icon: '👨‍👩‍👧‍👦', label: { en: 'Family', he: 'משפחה' } },
  { id: 'shared_memories', icon: '🎁', label: { en: 'Gifts', he: 'מתנות' } },
  { id: 'testimony', icon: '✈️', label: { en: 'Travel', he: 'מסעות' } },
];

// Israeli-specific categories for Hebrew users (with trauma-informed design)
const ISRAELI_CATEGORIES = [
  { id: 'October7', name: 'אירועי השבעה באוקטובר', icon: 'candle', hasSubcategories: true, isMemorial: true, image: '/img-isr/ארועי השבעה באוקטובר - קטגוריה ראשית.png' },
  { id: 'IsraelWars', name: 'מלחמות ישראל', icon: 'shield', hasSubcategories: true, image: '/img-isr/מלחמות ישראל - קטגוריה ראשית.png' },
  { id: 'HolocaustSurvivors', name: 'סיפורי ניצולי שואה', icon: 'users', hasSubcategories: true, isMemorial: true, image: '/img-isr/סיפורי ניצולי שואה - קטגוריה ראשית.png' },
];

// October 7th subcategories - trauma-informed taxonomy
const OCTOBER7_SUBCATEGORIES = [
  { id: 'October7_Hostages', name: 'סיפורי חטופים ושבים', icon: 'heart', image: '/img-isr/סיפורי חטופים ושבים.png' },
  { id: 'October7_Soldiers', name: 'סיפורי לוחמים וחיילים', icon: 'shield', image: '/img-isr/סיפורי לוחמים וחיילים.png' },
  { id: 'October7_BereavedFamilies', name: 'משפחות שכולות', icon: 'candle', image: '/img-isr/משפחות שכולות.png' },
  { id: 'October7_HostageFamilies', name: 'משפחות החטופים', icon: 'heart', image: '/img-isr/משפחות החטופים.png' },
  { id: 'October7_MissingFamilies', name: 'משפחות נעדרים', icon: 'search', image: '/img-isr/משפחות נעדרים.png' },
  { id: 'October7_EvacuatedCommunities', name: 'קהילות מפונות', icon: 'home', image: '/img-isr/קהילות מפונות.png' },
  { id: 'October7_Rescue', name: 'חילוץ והצלה', icon: 'first-aid', image: '/img-isr/חילוץ והצלה.png' },
  { id: 'October7_CommunityResilience', name: 'חוסן קהילתי והתנדבות', icon: 'hands', image: '/img-isr/חוסן קהילתי והתנדבות.png' },
  { id: 'October7_Memorial', name: 'הנצחה וזיכרון', icon: 'candle', image: '/img-isr/הנצחה וזיכרון.png' },
];

// Subcategories for Israel Wars
const ISRAEL_WARS_SUBCATEGORIES = [
  { id: 'IsraelWars_Independence', name: 'מלחמת העצמאות', icon: 'flag', image: '/img-isr/מלחמת העצמאות.png' },
  { id: 'IsraelWars_SixDay', name: 'מלחמת ששת הימים', icon: 'star', image: '/img-isr/מלחמת ששת הימים.png' },
  { id: 'IsraelWars_YomKippur', name: 'מלחמת יום כיפור', icon: 'shield', image: '/img-isr/מלחמת יום כיפור.png' },
  { id: 'IsraelWars_Lebanon', name: 'מלחמות לבנון', icon: 'shield', image: '/img-isr/מלחמות לבנון.png' },
  { id: 'IsraelWars_Operations', name: 'מבצעים צבאיים', icon: 'target', image: '/img-isr/מבצעים צבאיים.png' },
  { id: 'IsraelWars_IDF', name: 'סיפורי צה"ל', icon: 'shield', image: '/img-isr/סיפורי צהל.png' },
  { id: 'IsraelWars_Memorial', name: 'הנצחה וזיכרון', icon: 'candle', image: '/img-isr/הנצחה וזיכרון - צהל.png' },
];

// Subcategories for Holocaust Survivors
const HOLOCAUST_SUBCATEGORIES = [
  { id: 'Holocaust_Testimonies', name: 'עדויות', icon: 'mic', image: '/img-isr/עדויות.png' },
  { id: 'Holocaust_Survival', name: 'סיפורי הישרדות', icon: 'heart', image: '/img-isr/סיפורי הישרדות.png' },
  { id: 'Holocaust_Families', name: 'סיפורי משפחות', icon: 'users', image: '/img-isr/סיפורי משפחות.png' },
  { id: 'Holocaust_Children', name: 'ילדי השואה', icon: 'child', image: '/img-isr/סיפורי משפחות.png' },
  { id: 'Holocaust_SecondGen', name: 'דור שני ושלישי', icon: 'generations', image: '/img-isr/דור שני ושלישי.png' },
  { id: 'Holocaust_Heritage', name: 'מורשת וזיכרון', icon: 'candle', image: '/img-isr/מורשת וזיכרון.png' },
];

export default function MarketplacePage() {
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedIsraeliCategory, setExpandedIsraeliCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState('All');

  // Featured book: pick the highest-rated published book, or just the first one
  const featuredBook = useMemo(() => {
    if (books.length === 0) return null;
    const sorted = [...books].sort((a, b) => {
      const rA = a.qualityScore?.rating ?? a.qualityScore?.overallScore ?? 0;
      const rB = b.qualityScore?.rating ?? b.qualityScore?.overallScore ?? 0;
      return rB - rA;
    });
    return sorted[0];
  }, [books]);

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

  // Get image for Israeli category or subcategory
  const getIsraeliCategoryImage = (categoryId: string): string | null => {
    // Check main categories
    const mainCategory = ISRAELI_CATEGORIES.find(c => c.id === categoryId);
    if (mainCategory?.image) return encodeURI(mainCategory.image);

    // Check subcategories
    const allSubcategories = [...OCTOBER7_SUBCATEGORIES, ...ISRAEL_WARS_SUBCATEGORIES, ...HOLOCAUST_SUBCATEGORIES];
    const subcategory = allSubcategories.find(s => s.id === categoryId);
    if (subcategory?.image) return encodeURI(subcategory.image);

    // Return parent category image if subcategory selected
    if (categoryId.startsWith('October7_')) {
      return encodeURI(ISRAELI_CATEGORIES[0].image);
    }
    if (categoryId.startsWith('IsraelWars_')) {
      return encodeURI(ISRAELI_CATEGORIES[1].image);
    }
    if (categoryId.startsWith('Holocaust_')) {
      return encodeURI(ISRAELI_CATEGORIES[2].image);
    }

    return null;
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
    const cd = book.coverDesign;
    const imageUrl = cd?.front?.imageUrl || cd?.imageUrl;
    if (imageUrl) {
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }

    const gradientColors = cd?.front?.gradientColors || cd?.gradientColors;
    if (gradientColors && gradientColors.length > 0) {
      return {
        background: `linear-gradient(135deg, ${gradientColors.join(', ')})`,
      };
    }

    const backgroundColor = cd?.front?.backgroundColor || cd?.backgroundColor || cd?.coverColor;
    if (backgroundColor) {
      return {
        backgroundColor,
      };
    }

    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    };
  };

  return (
    <div className="min-h-screen relative">
      <SEO
        title="Book Marketplace | MeStory"
        description="Discover amazing books from talented authors. Browse, read, and purchase unique stories across all genres in the MeStory marketplace."
        type="website"
        locale={language === 'he' ? 'he_IL' : 'en_US'}
        url="/marketplace"
      />
      <CollectionPageSchema
        name={language === 'he' ? 'חנות הספרים של MeStory' : 'MeStory Book Marketplace'}
        description={language === 'he'
          ? 'גלו ספרים מקוריים מסופרים ישראלים — ספרי הנצחה, אוטוביוגרפיה, רומנים וספרי ילדים.'
          : 'Browse original books from Israeli authors — memorial books, autobiographies, novels, and children\u2019s books.'}
        url="https://mestory-ai.com/marketplace"
        inLanguage={language === 'he' ? 'he' : 'en'}
      />
      <BreadcrumbSchema
        items={[
          { name: language === 'he' ? 'ראשי' : 'Home', url: 'https://mestory-ai.com/' },
          { name: language === 'he' ? 'חנות הספרים' : 'Marketplace', url: 'https://mestory-ai.com/marketplace' },
        ]}
      />

      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8">
        {/* Background Image */}
        <div className="absolute inset-0">
          <OptimizedImage
            src={marketplaceHero}
            alt=""
            decorative
            lazy={false}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-space/80 via-deep-space/70 to-deep-space" />
        </div>
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
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-memorial-gold" />
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
              <span className="text-memorial-gold">{t('marketplace.hero.highlight')}</span>
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
                showClearButton={true}
                onClear={() => setSearchQuery('')}
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
        {/* Featured Books - Editor's Choice */}
        <FeaturedBooks limit={4} title={t('marketplace.sections.editors_choice')} />

        {/* Trending Books */}
        <TrendingBooks limit={6} title={t('marketplace.sections.trending')} />

        {/* === Featured Story Hero === */}
        {featuredBook && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-10 sm:mb-14"
          >
            <div
              className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
              style={{ minHeight: '280px' }}
            >
              {/* Parallax-like gradient background */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                }}
              />
              {/* Cover image as subtle background (parallax feel) */}
              {featuredBook.coverDesign?.front?.imageUrl && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `url(${featuredBook.coverDesign.front.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                  }}
                />
              )}
              {/* Glass overlay */}
              <div className="absolute inset-0 backdrop-blur-sm bg-black/30" />
              {/* Gold accent border */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-memorial-gold/30 shadow-[0_0_40px_rgba(218,165,32,0.15)]" />

              {/* Content */}
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-8 md:p-10">
                {/* Large cover image */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex-shrink-0"
                >
                  <div
                    className="w-36 h-52 sm:w-44 sm:h-64 md:w-48 md:h-72 rounded-xl shadow-2xl overflow-hidden ring-2 ring-memorial-gold/40"
                    style={{
                      ...getBookCoverStyle(featuredBook),
                      transform: 'perspective(800px) rotateY(-5deg)',
                      transition: 'transform 0.4s ease',
                    }}
                  >
                    {/* Title overlay on cover */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <span className="text-white text-sm font-bold drop-shadow-lg">{featuredBook.title}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Info */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex-1 text-center md:text-start"
                >
                  <span className="inline-block px-3 py-1 mb-3 bg-memorial-gold/20 text-memorial-gold text-xs sm:text-sm font-semibold rounded-full border border-memorial-gold/30">
                    <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                    {language === 'he' ? 'הסיפור המומלץ' : 'Featured Story'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-2 leading-tight">
                    {featuredBook.title}
                  </h2>
                  <div className="flex items-center gap-2 justify-center md:justify-start text-gray-300 text-sm mb-3">
                    <User className="w-4 h-4 text-memorial-gold/70" />
                    <span>{featuredBook.author.name}</span>
                    {featuredBook.qualityScore?.rating != null && (
                      <>
                        <span className="text-gray-600">|</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-yellow-300">{featuredBook.qualityScore.rating.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                  {featuredBook.description && (
                    <p className="text-gray-300 text-sm sm:text-base line-clamp-3 mb-5 max-w-xl">
                      {featuredBook.description}
                    </p>
                  )}
                  <GlowingButton
                    variant="gold"
                    size="lg"
                    onClick={() => { window.location.href = `/book/${featuredBook._id}`; }}
                  >
                    <Eye className="w-5 h-5" />
                    {language === 'he' ? 'קרא עכשיו' : 'Read Now'}
                    <ChevronRight className="w-4 h-4" />
                  </GlowingButton>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* === Category Filter Pills with Icons === */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6 sm:mb-8"
        >
          <div
            className="flex items-center gap-2 sm:gap-3 pb-3 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {QUICK_FILTER_PILLS.map((pill) => {
              const isActive = quickFilter === pill.id;
              return (
                <motion.button
                  key={pill.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setQuickFilter(pill.id);
                    setSelectedCategory(pill.id);
                    setExpandedIsraeliCategory(null);
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium whitespace-nowrap text-sm sm:text-base transition-all duration-300 border ${
                    isActive
                      ? 'bg-memorial-gold/20 text-memorial-gold border-memorial-gold/50 shadow-[0_0_16px_rgba(218,165,32,0.25)]'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg">{pill.icon}</span>
                  <span>{pill.label[language]}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Glowing Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 sm:mb-12"
        >
          {/* Base Categories */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-4 -mx-3 px-3 sm:mx-0 sm:px-0">
            {CATEGORY_KEYS.map((categoryKey, index) => (
              <motion.button
                key={categoryKey}
                onClick={() => {
                  setSelectedCategory(categoryKey);
                  setExpandedIsraeliCategory(null);
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`relative px-3 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium whitespace-nowrap text-sm sm:text-base ${
                  categoryKey === 'TrueStory' ? 'ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : ''
                }`}
              >
                {/* Special glow for TrueStory */}
                {categoryKey === 'TrueStory' && selectedCategory !== 'TrueStory' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20"
                    style={{ zIndex: 0 }}
                    animate={{
                      boxShadow: ['0 0 10px rgba(251,191,36,0.3)', '0 0 20px rgba(251,191,36,0.5)', '0 0 10px rgba(251,191,36,0.3)']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Sliding pill background for active tab */}
                {selectedCategory === categoryKey && !expandedIsraeliCategory && (
                  <motion.div
                    layoutId="activeCategoryIndicator"
                    className={`absolute inset-0 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)] ${
                      categoryKey === 'TrueStory'
                        ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
                        : 'bg-gradient-to-r from-purple-600/90 to-amber-500/90'
                    }`}
                    style={{ zIndex: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}

                {/* Hover glow effect for inactive tabs */}
                {selectedCategory !== categoryKey && categoryKey !== 'TrueStory' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white/0 hover:bg-white/10 transition-colors duration-200"
                    style={{ zIndex: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  />
                )}

                {/* Tab text - always on top */}
                <span
                  className={`relative font-semibold transition-colors duration-200 flex items-center gap-1.5 ${
                    selectedCategory === categoryKey && !expandedIsraeliCategory
                      ? 'text-white drop-shadow-md'
                      : categoryKey === 'TrueStory'
                        ? 'text-amber-300 hover:text-amber-200'
                        : 'text-gray-400 hover:text-gray-200'
                  }`}
                  style={{ zIndex: 10 }}
                >
                  {categoryKey === 'TrueStory' && <span>✨</span>}
                  {BASE_CATEGORIES[categoryKey][language]}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Israeli Memorial Categories Section (Hebrew only, when True Story is selected) */}
          {isHebrew && (selectedCategory === 'TrueStory' || selectedCategory.startsWith('TrueStory_')) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 mb-4"
            >
              {/* Section header with emotional styling */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                <div className="text-center">
                  <span className="text-amber-300 text-lg font-medium flex items-center gap-2 justify-center">
                    <span className="text-2xl">🕯️</span>
                    סיפורים ישראליים
                  </span>
                  <p className="text-gray-400 text-xs mt-1">לזכור, להנציח, לספר</p>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              </div>

              {/* Israeli Categories - Large Visual Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {ISRAELI_CATEGORIES.map((category, index) => (
                  <motion.button
                    key={category.id}
                    onClick={() => handleIsraeliCategoryClick(category.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden rounded-2xl aspect-[16/9] sm:aspect-[4/3] group transition-all duration-400 ${
                      selectedCategory === category.id || expandedIsraeliCategory === category.id
                        ? 'ring-2 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
                        : 'ring-1 ring-white/10 hover:ring-amber-400/50 shadow-lg'
                    }`}
                  >
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${encodeURI(category.image)})` }}
                    />

                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 transition-all duration-400 ${
                      selectedCategory === category.id || expandedIsraeliCategory === category.id
                        ? 'bg-gradient-to-t from-amber-900/95 via-black/60 to-black/20'
                        : 'bg-gradient-to-t from-black/90 via-black/50 to-black/10 group-hover:from-amber-900/80'
                    }`} />

                    {/* Memorial candle effect for memorial categories */}
                    {category.isMemorial && (
                      <div className="absolute top-3 right-3 text-2xl opacity-80">
                        <motion.span
                          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          🕯️
                        </motion.span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
                      <h3 className={`text-lg sm:text-xl font-bold text-right leading-tight transition-colors duration-300 ${
                        selectedCategory === category.id || expandedIsraeliCategory === category.id
                          ? 'text-amber-200'
                          : 'text-white group-hover:text-amber-100'
                      }`}>
                        {category.name}
                      </h3>
                      <p className="text-gray-300 text-xs sm:text-sm text-right mt-1 opacity-80">
                        {category.id === 'October7' && 'סיפורי גבורה, כאב ותקווה'}
                        {category.id === 'IsraelWars' && 'סיפורי לוחמים ומשפחות'}
                        {category.id === 'HolocaustSurvivors' && 'עדויות וזיכרונות מהשואה'}
                      </p>

                      {/* Expand indicator */}
                      <div className={`flex items-center justify-end gap-2 mt-2 text-xs transition-colors duration-300 ${
                        expandedIsraeliCategory === category.id ? 'text-amber-300' : 'text-gray-400'
                      }`}>
                        <span>{expandedIsraeliCategory === category.id ? 'סגור' : 'הצג נושאים'}</span>
                        <motion.span
                          animate={{ rotate: expandedIsraeliCategory === category.id ? 180 : 0 }}
                        >
                          ▼
                        </motion.span>
                      </div>
                    </div>

                    {/* Selected indicator */}
                    {(selectedCategory === category.id || expandedIsraeliCategory === category.id) && (
                      <div className="absolute top-3 left-3">
                        <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.7)]" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Subcategories (expandable) - Visual Image Grid */}
              <AnimatePresence>
                {expandedIsraeliCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-amber-500/25 backdrop-blur-sm" dir="rtl">
                      {/* Subcategory section title */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-amber-300/80 text-sm font-medium">
                          {expandedIsraeliCategory === 'October7' && 'נושאים באירועי השבעה באוקטובר'}
                          {expandedIsraeliCategory === 'IsraelWars' && 'נושאים במלחמות ישראל'}
                          {expandedIsraeliCategory === 'HolocaustSurvivors' && 'נושאים בסיפורי ניצולי שואה'}
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {getSubcategories(expandedIsraeliCategory).map((sub, index) => (
                          <motion.button
                            key={sub.id}
                            onClick={() => setSelectedCategory(sub.id)}
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.04, duration: 0.3 }}
                            whileHover={{ scale: 1.04, y: -4 }}
                            whileTap={{ scale: 0.97 }}
                            className={`relative overflow-hidden rounded-xl aspect-[4/3] group transition-all duration-300 ${
                              selectedCategory === sub.id
                                ? 'ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
                                : 'ring-1 ring-white/15 hover:ring-amber-400/60 shadow-md'
                            }`}
                          >
                            {/* Background Image */}
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-600 group-hover:scale-115"
                              style={{ backgroundImage: `url(${encodeURI(sub.image)})` }}
                            />

                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 transition-all duration-300 ${
                              selectedCategory === sub.id
                                ? 'bg-gradient-to-t from-amber-900/95 via-black/55 to-transparent'
                                : 'bg-gradient-to-t from-black/85 via-black/45 to-transparent group-hover:from-amber-900/75'
                            }`} />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-3">
                              <span className={`text-sm font-semibold text-right leading-tight transition-colors duration-300 drop-shadow-lg ${
                                selectedCategory === sub.id ? 'text-amber-200' : 'text-white group-hover:text-amber-100'
                              }`}>
                                {sub.name}
                              </span>
                            </div>

                            {/* Selected indicator */}
                            {selectedCategory === sub.id && (
                              <div className="absolute top-2 left-2">
                                <motion.div
                                  className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.7)]"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                />
                              </div>
                            )}
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

        {/* TRUE STORY - Premium Hero Banner */}
        {(selectedCategory === 'TrueStory' || selectedCategory.startsWith('TrueStory_')) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="mb-12 relative overflow-hidden"
          >
            <div
              className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl bg-cover bg-center shadow-2xl"
              style={{
                backgroundImage: `url(${genreBanners['TrueStory']})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Premium Golden Border */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.3)]" />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-deep-space/90 via-deep-space/70 to-transparent rounded-2xl" />

              {/* Animated Particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-amber-400/60 rounded-full"
                    style={{
                      left: `${10 + i * 12}%`,
                      top: `${20 + (i % 3) * 30}%`,
                    }}
                    animate={{
                      y: [-20, 20, -20],
                      opacity: [0.3, 0.8, 0.3],
                      scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 4 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-center p-6 sm:p-8 md:p-12 max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-2"
                >
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-semibold rounded-full border border-amber-400/30">
                    ✨ {language === 'he' ? 'הקטגוריה המובילה' : 'Featured Category'}
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {language === 'he' ? 'מבוסס על סיפור אמיתי' : 'Based on a True Story'}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-base sm:text-lg md:text-xl text-gray-200 font-light mb-6 leading-relaxed"
                >
                  {language === 'he'
                    ? 'לכל אחד יש סיפור. זה המקום לספר את שלך. שתף את החוויות, הרגעים והמסע שעיצבו את מי שאתה היום.'
                    : 'Everyone has a story. This is the place to tell yours. Share the experiences, moments, and journey that shaped who you are today.'}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-wrap gap-3"
                >
                  <a
                    href="/dashboard"
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-full hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all duration-300 flex items-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    {language === 'he' ? 'התחל לכתוב את הסיפור שלך' : 'Start Writing Your Story'}
                  </a>
                </motion.div>
              </div>
            </div>

            {/* Personal Story Categories - Subtle Tags */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-6 flex flex-wrap gap-2 justify-center"
              dir={language === 'he' ? 'rtl' : 'ltr'}
            >
              {TRUE_STORY_SUBCATEGORIES.map((sub, index) => (
                <motion.button
                  key={sub.id}
                  onClick={() => setSelectedCategory(sub.id)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.85 + index * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 flex items-center gap-1.5 ${
                    selectedCategory === sub.id
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                      : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-amber-500/20 hover:text-amber-200 hover:border-amber-400/40'
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.name[language]}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}

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
                backgroundImage: `url(${genreBanners['Fantasy']})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Glowing Border */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-memorial-gold/30 shadow-glow-gold" />

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
                    <Sparkles className="w-6 h-6 text-memorial-gold" />
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
                    className="absolute w-1 h-1 bg-memorial-gold rounded-full"
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
                backgroundImage: `url(${genreBanners['Sci-Fi']})`,
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
              className="relative w-full h-48 md:h-56 lg:h-64 rounded-2xl shadow-2xl bg-cover bg-center"
              style={{
                backgroundImage: `url(${getIsraeliCategoryImage(selectedCategory) || getIsraeliCategoryImage('October7')})`,
              }}
            >
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 rounded-2xl" />

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
              className="relative w-full h-48 md:h-56 lg:h-64 rounded-2xl shadow-2xl bg-cover bg-center"
              style={{
                backgroundImage: `url(${getIsraeliCategoryImage(selectedCategory) || getIsraeliCategoryImage('HolocaustSurvivors')})`,
              }}
            >
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 rounded-2xl" />

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
              className="relative w-full h-48 md:h-56 lg:h-64 rounded-2xl shadow-2xl bg-cover bg-center"
              style={{
                backgroundImage: `url(${getIsraeliCategoryImage(selectedCategory) || getIsraeliCategoryImage('IsraelWars')})`,
              }}
            >
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 rounded-2xl" />

              {/* Subtle border */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-blue-500/20" />

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
                backgroundImage: `url(${genreBanners['Mystery']})`,
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

        {/* Dynamic Banner for Other Categories */}
        {selectedCategory !== 'All' &&
         selectedCategory !== 'Fantasy' &&
         selectedCategory !== 'Sci-Fi' &&
         selectedCategory !== 'Mystery' &&
         genreBanners[selectedCategory] && (
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
                backgroundImage: `url(${genreBanners[selectedCategory]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Glowing Border */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-memorial-gold/30 shadow-lg" />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-deep-space/95 via-deep-space/50 to-transparent rounded-2xl" />

              {/* Category Title */}
              <div className="relative z-10 h-full flex items-end p-4 sm:p-6 md:p-8">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold gradient-gold mb-2"
                  >
                    {BASE_CATEGORIES[selectedCategory]?.[language] || selectedCategory}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl"
                  >
                    {language === 'he'
                      ? `גלה ספרי ${BASE_CATEGORIES[selectedCategory]?.he || selectedCategory} מדהימים`
                      : `Discover amazing ${selectedCategory} books`}
                  </motion.p>
                </div>
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
            {books.length} <span className="text-memorial-gold">{t('marketplace.results.stellar')}</span>{' '}
            {books.length === 1 ? t('marketplace.results.count_singular', { count: books.length }).split(' ').slice(-2).join(' ') : t('marketplace.results.count_plural', { count: books.length }).split(' ').slice(-2).join(' ')}
          </motion.p>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <span className="text-gray-400 text-xs sm:text-sm font-medium">{t('marketplace.sort.label')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={t('marketplace.sort.label')}
              className="flex-1 sm:flex-none rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-memorial-gold text-white cursor-pointer"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 sm:py-32"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-memorial-gold/10 to-yellow-600/5 border border-memorial-gold/20 flex items-center justify-center">
              {searchQuery ? (
                <Search className="w-10 h-10 text-memorial-gold/50" />
              ) : (
                <BookOpen className="w-10 h-10 text-memorial-gold/50" />
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-300 mb-3">
              {searchQuery
                ? t('marketplace.empty.search_title', `אין תוצאות עבור "${searchQuery}"`)
                : t('marketplace.empty.title')}
            </h3>
            <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? t('marketplace.empty.search_subtitle', 'נסו מילות חיפוש אחרות או עיינו בכל הספרים')
                : t('marketplace.empty.subtitle')}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-6 px-5 py-2.5 rounded-xl bg-memorial-gold/10 border border-memorial-gold/30 text-memorial-gold text-sm font-medium hover:bg-memorial-gold/20 transition-all"
              >
                {t('marketplace.empty.clear_search', 'נקה חיפוש')}
              </button>
            )}
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
                className="card-3d-hover"
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

                  {/* Book Cover with 2:3 Aspect Ratio + 3D Perspective */}
                  <div className="relative mb-2 sm:mb-4 rounded-lg overflow-hidden group/cover">
                    <div
                      className="aspect-[2/3] relative transition-all duration-400 ease-out"
                      style={{
                        ...getBookCoverStyle(book),
                        transform: hoveredBook === book._id
                          ? 'perspective(800px) rotateY(0deg) translateZ(10px)'
                          : 'perspective(800px) rotateY(-5deg)',
                        boxShadow: hoveredBook === book._id
                          ? '0 25px 50px rgba(0,0,0,0.4), 0 0 30px rgba(218,165,32,0.15)'
                          : '0 10px 30px rgba(0,0,0,0.3)',
                        transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                      }}
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
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-memorial-gold/30 to-yellow-600/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {book.author.profile?.avatar ? (
                          <OptimizedImage
                            src={book.author.profile.avatar}
                            alt={getAuthorProfileAlt(book.author.name)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-memorial-gold/70" />
                        )}
                      </div>
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
                        <div className="flex items-center gap-0.5 sm:gap-1 text-memorial-gold font-bold text-sm sm:text-lg">
                          <span>{formatCurrency(book.publishingStatus.price)}</span>
                        </div>
                      )}

                      {/* Rating */}
                      {book.qualityScore?.rating != null && (
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
