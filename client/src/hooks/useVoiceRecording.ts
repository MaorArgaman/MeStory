/**
 * Voice Recording Hook
 * Real-time voice recording with Whisper transcription
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../services/api';

interface UseVoiceRecordingOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  // Interval in ms to send audio chunks for transcription (default: 3000ms)
  transcriptionInterval?: number;
}

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => Promise<void>;
}

export function useVoiceRecording({
  onTranscription,
  onError,
  language = 'he',
  transcriptionInterval: _transcriptionInterval = 4000, // Reserved for chunked transcription
}: UseVoiceRecordingOptions = {}): UseVoiceRecordingReturn {
  void _transcriptionInterval;
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Get file extension from MIME type
  const getFileExtension = (mimeType: string): string => {
    // Normalize mimeType (remove codecs and extra params)
    const baseMime = mimeType.split(';')[0].trim().toLowerCase();

    const extensions: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/aac': 'm4a',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
    };

    const ext = extensions[baseMime] || 'webm';
    // MIME type resolved
    return ext;
  };

  // Send audio chunk for transcription
  const transcribeChunk = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) {
      // Skip very small chunks (likely silence)
      return;
    }

    setIsTranscribing(true);
    try {
      // Get the correct file extension based on blob type
      const extension = getFileExtension(audioBlob.type);
      const fileName = `recording.${extension}`;

      const formData = new FormData();
      formData.append('audio', audioBlob, fileName);
      formData.append('language', language);

      const response = await api.post('/voice/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data?.text) {
        const text = response.data.data.text.trim();
        if (text && text.length > 0) {
          onTranscription?.(text);
        }
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Transcription failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  }, [language, onTranscription, onError]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Check for browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Voice recording is not supported in this browser');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Create MediaRecorder with fallback formats
      // Safari/iOS doesn't support webm, needs mp4 or specific codecs
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4;codecs=mp4a.40.2', // AAC-LC codec for Safari
        'audio/mp4',
        'audio/aac',
        'audio/x-m4a',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/wav',
        'audio/mpeg',
      ];

      // Log all supported formats for debugging
      const supportedFormats = mimeTypes.filter(m => MediaRecorder.isTypeSupported(m));
      // audio formats checked

      let selectedMimeType = supportedFormats[0] || '';

      if (!selectedMimeType) {
        // Try without specifying mimeType - let browser choose default
        // using browser default format
        selectedMimeType = '';
      }

      // Create MediaRecorder - use default if no specific format works
      const mediaRecorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      // Get actual MIME type from recorder (in case browser chose default)
      mimeTypeRef.current = mediaRecorder.mimeType || selectedMimeType || 'audio/webm';
      chunksRef.current = [];

      // recording started

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Start recording - collect data every second
      mediaRecorder.start(1000);
      setIsRecording(true);

      // Note: We only transcribe when recording stops to avoid duplicates
      // Live transcription would require tracking already-transcribed portions

    } catch (err: any) {
      console.error('Start recording error:', err);
      let errorMessage = 'Failed to start recording';

      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone access.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    // Stop media recorder and transcribe
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();

      // Transcribe the complete recording when stopped
      mediaRecorderRef.current.onstop = async () => {
        if (chunksRef.current.length > 0) {
          const finalBlob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
          // sending recording
          await transcribeChunk(finalBlob);
        }
      };
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, [transcribeChunk]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
