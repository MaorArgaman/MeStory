import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, ChevronRight, Star, Eye, Flame } from 'lucide-react';
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
}

interface PromotedBook {
  book: Book;
  promotionScore: number;
  promotionReasons: string[];
  badges: string[];
}

interface TrendingBooksProps {
  limit?: number;
  title?: string;
}

export default function TrendingBooks({
  limit = 6,
  title = 'טרנדינג עכשיו',
}: TrendingBooksProps) {
  const [books, setBooks] = useState<PromotedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const response = await api.get('/promotions/trending', {
          params: { limit },
        });

        if (response.data.success) {
          setBooks(response.data.data.books);
        }
      } catch (err) {
        console.error('Failed to fetch trending books:', err);
        setError('Failed to load trending books');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
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
      background: 'linear-gradient(135deg, #ff6b35 0%, #f7c59f 50%, #2ec4b6 100%)',
    };
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-orange-400" />
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white/5 rounded-xl aspect-[2/3]"
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
          <TrendingUp className="w-6 h-6 text-orange-400" />
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
        </div>
        <Link
          to="/marketplace?sort=trending"
          className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors text-sm"
        >
          הצג הכל
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {books.slice(0, limit).map((item, index) => (
          <motion.div
            key={item.book._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={`/book/${item.book._id}`}>
              <GlassCard hover className="p-0 overflow-hidden group relative">
                {/* Rank Badge */}
                <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {index + 1}
                </div>

                {/* Cover Image */}
                <div
                  className="aspect-[2/3] relative overflow-hidden"
                  style={!getCoverUrl(item.book) ? getCoverStyle(item.book) : undefined}
                >
                  {getCoverUrl(item.book) ? (
                    <img
                      src={getCoverUrl(item.book)!}
                      alt={item.book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <span className="text-white/80 text-center text-sm font-bold">
                        {item.book.title}
                      </span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {item.badges.includes('HOT') && (
                      <span className="bg-red-500/90 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Flame className="w-3 h-3" /> HOT
                      </span>
                    )}
                    {item.badges.includes('MASTERPIECE') && (
                      <span className="bg-amber-500/90 text-black text-xs font-bold px-2 py-0.5 rounded">
                        MASTERPIECE
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs line-clamp-2">
                        {item.promotionReasons[0]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-bold text-white text-sm truncate">
                    {item.book.title}
                  </h3>
                  <p className="text-xs text-white/50 truncate">
                    {item.book.author.name}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.book.statistics.views}
                    </span>
                    {item.book.qualityScore && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        {item.book.qualityScore.rating}
                      </span>
                    )}
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
