/**
 * AIInterviewChat Component
 * Chat-style AI interview for story development
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Mic,
  Volume2,
  VolumeX,
  Loader2,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AIAvatar, { AIAvatarState } from './AIAvatar';
import VoiceRecorder from '../voice/VoiceRecorder';
import {
  startInterview,
  sendInterviewMessage,
  completeInterview,
  ChatMessage,
  InterviewState,
  InterviewSummary,
  TOPIC_NAMES,
  TOPIC_ORDER,
} from '../../services/aiInterviewApi';
import { transcribeAudio } from '../../services/voiceService';

interface AIInterviewChatProps {
  onClose: () => void;
  onComplete: (summary: InterviewSummary) => void;
  genre?: string;
  targetAudience?: string;
}

export default function AIInterviewChat({
  onClose,
  onComplete,
  genre,
  targetAudience,
}: AIInterviewChatProps) {
  // State
  const [interviewState, setInterviewState] = useState<InterviewState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [avatarState, setAvatarState] = useState<AIAvatarState>('idle');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize interview
  useEffect(() => {
    initializeInterview();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeInterview = async () => {
    setIsLoading(true);
    setAvatarState('thinking');

    try {
      const { state, firstMessage } = await startInterview(genre, targetAudience);
      setInterviewState(state);
      setMessages([firstMessage]);
      setAvatarState('speaking');

      // TTS for first message
      if (ttsEnabled) {
        await speakText(firstMessage.content);
      }

      setAvatarState('idle');
    } catch (error) {
      console.error('Failed to start interview:', error);
      toast.error('Failed to start interview');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const speakText = async (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.rate = 0.9;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.speak(utterance);
    });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !interviewState || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      topic: interviewState.currentTopic,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);
    setAvatarState('thinking');

    try {
      const { state, aiMessage, topicTransition } = await sendInterviewMessage(
        interviewState.id,
        text.trim()
      );

      setInterviewState(state);

      // Show topic transition if any
      if (topicTransition) {
        toast.success(topicTransition, { duration: 3000 });
      }

      setMessages((prev) => [...prev, aiMessage]);
      setAvatarState('speaking');

      // TTS
      if (ttsEnabled) {
        await speakText(aiMessage.content);
      }

      setAvatarState('idle');

      // Check if interview is complete
      if (state.isComplete) {
        handleInterviewComplete();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setAvatarState('idle');
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setAvatarState('listening');
    setShowVoiceInput(false);

    try {
      const result = await transcribeAudio(audioBlob);
      if (result && result.text) {
        await handleSendMessage(result.text);
      } else {
        toast.error('Could not transcribe audio');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
      setAvatarState('idle');
    }
  };

  const handleInterviewComplete = async () => {
    if (!interviewState || isCompleting) return;

    setIsCompleting(true);
    setAvatarState('thinking');

    try {
      const summary = await completeInterview(interviewState.id);
      toast.success('Interview complete!');
      onComplete(summary);
    } catch (error) {
      console.error('Failed to complete interview:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsCompleting(false);
      setAvatarState('idle');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const getCurrentTopicIndex = () => {
    if (!interviewState) return 0;
    return TOPIC_ORDER.indexOf(interviewState.currentTopic);
  };

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <AIAvatar state="thinking" size="lg" />
          <p className="text-gray-300 text-lg">Preparing interview...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-2xl h-[90vh] max-h-[800px] flex flex-col shadow-2xl border border-purple-500/20 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-4">
            <AIAvatar state={avatarState} size="sm" />
            <div>
              <h2 className="text-lg font-bold text-white">Deep Dive Interview</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{TOPIC_NAMES[interviewState?.currentTopic || 'theme']}</span>
                <span className="text-gray-600">|</span>
                <span>{getCurrentTopicIndex() + 1}/8</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TTS Toggle */}
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                ttsEnabled
                  ? 'bg-magic-gold/20 text-magic-gold'
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
              title={ttsEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Complete Early */}
            {interviewState?.canCompleteEarly && !interviewState.isComplete && (
              <button
                onClick={handleInterviewComplete}
                disabled={isCompleting}
                className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm flex items-center gap-1"
              >
                {isCompleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Complete
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2 bg-black/10">
          <div className="flex items-center gap-2 mb-1">
            {TOPIC_ORDER.map((topic, index) => {
              const currentIndex = getCurrentTopicIndex();
              const isComplete = index < currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div
                  key={topic}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    isComplete
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-magic-gold'
                      : 'bg-white/10'
                  }`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress: {interviewState?.progress || 0}%</span>
            <span>{messages.length} messages</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {message.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                      <span className="font-medium text-magic-gold">AI Interviewer</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>{TOPIC_NAMES[message.topic]}</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed" dir="rtl">
                    {message.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          {(isSending || isTranscribing) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-magic-gold" />
                  <span className="text-sm text-gray-400">
                    {isTranscribing ? 'Transcribing...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <AnimatePresence mode="wait">
            {showVoiceInput ? (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <VoiceRecorder
                  onRecordingComplete={handleVoiceRecording}
                  onCancel={() => setShowVoiceInput(false)}
                  isProcessing={isTranscribing}
                  maxDuration={120}
                  showTextInput={true}
                  onTextSubmit={(text) => {
                    setShowVoiceInput(false);
                    handleSendMessage(text);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center gap-2"
              >
                {/* Voice button */}
                <button
                  onClick={() => setShowVoiceInput(true)}
                  disabled={isSending}
                  className="p-3 rounded-xl bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                  title="Record voice"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer..."
                  dir="rtl"
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  disabled={isSending}
                />

                {/* Send button */}
                <button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim() || isSending}
                  className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
