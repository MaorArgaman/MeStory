import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, Star, Eye } from 'lucide-react';
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

interface RecommendationWithReason {
  book: Book;
  score: number;
  reasons: string[];
  category: string;
}

interface RecommendedForYouProps {
  limit?: number;
  showReasons?: boolean;
  title?: string;
}

export default function RecommendedForYou({
  limit = 8,
  showReasons = true,
  title = 'Recommended For You',
}: RecommendedForYouProps) {
  const [recommendations, setRecommendations] = useState<RecommendationWithReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await api.get('/recommendations/ml', {
          params: { limit },
        });

        if (response.data.success) {
          setRecommendations(response.data.data.recommendations);
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
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
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    };
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white/5 rounded-xl aspect-[2/3]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <Link
          to="/marketplace"
          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors text-sm"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {recommendations.slice(0, limit).map((rec, index) => (
          <motion.div
            key={rec.book._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={`/book/${rec.book._id}`}>
              <GlassCard hover glow="gold" className="p-0 overflow-hidden group">
                {/* Cover Image */}
                <div
                  className="aspect-[2/3] relative overflow-hidden"
                  style={!getCoverUrl(rec.book) ? getCoverStyle(rec.book) : undefined}
                >
                  {getCoverUrl(rec.book) ? (
                    <img
                      src={getCoverUrl(rec.book)!}
                      alt={rec.book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <span className="text-white/80 text-center text-lg font-bold">
                        {rec.book.title}
                      </span>
                    </div>
                  )}

                  {/* Quality Badge */}
                  {rec.book.qualityScore && rec.book.qualityScore.overallScore >= 80 && (
                    <div className="absolute top-2 right-2 bg-amber-500/90 text-black text-xs font-bold px-2 py-1 rounded">
                      {rec.book.qualityScore.overallScore >= 90 ? 'MASTERPIECE' : 'EXCELLENT'}
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-white truncate">{rec.book.title}</h3>
                  <p className="text-sm text-white/60 truncate">{rec.book.author.name}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {rec.book.statistics.views}
                    </span>
                    {rec.book.qualityScore && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        {rec.book.qualityScore.rating}
                      </span>
                    )}
                  </div>

                  {/* Reasons */}
                  {showReasons && rec.reasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rec.reasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
