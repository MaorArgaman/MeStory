import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Book3DPreviewProps {
  title: string;
  author: string;
  coverColor: string;
  imageUrl?: string;
  fontFamily: string;
  textColor?: string;
  language?: string;
  content?: string;
}

export default function Book3DPreview({
  title,
  author,
  coverColor,
  imageUrl,
  fontFamily,
  textColor = '#ffffff',
  language = 'en',
  content = '',
}: Book3DPreviewProps) {
  // Detect RTL languages
  const isRTL = language === 'he' || language === 'ar';

  // Split content into pages (300 words per page)
  const pages = splitIntoPages(content, 300);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPageTurning, setIsPageTurning] = useState(false);

  const nextPage = () => {
    if (currentPage < pages.length - 1 && !isPageTurning) {
      setIsPageTurning(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsPageTurning(false);
      }, 500);
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isPageTurning) {
      setIsPageTurning(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsPageTurning(false);
      }, 500);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      {/* Magical glow background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-96 h-96 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${coverColor}80, transparent)`,
        }}
      />

      {/* 3D Book Container */}
      <div
        className="book-container"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <motion.div
          className="book-3d"
          animate={{
            rotateY: isRTL ? [-15, -20, -15] : [15, 20, 15],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: '280px',
            height: '400px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: isRTL ? 'rotateY(-15deg) rotateX(-5deg)' : 'rotateY(15deg) rotateX(-5deg)',
          }}
        >
          {/* Front Cover */}
          <div
            className="book-cover front-cover"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: imageUrl
                ? `url(${imageUrl}) center/cover`
                : `linear-gradient(135deg, ${coverColor}, ${adjustBrightness(coverColor, -20)})`,
              borderRadius: isRTL ? '8px 4px 4px 8px' : '4px 8px 8px 4px',
              boxShadow: `
                0 0 0 2px rgba(0,0,0,0.3),
                inset ${isRTL ? '10px' : '-10px'} 0 20px rgba(0,0,0,0.2),
                ${isRTL ? '-10px' : '10px'} 10px 40px rgba(0,0,0,0.5),
                0 0 80px ${coverColor}40
              `,
              transform: 'translateZ(25px)',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
              direction: isRTL ? 'rtl' : 'ltr',
            }}
          >
            {/* Overlay for text readability */}
            {imageUrl && (
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
                }}
              />
            )}

            {/* Title */}
            <div className="relative z-10">
              <h1
                style={{
                  fontFamily: fontFamily,
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: textColor,
                  textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                  lineHeight: '1.2',
                  wordWrap: 'break-word',
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {title || 'Book Title'}
              </h1>
            </div>

            {/* Author */}
            <div className="relative z-10">
              <p
                style={{
                  fontFamily: fontFamily,
                  fontSize: '18px',
                  color: textColor,
                  textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                  opacity: 0.9,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {author || 'Author Name'}
              </p>
            </div>
          </div>

          {/* Spine */}
          <div
            className="book-spine"
            style={{
              position: 'absolute',
              width: '50px',
              height: '100%',
              left: isRTL ? 'auto' : '-25px',
              right: isRTL ? '-25px' : 'auto',
              background: `linear-gradient(to ${isRTL ? 'left' : 'right'},
                ${adjustBrightness(coverColor, -40)},
                ${adjustBrightness(coverColor, -20)},
                ${adjustBrightness(coverColor, -30)}
              )`,
              transform: isRTL ? 'rotateY(90deg)' : 'rotateY(-90deg)',
              transformOrigin: isRTL ? 'left center' : 'right center',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: isRTL ? '0 4px 4px 0' : '4px 0 0 4px',
            }}
          >
            {/* Spine text */}
            <div
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                whiteSpace: 'nowrap',
                color: textColor,
                fontSize: '12px',
                fontFamily: fontFamily,
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                maxWidth: '380px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title || 'Book Title'} • {author || 'Author'}
            </div>
          </div>

          {/* Back Cover */}
          <div
            className="book-cover back-cover"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${adjustBrightness(coverColor, -10)}, ${adjustBrightness(coverColor, -30)})`,
              borderRadius: isRTL ? '4px 8px 8px 4px' : '8px 4px 4px 8px',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)',
              transform: 'translateZ(-25px) rotateY(180deg)',
            }}
          />

          {/* Pages with content - Animated page turning */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ rotateY: isPageTurning ? (isRTL ? 90 : -90) : 0 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: isPageTurning ? (isRTL ? -90 : 90) : 0 }}
              transition={{ duration: 0.5 }}
              className="book-pages"
              style={{
                position: 'absolute',
                width: 'calc(100% - 4px)',
                height: 'calc(100% - 4px)',
                top: '2px',
                left: '2px',
                background: '#f5f5dc',
                borderRadius: isRTL ? '6px 0 0 6px' : '0 6px 6px 0',
                transform: 'translateZ(24px)',
                transformStyle: 'preserve-3d',
                transformOrigin: isRTL ? 'right center' : 'left center',
                boxShadow: `
                  inset ${isRTL ? '5px' : '-5px'} 0 10px rgba(0,0,0,0.1),
                  ${isRTL ? '2px' : '-2px'} 0 0 #e8e8d0,
                  ${isRTL ? '4px' : '-4px'} 0 0 #deded0,
                  ${isRTL ? '6px' : '-6px'} 0 0 #d4d4c0
                `,
                padding: '20px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontFamily: "'Merriweather', serif",
                  fontSize: '11px',
                  lineHeight: '1.6',
                  color: '#2d3748',
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                {pages[currentPage] || 'This page intentionally left blank.'}
              </div>
              {/* Page number */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  [isRTL ? 'left' : 'right']: '20px',
                  fontSize: '10px',
                  color: '#718096',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {currentPage + 1} / {pages.length || 1}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Pagination Controls */}
      {pages.length > 1 && (
        <div className="mt-8 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevPage}
            disabled={currentPage === 0 || isPageTurning}
            className="btn-secondary px-4 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            Previous
          </motion.button>

          <div className="glass rounded-lg px-4 py-2 text-sm text-gray-300">
            Page {currentPage + 1} of {pages.length}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextPage}
            disabled={currentPage === pages.length - 1 || isPageTurning}
            className="btn-secondary px-4 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </motion.button>
        </div>
      )}
    </div>
  );
}

// Helper function to split content into pages
function splitIntoPages(content: string, wordsPerPage: number): string[] {
  if (!content || content.trim().length === 0) {
    return ['This book has no content yet. Start writing your story!'];
  }

  const words = content.trim().split(/\s+/);
  const pages: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerPage) {
    const pageWords = words.slice(i, i + wordsPerPage);
    pages.push(pageWords.join(' '));
  }

  return pages.length > 0 ? pages : [''];
}

// Helper function to adjust color brightness
function adjustBrightness(color: string, percent: number): string {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Adjust brightness
  const newR = Math.max(0, Math.min(255, r + (r * percent) / 100));
  const newG = Math.max(0, Math.min(255, g + (g * percent) / 100));
  const newB = Math.max(0, Math.min(255, b + (b * percent) / 100));

  // Convert back to hex
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}
