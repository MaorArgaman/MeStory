import OpenAI from 'openai';
import fs from 'fs';

// Lazy-initialize OpenAI client (only when API key is available)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  // Debug logging for serverless environments
  console.log('🔑 Checking OPENAI_API_KEY:', apiKey ? `configured (${apiKey.substring(0, 12)}...)` : 'NOT SET');

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    console.error('🔍 Available API-related env vars:', Object.keys(process.env).filter(k =>
      k.includes('OPENAI') || k.includes('API') || k.includes('KEY')
    ).join(', '));
    throw new Error('OPENAI_API_KEY is not configured. Please add it to Vercel Environment Variables.');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
    console.log('✅ OpenAI client initialized successfully');
  }
  return openaiClient;
}

/**
 * Transcribe audio file to text using OpenAI Whisper
 * Supports multiple languages including English and Hebrew
 * Section 4.1: Audio Upload → Transcription → Book
 */
export async function transcribeAudio(
  filePath: string,
  language?: string
): Promise<{ text: string; language: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log(`🎤 Starting audio transcription for file: ${filePath}`);

    // Create a readable stream from the file
    const audioFile = fs.createReadStream(filePath);

    // Call Whisper API
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language || undefined, // Auto-detect if not specified
      response_format: 'verbose_json', // Get detailed response with language detection
    });

    console.log(`✅ Audio transcription completed. Detected language: ${transcription.language}`);

    return {
      text: transcription.text,
      language: transcription.language || 'en',
    };
  } catch (error: any) {
    console.error('Whisper API error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });

    // Provide helpful error messages
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.');
    }

    if (error.response?.status === 413) {
      throw new Error('Audio file is too large. Maximum size is 25MB.');
    }

    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

/**
 * Get estimated cost for audio transcription
 * Whisper pricing: $0.006 per minute
 */
export function estimateTranscriptionCost(durationSeconds: number): number {
  const durationMinutes = durationSeconds / 60;
  const costPerMinute = 0.006;
  return Number((durationMinutes * costPerMinute).toFixed(4));
}

/**
 * Validate audio file format
 */
export function isValidAudioFormat(filename: string): boolean {
  const validExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return validExtensions.includes(extension);
}
