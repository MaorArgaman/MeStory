/**
 * VoiceInterviewWizard Component
 * Full voice-based interview for book creation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  X,
  ArrowLeft,
  CheckCircle,
  Edit3,
  Save,
  RefreshCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AIAvatar, { AIAvatarState } from './AIAvatar';
import VoiceRecorder from '../voice/VoiceRecorder';
import { useTTS } from '../../hooks/useTTS';
import {
  startVoiceInterview,
  processInterviewResponse,
  completeInterview,
  getTopicDisplayName,
  getTopicIcon,
  InterviewState,
  InterviewSummary,
  InterviewResponse,
} from '../../services/voiceService';

type WizardStep = 'intro' | 'interview' | 'summary' | 'editing';

interface VoiceInterviewWizardProps {
  bookId?: string;
  genre?: string;
  targetAudience?: string;
  onComplete: (summary: InterviewSummary, responses: InterviewResponse[], duration: number) => void;
  onCancel: () => void;
}

export default function VoiceInterviewWizard({
  bookId,
  genre,
  targetAudience,
  onComplete,
  onCancel,
}: VoiceInterviewWizardProps) {
  // State
  const [step, setStep] = useState<WizardStep>('intro');
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [interviewState, setInterviewState] = useState<InterviewState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [avatarState, setAvatarState] = useState<AIAvatarState>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canCompleteEarly, setCanCompleteEarly] = useState(false);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [duration, setDuration] = useState(0);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [editingSummary, setEditingSummary] = useState<InterviewSummary | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);

  // TTS hook
  const { speak, stop: stopTTS, isSpeaking, isSupported: ttsSupported } = useTTS({
    language: 'he-IL',
    onEnd: () => setAvatarState('listening'),
  });

  // Check microphone permission
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setMicPermissionGranted(true);
      } catch {
        setMicPermissionGranted(false);
      }
    };
    checkMicPermission();
  }, []);

  // Speak question with TTS
  const speakQuestion = useCallback(
    async (question: string) => {
      if (isTTSEnabled && ttsSupported) {
        setAvatarState('speaking');
        try {
          await speak(question);
        } catch (error) {
          console.error('TTS error:', error);
        }
      }
      setAvatarState('listening');
    },
    [isTTSEnabled, ttsSupported, speak]
  );

  // Start interview
  const handleStartInterview = async () => {
    try {
      setIsProcessing(true);
      const result = await startVoiceInterview(genre, targetAudience, bookId);

      setInterviewId(result.interviewId);
      setInterviewState(result.state);
      setCurrentQuestion(result.firstQuestion);
      setProgress(result.progress);
      setStep('interview');

      // Speak the first question
      await speakQuestion(result.firstQuestion);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בהתחלת הראיון');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process response (audio or text)
  const handleResponse = async (audioBlob?: Blob, textResponse?: string) => {
    if (!interviewId) return;

    try {
      setIsProcessing(true);
      setAvatarState('thinking');

      const result = await processInterviewResponse(interviewId, {
        audioBlob,
        textResponse,
        currentQuestion,
      });

      setInterviewState(result.state);
      setProgress(result.progress);
      setCanCompleteEarly(result.canCompleteEarly);

      if (result.isComplete) {
        // Interview complete - get summary
        await handleCompleteInterview();
      } else if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        await speakQuestion(result.nextQuestion);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בעיבוד התשובה');
      setAvatarState('listening');
    } finally {
      setIsProcessing(false);
    }
  };

  // Complete interview
  const handleCompleteInterview = async () => {
    if (!interviewId) return;

    try {
      setIsProcessing(true);
      setAvatarState('thinking');

      const result = await completeInterview(interviewId);

      setSummary(result.summary);
      setEditingSummary(result.summary);
      setResponses(result.responses);
      setDuration(result.duration);
      setStep('summary');
      setAvatarState('idle');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בסיום הראיון');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save and complete
  const handleSaveAndComplete = () => {
    if (editingSummary) {
      onComplete(editingSummary, responses, duration);
    }
  };

  // Cancel handler
  const handleCancel = () => {
    stopTTS();
    onCancel();
  };

  // Render intro step
  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center text-center"
    >
      <AIAvatar state="idle" size="lg" className="mb-8" />

      <h2 className="text-2xl font-bold text-white mb-4">ראיון קולי עם AI</h2>

      <p className="text-gray-300 mb-6 max-w-md">
        אני אשאל אותך שאלות על הספר שאתה רוצה לכתוב. ענה בקול או בטקסט, ובסוף נקבל סיכום מקיף
        שיעזור לך בכתיבה.
      </p>

      {/* Mic permission status */}
      <div className="mb-6">
        {micPermissionGranted === null ? (
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>בודק הרשאות מיקרופון...</span>
          </div>
        ) : micPermissionGranted ? (
          <div className="flex items-center gap-2 text-green-400">
            <Mic className="w-4 h-4" />
            <span>מיקרופון זמין</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-400">
            <MicOff className="w-4 h-4" />
            <span>לא ניתן לגשת למיקרופון - ניתן להקליד תשובות</span>
          </div>
        )}
      </div>

      {/* TTS toggle */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setIsTTSEnabled(!isTTSEnabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isTTSEnabled
              ? 'bg-magic-gold/20 text-magic-gold border border-magic-gold/30'
              : 'bg-white/5 text-gray-400 border border-white/10'
          }`}
        >
          {isTTSEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{isTTSEnabled ? 'הקראה מופעלת' : 'הקראה כבויה'}</span>
        </button>
      </div>

      {/* Topics preview */}
      <div className="grid grid-cols-2 gap-3 mb-8 w-full max-w-sm">
        {(['theme', 'characters', 'plot', 'setting'] as const).map((topic) => (
          <div
            key={topic}
            className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10"
          >
            <span className="text-lg">{getTopicIcon(topic)}</span>
            <span className="text-gray-300 text-sm">{getTopicDisplayName(topic)}</span>
          </div>
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={handleStartInterview}
        disabled={isProcessing}
        className="w-full max-w-sm py-4 px-6 rounded-xl bg-gradient-to-r from-magic-gold to-yellow-500 text-deep-space font-bold text-lg hover:from-yellow-500 hover:to-magic-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>מתחיל...</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span>התחל ראיון</span>
          </>
        )}
      </button>
    </motion.div>
  );

  // Render interview step
  const renderInterview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center"
    >
      {/* Progress bar */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>התקדמות</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-magic-gold to-yellow-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Current topic */}
      {interviewState && (
        <div className="flex items-center gap-2 mb-4 text-magic-gold">
          <span className="text-lg">{getTopicIcon(interviewState.currentTopic)}</span>
          <span className="font-medium">{getTopicDisplayName(interviewState.currentTopic)}</span>
        </div>
      )}

      {/* Avatar */}
      <AIAvatar state={avatarState} size="lg" className="mb-6" />

      {/* Question */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 max-w-lg"
      >
        <p className="text-xl text-white leading-relaxed">{currentQuestion}</p>
      </motion.div>

      {/* Voice recorder */}
      <VoiceRecorder
        onRecordingComplete={(blob) => handleResponse(blob)}
        isProcessing={isProcessing}
        maxDuration={120}
        disabled={isSpeaking || isProcessing}
        showTextInput={true}
        onTextSubmit={(text) => handleResponse(undefined, text)}
        className="mb-6"
      />

      {/* Early complete button */}
      {canCompleteEarly && !isProcessing && (
        <button
          onClick={handleCompleteInterview}
          className="text-magic-gold hover:text-yellow-400 text-sm flex items-center gap-1"
        >
          <CheckCircle className="w-4 h-4" />
          <span>סיים ראיון מוקדם</span>
        </button>
      )}
    </motion.div>
  );

  // Render summary step
  const renderSummary = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">סיכום הראיון</h2>
        <button
          onClick={() => setStep('editing')}
          className="flex items-center gap-2 text-magic-gold hover:text-yellow-400 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>עריכה</span>
        </button>
      </div>

      {editingSummary && (
        <div className="space-y-6">
          {/* Theme */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-magic-gold font-medium mb-2 flex items-center gap-2">
              {getTopicIcon('theme')} {getTopicDisplayName('theme')}
            </h3>
            <p className="text-white">{editingSummary.theme.mainTheme}</p>
            {editingSummary.theme.subThemes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {editingSummary.theme.subThemes.map((sub, i) => (
                  <span key={i} className="text-sm bg-white/10 px-2 py-1 rounded-lg text-gray-300">
                    {sub}
                  </span>
                ))}
              </div>
            )}
            <p className="text-gray-400 text-sm mt-2">טון: {editingSummary.theme.tone}</p>
          </div>

          {/* Characters */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-magic-gold font-medium mb-2 flex items-center gap-2">
              {getTopicIcon('characters')} {getTopicDisplayName('characters')}
            </h3>
            {editingSummary.characters.map((char, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{char.name}</span>
                  <span className="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded">
                    {char.role === 'protagonist'
                      ? 'ראשית'
                      : char.role === 'antagonist'
                      ? 'אנטגוניסט'
                      : char.role === 'supporting'
                      ? 'משנית'
                      : 'משנית'}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{char.description}</p>
              </div>
            ))}
          </div>

          {/* Plot */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-magic-gold font-medium mb-2 flex items-center gap-2">
              {getTopicIcon('plot')} {getTopicDisplayName('plot')}
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-400">רעיון: </span>
                <span className="text-white">{editingSummary.plot.premise}</span>
              </p>
              <p>
                <span className="text-gray-400">קונפליקט: </span>
                <span className="text-white">{editingSummary.plot.conflict}</span>
              </p>
              <p>
                <span className="text-gray-400">מה על כף המאזניים: </span>
                <span className="text-white">{editingSummary.plot.stakes}</span>
              </p>
            </div>
          </div>

          {/* Setting */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-magic-gold font-medium mb-2 flex items-center gap-2">
              {getTopicIcon('setting')} {getTopicDisplayName('setting')}
            </h3>
            <p className="text-white">{editingSummary.setting.world}</p>
            <p className="text-gray-400 text-sm mt-1">
              {editingSummary.setting.timePeriod} | {editingSummary.setting.atmosphere}
            </p>
          </div>

          {/* Writing guidelines */}
          {editingSummary.writingGuidelines.length > 0 && (
            <div className="bg-magic-gold/10 rounded-xl p-4 border border-magic-gold/30">
              <h3 className="text-magic-gold font-medium mb-2">הנחיות לכתיבה</h3>
              <ul className="space-y-1">
                {editingSummary.writingGuidelines.map((guide, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-magic-gold">•</span>
                    <span>{guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={handleCancel}
          className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors border border-white/20"
        >
          ביטול
        </button>
        <button
          onClick={handleSaveAndComplete}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-magic-gold to-yellow-500 text-deep-space font-bold hover:from-yellow-500 hover:to-magic-gold transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          <span>שמור והמשך</span>
        </button>
      </div>
    </motion.div>
  );

  // Render editing step (for detailed edits)
  const renderEditing = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setStep('summary')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white">עריכת סיכום</h2>
      </div>

      {editingSummary && (
        <div className="space-y-6">
          {/* Theme editing */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label className="block text-magic-gold font-medium mb-2">נושא מרכזי</label>
            <textarea
              value={editingSummary.theme.mainTheme}
              onChange={(e) =>
                setEditingSummary({
                  ...editingSummary,
                  theme: { ...editingSummary.theme, mainTheme: e.target.value },
                })
              }
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-magic-gold/50"
              rows={2}
              dir="rtl"
            />
          </div>

          {/* Conflict editing */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label className="block text-magic-gold font-medium mb-2">קונפליקט</label>
            <textarea
              value={editingSummary.plot.conflict}
              onChange={(e) =>
                setEditingSummary({
                  ...editingSummary,
                  plot: { ...editingSummary.plot, conflict: e.target.value },
                })
              }
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-magic-gold/50"
              rows={2}
              dir="rtl"
            />
          </div>

          {/* Setting editing */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label className="block text-magic-gold font-medium mb-2">עולם הסיפור</label>
            <textarea
              value={editingSummary.setting.world}
              onChange={(e) =>
                setEditingSummary({
                  ...editingSummary,
                  setting: { ...editingSummary.setting, world: e.target.value },
                })
              }
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-magic-gold/50"
              rows={2}
              dir="rtl"
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => setStep('summary')}
          className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors border border-white/20"
        >
          חזור לסיכום
        </button>
        <button
          onClick={handleSaveAndComplete}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-magic-gold to-yellow-500 text-deep-space font-bold hover:from-yellow-500 hover:to-magic-gold transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          <span>שמור והמשך</span>
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-space/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-deep-space to-slate-900 border border-white/10 shadow-2xl p-6"
        dir="rtl"
      >
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 left-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 'intro' && renderIntro()}
          {step === 'interview' && renderInterview()}
          {step === 'summary' && renderSummary()}
          {step === 'editing' && renderEditing()}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
