/**
 * AI Interview API Service
 * Handles communication with the AI interview backend
 */

import { api } from './api';

// Interview topics (8 pillars)
export type InterviewTopic =
  | 'theme'
  | 'characters'
  | 'conflict'
  | 'climax'
  | 'resolution'
  | 'setting'
  | 'keyPoints'
  | 'narrativeArc';

// Message interface
export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  topic: InterviewTopic;
  timestamp: Date;
}

// Interview state from server
export interface InterviewState {
  id: string;
  currentTopic: InterviewTopic;
  questionsAsked: number;
  messages: ChatMessage[];
  isComplete: boolean;
  progress: number;
  canCompleteEarly: boolean;
}

// Interview summary
export interface InterviewSummary {
  theme: string;
  characters: string;
  conflict: string;
  climax: string;
  resolution: string;
  setting: string;
  keyPoints: string;
  narrativeArc: string;
}

// Start a new interview
export async function startInterview(
  genre?: string,
  targetAudience?: string
): Promise<{ state: InterviewState; firstMessage: ChatMessage }> {
  const response = await api.post('/ai/interview/start', {
    genre,
    targetAudience,
  });
  return response.data.data;
}

// Send a message and get AI response
export async function sendInterviewMessage(
  interviewId: string,
  message: string
): Promise<{
  state: InterviewState;
  aiMessage: ChatMessage;
  topicTransition?: string;
}> {
  const response = await api.post(`/ai/interview/${interviewId}/message`, {
    message,
  });
  return response.data.data;
}

// Get current interview state
export async function getInterviewState(
  interviewId: string
): Promise<InterviewState> {
  const response = await api.get(`/ai/interview/${interviewId}/state`);
  return response.data.data;
}

// Complete the interview and get summary
export async function completeInterview(
  interviewId: string
): Promise<InterviewSummary> {
  const response = await api.post(`/ai/interview/${interviewId}/complete`);
  return response.data.data;
}

// Cancel/delete an interview
export async function cancelInterview(interviewId: string): Promise<void> {
  await api.delete(`/ai/interview/${interviewId}`);
}

// Topic display names (Hebrew)
export const TOPIC_NAMES: Record<InterviewTopic, string> = {
  theme: 'נושא ורעיון מרכזי',
  characters: 'דמויות ראשיות',
  conflict: 'קונפליקט מרכזי',
  climax: 'שיא מתוכנן',
  resolution: 'סיום ופתרון',
  setting: 'סביבה ועולם',
  keyPoints: 'נקודות מפתח בעלילה',
  narrativeArc: 'קשת נרטיבית וטון',
};

// Topic order for progress display
export const TOPIC_ORDER: InterviewTopic[] = [
  'theme',
  'characters',
  'conflict',
  'climax',
  'resolution',
  'setting',
  'keyPoints',
  'narrativeArc',
];
