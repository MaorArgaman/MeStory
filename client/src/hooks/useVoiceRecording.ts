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
  transcriptionInterval = 4000,
}: UseVoiceRecordingOptions = {}): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const allChunksRef = useRef<Blob[]>([]); // Keep all chunks for valid file creation
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const lastSentIndexRef = useRef<number>(0); // Track which chunks we've sent

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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
    console.log(`🎵 MIME type: ${mimeType} -> extension: ${ext}`);
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

  // Process accumulated chunks - send full recording for valid file format
  const processChunks = useCallback(async () => {
    // Only process if we have new chunks since last send
    if (allChunksRef.current.length === 0) return;
    if (allChunksRef.current.length <= lastSentIndexRef.current) return;

    // Create blob from ALL chunks (includes header from first chunk)
    const audioBlob = new Blob(allChunksRef.current, { type: mimeTypeRef.current });

    // Update the last sent index
    lastSentIndexRef.current = allChunksRef.current.length;

    console.log('📤 Sending audio blob:', audioBlob.size, 'bytes,', allChunksRef.current.length, 'chunks');

    await transcribeChunk(audioBlob);
  }, [transcribeChunk]);

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
      console.log('🎵 Supported audio formats:', supportedFormats);

      let selectedMimeType = supportedFormats[0] || '';

      if (!selectedMimeType) {
        // Try without specifying mimeType - let browser choose default
        console.log('⚠️ No specific format supported, using browser default');
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
      allChunksRef.current = []; // Reset all chunks for new recording
      lastSentIndexRef.current = 0; // Reset sent index

      console.log('🎤 Recording with MIME type:', selectedMimeType);

      // Handle data available - add to both refs
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          allChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Set up interval for periodic transcription
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          // Request data from recorder
          mediaRecorderRef.current.requestData();
          // Process accumulated chunks
          processChunks();
        }
      }, transcriptionInterval);

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
  }, [processChunks, transcriptionInterval, onError]);

  const stopRecording = useCallback(() => {
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();

      // Process final recording with all chunks
      mediaRecorderRef.current.onstop = async () => {
        if (allChunksRef.current.length > 0) {
          // Send the complete recording
          const finalBlob = new Blob(allChunksRef.current, { type: mimeTypeRef.current });
          console.log('📤 Sending final recording:', finalBlob.size, 'bytes');
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
