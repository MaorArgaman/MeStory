/**
 * useVoiceRecorder Hook
 * Handles microphone recording using MediaRecorder API
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceRecorderResult {
  isRecording: boolean;
  isSupported: boolean;
  isPaused: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  resetRecording: () => void;
}

interface UseVoiceRecorderOptions {
  maxDuration?: number; // Maximum recording duration in seconds
  onRecordingComplete?: (blob: Blob) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderResult {
  const { maxDuration = 120, onRecordingComplete, onError } = options;

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check for MediaRecorder support
  useEffect(() => {
    const supported = !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    );
    setIsSupported(supported);

    if (!supported) {
      setError('הדפדפן שלך לא תומך בהקלטת קול');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Start timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - (duration * 1000);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDuration(elapsed);

      // Auto-stop if max duration reached
      if (maxDuration && elapsed >= maxDuration) {
        stopRecording();
      }
    }, 100);
  }, [duration, maxDuration]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);
      chunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Optimal for Whisper
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Determine best audio format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }
      };

      // Handle errors
      mediaRecorder.onerror = (event: any) => {
        const errorMsg = event.error?.message || 'שגיאה בהקלטה';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
    } catch (err: any) {
      let errorMsg = 'שגיאה בגישה למיקרופון';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'יש לאשר גישה למיקרופון כדי להקליט';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'לא נמצא מיקרופון. וודא שמיקרופון מחובר למחשב';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'המיקרופון בשימוש על ידי תוכנה אחרת';
      }

      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    }
  }, [startTimer, onRecordingComplete, onError]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      stopTimer();

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        const originalOnStop = mediaRecorderRef.current.onstop;

        mediaRecorderRef.current.onstop = (event) => {
          if (originalOnStop) {
            originalOnStop.call(mediaRecorderRef.current, event);
          }

          const blob = new Blob(chunksRef.current, {
            type: mediaRecorderRef.current?.mimeType || 'audio/webm',
          });

          setIsRecording(false);
          setIsPaused(false);
          resolve(blob);
        };

        mediaRecorderRef.current.stop();
      } else {
        setIsRecording(false);
        setIsPaused(false);
        resolve(null);
      }
    });
  }, [stopTimer]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [stopTimer]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [startTimer]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    stopTimer();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null; // Prevent blob creation
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    chunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setAudioBlob(null);
    setDuration(0);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [stopTimer, audioUrl]);

  // Reset recording state
  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  return {
    isRecording,
    isSupported,
    isPaused,
    audioBlob,
    audioUrl,
    duration,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    resetRecording,
  };
}

export default useVoiceRecorder;
