import { api } from './api';

export interface AISuggestion {
  suggestions: string[];
}

export interface QualityAnalysis {
  scores: {
    writingQuality: number;
    plotStructure: number;
    characterDevelopment: number;
    dialogue: number;
    setting: number;
    originality: number;
  };
  overallScore: number;
  rating: number;
  ratingLabel: 'Masterpiece' | 'Excellent' | 'Good' | 'Fair' | 'Needs Work';
  feedback: string;
  suggestions?: string[];
}

/**
 * Get AI writing suggestions to overcome writer's block
 */
export const getAiSuggestions = async (data: {
  currentText: string;
  genre: string;
  context?: {
    bookTitle?: string;
    chapterTitle?: string;
    characters?: string[];
  };
}): Promise<AISuggestion> => {
  const response = await api.post('/ai/suggestions', data);
  return response.data.data;
};

/**
 * Analyze text quality and get detailed scores
 */
export const getQualityAnalysis = async (data: {
  text: string;
}): Promise<QualityAnalysis> => {
  const response = await api.post('/ai/analyze', data);
  return response.data.data;
};
