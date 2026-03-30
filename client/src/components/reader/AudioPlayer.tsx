/**
 * AudioPlayer Component
 * Full-featured audio player for book narration with Gemini TTS
 * Supports language-specific audio (English/Hebrew) with male/female voices
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Mic2,
  Rewind,
  FastForward,
} from 'lucide-react';

interface AudioTrack {
  url: string;
  duration: number;
  voice: string;
  language?: 'en' | 'he';
  generatedAt: string;
}

interface ChapterAudio {
  // Language-specific voices
  maleVoiceEn?: AudioTrack;
  femaleVoiceEn?: AudioTrack;
  maleVoiceHe?: AudioTrack;
  femaleVoiceHe?: AudioTrack;
  // Legacy fields
  maleVoice?: AudioTrack;
  femaleVoice?: AudioTrack;
}

interface AudioPlayerProps {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  chapterAudio?: ChapterAudio;
  bookLanguage?: 'en' | 'he';
  onChapterChange?: (direction: 'next' | 'prev') => void;
  onPositionChange?: (position: number) => void; // For saving bookmark
  initialPosition?: number; // Resume from bookmark
  hasNextChapter?: boolean;
  hasPrevChapter?: boolean;
}

export default function AudioPlayer({
  bookId,
  chapterId,
  chapterTitle,
  chapterAudio,
  bookLanguage = 'en',
  onChapterChange,
  onPositionChange,
  initialPosition = 0,
  hasNextChapter = false,
  hasPrevChapter = false,
}: AudioPlayerProps) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isExpanded, setIsExpanded] = useState(true);

  // Get audio URL based on book language and selected gender
  const getAudioUrl = useCallback(() => {
    if (!chapterAudio) return undefined;

    if (bookLanguage === 'he') {
      // Hebrew book - use Hebrew voices
      return selectedGender === 'female'
        ? chapterAudio.femaleVoiceHe?.url
        : chapterAudio.maleVoiceHe?.url;
    } else {
      // English book - use English voices
      return selectedGender === 'female'
        ? (chapterAudio.femaleVoiceEn?.url || chapterAudio.femaleVoice?.url)
        : (chapterAudio.maleVoiceEn?.url || chapterAudio.maleVoice?.url);
    }
  }, [chapterAudio, bookLanguage, selectedGender]);

  const getAudioDuration = useCallback(() => {
    if (!chapterAudio) return 0;

    if (bookLanguage === 'he') {
      return selectedGender === 'female'
        ? chapterAudio.femaleVoiceHe?.duration
        : chapterAudio.maleVoiceHe?.duration;
    } else {
      return selectedGender === 'female'
        ? (chapterAudio.femaleVoiceEn?.duration || chapterAudio.femaleVoice?.duration)
        : (chapterAudio.maleVoiceEn?.duration || chapterAudio.maleVoice?.duration);
    }
  }, [chapterAudio, bookLanguage, selectedGender]);

  const audioUrl = getAudioUrl();
  const audioDuration = getAudioDuration();

  // Check if audio is available for current language
  const hasAudio = !!audioUrl;
  const hasBothVoices = bookLanguage === 'he'
    ? !!(chapterAudio?.maleVoiceHe?.url && chapterAudio?.femaleVoiceHe?.url)
    : !!((chapterAudio?.maleVoiceEn?.url || chapterAudio?.maleVoice?.url) &&
         (chapterAudio?.femaleVoiceEn?.url || chapterAudio?.femaleVoice?.url));

  // Reset when chapter changes
  useEffect(() => {
    setCurrentTime(initialPosition);
    setIsPlaying(false);
    if (audioDuration) {
      setDuration(audioDuration);
    }
  }, [chapterId, audioDuration, initialPosition]);

  // Reset and reload when language changes (e.g., when translation is toggled)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      // Pause current audio
      audio.pause();
      setIsPlaying(false);
      // Reset position
      setCurrentTime(0);
      audio.currentTime = 0;
      // Load new source
      audio.load();
    }
  }, [bookLanguage]);

  // Set initial position when audio loads
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && initialPosition > 0) {
      audio.currentTime = initialPosition;
    }
  }, [audioUrl, initialPosition]);

  // Save position periodically
  useEffect(() => {
    if (!onPositionChange) return;

    const saveInterval = setInterval(() => {
      if (currentTime > 0) {
        onPositionChange(currentTime);
      }
    }, 5000); // Save every 5 seconds

    return () => clearInterval(saveInterval);
  }, [currentTime, onPositionChange]);

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Save final position
      onPositionChange?.(0); // Reset position when chapter ends
      // Auto-advance to next chapter
      if (hasNextChapter && onChapterChange) {
        onChapterChange('next');
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      // Save position when pausing
      onPositionChange?.(audio.currentTime);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [hasNextChapter, onChapterChange, onPositionChange]);

  // Update audio element when playback rate changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Play/Pause toggle
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
  };

  // Format time
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Playback rate options
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      {/* Hidden audio element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="auto" />
      )}

      {/* Player UI */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-t from-slate-900 via-slate-900/95 to-slate-900/90 backdrop-blur-lg border-t border-white/10 safe-area-inset-bottom"
      >
        {/* Expand/Collapse toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-800 rounded-t-lg border border-white/10 border-b-0"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="max-w-4xl mx-auto px-3 py-3 sm:p-4">
                {/* Chapter title */}
                <div className="text-center mb-2 sm:mb-3">
                  <h3 className="text-xs sm:text-sm text-gray-400 truncate px-2">{chapterTitle}</h3>
                </div>

                {/* No audio available message */}
                {!hasAudio && (
                  <div className="flex flex-col items-center gap-2 sm:gap-3 py-2">
                    <Mic2 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                    <p className="text-gray-400 text-sm text-center">{t('reader.no_audio', 'Audio narration not available for this chapter')}</p>
                  </div>
                )}

                {/* Audio player controls */}
                {hasAudio && (
                  <div className="space-y-2 sm:space-y-3">
                    {/* Progress bar - draggable, RTL for Hebrew */}
                    <div
                      className="flex items-center gap-2 sm:gap-3"
                      dir={bookLanguage === 'he' ? 'rtl' : 'ltr'}
                    >
                      <span className="text-[10px] sm:text-xs text-gray-400 w-10 sm:w-12 text-center">
                        {formatTime(currentTime)}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 h-2 sm:h-2 bg-gray-700 rounded-full appearance-none cursor-pointer touch-pan-x
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-5
                          [&::-webkit-slider-thumb]:h-5
                          [&::-webkit-slider-thumb]:sm:w-4
                          [&::-webkit-slider-thumb]:sm:h-4
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-indigo-500
                          [&::-webkit-slider-thumb]:cursor-grab
                          [&::-webkit-slider-thumb]:active:cursor-grabbing
                          [&::-webkit-slider-thumb]:hover:bg-indigo-400
                          [&::-webkit-slider-thumb]:transition-colors"
                        style={{
                          background: bookLanguage === 'he'
                            ? `linear-gradient(to left, #6366f1 0%, #6366f1 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                            : `linear-gradient(to right, #6366f1 0%, #6366f1 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`,
                          direction: bookLanguage === 'he' ? 'rtl' : 'ltr',
                        }}
                      />
                      <span className="text-[10px] sm:text-xs text-gray-400 w-10 sm:w-12 text-center">
                        {formatTime(duration)}
                      </span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      {/* Previous chapter */}
                      <button
                        onClick={() => onChapterChange?.('prev')}
                        disabled={!hasPrevChapter}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-white active:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title={t('reader.previous', 'Previous')}
                      >
                        <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      {/* Skip back 5s */}
                      <button
                        onClick={() => skip(-5)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-white active:text-white flex items-center gap-0.5 sm:gap-1"
                        title={t('reader.skip_back', 'Skip back 5s')}
                      >
                        <Rewind className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="text-[10px] sm:text-xs">5</span>
                      </button>

                      {/* Play/Pause - larger touch target on mobile */}
                      <button
                        onClick={togglePlayPause}
                        className="p-4 sm:p-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-400 active:scale-95 rounded-full transition-all min-w-[56px] min-h-[56px] sm:min-w-0 sm:min-h-0 flex items-center justify-center shadow-lg shadow-indigo-500/30"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 sm:w-6 sm:h-6" />
                        ) : (
                          <Play className="w-6 h-6 sm:w-6 sm:h-6 ml-0.5" />
                        )}
                      </button>

                      {/* Skip forward 5s */}
                      <button
                        onClick={() => skip(5)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-white active:text-white flex items-center gap-0.5 sm:gap-1"
                        title={t('reader.skip_forward', 'Skip forward 5s')}
                      >
                        <span className="text-[10px] sm:text-xs">5</span>
                        <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      {/* Next chapter */}
                      <button
                        onClick={() => onChapterChange?.('next')}
                        disabled={!hasNextChapter}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-white active:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title={t('reader.next', 'Next')}
                      >
                        <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    {/* Secondary controls - responsive layout */}
                    <div className="flex items-center justify-center gap-4 sm:gap-6 px-1 sm:px-4">
                      {/* Voice Gender Selector */}
                      {hasBothVoices && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Mic2 className="hidden sm:block w-4 h-4 text-gray-400" />
                          <select
                            value={selectedGender}
                            onChange={(e) => setSelectedGender(e.target.value as 'male' | 'female')}
                            className="bg-slate-700 text-white text-[10px] sm:text-xs rounded px-1.5 sm:px-2 py-1"
                          >
                            <option value="male">{t('reader.male_voice', 'Male')}</option>
                            <option value="female">{t('reader.female_voice', 'Female')}</option>
                          </select>
                        </div>
                      )}

                      {/* Playback speed */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="hidden sm:inline text-xs text-gray-400">{t('reader.speed', 'Speed')}:</span>
                        <select
                          value={playbackRate}
                          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                          className="bg-slate-700 text-white text-[10px] sm:text-xs rounded px-1.5 sm:px-2 py-1"
                        >
                          {playbackRates.map((rate) => (
                            <option key={rate} value={rate}>
                              {rate}x
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
