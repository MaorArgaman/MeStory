import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import GlassCard from '../ui/GlassCard';

interface Book {
  _id: string;
  title: string;
  genre: string;
  author: { _id: string; name: string };
  coverDesign?: {
    front?: {
      imageUrl?: string;
      backgroundColor?: string;
      gradientColors?: string[];
    };
  };
  chapters?: Array<{ title: string }>;
}

interface ReadingProgress {
  book: Book;
  progress: number;
  lastReadAt: string;
}

interface ContinueReadingProps {
  limit?: number;
  title?: string;
  showIfEmpty?: boolean;
}

export default function ContinueReading({
  limit = 4,
  title = 'Continue Reading',
  showIfEmpty = false,
}: ContinueReadingProps) {
  const [books, setBooks] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const response = await api.get('/recommendations/progress-details');

        if (response.data.success) {
          setBooks(response.data.data.continueReading || []);
        }
      } catch (err) {
        console.error('Failed to fetch reading progress:', err);
        setError('Failed to load reading progress');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
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
      background: 'linear-gradient(135deg, #2d1b4e 0%, #1a0a2e 100%)',
    };
  };

  const formatLastRead = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US');
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white/5 rounded-xl min-w-[200px] h-[280px]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || (books.length === 0 && !showIfEmpty)) {
    return null;
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        {books.length > limit && (
          <Link
            to="/library"
            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors text-sm"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {books.length === 0 ? (
        <GlassCard hover={false} className="text-center py-8">
          <BookOpen className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/60">No books in progress</p>
          <Link
            to="/marketplace"
            className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block"
          >
            Discover new books
          </Link>
        </GlassCard>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
          {books.slice(0, limit).map((item, index) => (
            <motion.div
              key={item.book._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="min-w-[200px] flex-shrink-0"
            >
              <Link to={`/read/${item.book._id}`}>
                <GlassCard hover glow="purple" className="p-0 overflow-hidden">
                  {/* Cover */}
                  <div
                    className="h-40 relative"
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

                    {/* Progress Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2">
                      <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                        <span>{Math.round(item.progress)}% completed</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-amber-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
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

                    {/* Last Read */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-white/40">
                      <Clock className="w-3 h-3" />
                      <span>{formatLastRead(item.lastReadAt)}</span>
                    </div>

                    {/* Resume Button */}
                    <button className="w-full mt-3 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white text-sm font-medium transition-colors">
                      Continue Reading
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
