/**
 * VoiceRecorder Component
 * Recording interface with visual feedback
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, X, Send, Loader2, AlertCircle } from 'lucide-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { formatDuration } from '../../services/voiceService';
import AudioWaveform from './AudioWaveform';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel?: () => void;
  isProcessing?: boolean;
  maxDuration?: number;
  disabled?: boolean;
  showTextInput?: boolean;
  onTextSubmit?: (text: string) => void;
  className?: string;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  isProcessing = false,
  maxDuration = 120,
  disabled = false,
  showTextInput = false,
  onTextSubmit,
  className = '',
}: VoiceRecorderProps) {
  const {
    isRecording,
    isSupported,
    audioBlob,
    duration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
  } = useVoiceRecorder({
    maxDuration,
    onRecordingComplete: (blob) => {
      onRecordingComplete(blob);
    },
  });

  // Text input state for fallback
  const [textInput, setTextInput] = React.useState('');

  const handleStopAndSend = async () => {
    const blob = await stopRecording();
    if (blob) {
      onRecordingComplete(blob);
    }
  };

  const handleCancel = () => {
    cancelRecording();
    resetRecording();
    if (onCancel) {
      onCancel();
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim() && onTextSubmit) {
      onTextSubmit(textInput.trim());
      setTextInput('');
    }
  };

  // Show error state
  if (!isSupported || error) {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/30">
          <AlertCircle className="w-5 h-5" />
          <span>{error || 'Voice recording is not supported by your browser'}</span>
        </div>

        {showTextInput && onTextSubmit && (
          <div className="w-full">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-magic-gold/50 resize-none"
              rows={3}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="mt-2 w-full py-2 px-4 rounded-xl bg-magic-gold text-deep-space font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-500 transition-colors"
            >
              Send answer
            </button>
          </div>
        )}
      </div>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full bg-magic-gold/20 flex items-center justify-center"
        >
          <Loader2 className="w-8 h-8 text-magic-gold" />
        </motion.div>
        <span className="text-gray-300">Processing recording...</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Recording indicator */}
      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Waveform */}
            <AudioWaveform isActive={true} barCount={7} />

            {/* Duration */}
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex items-center gap-2 text-magic-gold"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-lg">{formatDuration(duration)}</span>
              <span className="text-gray-400 text-sm">/ {formatDuration(maxDuration)}</span>
            </motion.div>

            {/* Recording buttons */}
            <div className="flex items-center gap-3">
              {/* Cancel */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCancel}
                className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Stop & Send */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleStopAndSend}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-magic-gold to-yellow-500 flex items-center justify-center text-deep-space shadow-lg shadow-magic-gold/30"
              >
                <Send className="w-7 h-7" />
              </motion.button>
            </div>

            <p className="text-gray-400 text-sm">Press send when done</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Record button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              disabled={disabled}
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-magic-gold to-yellow-500 flex items-center justify-center text-deep-space shadow-lg shadow-magic-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Pulse animation */}
              <motion.div
                className="absolute inset-0 rounded-full bg-magic-gold"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Mic className="w-8 h-8 relative z-10" />
            </motion.button>

            <p className="text-gray-300 text-sm">Press to record</p>

            {/* Optional text input toggle */}
            {showTextInput && onTextSubmit && (
              <div className="w-full mt-4">
                <div className="text-center text-gray-500 text-sm mb-3">or type your answer</div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-magic-gold/50 resize-none"
                  rows={3}
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className="mt-2 w-full py-2 px-4 rounded-xl bg-white/10 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors border border-white/20"
                >
                  Send text answer
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
