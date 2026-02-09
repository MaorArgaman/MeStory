import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PenLine, Clock, ChevronRight, FileText } from 'lucide-react';
import api from '../../services/api';
import GlassCard from '../ui/GlassCard';

interface Book {
  _id: string;
  title: string;
  genre: string;
  coverDesign?: {
    front?: {
      imageUrl?: string;
      backgroundColor?: string;
      gradientColors?: string[];
    };
  };
  statistics?: { wordCount: number };
}

interface WritingProgress {
  book: Book;
  lastEditedAt: string;
  wordCount: number;
}

interface ContinueWritingProps {
  limit?: number;
  title?: string;
  showIfEmpty?: boolean;
}

export default function ContinueWriting({
  limit = 4,
  title = 'Continue Writing',
  showIfEmpty = false,
}: ContinueWritingProps) {
  const [drafts, setDrafts] = useState<WritingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/recommendations/progress-details');

        if (response.data.success) {
          setDrafts(response.data.data.continueWriting || []);
        }
      } catch (err) {
        console.error('Failed to fetch writing progress:', err);
        setError('Failed to load writing progress');
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []);

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
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
    };
  };

  const formatLastEdited = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US');
  };

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-2 mb-4">
          <PenLine className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white/5 rounded-xl min-w-[200px] h-[200px]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || (drafts.length === 0 && !showIfEmpty)) {
    return null;
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        {drafts.length > limit && (
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors text-sm"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {drafts.length === 0 ? (
        <GlassCard hover={false} className="text-center py-8">
          <PenLine className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/60">No active drafts</p>
          <Link
            to="/dashboard"
            className="text-amber-400 hover:text-amber-300 text-sm mt-2 inline-block"
          >
            Start a new book
          </Link>
        </GlassCard>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
          {drafts.slice(0, limit).map((item, index) => (
            <motion.div
              key={item.book._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="min-w-[200px] flex-shrink-0"
            >
              <Link to={`/write/${item.book._id}`}>
                <GlassCard hover glow="gold" className="p-0 overflow-hidden">
                  {/* Cover */}
                  <div
                    className="h-32 relative"
                    style={!getCoverUrl(item.book) ? getCoverStyle(item.book) : undefined}
                  >
                    {getCoverUrl(item.book) ? (
                      <img
                        src={getCoverUrl(item.book)!}
                        alt={item.book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <span className="text-white/80 text-center text-sm font-bold">
                          {item.book.title}
                        </span>
                      </div>
                    )}

                    {/* Draft Badge */}
                    <div className="absolute top-2 left-2 bg-amber-500/90 text-black text-xs font-bold px-2 py-0.5 rounded">
                      Draft
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-white text-sm truncate">
                      {item.book.title}
                    </h3>
                    <p className="text-xs text-white/50">{item.book.genre}</p>

                    {/* Stats */}
                    <div className="flex items-center justify-between mt-2 text-xs text-white/40">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{formatWordCount(item.wordCount)} words</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatLastEdited(item.lastEditedAt)}</span>
                      </div>
                    </div>

                    {/* Continue Button */}
                    <button className="w-full mt-3 py-2 bg-amber-600/50 hover:bg-amber-600 rounded-lg text-white text-sm font-medium transition-colors">
                      Continue Writing
                    </button>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
