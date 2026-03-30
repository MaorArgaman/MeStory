/**
 * User Library Modal
 * Displays a user's published books when clicking on a mention
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  Book,
  User,
  Star,
  Eye,
  Heart,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { getUserLibrary, UserLibraryData, UserLibraryBook } from '../../services/userApi';
import { useModal } from '../../hooks/useModal';

interface UserLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
}

const UserLibraryModal: React.FC<UserLibraryModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [libraryData, setLibraryData] = useState<UserLibraryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useModal(isOpen, onClose);

  useEffect(() => {
    if (isOpen && userId) {
      loadLibrary();
    }
  }, [isOpen, userId]);

  const loadLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserLibrary(userId);
      setLibraryData(data);
    } catch (err) {
      console.error('Failed to load user library:', err);
      setError(t('mentions.library_load_error', 'Failed to load library'));
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (bookId: string) => {
    onClose();
    navigate(`/reader/${bookId}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-purple-500/20 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {libraryData?.user?.avatar ? (
                  <img
                    src={libraryData.user.avatar}
                    alt={libraryData.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {libraryData?.user?.name || userName || t('mentions.library', 'Library')}
                  </h2>
                  {libraryData?.user?.bio && (
                    <p className="text-sm text-gray-400 line-clamp-1">
                      {libraryData.user.bio}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={loadLibrary}
                  className="mt-4 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  {t('common.retry', 'Retry')}
                </button>
              </div>
            ) : libraryData?.books.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <Book className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">
                  {t('mentions.no_books', 'No published books yet')}
                </h4>
                <p className="text-gray-400 text-sm">
                  {t('mentions.no_books_subtitle', 'This author has not published any books')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {libraryData?.books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onClick={() => handleBookClick(book.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {libraryData && libraryData.totalBooks > 0 && (
            <div className="p-4 border-t border-white/10 bg-black/20">
              <p className="text-center text-gray-400 text-sm">
                {t('mentions.total_books', '{{count}} published books', {
                  count: libraryData.totalBooks,
                })}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface BookCardProps {
  book: UserLibraryBook;
  onClick: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  const { t } = useTranslation('common');

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 cursor-pointer transition-all group"
    >
      {/* Cover */}
      <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book className="w-8 h-8 text-white/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
            {book.title}
          </h3>
          <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <p className="text-sm text-purple-400 mt-1">{book.genre}</p>

        {book.synopsis && (
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
            {book.synopsis}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{book.statistics.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            <span>{book.statistics.likes}</span>
          </div>
          {book.statistics.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>{book.statistics.rating.toFixed(1)}</span>
            </div>
          )}
          <div className="ml-auto">
            {book.isFree ? (
              <span className="text-green-400">{t('common.free', 'Free')}</span>
            ) : (
              <span className="text-purple-300">${book.price}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserLibraryModal;
