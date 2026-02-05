/**
 * Voice Service
 * API calls for voice interview and transcription
 */

import api from './api';

// Types
export interface InterviewResponse {
  question: string;
  answer: string;
  topic: 'theme' | 'characters' | 'plot' | 'setting';
  timestamp: string;
  isFollowUp: boolean;
}

export interface CharacterSummary {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  traits: string[];
  description: string;
}

export interface InterviewSummary {
  theme: {
    mainTheme: string;
    subThemes: string[];
    tone: string;
    genre: string;
  };
  characters: CharacterSummary[];
  plot: {
    premise: string;
    conflict: string;
    stakes: string;
    keyEvents: string[];
  };
  setting: {
    world: string;
    timePeriod: string;
    atmosphere: string;
    locations: string[];
  };
  writingGuidelines: string[];
}

export interface InterviewState {
  id: string;
  currentTopic: 'theme' | 'characters' | 'plot' | 'setting';
  questionsAsked: number;
  questionsPerTopic: Record<string, number>;
  responses: InterviewResponse[];
  isComplete: boolean;
  startedAt: string;
  genre?: string;
  targetAudience?: string;
}

// API Responses
interface StartInterviewResponse {
  interviewId: string;
  firstQuestion: string;
  currentTopic: string;
  progress: number;
  state: InterviewState;
}

interface ProcessResponseResult {
  transcribedText: string;
  nextQuestion: string | null;
  currentTopic: string;
  isComplete: boolean;
  progress: number;
  canCompleteEarly: boolean;
  state: InterviewState;
}

interface CompleteInterviewResult {
  summary: InterviewSummary;
  responses: InterviewResponse[];
  duration: number;
  questionsAsked: number;
}

interface TranscribeResult {
  text: string;
  language: string;
}

/**
 * Start a new voice interview
 */
export async function startVoiceInterview(
  genre?: string,
  targetAudience?: string,
  bookId?: string
): Promise<StartInterviewResponse> {
  const response = await api.post('/voice/interview/start', {
    genre,
    targetAudience,
    bookId,
  });
  return response.data.data;
}

/**
 * Process interview response (audio or text)
 */
export async function processInterviewResponse(
  interviewId: string,
  options: {
    audioBlob?: Blob;
    textResponse?: string;
    currentQuestion?: string;
  }
): Promise<ProcessResponseResult> {
  const formData = new FormData();
  formData.append('interviewId', interviewId);

  if (options.audioBlob) {
    formData.append('audio', options.audioBlob, 'recording.webm');
  }

  if (options.textResponse) {
    formData.append('textResponse', options.textResponse);
  }

  if (options.currentQuestion) {
    formData.append('currentQuestion', options.currentQuestion);
  }

  const response = await api.post('/voice/interview/respond', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
}

/**
 * Complete interview and get summary
 */
export async function completeInterview(
  interviewId: string
): Promise<CompleteInterviewResult> {
  const response = await api.post('/voice/interview/complete', {
    interviewId,
  });
  return response.data.data;
}

/**
 * Get interview state
 */
export async function getInterviewState(
  interviewId: string
): Promise<{
  state: InterviewState;
  progress: number;
  canCompleteEarly: boolean;
}> {
  const response = await api.get(`/voice/interview/${interviewId}/state`);
  return response.data.data;
}

/**
 * Save interview summary to book
 */
export async function saveInterviewToBook(
  bookId: string,
  interviewId: string | undefined,
  summary: InterviewSummary,
  responses: InterviewResponse[],
  duration: number
): Promise<{ bookId: string; message: string }> {
  const response = await api.post('/voice/interview/save-to-book', {
    bookId,
    interviewId,
    summary,
    responses,
    duration,
  });
  return response.data.data;
}

/**
 * Cancel/delete an interview
 */
export async function cancelInterview(interviewId: string): Promise<void> {
  await api.delete(`/voice/interview/${interviewId}`);
}

/**
 * Transcribe audio file only (no interview processing)
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscribeResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await api.post('/voice/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
}

/**
 * Format duration to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get topic display name in Hebrew
 */
export function getTopicDisplayName(topic: string): string {
  const topicNames: Record<string, string> = {
    theme: 'נושא הספר',
    characters: 'דמויות',
    plot: 'עלילה',
    setting: 'סביבה',
    summary: 'סיכום',
  };
  return topicNames[topic] || topic;
}

/**
 * Get topic icon
 */
export function getTopicIcon(topic: string): string {
  const topicIcons: Record<string, string> = {
    theme: '💡',
    characters: '👥',
    plot: '📖',
    setting: '🌍',
    summary: '✨',
  };
  return topicIcons[topic] || '📝';
}

export default {
  startVoiceInterview,
  processInterviewResponse,
  completeInterview,
  getInterviewState,
  saveInterviewToBook,
  cancelInterview,
  transcribeAudio,
  formatDuration,
  getTopicDisplayName,
  getTopicIcon,
};
