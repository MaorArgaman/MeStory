/**
 * Share Modal Component
 * Allows users to share books via various platforms
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link,
  Share2,
  Check,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

// Social media icons
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  authorName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  authorName,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const shareUrl = `${window.location.origin}/reader/${bookId}`;
  const shareText = `I read "${bookTitle}" by ${authorName} and highly recommend it! 📚`;

  const trackShare = async (platform: string) => {
    try {
      await api.post(`/books/${bookId}/share`, { platform });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      await trackShare('copy');
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      setSharing(true);
      try {
        await navigator.share({
          title: bookTitle,
          text: shareText,
          url: shareUrl,
        });
        await trackShare('native');
        toast.success('Thanks for sharing!');
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      } finally {
        setSharing(false);
      }
    }
  };

  const handleWhatsAppShare = async () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
    window.open(url, '_blank');
    await trackShare('whatsapp');
  };

  const handleTwitterShare = async () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    await trackShare('twitter');
  };

  const handleFacebookShare = async () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    await trackShare('facebook');
  };

  const handleTelegramShare = async () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    await trackShare('telegram');
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
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-purple-500/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-400" />
              Share Book
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Book info */}
          <div className="mb-6 p-4 bg-white/5 rounded-xl">
            <h4 className="font-semibold text-white truncate">{bookTitle}</h4>
            <p className="text-sm text-gray-400">by {authorName}</p>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <WhatsAppIcon />
              </div>
              <span className="text-xs">WhatsApp</span>
            </button>

            <button
              onClick={handleTwitterShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <TwitterIcon />
              </div>
              <span className="text-xs">Twitter</span>
            </button>

            <button
              onClick={handleFacebookShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-blue-600/20 text-gray-400 hover:text-blue-500 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                <FacebookIcon />
              </div>
              <span className="text-xs">Facebook</span>
            </button>

            <button
              onClick={handleTelegramShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-sky-500/20 text-gray-400 hover:text-sky-400 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center group-hover:bg-sky-500/30 transition-colors">
                <TelegramIcon />
              </div>
              <span className="text-xs">Telegram</span>
            </button>
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl mb-4">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-gray-300 text-sm truncate outline-none"
              dir="ltr"
            />
            <button
              onClick={handleCopyLink}
              className={`p-2 rounded-lg transition-all ${
                copied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {copied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Link className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Native share button (if supported) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              disabled={sharing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sharing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  More sharing options...
                </>
              )}
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
