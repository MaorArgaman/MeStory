import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Book3DPreviewProps {
  title: string;
  author: string;
  coverColor: string;
  imageUrl?: string;
  fontFamily: string;
  textColor?: string;
  language?: string;
  content?: string;
  synopsis?: string;
  backCoverImageUrl?: string;
  backCoverColor?: string;
  titlePosition?: { x: number; y: number };
  authorPosition?: { x: number; y: number };
  synopsisPosition?: { x: number; y: number };
  editMode?: boolean;
  onTitlePositionChange?: (pos: { x: number; y: number }) => void;
  onAuthorPositionChange?: (pos: { x: number; y: number }) => void;
  onSynopsisPositionChange?: (pos: { x: number; y: number }) => void;
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
  synopsis = '',
  backCoverImageUrl,
  backCoverColor,
  titlePosition = { x: 50, y: 20 },
  authorPosition = { x: 50, y: 85 },
  synopsisPosition = { x: 50, y: 40 },
  editMode = false,
  onTitlePositionChange,
  onAuthorPositionChange,
  onSynopsisPositionChange,
}: Book3DPreviewProps) {
  const { t } = useTranslation('common');
  // Detect RTL languages
  const isRTL = language === 'he' || language === 'ar';

  // Split content into pages (300 words per page)
  const pages = splitIntoPages(content, 300);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPageTurning, setIsPageTurning] = useState(false);

  // Flip state to show back cover
  const [showBackCover, setShowBackCover] = useState(false);

  // Drag state
  const [isDraggingTitle, setIsDraggingTitle] = useState(false);
  const [isDraggingAuthor, setIsDraggingAuthor] = useState(false);
  const [isDraggingSynopsis, setIsDraggingSynopsis] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const coverRef = useRef<HTMLDivElement>(null);
  const backCoverRef = useRef<HTMLDivElement>(null);

  // Handle drag for title (mouse)
  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if (!editMode || !onTitlePositionChange) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTitle(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartPos({ x: titlePosition.x, y: titlePosition.y });
  };

  // Handle drag for title (touch)
  const handleTitleTouchStart = (e: React.TouchEvent) => {
    if (!editMode || !onTitlePositionChange) return;
    e.stopPropagation();
    const touch = e.touches[0];
    setIsDraggingTitle(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setStartPos({ x: titlePosition.x, y: titlePosition.y });
  };

  // Handle drag for author (mouse)
  const handleAuthorMouseDown = (e: React.MouseEvent) => {
    if (!editMode || !onAuthorPositionChange) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAuthor(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartPos({ x: authorPosition.x, y: authorPosition.y });
  };

  // Handle drag for author (touch)
  const handleAuthorTouchStart = (e: React.TouchEvent) => {
    if (!editMode || !onAuthorPositionChange) return;
    e.stopPropagation();
    const touch = e.touches[0];
    setIsDraggingAuthor(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setStartPos({ x: authorPosition.x, y: authorPosition.y });
  };

  // Handle drag for synopsis (mouse)
  const handleSynopsisMouseDown = (e: React.MouseEvent) => {
    if (!editMode || !onSynopsisPositionChange) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSynopsis(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartPos({ x: synopsisPosition.x, y: synopsisPosition.y });
  };

  // Handle drag for synopsis (touch)
  const handleSynopsisTouchStart = (e: React.TouchEvent) => {
    if (!editMode || !onSynopsisPositionChange) return;
    e.stopPropagation();
    const touch = e.touches[0];
    setIsDraggingSynopsis(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setStartPos({ x: synopsisPosition.x, y: synopsisPosition.y });
  };

  useEffect(() => {
    if (!isDraggingTitle && !isDraggingAuthor && !isDraggingSynopsis) return;

    const handleMove = (clientX: number, clientY: number) => {
      // Use the appropriate ref based on what we're dragging
      const ref = isDraggingSynopsis ? backCoverRef : coverRef;
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const deltaX = ((clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((clientY - dragStart.y) / rect.height) * 100;

      const newX = Math.max(10, Math.min(90, startPos.x + deltaX));
      const newY = Math.max(5, Math.min(95, startPos.y + deltaY));

      if (isDraggingTitle && onTitlePositionChange) {
        onTitlePositionChange({ x: newX, y: newY });
      }
      if (isDraggingAuthor && onAuthorPositionChange) {
        onAuthorPositionChange({ x: newX, y: newY });
      }
      if (isDraggingSynopsis && onSynopsisPositionChange) {
        onSynopsisPositionChange({ x: newX, y: newY });
      }
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleEnd = () => {
      setIsDraggingTitle(false);
      setIsDraggingAuthor(false);
      setIsDraggingSynopsis(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingTitle, isDraggingAuthor, isDraggingSynopsis, dragStart, startPos, onTitlePositionChange, onAuthorPositionChange, onSynopsisPositionChange]);

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
        className="absolute w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${coverColor}80, transparent)`,
        }}
      />

      {/* Flip Button */}
      <button
        onClick={() => setShowBackCover(!showBackCover)}
        className="absolute top-2 right-2 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title={showBackCover ? t('design_studio.show_front_cover') : t('design_studio.show_back_cover')}
      >
        <RotateCw className={`w-5 h-5 text-white transition-transform ${showBackCover ? 'rotate-180' : ''}`} />
      </button>

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
            rotateY: showBackCover
              ? (isRTL ? 165 : -165)
              : (isRTL ? [-15, -20, -15] : [15, 20, 15]),
          }}
          transition={showBackCover ? {
            duration: 0.6,
            ease: 'easeInOut',
          } : {
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
            ref={coverRef}
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

            {/* Title - Draggable in edit mode */}
            <div
              className={`absolute z-10 ${editMode ? 'cursor-move touch-none' : ''} ${isDraggingTitle ? 'opacity-80' : ''}`}
              style={{
                left: `${titlePosition.x}%`,
                top: `${titlePosition.y}%`,
                transform: 'translate(-50%, -50%)',
                maxWidth: '85%',
              }}
              onMouseDown={handleTitleMouseDown}
              onTouchStart={handleTitleTouchStart}
            >
              <h1
                style={{
                  fontFamily: fontFamily,
                  fontSize: title.length > 30 ? '16px' : title.length > 20 ? '20px' : '26px',
                  fontWeight: 'bold',
                  color: textColor,
                  textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                  lineHeight: '1.3',
                  textAlign: 'center',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'keep-all',
                }}
              >
                {title || 'Book Title'}
              </h1>
              {editMode && (
                <div className="absolute -inset-2 border-2 border-dashed border-white/40 rounded pointer-events-none" />
              )}
            </div>

            {/* Author - Draggable in edit mode */}
            <div
              className={`absolute z-10 ${editMode ? 'cursor-move touch-none' : ''} ${isDraggingAuthor ? 'opacity-80' : ''}`}
              style={{
                left: `${authorPosition.x}%`,
                top: `${authorPosition.y}%`,
                transform: 'translate(-50%, -50%)',
                maxWidth: '80%',
              }}
              onMouseDown={handleAuthorMouseDown}
              onTouchStart={handleAuthorTouchStart}
            >
              <p
                style={{
                  fontFamily: fontFamily,
                  fontSize: '18px',
                  color: textColor,
                  textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                  opacity: 0.9,
                  textAlign: 'center',
                }}
              >
                {author || 'Author Name'}
              </p>
              {editMode && (
                <div className="absolute -inset-2 border-2 border-dashed border-white/40 rounded pointer-events-none" />
              )}
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

          {/* Back Cover with Synopsis */}
          <div
            ref={backCoverRef}
            className="book-cover back-cover"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: backCoverImageUrl
                ? `url(${backCoverImageUrl}) center/cover`
                : `linear-gradient(135deg, ${backCoverColor || adjustBrightness(coverColor, -10)}, ${adjustBrightness(backCoverColor || coverColor, -30)})`,
              borderRadius: isRTL ? '4px 8px 8px 4px' : '8px 4px 4px 8px',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)',
              transform: 'translateZ(-25px) rotateY(180deg)',
              overflow: 'hidden',
              direction: isRTL ? 'rtl' : 'ltr',
            }}
          >
            {/* Background overlay for text readability */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
              }}
            />

            {/* Synopsis - Draggable in edit mode */}
            <div
              className={`absolute z-10 ${editMode ? 'cursor-move touch-none' : ''} ${isDraggingSynopsis ? 'opacity-80' : ''}`}
              style={{
                left: `${synopsisPosition.x}%`,
                top: `${synopsisPosition.y}%`,
                transform: 'translate(-50%, -50%)',
                maxWidth: '85%',
                maxHeight: '75%',
              }}
              onMouseDown={handleSynopsisMouseDown}
              onTouchStart={handleSynopsisTouchStart}
            >
              {(() => {
                const text = synopsis || (language === 'he' ? 'תקציר הספר יופיע כאן...' : 'Book synopsis will appear here...');
                const len = text.length;
                const fontSize = len < 150 ? '11px' : len < 300 ? '9.5px' : len < 450 ? '8px' : '7px';
                const lineHeight = len < 150 ? '1.5' : len < 300 ? '1.45' : '1.4';
                return (
                  <p
                    style={{
                      fontFamily: fontFamily,
                      fontSize,
                      lineHeight,
                      color: textColor,
                      textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                      textAlign: isRTL ? 'right' : 'left',
                      opacity: 0.95,
                      userSelect: 'none',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {text}
                  </p>
                );
              })()}
              {editMode && (
                <div className="absolute -inset-2 border-2 border-dashed border-white/40 rounded pointer-events-none" />
              )}
            </div>

            {/* Author Section at Bottom */}
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <div className="pt-3 border-t border-white/20">
                <p
                  style={{
                    fontFamily: fontFamily,
                    fontSize: '10px',
                    color: textColor,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    opacity: 0.85,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                >
                  {language === 'he' ? 'מאת: ' : 'By: '}{author || 'Author Name'}
                </p>
              </div>

              {/* Barcode Placeholder */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '15px',
                  [isRTL ? 'left' : 'right']: '15px',
                  width: '50px',
                  height: '30px',
                  background: 'white',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '20px',
                    background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)',
                  }}
                />
              </div>
            </div>
          </div>

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

      {/* Pagination Controls - DESIGN-001/005 FIX: Added translations and RTL button order */}
      {pages.length > 1 && (
        <div className={`mt-8 flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevPage}
            disabled={currentPage === 0 || isPageTurning}
            className={`btn-secondary px-4 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {t('pagination.previous', 'Previous')}
          </motion.button>

          <div className="glass rounded-lg px-4 py-2 text-sm text-gray-300">
            {t('pagination.page_of', { current: currentPage + 1, total: pages.length })}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextPage}
            disabled={currentPage === pages.length - 1 || isPageTurning}
            className={`btn-secondary px-4 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {t('pagination.next', 'Next')}
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
