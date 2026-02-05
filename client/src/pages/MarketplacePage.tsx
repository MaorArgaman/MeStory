import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Search, Sparkles, Star, DollarSign, User, BookOpen, Eye } from 'lucide-react';
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

const CATEGORIES = [
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

export default function MarketplacePage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);

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
      toast.error('Failed to load marketplace books');
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
      <div className="relative overflow-hidden py-32 px-8">
        {/* Floating Book Icons Background */}
        <div className="absolute inset-0 pointer-events-none">
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
              <BookOpen className="w-16 h-16 text-magic-gold" />
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
            className="text-center mb-12"
          >
            <h1 className="text-7xl font-display font-bold gradient-gold mb-6 majestic-heading">
              Discover Worlds Unseen
            </h1>
            <p className="text-2xl text-gray-300 font-light max-w-3xl mx-auto">
              Explore a universe of stories crafted by visionary authors.
              <br />
              <span className="text-magic-gold">Every book is a portal.</span>
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
            <div className="flex items-center gap-4">
              <NeonInput
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for books, authors, or genres..."
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
                Search
              </GlowingButton>
            </div>
          </motion.form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 pb-20">
        {/* Personalized Recommendation Sections (for logged-in users) */}
        {isAuthenticated() && (
          <div className="mb-12">
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
          className="mb-12"
        >
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {CATEGORIES.map((category, index) => (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`
                  relative px-6 py-3 rounded-xl font-medium whitespace-nowrap
                  transition-all duration-300 group
                  ${
                    selectedCategory === category
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                {/* Glowing background for active tab */}
                {selectedCategory === category && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-gradient-to-r from-magic-gold via-cosmic-purple to-magic-gold rounded-xl"
                    style={{ backgroundSize: '200% 100%' }}
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}

                {/* Hover glow effect */}
                {selectedCategory !== category && (
                  <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                )}

                {/* Tab text */}
                <span className="relative z-10 font-semibold">{category}</span>

                {/* Shimmer effect */}
                {selectedCategory === category && (
                  <motion.div
                    className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                      repeatDelay: 1,
                    }}
                  >
                    <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
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
              <div className="relative z-10 h-full flex items-end p-8">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-6xl font-bold gradient-gold mb-3"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Fantasy Worlds
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-xl text-gray-200 font-light max-w-2xl"
                  >
                    Step into realms of magic, adventure, and wonder. Where dragons soar and heroes rise.
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
              <div className="relative z-10 h-full flex items-end p-8">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Sci-Fi & Cyberworlds
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-xl text-gray-200 font-light max-w-2xl"
                  >
                    Explore distant galaxies, cyberpunk cities, and futures beyond imagination.
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
              <div className="relative z-10 h-full flex items-end p-8">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-transparent mb-3"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Mystery & Thrillers
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-xl text-gray-200 font-light max-w-2xl"
                  >
                    Unravel dark secrets, solve impossible crimes, and face heart-pounding suspense.
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
        <div className="flex items-center justify-between mb-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400 font-medium"
          >
            {books.length} <span className="text-magic-gold">stellar</span>{' '}
            {books.length === 1 ? 'book' : 'books'} discovered
          </motion.p>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg px-4 py-2 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-magic-gold text-white cursor-pointer"
              style={{ backgroundColor: '#1a1a2e' }}
            >
              <option value="createdAt" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Newest First</option>
              <option value="popularity" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Most Popular</option>
              <option value="quality" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Highest Rated</option>
              <option value="price" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-strong rounded-xl p-4 animate-pulse">
                <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-4" />
                <div className="h-4 bg-gray-700 rounded mb-2" />
                <div className="h-3 bg-gray-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32"
          >
            <BookOpen className="w-24 h-24 text-gray-600 mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-display font-semibold text-gray-400 mb-3">
              No Worlds Found
            </h3>
            <p className="text-gray-500 text-lg">
              Try adjusting your search or exploring different categories
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  glow={book.qualityScore?.overallScore >= 90 ? 'gold' : 'cosmic'}
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
                          MASTERPIECE
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Book Cover with 2:3 Aspect Ratio */}
                  <div className="relative mb-4 rounded-lg overflow-hidden group/cover">
                    <div
                      className="aspect-[2/3] relative"
                      style={getBookCoverStyle(book)}
                    >
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Quality Score Badge */}
                      {book.qualityScore && (
                        <div className="absolute top-3 left-3">
                          <div
                            className={`
                              w-14 h-14 rounded-full flex items-center justify-center
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
                              <div className="text-lg leading-none">
                                {book.qualityScore.overallScore}
                              </div>
                              <div className="text-[8px] opacity-80">SCORE</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Book Title on Cover */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-display font-bold text-white text-xl line-clamp-2 drop-shadow-lg">
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
                              Quick Preview
                            </GlowingButton>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 flex flex-col">
                    {/* Author */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <User className="w-4 h-4" />
                      <span className="truncate">{book.author.name}</span>
                    </div>

                    {/* Description */}
                    {book.description && (
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                        {book.description}
                      </p>
                    )}

                    {/* Price and Rating */}
                    <div className="flex items-center justify-between mb-4">
                      {/* Price */}
                      {book.publishingStatus.isFree ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold border border-green-500/40">
                          FREE
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-magic-gold font-bold text-lg">
                          <DollarSign className="w-5 h-5" />
                          <span>{book.publishingStatus.price.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Rating */}
                      {book.qualityScore && (
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-bold text-white">
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
                    >
                      View Details
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
