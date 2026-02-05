/**
 * Text-to-Speech Service
 * Provides AI-powered narration for books
 * Supports multiple TTS providers: Browser API, Google Cloud TTS, ElevenLabs
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// TTS Provider types
export type TTSProvider = 'browser' | 'google' | 'elevenlabs';

export interface TTSRequest {
  text: string;
  language: string; // 'he' for Hebrew, 'en' for English
  voice?: string;
  speed?: number; // 0.5 to 2.0
  provider?: TTSProvider;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  audioDuration?: number;
  provider: TTSProvider;
  error?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: TTSProvider;
}

// Available voices per provider
const VOICES: Record<string, VoiceOption[]> = {
  browser: [
    { id: 'he-IL-Standard', name: 'Hebrew Standard', language: 'he', gender: 'female', provider: 'browser' },
    { id: 'en-US-Standard', name: 'English US', language: 'en', gender: 'female', provider: 'browser' },
    { id: 'en-GB-Standard', name: 'English UK', language: 'en', gender: 'male', provider: 'browser' },
  ],
  google: [
    { id: 'he-IL-Standard-A', name: 'Hebrew Female', language: 'he', gender: 'female', provider: 'google' },
    { id: 'he-IL-Standard-B', name: 'Hebrew Male', language: 'he', gender: 'male', provider: 'google' },
    { id: 'he-IL-Wavenet-A', name: 'Hebrew Premium Female', language: 'he', gender: 'female', provider: 'google' },
    { id: 'he-IL-Wavenet-B', name: 'Hebrew Premium Male', language: 'he', gender: 'male', provider: 'google' },
    { id: 'en-US-Neural2-A', name: 'English US Female', language: 'en', gender: 'female', provider: 'google' },
    { id: 'en-US-Neural2-D', name: 'English US Male', language: 'en', gender: 'male', provider: 'google' },
  ],
  elevenlabs: [
    { id: 'rachel', name: 'Rachel (Calm)', language: 'en', gender: 'female', provider: 'elevenlabs' },
    { id: 'domi', name: 'Domi (Strong)', language: 'en', gender: 'female', provider: 'elevenlabs' },
    { id: 'bella', name: 'Bella (Soft)', language: 'en', gender: 'female', provider: 'elevenlabs' },
    { id: 'antoni', name: 'Antoni (Well-rounded)', language: 'en', gender: 'male', provider: 'elevenlabs' },
    { id: 'josh', name: 'Josh (Young)', language: 'en', gender: 'male', provider: 'elevenlabs' },
    { id: 'arnold', name: 'Arnold (Deep)', language: 'en', gender: 'male', provider: 'elevenlabs' },
  ],
};

/**
 * Get available voices for a language
 */
export function getAvailableVoices(language: string, provider?: TTSProvider): VoiceOption[] {
  const allVoices: VoiceOption[] = [];

  const providers = provider ? [provider] : ['browser', 'google', 'elevenlabs'];

  providers.forEach(p => {
    const providerVoices = VOICES[p] || [];
    const langVoices = providerVoices.filter(v =>
      v.language === language || v.language.startsWith(language)
    );
    allVoices.push(...langVoices);
  });

  return allVoices;
}

/**
 * Generate speech using Google Cloud TTS
 */
async function generateWithGoogleTTS(request: TTSRequest): Promise<TTSResponse> {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      provider: 'google',
      error: 'Google Cloud TTS API key not configured',
    };
  }

  try {
    const languageCode = request.language === 'he' ? 'he-IL' : 'en-US';
    const voiceName = request.voice || (request.language === 'he' ? 'he-IL-Wavenet-A' : 'en-US-Neural2-A');

    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        input: { text: request.text },
        voice: {
          languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: request.speed || 1.0,
          pitch: 0,
        },
      }
    );

    if (response.data.audioContent) {
      // Save audio to file
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const audioDir = path.join(uploadDir, 'audio');
      await fs.mkdir(audioDir, { recursive: true });

      const filename = `tts-${crypto.randomUUID()}.mp3`;
      const filePath = path.join(audioDir, filename);

      await fs.writeFile(filePath, Buffer.from(response.data.audioContent, 'base64'));

      return {
        success: true,
        audioUrl: `/uploads/audio/${filename}`,
        provider: 'google',
      };
    }

    return {
      success: false,
      provider: 'google',
      error: 'No audio content received',
    };
  } catch (error: any) {
    console.error('Google TTS error:', error.response?.data || error.message);
    return {
      success: false,
      provider: 'google',
      error: error.response?.data?.error?.message || 'Failed to generate speech',
    };
  }
}

/**
 * Generate speech using ElevenLabs
 */
async function generateWithElevenLabs(request: TTSRequest): Promise<TTSResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      provider: 'elevenlabs',
      error: 'ElevenLabs API key not configured',
    };
  }

  try {
    const voiceId = request.voice || 'rachel';

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: request.text,
        model_id: 'eleven_multilingual_v2', // Supports Hebrew
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    );

    // Save audio to file
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const audioDir = path.join(uploadDir, 'audio');
    await fs.mkdir(audioDir, { recursive: true });

    const filename = `tts-${crypto.randomUUID()}.mp3`;
    const filePath = path.join(audioDir, filename);

    await fs.writeFile(filePath, response.data);

    return {
      success: true,
      audioUrl: `/uploads/audio/${filename}`,
      provider: 'elevenlabs',
    };
  } catch (error: any) {
    console.error('ElevenLabs TTS error:', error.response?.data || error.message);
    return {
      success: false,
      provider: 'elevenlabs',
      error: error.response?.data?.detail?.message || 'Failed to generate speech',
    };
  }
}

/**
 * Generate speech - main function
 * Falls back to browser API info if no server-side provider is configured
 */
export async function generateSpeech(request: TTSRequest): Promise<TTSResponse> {
  const provider = request.provider || 'browser';

  switch (provider) {
    case 'google':
      return generateWithGoogleTTS(request);

    case 'elevenlabs':
      return generateWithElevenLabs(request);

    case 'browser':
    default:
      // Return info for client-side synthesis
      return {
        success: true,
        provider: 'browser',
        // Client will use Web Speech API
      };
  }
}

/**
 * Generate narration for an entire chapter
 * Splits text into paragraphs for better pacing
 */
export async function generateChapterNarration(
  chapterContent: string,
  language: string,
  provider: TTSProvider = 'browser',
  voice?: string
): Promise<TTSResponse> {
  // Clean HTML from content
  const plainText = chapterContent
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) {
    return {
      success: false,
      provider,
      error: 'No text content to narrate',
    };
  }

  // For browser provider, just return the cleaned text
  if (provider === 'browser') {
    return {
      success: true,
      provider: 'browser',
    };
  }

  // For server-side providers, generate the audio
  return generateSpeech({
    text: plainText,
    language,
    voice,
    provider,
  });
}

/**
 * Clean HTML and prepare text for TTS
 */
export function prepareTextForTTS(htmlContent: string): string {
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
 * Split text into sentences for synchronized highlighting
 */
export function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries, keeping the delimiters
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.filter(s => s.trim().length > 0);
}

/**
 * Estimate speaking duration in seconds
 * Average speaking rate: ~150 words per minute for English
 * Hebrew is slightly slower: ~130 words per minute
 */
export function estimateDuration(text: string, language: string, speed: number = 1.0): number {
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const wordsPerMinute = language === 'he' ? 130 : 150;
  const adjustedWPM = wordsPerMinute * speed;
  return (words / adjustedWPM) * 60;
}
