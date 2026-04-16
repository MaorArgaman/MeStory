/**
 * Shared Gemini client with circuit breaker.
 * All AI services should import from here instead of instantiating their own client,
 * so one upstream outage fast-fails uniformly across the app.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { geminiBreaker } from '../utils/circuitBreaker';

let genAIClient: GoogleGenerativeAI | null = null;
let modelInstance: GenerativeModel | null = null;

export function getGeminiModel(): GenerativeModel {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  if (!modelInstance) {
    modelInstance = genAIClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return modelInstance;
}

/**
 * Call Gemini through the shared circuit breaker.
 * Fast-fails with CircuitBreakerOpenError after 3 consecutive failures.
 */
export function generateWithBreaker(prompt: string) {
  return geminiBreaker.exec(() => getGeminiModel().generateContent(prompt));
}
