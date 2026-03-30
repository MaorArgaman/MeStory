/**
 * Voice Record Button
 * A button that enables voice-to-text writing using Whisper
 */

import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

interface VoiceRecordButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceRecordButton({
  onTranscription,
  disabled = false,
  className = '',
}: VoiceRecordButtonProps) {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const { isRecording, isTranscribing, toggleRecording } = useVoiceRecording({
    onTranscription: (text) => {
      onTranscription(text);
      // Optional: Show subtle feedback that text was added
      // toast.success(isHebrew ? 'טקסט נוסף' : 'Text added', { duration: 1000 });
    },
    onError: (errorMsg) => {
      toast.error(isHebrew ? `שגיאה: ${errorMsg}` : `Error: ${errorMsg}`);
    },
    language: language,
    transcriptionInterval: 4000, // Transcribe every 4 seconds
  });

  const handleClick = async () => {
    if (disabled) return;

    if (!isRecording) {
      toast(isHebrew ? '🎤 מקליט... דבר עכשיו' : '🎤 Recording... speak now', {
        duration: 2000,
        icon: '🎙️',
      });
    }

    await toggleRecording();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`relative p-2 rounded-lg transition-all duration-200 ${
        isRecording
          ? 'bg-red-500/20 text-red-400 border border-red-500/50'
          : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      title={
        isRecording
          ? isHebrew
            ? 'לחץ לעצירה'
            : 'Click to stop'
          : isHebrew
          ? 'הקלטה קולית (Whisper)'
          : 'Voice recording (Whisper)'
      }
    >
      {/* Recording pulse animation */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-lg bg-red-500/30"
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <div className="relative z-10">
        {isTranscribing ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5 text-red-400" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </div>

      {/* Recording indicator dot */}
      {isRecording && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
        >
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-full h-full bg-red-500 rounded-full"
          />
        </motion.div>
      )}
    </motion.button>
  );
}
