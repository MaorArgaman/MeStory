/**
 * ImagePlaceholder Component
 * Clickable placeholder for adding images to book pages
 * Supports both image upload and AI generation
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Upload,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface ImagePlaceholderProps {
  // Position and size (percentages)
  x: number;
  y: number;
  width: number;
  height: number;
  // Optional preset style
  frameStyle?: 'none' | 'thin-border' | 'shadow' | 'rounded' | 'decorative';
  // Callbacks
  onImageAdded: (imageUrl: string, imageData: {
    x: number;
    y: number;
    width: number;
    height: number;
    isAiGenerated: boolean;
    prompt?: string;
  }) => void;
  // Context for AI generation
  bookId?: string;
  chapterIndex?: number;
  pageIndex?: number;
  bookContext?: {
    title: string;
    genre: string;
    chapterTitle?: string;
  };
  // Optional label
  label?: string;
  // Is RTL
  isRTL?: boolean;
}

export default function ImagePlaceholder({
  x,
  y,
  width,
  height,
  frameStyle = 'shadow',
  onImageAdded,
  bookId,
  chapterIndex,
  pageIndex: _pageIndex,
  bookContext,
  label,
  isRTL = false,
}: ImagePlaceholderProps) {
  const { t } = useTranslation('common');
  void _pageIndex; // Reserved for future use
  const [showMenu, setShowMenu] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get frame styles
  const getFrameStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: `${width}%`,
      height: `${height}%`,
    };

    switch (frameStyle) {
      case 'thin-border':
        return { ...base, border: '1px solid #d1d5db' };
      case 'shadow':
        return { ...base, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' };
      case 'rounded':
        return { ...base, borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' };
      case 'decorative':
        return {
          ...base,
          border: '3px double #d4af37',
          borderRadius: '4px',
          boxShadow: '0 4px 15px rgba(212,175,55,0.2)',
        };
      default:
        return base;
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('book_layout.invalid_image', 'Please select an image file'));
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('book_layout.image_too_large', 'Image must be less than 10MB'));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success && response.data.url) {
        onImageAdded(response.data.url, {
          x,
          y,
          width,
          height,
          isAiGenerated: false,
        });
        toast.success(t('book_layout.image_uploaded', 'Image uploaded successfully'));
        setShowMenu(false);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || t('book_layout.upload_failed', 'Failed to upload image'));
    }
  };

  // Handle AI image generation
  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error(t('book_layout.enter_prompt', 'Please enter an image description'));
      return;
    }

    setIsGenerating(true);

    try {
      const response = await api.post('/ai/generate-image', {
        prompt: prompt.trim(),
        bookId,
        style: 'illustration',
        aspectRatio: width > height ? '16:9' : height > width ? '9:16' : '4:3',
        bookContext,
      });

      if (response.data.success && response.data.data?.imageUrl) {
        onImageAdded(response.data.data.imageUrl, {
          x,
          y,
          width,
          height,
          isAiGenerated: true,
          prompt: prompt.trim(),
        });
        toast.success(t('book_layout.image_generated', 'Image generated successfully'));
        setShowMenu(false);
        setShowAIPrompt(false);
        setPrompt('');
      } else {
        throw new Error(response.data.error || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || t('book_layout.generation_failed', 'Failed to generate image'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate contextual image based on book content
  const handleGenerateContextualImage = async () => {
    if (!bookId || chapterIndex === undefined) {
      toast.error(t('book_layout.no_context', 'Book context required for contextual generation'));
      return;
    }

    setIsGenerating(true);

    try {
      const response = await api.post('/ai/generate-contextual-image', {
        bookId,
        chapterIndex,
      });

      if (response.data.success && response.data.data?.imageUrl) {
        onImageAdded(response.data.data.imageUrl, {
          x,
          y,
          width,
          height,
          isAiGenerated: true,
          prompt: response.data.data.prompt,
        });
        toast.success(t('book_layout.image_generated', 'Image generated successfully'));
        setShowMenu(false);
      } else {
        throw new Error(response.data.error || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('Contextual generation error:', error);
      toast.error(error.message || t('book_layout.generation_failed', 'Failed to generate image'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div
        style={{ ...getFrameStyles(), zIndex: 25, pointerEvents: 'all' }}
        className="cursor-pointer bg-gradient-to-br from-gray-100/50 to-gray-200/50 hover:from-purple-100/50 hover:to-pink-100/50 transition-colors duration-300 flex items-center justify-center group border-2 border-dashed border-gray-300 hover:border-purple-400"
        onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Placeholder content */}
        <div className="text-center p-2">
          <ImageIcon className="w-8 h-8 mx-auto text-gray-400 group-hover:text-purple-500 transition-colors" />
          <p className="text-xs text-gray-500 mt-1 group-hover:text-purple-600">
            {label || t('book_layout.click_to_add_image', 'לחץ להוספת תמונה')}
          </p>
        </div>

        {/* Decorative corners for decorative frame */}
        {frameStyle === 'decorative' && (
          <>
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500" />
          </>
        )}
      </div>

      {/* Menu Modal */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isGenerating && setShowMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  {t('book_layout.add_image', 'הוסף תמונה')}
                </h3>
                <button
                  onClick={() => setShowMenu(false)}
                  disabled={isGenerating}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Options */}
              {!showAIPrompt ? (
                <div className="space-y-3">
                  {/* Upload option */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-4 transition-colors text-right"
                  >
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Upload className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {t('book_layout.upload_image', 'העלאת תמונה')}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t('book_layout.upload_desc', 'בחר תמונה מהמחשב שלך')}
                      </p>
                    </div>
                  </button>

                  {/* AI generation option */}
                  <button
                    onClick={() => setShowAIPrompt(true)}
                    disabled={isGenerating}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-4 transition-colors text-right"
                  >
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {t('book_layout.generate_with_ai', 'יצירה עם AI')}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t('book_layout.ai_desc', 'תאר את התמונה שתרצה ליצור')}
                      </p>
                    </div>
                  </button>

                  {/* Contextual generation option (if context available) */}
                  {bookId && chapterIndex !== undefined && (
                    <button
                      onClick={handleGenerateContextualImage}
                      disabled={isGenerating}
                      className="w-full p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl flex items-center gap-4 transition-colors text-right border border-purple-500/30"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        {isGenerating ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {t('book_layout.generate_from_content', 'יצירה אוטומטית מהתוכן')}
                        </p>
                        <p className="text-sm text-gray-400">
                          {t('book_layout.auto_desc', 'AI ינתח את הפרק ויצור תמונה מתאימה')}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              ) : (
                /* AI Prompt Input */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('book_layout.describe_image', 'תאר את התמונה')}
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={t('book_layout.prompt_placeholder', 'לדוגמה: נוף הררי עם שקיעה צבעונית, סגנון אמנותי...')}
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAIPrompt(false)}
                      disabled={isGenerating}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors"
                    >
                      {t('common.back', 'חזרה')}
                    </button>
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGenerating || !prompt.trim()}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {t('book_layout.generating', 'מייצר...')}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          {t('book_layout.generate', 'צור תמונה')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
