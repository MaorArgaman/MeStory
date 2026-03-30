/**
 * Gemini TTS Service
 * Text-to-Speech using Google Gemini 2.5 Flash Preview TTS
 * Generates audio files for book narration
 * Uses REST API directly for TTS support
 */

import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';

// Available Gemini TTS voices with gender classification
export const GEMINI_VOICES = {
  // Female voices
  Aoede: { name: 'Aoede', style: 'Breezy', description: 'Light and casual', gender: 'female' },
  Kore: { name: 'Kore', style: 'Firm', description: 'Confident and authoritative', gender: 'female' },
  Leda: { name: 'Leda', style: 'Youthful', description: 'Young and fresh', gender: 'female' },
  Zephyr: { name: 'Zephyr', style: 'Bright', description: 'Cheerful and optimistic', gender: 'female' },
  Despina: { name: 'Despina', style: 'Smooth', description: 'Elegant and refined', gender: 'female' },
  Vindemiatrix: { name: 'Vindemiatrix', style: 'Gentle', description: 'Soothing and calm', gender: 'female' },
  Sulafat: { name: 'Sulafat', style: 'Warm', description: 'Comforting and kind', gender: 'female' },

  // Male voices
  Puck: { name: 'Puck', style: 'Upbeat', description: 'Energetic and lively', gender: 'male' },
  Charon: { name: 'Charon', style: 'Informative', description: 'Clear and educational', gender: 'male' },
  Fenrir: { name: 'Fenrir', style: 'Excitable', description: 'Enthusiastic and dynamic', gender: 'male' },
  Orus: { name: 'Orus', style: 'Firm', description: 'Strong and steady', gender: 'male' },
  Enceladus: { name: 'Enceladus', style: 'Breathy', description: 'Soft and intimate', gender: 'male' },
  Iapetus: { name: 'Iapetus', style: 'Clear', description: 'Crisp and precise', gender: 'male' },
  Umbriel: { name: 'Umbriel', style: 'Easy-going', description: 'Relaxed and friendly', gender: 'male' },
  Algieba: { name: 'Algieba', style: 'Smooth', description: 'Rich and melodic', gender: 'male' },
  Gacrux: { name: 'Gacrux', style: 'Mature', description: 'Wise and experienced', gender: 'male' },
} as const;

export type GeminiVoiceName = keyof typeof GEMINI_VOICES;
export type AuthorGender = 'male' | 'female' | 'unknown';

// Default voices by gender
const DEFAULT_FEMALE_VOICE: GeminiVoiceName = 'Aoede';
const DEFAULT_MALE_VOICE: GeminiVoiceName = 'Charon';

/**
 * Get appropriate voice based on author gender
 */
export function getVoiceForGender(gender: AuthorGender): GeminiVoiceName {
  switch (gender) {
    case 'female':
      return DEFAULT_FEMALE_VOICE;
    case 'male':
      return DEFAULT_MALE_VOICE;
    default:
      return DEFAULT_MALE_VOICE; // Default to male if unknown
  }
}

/**
 * Get all voices filtered by gender
 */
export function getVoicesByGender(gender: 'male' | 'female'): Array<{
  name: string;
  style: string;
  description: string;
}> {
  return Object.values(GEMINI_VOICES)
    .filter(v => v.gender === gender)
    .map(({ name, style, description }) => ({ name, style, description }));
}

// Gemini API configuration
const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function getApiKey(): string {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return process.env.GEMINI_API_KEY;
}

export interface TTSOptions {
  voice?: GeminiVoiceName;
  authorGender?: AuthorGender;
  language?: 'en' | 'he';
}

/**
 * Convert PCM audio data to WAV format
 */
function pcmToWav(pcmData: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize - 8;

  const header = Buffer.alloc(headerSize);

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  // fmt subchunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

/**
 * Generate a cache key for the chapter audio
 */
function generateCacheKey(bookId: string, chapterId: string, voice: string): string {
  const hash = crypto.createHash('md5').update(`${bookId}-${chapterId}-${voice}`).digest('hex');
  return `tts/${bookId}/${hash}.wav`;
}

/**
 * Check if audio exists in cache
 */
async function getAudioFromCache(cacheKey: string): Promise<string | null> {
  try {
    const { data } = supabaseAdmin.storage.from('audio').getPublicUrl(cacheKey);

    // Check if file exists by trying to get it
    const { data: fileData, error } = await supabaseAdmin.storage
      .from('audio')
      .download(cacheKey);

    if (error || !fileData) {
      return null;
    }

    return data.publicUrl;
  } catch {
    return null;
  }
}

/**
 * Save audio to cache
 */
async function saveAudioToCache(cacheKey: string, audioBuffer: Buffer): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from('audio')
    .upload(cacheKey, audioBuffer, {
      contentType: 'audio/wav',
      upsert: true,
    });

  if (error) {
    console.error('Error saving audio to cache:', error);
    throw error;
  }

  const { data } = supabaseAdmin.storage.from('audio').getPublicUrl(cacheKey);
  return data.publicUrl;
}

/**
 * Generate speech from text using Gemini 2.5 Flash TTS via REST API
 */
async function generateSpeechFromGemini(
  text: string,
  voice: GeminiVoiceName = 'Kore'
): Promise<Buffer> {
  const apiKey = getApiKey();
  const url = `${GEMINI_API_BASE}/${GEMINI_TTS_MODEL}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text }]
      }
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice }
        }
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini TTS API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // Extract audio data from response
  const audioData = result.candidates?.[0]?.content?.parts?.[0];

  if (!audioData || !audioData.inlineData?.data) {
    throw new Error('No audio data in response');
  }

  // Decode base64 audio data (PCM format)
  const pcmBuffer = Buffer.from(audioData.inlineData.data, 'base64');

  // Convert to WAV
  return pcmToWav(pcmBuffer);
}

/**
 * Clean HTML content for TTS
 */
function cleanTextForTTS(htmlContent: string): string {
  return htmlContent
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate audio for a chapter
 * Returns URL to the audio file
 */
export async function generateChapterAudio(
  bookId: string,
  chapterId: string,
  chapterContent: string,
  options: TTSOptions = {}
): Promise<{ audioUrl: string; duration: number; cached: boolean; voice: string }> {
  const { authorGender = 'unknown' } = options;
  // Use provided voice or select based on author gender
  const voice = options.voice || getVoiceForGender(authorGender);

  const cacheKey = generateCacheKey(bookId, chapterId, voice);

  // Check cache first
  const cachedUrl = await getAudioFromCache(cacheKey);
  if (cachedUrl) {
    // Estimate duration based on text length (rough estimate: 150 words per minute)
    const plainText = cleanTextForTTS(chapterContent);
    const wordCount = plainText.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60;

    return {
      audioUrl: cachedUrl,
      duration: estimatedDuration,
      cached: true,
      voice,
    };
  }

  // Generate new audio
  const plainText = cleanTextForTTS(chapterContent);

  // Split long text into chunks (Gemini TTS has input limits)
  const maxChunkLength = 4000; // Characters
  const chunks: string[] = [];

  if (plainText.length <= maxChunkLength) {
    chunks.push(plainText);
  } else {
    // Split by paragraphs/sentences
    const sentences = plainText.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
  }

  // Generate audio for each chunk
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    try {
      const audioBuffer = await generateSpeechFromGemini(chunk, voice);
      audioBuffers.push(audioBuffer);
    } catch (error) {
      console.error('Error generating TTS for chunk:', error);
      throw error;
    }
  }

  // Combine all audio buffers
  // For multiple WAV files, we need to combine the PCM data
  let combinedPcm = Buffer.alloc(0);
  for (const wavBuffer of audioBuffers) {
    // Skip WAV header (44 bytes) and get PCM data
    const pcmData = wavBuffer.slice(44);
    combinedPcm = Buffer.concat([combinedPcm, pcmData]);
  }

  // Convert combined PCM to WAV
  const finalAudio = pcmToWav(combinedPcm);

  // Save to cache
  const audioUrl = await saveAudioToCache(cacheKey, finalAudio);

  // Calculate duration (24kHz, 16-bit, mono = 48000 bytes per second)
  const bytesPerSecond = 24000 * 2; // 24kHz * 16-bit (2 bytes)
  const duration = combinedPcm.length / bytesPerSecond;

  return {
    audioUrl,
    duration,
    cached: false,
    voice,
  };
}

/**
 * Get available voices
 */
export function getAvailableVoices(): Array<{
  name: string;
  style: string;
  description: string;
}> {
  return Object.values(GEMINI_VOICES);
}

/**
 * Delete cached audio for a chapter
 */
export async function deleteCachedAudio(bookId: string, chapterId: string, voice: string): Promise<void> {
  const cacheKey = generateCacheKey(bookId, chapterId, voice);

  try {
    await supabaseAdmin.storage.from('audio').remove([cacheKey]);
  } catch (error) {
    console.error('Error deleting cached audio:', error);
  }
}
