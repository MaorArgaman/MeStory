/**
 * Analysis Types
 * TypeScript interfaces for AI writing analysis features
 */

// Text Enhancement Types
export type EnhanceAction = 'improve' | 'expand' | 'shorten' | 'continue';

export interface EnhanceContext {
  genre?: string;
  bookId?: string;
  bookTitle?: string;
  chapterTitle?: string;
  surroundingText?: string;
}

export interface EnhanceResult {
  originalText: string;
  enhancedText: string;
  explanation: string;
  action: EnhanceAction;
}

// Plot Structure Types
export interface ActInfo {
  chapters: number[];
  percentage: number;
  completeness: number;
  elements: string[];
  suggestions: string[];
}

export interface PlotPoint {
  chapter: number;
  description: string;
}

export interface PlotAnalysis {
  threeActStructure: {
    act1: ActInfo;
    act2: ActInfo;
    act3: ActInfo;
  };
  plotPoints: {
    incitingIncident?: PlotPoint;
    midpoint?: PlotPoint;
    climax?: PlotPoint;
  };
  balance: 'balanced' | 'front-heavy' | 'back-heavy' | 'middle-heavy';
  suggestions: string[];
}

// Tension Analysis Types
export interface TensionMoment {
  position: number;
  type: 'conflict' | 'revelation' | 'resolution' | 'cliffhanger' | 'suspense';
  description: string;
}

export interface ChapterTension {
  chapterIndex: number;
  title: string;
  tensionLevel: number;
  type: 'rising' | 'falling' | 'peak' | 'valley' | 'stable';
  keyMoments: TensionMoment[];
}

export interface TensionAnalysis {
  chapters: ChapterTension[];
  overallArc: 'classic' | 'episodic' | 'building' | 'flat' | 'irregular';
  suggestions: string[];
}

// Writing Techniques Types
export interface TechniqueExample {
  chapterIndex: number;
  excerpt: string;
  analysis: string;
  quality: 'excellent' | 'good' | 'needs-improvement';
}

export interface TechniqueScore {
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  examples: TechniqueExample[];
  suggestions: string[];
}

export interface WritingTechniques {
  tensionCreation: TechniqueScore;
  problemResolution: TechniqueScore;
  characterDevelopment: TechniqueScore;
  motifsThemes: TechniqueScore;
  dialogueQuality: TechniqueScore;
  pacing: TechniqueScore;
}

export interface TechniquesAnalysis {
  techniques: WritingTechniques;
  overallScore: number;
  improvements: string[];
}

// Writing Guidance Types
export interface GuidanceSuggestion {
  text: string;
  insertable?: string;
}

export interface WritingGuidance {
  type: 'deviation' | 'structure' | 'tension' | 'character' | 'pacing' | 'theme';
  severity: 'info' | 'warning' | 'suggestion';
  message: string;
  context?: string;
  suggestions: GuidanceSuggestion[];
  dismissible: boolean;
}

// Score Change Types
export interface ScoreBreakdown {
  category: string;
  previousValue: number;
  newValue: number;
  delta: number;
}

export interface ScoreChange {
  previousScore: number;
  newScore: number;
  delta: number;
  breakdown: ScoreBreakdown[];
  improvements: string[];
  newRating: number;
  newRatingLabel: string;
}

// Analysis Panel Tab Types
export type AnalysisTab = 'copilot' | 'plot' | 'analysis';
