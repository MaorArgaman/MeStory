/**
 * Analysis API Service
 * API calls for AI text enhancement and analysis features
 */

import { api } from './api';
import {
  EnhanceAction,
  EnhanceContext,
  EnhanceResult,
  PlotAnalysis,
  TensionAnalysis,
  TechniquesAnalysis,
  WritingGuidance,
  ScoreChange,
} from '../types/analysis';

/**
 * Enhance selected text using AI
 */
export const enhanceText = async (
  text: string,
  action: EnhanceAction,
  context?: EnhanceContext
): Promise<EnhanceResult> => {
  const response = await api.post('/analysis/enhance-text', {
    text,
    action,
    context,
  });
  return response.data.data;
};

/**
 * Analyze book plot structure (three-act)
 */
export const analyzePlotStructure = async (bookId: string): Promise<PlotAnalysis> => {
  const response = await api.post(`/analysis/plot-structure/${bookId}`);
  return response.data.data;
};

/**
 * Analyze book tension levels
 */
export const analyzeTension = async (bookId: string): Promise<TensionAnalysis> => {
  const response = await api.post(`/analysis/tension/${bookId}`);
  return response.data.data;
};

/**
 * Analyze writing techniques
 */
export const analyzeWritingTechniques = async (bookId: string): Promise<TechniquesAnalysis> => {
  const response = await api.post(`/analysis/techniques/${bookId}`);
  return response.data.data;
};

/**
 * Check for writing guidance alerts
 */
export const checkWritingGuidance = async (
  bookId: string,
  chapterIndex: number,
  recentText: string
): Promise<WritingGuidance | null> => {
  const response = await api.post('/analysis/guidance', {
    bookId,
    chapterIndex,
    recentText,
  });
  return response.data.data.guidance;
};

/**
 * Interview coverage analysis
 */
export interface TopicCoverage {
  topic: string;
  label: string;
  interviewAnswer: string;
  coverageScore: number;
  status: 'covered' | 'partial' | 'missing';
  gap: string;
  suggestion: string;
}

export interface InterviewCoverage {
  overallScore: number;
  topics: TopicCoverage[];
  topGaps: string[];
  encouragement: string;
}

export const getInterviewCoverage = async (bookId: string): Promise<InterviewCoverage | null> => {
  const response = await api.get(`/analysis/interview-coverage/${bookId}`);
  return response.data.data;
};

/**
 * Calculate score change after AI suggestion applied
 */
export const calculateScoreChange = async (
  previousText: string,
  newText: string,
  bookId?: string,
  chapterIndex?: number
): Promise<ScoreChange> => {
  const response = await api.post('/analysis/score-change', {
    previousText,
    newText,
    bookId,
    chapterIndex,
  });
  return response.data.data;
};
