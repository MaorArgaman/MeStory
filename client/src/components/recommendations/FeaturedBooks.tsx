import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, ChevronRight, Star, Crown } from 'lucide-react';
import api from '../../services/api';
import GlassCard from '../ui/GlassCard';

interface Book {
  _id: string;
  title: string;
  genre: string;
  description?: string;
  author: { _id: string; name: string };
  coverDesign?: {
    front?: {
      imageUrl?: string;
      backgroundColor?: string;
      gradientColors?: string[];
    };
  };
  qualityScore?: { overallScore: number; rating: number };
  statistics: { views: number; purchases: number };
  publishingStatus?: { price: number; isFree: boolean };
}

interface PromotedBook {
  book: Book;
  promotionScore: number;
  promotionReasons: string[];
  badges: string[];
}

interface FeaturedBooksProps {
  limit?: number;
  title?: string;
}

export default function FeaturedBooks({
  limit = 4,
  title = "Editor's Choice",
}: FeaturedBooksProps) {
  const [books, setBooks] = useState<PromotedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const response = await api.get('/promotions/featured', {
          params: { limit },
        });

        if (response.data.success) {
          setBooks(response.data.data.books);
        }
      } catch (err) {
        console.error('Failed to fetch featured books:', err);
        setError('Failed to load featured books');
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, [limit]);

  const getCoverUrl = (book: Book) => {
    if (book.coverDesign?.front?.imageUrl) {
      return book.coverDesign.front.imageUrl;
    }
    return null;
  };

  const getCoverStyle = (book: Book) => {
    if (book.coverDesign?.front?.gradientColors?.length) {
      return {
        background: `linear-gradient(135deg, ${book.coverDesign.front.gradientColors.join(', ')})`,
      };
    }
    if (book.coverDesign?.front?.backgroundColor) {
      return { backgroundColor: book.coverDesign.front.backgroundColor };
    }
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    };
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 mb-6">
          <Award className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white/5 rounded-xl h-[350px]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || books.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <Crown className="w-5 h-5 text-amber-500" />
        </div>
        <Link
          to="/marketplace?filter=featured"
          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors text-sm"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {books.slice(0, limit).map((item, index) => (
          <motion.div
            key={item.book._id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={`/book/${item.book._id}`}>
              <GlassCard
                hover
                glow="gold"
                className="p-0 overflow-hidden group h-full"
              >
                {/* Featured Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Crown className="w-3 h-3" />
                    Featured
                  </div>
                </div>

                {/* Cover Image */}
                <div
                  className="h-48 relative overflow-hidden"
                  style={!getCoverUrl(item.book) ? getCoverStyle(item.book) : undefined}
                >
                  {getCoverUrl(item.book) ? (
                    <img
                      src={getCoverUrl(item.book)!}
                      alt={item.book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <span className="text-white text-center text-lg font-bold">
                        {item.book.title}
                      </span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Quality Score */}
                  {item.book.qualityScore && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-white text-sm font-bold">
                        {item.book.qualityScore.rating}/5
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <span className="text-xs text-purple-400 font-medium">
                    {item.book.genre}
                  </span>
                  <h3 className="font-bold text-white text-lg mt-1 line-clamp-1">
                    {item.book.title}
                  </h3>
                  <p className="text-sm text-white/60 mt-1">
                    by {item.book.author.name}
                  </p>

                  {/* Description */}
                  {item.book.description && (
                    <p className="text-xs text-white/40 mt-3 line-clamp-2">
                      {item.book.description}
                    </p>
                  )}

                  {/* Promotion Reasons */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.promotionReasons.slice(0, 2).map((reason, i) => (
                      <span
                        key={i}
                        className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-bold text-white">
                      {item.book.publishingStatus?.isFree || item.book.publishingStatus?.price === 0
                        ? 'Free'
                        : `$${item.book.publishingStatus?.price}`}
                    </span>
                    <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 rounded-lg text-black font-bold text-sm transition-all">
                      View
                    </button>
                  </div>
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
