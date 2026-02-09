/**
 * useTTS Hook
 * Handles text-to-speech using Browser Web Speech API
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTTSResult {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  error: string | null;
}

interface UseTTSOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useTTS(options: UseTTSOptions = {}): UseTTSResult {
  const {
    language = 'en-US',
    rate: initialRate = 1.0,
    pitch: initialPitch = 1.0,
    volume = 1.0,
    onStart,
    onEnd,
    onError,
  } = options;

  // State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(initialRate);
  const [pitch, setPitch] = useState(initialPitch);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  // Check for Web Speech API support
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);

    if (!supported) {
      setError('Your browser does not support text-to-speech');
      return;
    }

    // Load voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Try to find a Hebrew voice
      const hebrewVoice = availableVoices.find(
        (voice) =>
          voice.lang.startsWith('he') ||
          voice.lang.includes('Hebrew') ||
          voice.name.includes('Hebrew')
      );

      // Try to find a voice matching the requested language
      const languageVoice = availableVoices.find((voice) =>
        voice.lang.startsWith(language.split('-')[0])
      );

      // Set default voice
      if (hebrewVoice && language.startsWith('he')) {
        setSelectedVoice(hebrewVoice);
      } else if (languageVoice) {
        setSelectedVoice(languageVoice);
      } else if (availableVoices.length > 0) {
        // Fallback to first available voice
        setSelectedVoice(availableVoices[0]);
      }
    };

    // Load voices immediately if available
    loadVoices();

    // Also listen for voiceschanged event (Chrome loads voices asynchronously)
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [language]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speak text
  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!isSupported) {
          const errorMsg = 'Browser does not support text-to-speech';
          setError(errorMsg);
          if (onError) onError(errorMsg);
          reject(new Error(errorMsg));
          return;
        }

        if (!text || text.trim().length === 0) {
          resolve();
          return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        setError(null);

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;
        resolveRef.current = resolve;

        // Configure utterance
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        utterance.lang = language;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        // Event handlers
        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
          if (onStart) onStart();
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          if (onEnd) onEnd();
          if (resolveRef.current) {
            resolveRef.current();
            resolveRef.current = null;
          }
        };

        utterance.onerror = (event) => {
          setIsSpeaking(false);
          setIsPaused(false);

          // Ignore 'interrupted' errors (normal when stopping)
          if (event.error === 'interrupted') {
            if (resolveRef.current) {
              resolveRef.current();
              resolveRef.current = null;
            }
            return;
          }

          const errorMsg = `Speech error: ${event.error}`;
          setError(errorMsg);
          if (onError) onError(errorMsg);
          reject(new Error(errorMsg));
        };

        utterance.onpause = () => {
          setIsPaused(true);
        };

        utterance.onresume = () => {
          setIsPaused(false);
        };

        // Start speaking
        window.speechSynthesis.speak(utterance);
      });
    },
    [isSupported, selectedVoice, language, rate, pitch, volume, onStart, onEnd, onError]
  );

  // Stop speaking
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, []);

  // Pause speaking
  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking]);

  // Resume speaking
  const resume = useCallback(() => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    error,
  };
}

export default useTTS;
