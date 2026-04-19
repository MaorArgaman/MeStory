import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { generateWithBreaker } from './geminiClient';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Lazy-initialize Gemini AI client (only when API key is available)
let genAIClient: GoogleGenerativeAI | null = null;
let modelInstance: GenerativeModel | null = null;
let imageModelInstance: GenerativeModel | null = null;

function getGeminiModel(): GenerativeModel {
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
 * Get Gemini model configured for image generation (Nano Banana 2)
 * Tries multiple model names for compatibility
 */
function getGeminiImageModel(): GenerativeModel {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  if (!imageModelInstance) {
    // Try the image generation model - use gemini-2.5-flash or imagen-3.0
    const modelName = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash';
    console.log(`🍌 Using Gemini image model: ${modelName}`);
    imageModelInstance = genAIClient.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
      }
    });
  }
  return imageModelInstance;
}

export interface ImageGenerationRequest {
  prompt: string;
  bookContext?: {
    title?: string;
    genre?: string;
    chapterTitle?: string;
    sceneDescription?: string;
  };
  style?: 'realistic' | 'illustration' | 'artistic' | 'manga' | 'watercolor' | 'oil-painting';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  prompt: string;
  enhancedPrompt?: string;
  error?: string;
}

/**
 * Generate an enhanced image prompt based on user input and book context
 * IMPORTANT: Preserves the user's original intent while translating to English
 */
export async function generateEnhancedPrompt(request: ImageGenerationRequest): Promise<string> {
  const { prompt, bookContext, style } = request;

  console.log('🎨 Enhancing prompt - Original:', prompt);

  try {
    const contextInfo = bookContext ? `
Book Title: ${bookContext.title || 'Unknown'}
Genre: ${bookContext.genre || 'Fiction'}
Chapter: ${bookContext.chapterTitle || 'Unknown'}
Scene: ${bookContext.sceneDescription || 'Not specified'}
` : '';

    const styleGuide = style ? `
Requested Style: ${style}
` : '';

    const aiPrompt = `You are a professional translator and image prompt engineer. Your task is to translate and enhance an image generation prompt.

USER'S ORIGINAL REQUEST (may be in Hebrew or any language):
"${prompt}"

${contextInfo}
${styleGuide}

CRITICAL INSTRUCTIONS:
1. FIRST: Translate the user's request EXACTLY to English - preserve ALL specific details they mentioned
2. THEN: Add visual quality enhancers (lighting, atmosphere, style)
3. DO NOT change the core subject or meaning of the user's request
4. DO NOT replace specific items with generic ones
5. If user asked for "a cat sitting on a red chair" - the output MUST include a cat on a red chair

Example:
- User input (Hebrew): "ילדה קטנה עם שיער אדום מחזיקה בלון כחול בפארק"
- Correct output: "A little girl with red hair holding a blue balloon in a park, soft natural lighting, warm atmosphere, illustration style"
- WRONG output: "A child playing outdoors" (this loses all the specific details!)

OUTPUT REQUIREMENTS:
- Must be in ENGLISH
- Must preserve ALL specific elements from the user's request
- Under 300 characters
- No quotes or explanations, just the prompt

Respond with ONLY the enhanced prompt:`;

    const result = await generateWithBreaker(aiPrompt);
    const response = result.response;
    const enhancedPrompt = response.text().trim();

    console.log('🎨 Enhanced prompt result:', enhancedPrompt);

    return enhancedPrompt;
  } catch (error) {
    console.error('Error generating enhanced prompt:', error);
    // On error, try a simple translation approach
    console.log('🎨 Falling back to original prompt');
    return prompt;
  }
}

/**
 * Generate image using a placeholder service (can be replaced with actual AI image generation)
 * For production, integrate with DALL-E, Stability AI, Midjourney, etc.
 */
/**
 * Simple translation of Hebrew prompt to English (preserves meaning exactly)
 */
async function translatePromptToEnglish(prompt: string): Promise<string> {
  // Check if prompt contains Hebrew characters
  const hasHebrew = /[\u0590-\u05FF]/.test(prompt);

  if (!hasHebrew) {
    console.log('🌐 Prompt is already in English');
    return prompt;
  }

  console.log('🌐 Translating Hebrew prompt to English...');

  try {
    const translationPrompt = `Translate this Hebrew text to English.
IMPORTANT: Translate EXACTLY - do not add, remove, or change anything. Just translate word for word.

Hebrew text: "${prompt}"

Reply with ONLY the English translation, nothing else:`;

    const result = await generateWithBreaker(translationPrompt);
    const translated = result.response.text().trim();

    console.log('🌐 Translation result:', translated);
    return translated;
  } catch (error) {
    console.error('🌐 Translation failed, using original:', error);
    return prompt; // Fallback to original if translation fails
  }
}

export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  try {
    console.log('🖼️ ====== IMAGE GENERATION STARTED ======');
    console.log('🖼️ Original prompt:', request.prompt);
    console.log('🖼️ Style:', request.style);
    console.log('🖼️ Aspect ratio:', request.aspectRatio);

    // Translate Hebrew to English if needed (simple translation, no enhancement)
    const translatedPrompt = await translatePromptToEnglish(request.prompt);

    // Add style modifiers without changing the core meaning
    const styleModifier = request.style ? `, ${request.style} style` : ', illustration style';
    const enhancedPrompt = `${translatedPrompt}${styleModifier}, high quality, detailed`;
    console.log('🖼️ Final prompt for image generation:', enhancedPrompt);

    // Use Gemini (Imagen) as primary service - free with API key
    const configuredService = process.env.IMAGE_GENERATION_SERVICE || 'gemini';
    console.log('🖼️ Configured service:', configuredService);

    let imageUrl: string;

    // Try Gemini/Imagen first (free with API key)
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('🎨 Using Gemini Imagen for image generation...');
        imageUrl = await generateWithNanoBananaPro(enhancedPrompt, request.aspectRatio);
        return {
          success: true,
          imageUrl,
          prompt: request.prompt,
          enhancedPrompt,
        };
      } catch (geminiError: any) {
        console.error('❌ Gemini Imagen failed:', geminiError.message);
        // Return a placeholder image with error message
        console.log('🔄 Using placeholder image...');
        imageUrl = generatePlaceholderImage(request.bookContext?.genre || 'fiction', request.aspectRatio);
        return {
          success: true,
          imageUrl,
          prompt: request.prompt,
          enhancedPrompt,
          error: 'AI generation failed, using placeholder',
        };
      }
    }

    // Fallback based on configured service
    switch (configuredService) {
      case 'dalle':
      case 'openai':
        // DALL-E 3 via OpenAI
        imageUrl = await generateWithDallE(enhancedPrompt, request.aspectRatio);
        break;

      case 'pollinations':
        // Free AI image generation via Pollinations.ai (currently broken)
        imageUrl = await generateWithPollinations(enhancedPrompt, request.aspectRatio);
        break;

      case 'stability':
        // Stability AI (requires API key)
        imageUrl = await generateWithStabilityAI(enhancedPrompt, request);
        break;

      case 'gemini':
      case 'nano-banana':
        // Nano Banana 2 - Gemini 3.1 Flash Image Preview (with Pollinations fallback)
        try {
          imageUrl = await generateWithNanoBananaPro(enhancedPrompt, request.aspectRatio);
        } catch (nanoBananaError: any) {
          console.log('🍌 Nano Banana 2 failed, falling back to Pollinations...');
          console.log('🍌 Error was:', nanoBananaError.message);
          imageUrl = await generateWithPollinationsEnhanced(enhancedPrompt, request.aspectRatio);
        }
        break;

      case 'placeholder':
      default:
        // Generate a themed placeholder image based on book genre
        imageUrl = generatePlaceholderImage(request.bookContext?.genre || 'fiction', request.aspectRatio);
        break;
    }

    return {
      success: true,
      imageUrl,
      prompt: request.prompt,
      enhancedPrompt,
    };
  } catch (error: any) {
    console.error('Image generation error:', error);
    return {
      success: false,
      prompt: request.prompt,
      error: error.message || 'Failed to generate image',
    };
  }
}

/**
 * Generate image using Pollinations.ai (free service)
 */
async function generateWithPollinations(prompt: string, aspectRatio?: string): Promise<string> {
  // Pollinations.ai provides free AI image generation
  // URL format: https://pollinations.ai/p/{encoded_prompt}
  const encodedPrompt = encodeURIComponent(prompt);

  // Determine dimensions based on aspect ratio
  let width = 512;
  let height = 512;

  switch (aspectRatio) {
    case '16:9':
      width = 896;
      height = 512;
      break;
    case '9:16':
      width = 512;
      height = 896;
      break;
    case '4:3':
      width = 640;
      height = 480;
      break;
    case '3:4':
      width = 480;
      height = 640;
      break;
    case '1:1':
    default:
      width = 512;
      height = 512;
  }

  const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${Date.now()}&nologo=true`;

  // Check if running on Vercel - if so, return direct URL (no local storage in serverless)
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  if (isVercel) {
    console.log('🌐 Running on Vercel - returning direct Pollinations URL');
    // Pollinations generates images on-demand when the URL is accessed by the browser
    // Don't do HEAD check as it can fail - just return the URL directly
    return imageUrl;
  }

  // Download the image and save it locally for non-Vercel environments
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 60000 // 60 second timeout for image generation
    });

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filename = `ai-generated-${crypto.randomUUID()}.png`;
    const filePath = path.join(uploadDir, filename);

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Save the image
    await fs.writeFile(filePath, response.data);

    // Return local URL
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error downloading generated image:', error);
    // Return the direct URL if download fails
    return imageUrl;
  }
}

/**
 * Generate image using DALL-E 3 via OpenAI (high quality, reliable)
 */
async function generateWithDallE(prompt: string, aspectRatio?: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🎨 DALL-E 3: Starting image generation');

  // Determine size based on aspect ratio
  // DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792
  let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';

  switch (aspectRatio) {
    case '16:9':
    case '4:3':
      size = '1792x1024'; // Landscape
      break;
    case '9:16':
    case '3:4':
      size = '1024x1792'; // Portrait (great for book covers)
      break;
    case '1:1':
    default:
      size = '1024x1024'; // Square
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: `${prompt}. High quality, professional, no text or watermarks.`,
        n: 1,
        size,
        quality: 'standard',
        style: 'vivid',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 120000, // 2 minute timeout
      }
    );

    if (response.data.data && response.data.data.length > 0) {
      const imageUrl = response.data.data[0].url;
      console.log('✅ DALL-E 3: Image generated successfully');
      return imageUrl;
    }

    throw new Error('No image generated by DALL-E');
  } catch (error: any) {
    console.error('DALL-E 3 error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Generate image using Stability AI (requires API key)
 */
async function generateWithStabilityAI(prompt: string, request: ImageGenerationRequest): Promise<string> {
  const apiKey = process.env.STABILITY_API_KEY;

  if (!apiKey) {
    throw new Error('Stability AI API key not configured');
  }

  // Determine dimensions based on aspect ratio
  let width = 512;
  let height = 512;

  switch (request.aspectRatio) {
    case '16:9':
      width = 896;
      height = 512;
      break;
    case '9:16':
      width = 512;
      height = 896;
      break;
    case '4:3':
      width = 640;
      height = 480;
      break;
    case '3:4':
      width = 480;
      height = 640;
      break;
  }

  const response = await axios.post(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      text_prompts: [
        {
          text: prompt,
          weight: 1,
        },
        {
          text: 'blurry, bad quality, watermark, text, signature',
          weight: -1,
        },
      ],
      cfg_scale: 7,
      width,
      height,
      samples: 1,
      steps: 30,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (response.data.artifacts && response.data.artifacts.length > 0) {
    const imageData = response.data.artifacts[0].base64;

    // Check if running on Vercel - if so, return as data URL (no local storage)
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
    if (isVercel) {
      console.log('🌐 Running on Vercel - returning base64 data URL for Stability AI image');
      return `data:image/png;base64,${imageData}`;
    }

    // Save the base64 image locally for non-Vercel environments
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filename = `ai-generated-${crypto.randomUUID()}.png`;
    const filePath = path.join(uploadDir, filename);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, Buffer.from(imageData, 'base64'));

    return `/uploads/${filename}`;
  }

  throw new Error('No image generated');
}

/**
 * Generate image using Nano Banana 2 (Gemini 3.1 Flash Image Preview)
 * Model: gemini-3.1-flash-image-preview
 * Fallback models: gemini-2.5-flash, imagen-3.0-generate-002
 * Docs: https://ai.google.dev/gemini-api/docs/image-generation
 */
async function generateWithNanoBananaPro(prompt: string, aspectRatio?: string): Promise<string> {
  // Try multiple model names in order of preference
  const MODEL_OPTIONS = [
    'gemini-3.1-flash-image-preview',  // Nano Banana 2
    'gemini-2.5-flash',                // Gemini 2.5 Flash (stable)
    'gemini-2.5-pro',                  // Gemini 2.5 Pro (fallback)
  ];

  console.log(`🍌 Nano Banana 2: Starting image generation`);
  console.log(`🍌 API Key configured: ${process.env.GEMINI_API_KEY ? 'Yes (starts with ' + process.env.GEMINI_API_KEY.slice(0, 10) + '...)' : 'No'}`);
  console.log(`🍌 Prompt: ${prompt.slice(0, 100)}...`);

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Determine dimensions description based on aspect ratio
  let dimensionPrompt = 'square format';
  switch (aspectRatio) {
    case '16:9':
      dimensionPrompt = 'wide landscape format (16:9 ratio)';
      break;
    case '9:16':
      dimensionPrompt = 'tall portrait format (9:16 ratio), perfect for book cover';
      break;
    case '4:3':
      dimensionPrompt = 'landscape format (4:3 ratio)';
      break;
    case '3:4':
      dimensionPrompt = 'portrait format (3:4 ratio)';
      break;
    case '1:1':
      dimensionPrompt = 'square format (1:1 ratio)';
      break;
  }

  // Create the image generation prompt
  const imagePrompt = `Create a ${dimensionPrompt} image: ${prompt}. High quality, professional, no text or watermarks.`;

  let lastError: any = null;

  // Try each model in order
  for (const MODEL_NAME of MODEL_OPTIONS) {
    console.log(`🍌 Trying model: ${MODEL_NAME}`);

    try {
      // Use Gemini API with responseModalities for image generation
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{ text: imagePrompt }]
          }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minute timeout
        }
      );

      console.log(`🍌 ${MODEL_NAME}: Response received (status ${response.status})`);

      // Parse the response for image data
      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            // Check for inline data (base64 image)
            if (part.inlineData) {
              const imageData = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || 'image/png';
              console.log(`🍌 ${MODEL_NAME}: SUCCESS! Got image (${mimeType}, ${(imageData.length / 1024).toFixed(1)}KB)`);

              // Return as data URL for direct use
              return `data:${mimeType};base64,${imageData}`;
            }
          }
        }

        // Log what we got instead of an image
        console.log(`🍌 ${MODEL_NAME}: Response had candidates but no image. Parts:`,
          JSON.stringify(parts?.map((p: any) => Object.keys(p)) || 'none'));
      }

      // No image found in response - try next model
      console.log(`🍌 ${MODEL_NAME}: No image in response, trying next model...`);

    } catch (error: any) {
      lastError = error;
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error(`🍌 ${MODEL_NAME} error:`, errorMsg);

      // Log detailed error for debugging
      if (error.response?.data?.error) {
        console.error(`🍌 Error details:`, JSON.stringify(error.response.data.error, null, 2).slice(0, 500));
      }

      // If it's a model not found error, try next model
      if (errorMsg?.includes('not found') || errorMsg?.includes('not supported') || error.response?.status === 404) {
        console.log(`🍌 Model ${MODEL_NAME} not available, trying next...`);
        continue;
      }

      // For other errors (rate limit, etc.), throw immediately
      throw error;
    }
  }

  // All models failed
  console.error('🍌 All Nano Banana models failed');
  throw lastError || new Error('No image generation model available');
}

/**
 * Generate image using Pollinations with enhanced prompt (helper for Nano Banana)
 * Includes retry logic and quality validation for professional book covers
 */
async function generateWithPollinationsEnhanced(prompt: string, aspectRatio?: string, maxRetries: number = 3): Promise<string> {
  // Use higher quality settings for book covers
  let width = 1024;
  let height = 1024;

  switch (aspectRatio) {
    case '16:9':
      width = 1792;
      height = 1024;
      break;
    case '9:16':
      width = 1024;
      height = 1792;
      break;
    case '4:3':
      width = 1280;
      height = 960;
      break;
    case '3:4':
      width = 960;
      height = 1280;
      break;
    case '1:1':
    default:
      width = 1024;
      height = 1024;
  }

  // Truncate prompt but keep all characters (URL encoding handles special chars)
  // Don't remove Hebrew/Arabic/etc. characters - they work fine when URL encoded
  let sanitizedPrompt = prompt
    .replace(/[\r\n\t]+/g, ' ') // Replace newlines/tabs with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .slice(0, 400); // Limit length for URL safety

  // Enhanced prompt for professional quality
  const enhancedPrompt = `${sanitizedPrompt}, professional quality, high resolution, sharp details, no text, no watermarks`;
  const encodedPrompt = encodeURIComponent(enhancedPrompt);

  console.log(`🎨 Pollinations Enhanced: generating with prompt: "${enhancedPrompt.slice(0, 100)}..."`);
  console.log(`🎨 Encoded prompt length: ${encodedPrompt.length}`);

  // Use unique seed based on prompt hash + timestamp to ensure fresh images
  const promptHash = prompt.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  const baseSeed = Math.abs(promptHash) + Date.now();

  // Retry logic with different seeds
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const seed = baseSeed + attempt * 12345;
    const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    console.log(`🎨 Attempt ${attempt}/${maxRetries} - Full URL: ${imageUrl.slice(0, 200)}...`);

    // Check if running on Vercel - if so, return direct URL (no local storage in serverless)
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
    if (isVercel) {
      console.log('🌐 Vercel: returning direct Pollinations URL');
      // Pollinations generates images on-demand - return URL directly
      return imageUrl;
    }

    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 120000 // 2 minute timeout for high-quality generation
      });

      // Quality validation - check minimum file size (at least 50KB for good quality)
      const minFileSize = 50 * 1024; // 50KB
      if (response.data.length < minFileSize && attempt < maxRetries) {
        console.log(`⚠️ Image too small (${response.data.length} bytes), retrying...`);
        continue;
      }

      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const filename = `nano-banana-${crypto.randomUUID()}.png`;
      const filePath = path.join(uploadDir, filename);

      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(filePath, response.data);

      console.log(`✅ High-quality image saved: ${filename} (${(response.data.length / 1024).toFixed(1)}KB)`);
      return `/uploads/${filename}`;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        console.log('🔄 All retries failed, returning direct URL');
        return imageUrl;
      }
    }
  }

  // Fallback - return direct URL
  const seed = Date.now();
  return `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux`;
}

/**
 * Generate a placeholder image URL based on genre
 * Uses picsum.photos or similar service for themed placeholders
 */
function generatePlaceholderImage(genre: string, aspectRatio?: string): string {
  // Determine dimensions based on aspect ratio
  let width = 400;
  let height = 400;

  switch (aspectRatio) {
    case '16:9':
      width = 640;
      height = 360;
      break;
    case '9:16':
      width = 360;
      height = 640;
      break;
    case '4:3':
      width = 480;
      height = 360;
      break;
    case '3:4':
      width = 360;
      height = 480;
      break;
  }

  // Use Lorem Picsum with a seed based on genre for consistent placeholder images
  const genreSeed = genre.toLowerCase().replace(/\s+/g, '-');
  const randomSeed = Math.floor(Math.random() * 1000);

  return `https://picsum.photos/seed/${genreSeed}-${randomSeed}/${width}/${height}`;
}

/**
 * Generate multiple image variations
 */
export async function generateImageVariations(
  request: ImageGenerationRequest,
  count: number = 4
): Promise<ImageGenerationResult[]> {
  const results: ImageGenerationResult[] = [];

  // Generate base enhanced prompt
  const basePrompt = await generateEnhancedPrompt(request);

  // Generate variations by adding different modifiers
  const variations = [
    basePrompt,
    `${basePrompt}, dramatic lighting`,
    `${basePrompt}, soft ethereal glow`,
    `${basePrompt}, vibrant colors`,
  ];

  for (let i = 0; i < Math.min(count, variations.length); i++) {
    const result = await generateImage({
      ...request,
      prompt: variations[i],
    });
    results.push(result);
  }

  return results;
}

/**
 * Generate book illustration based on chapter content
 */
export async function generateBookIllustration(
  chapterContent: string,
  bookContext: ImageGenerationRequest['bookContext'],
  style: ImageGenerationRequest['style'] = 'illustration'
): Promise<ImageGenerationResult> {
  try {
    // Use Gemini to extract key visual elements from the chapter
    const analysisPrompt = `Analyze the following book chapter excerpt and describe the most visually compelling scene that would make a great illustration.

CHAPTER CONTENT:
${chapterContent.slice(0, 2000)}

BOOK CONTEXT:
Title: ${bookContext?.title || 'Unknown'}
Genre: ${bookContext?.genre || 'Fiction'}
Chapter: ${bookContext?.chapterTitle || 'Unknown'}

Describe the scene in 2-3 sentences, focusing on:
- Main characters or subjects
- Setting and environment
- Mood and atmosphere
- Key visual elements

Respond with ONLY the scene description, no other text.`;

    const result = await generateWithBreaker(analysisPrompt);
    const sceneDescription = result.response.text().trim();

    // Generate the illustration
    return await generateImage({
      prompt: sceneDescription,
      bookContext: {
        ...bookContext,
        sceneDescription,
      },
      style,
      aspectRatio: '4:3', // Good ratio for book illustrations
    });
  } catch (error: any) {
    console.error('Error generating book illustration:', error);
    return {
      success: false,
      prompt: 'Book illustration',
      error: error.message || 'Failed to generate illustration',
    };
  }
}

/**
 * Book Cover Generation Options
 */
// Style type for image generation
export type ImageStyle = 'realistic' | 'illustration' | 'artistic' | 'manga' | 'watercolor' | 'oil-painting' | (string & {});

export interface BookCoverGenerationRequest {
  title: string;
  author: string;
  genre: string;
  synopsis?: string;
  mood?: string;
  style?: ImageStyle;
}

export interface BookCoverGenerationResult {
  frontCover: ImageGenerationResult;
  backCover?: ImageGenerationResult;
  spine?: ImageGenerationResult;
}

// Genre-specific style modifiers for professional book covers
const GENRE_STYLE_MODIFIERS: Record<string, string> = {
  'fiction': 'cinematic lighting, dramatic atmosphere, professional photography',
  'fantasy': 'magical atmosphere, ethereal glow, fantasy art style, vibrant colors',
  'sci-fi': 'futuristic, cyberpunk aesthetic, neon accents, high-tech atmosphere',
  'romance': 'soft romantic lighting, warm tones, dreamy atmosphere, elegant composition',
  'thriller': 'dark moody atmosphere, dramatic shadows, intense suspense, noir style',
  'mystery': 'mysterious shadows, foggy atmosphere, intriguing composition, dark tones',
  'horror': 'eerie atmosphere, dark shadows, unsettling mood, horror aesthetic',
  'children': 'bright cheerful colors, playful illustration style, friendly and warm',
  'young-adult': 'vibrant and dynamic, modern aesthetic, emotional depth',
  'historical': 'period-accurate details, warm sepia tones, classical composition',
  'biography': 'professional portrait style, dignified lighting, documentary feel',
  'self-help': 'uplifting atmosphere, clean and inspiring, positive energy',
  'business': 'professional and corporate, clean modern design, confident composition',
  'poetry': 'artistic and evocative, abstract elements, emotional depth, minimalist',
  'default': 'professional book cover style, high quality, compelling composition',
};

// Negative prompts to avoid common image generation issues
const NEGATIVE_PROMPTS = 'no text, no letters, no words, no watermarks, no signatures, no borders, no frames, no blurry areas, no distorted faces';

/**
 * Generate complete book covers using Nano Banana Pro
 * Generates front cover, back cover, and spine images with genre-specific styling
 */
export async function generateBookCovers(
  request: BookCoverGenerationRequest
): Promise<BookCoverGenerationResult> {
  const { title, author, genre, synopsis, mood, style } = request;

  console.log(`📚 Generating professional book covers for: "${title}" by ${author}`);

  // Get genre-specific style modifier
  const genreKey = genre.toLowerCase().replace(/[^a-z-]/g, '');
  const genreStyle = GENRE_STYLE_MODIFIERS[genreKey] || GENRE_STYLE_MODIFIERS['default'];

  // Generate front cover prompt with genre-specific enhancements
  const frontCoverPromptRequest = `Create a professional, high-quality book cover image prompt for:
Title: "${title}"
Author: ${author}
Genre: ${genre}
Synopsis: ${synopsis || 'Not provided'}
Mood: ${mood || 'Based on genre'}
Style: ${style || 'Appropriate for genre'}

Genre-specific style elements: ${genreStyle}

IMPORTANT REQUIREMENTS:
- NO text, letters, or words in the image
- Professional quality suitable for commercial publishing
- Visually striking and memorable
- Works well with text overlay for title and author
- Follows modern book cover design trends for ${genre}
- High resolution quality with sharp details

Create a detailed, vivid image description (under 300 characters) that will generate a stunning professional cover.

Respond with ONLY the image prompt, nothing else.`;

  const frontPromptResult = await generateWithBreaker(frontCoverPromptRequest);
  let frontCoverPrompt = frontPromptResult.response.text().trim();

  // Add genre style and negative prompts
  frontCoverPrompt = `${frontCoverPrompt}, ${genreStyle}, ${NEGATIVE_PROMPTS}`;

  // Generate front cover
  console.log(`📚 Generating FRONT cover image...`);
  const frontCover = await generateImage({
    prompt: frontCoverPrompt,
    bookContext: { title, genre },
    style: (style || 'illustration') as any,
    aspectRatio: '3:4', // Standard book cover ratio
  });
  console.log(`📚 Front cover result: success=${frontCover.success}, hasUrl=${!!frontCover.imageUrl}`);
  if (frontCover.error) {
    console.error(`📚 Front cover error: ${frontCover.error}`);
  }

  // Generate back cover prompt with matching style
  const backCoverPromptRequest = `Create a complementary back cover image prompt for a book:
Title: "${title}"
Genre: ${genre}
Synopsis: ${synopsis || 'Not provided'}
Front cover style: ${frontCoverPrompt.slice(0, 150)}

The back cover should:
- Complement the front cover style perfectly
- Be subtle and elegant for text overlay (synopsis, reviews, barcode area)
- Maintain visual consistency with the front cover
- Use similar color palette and mood
- NO text, letters, or words
- Professional quality suitable for publishing

Respond with ONLY the image prompt (under 250 characters), no other text.`;

  const backPromptResult = await generateWithBreaker(backCoverPromptRequest);
  let backCoverPrompt = backPromptResult.response.text().trim();

  // Add negative prompts to back cover
  backCoverPrompt = `${backCoverPrompt}, subtle background, ${NEGATIVE_PROMPTS}`;

  console.log(`📚 Generating BACK cover image...`);
  const backCover = await generateImage({
    prompt: backCoverPrompt,
    bookContext: { title, genre },
    style: (style || 'illustration') as any,
    aspectRatio: '3:4',
  });
  console.log(`📚 Back cover result: success=${backCover.success}, hasUrl=${!!backCover.imageUrl}`);

  // Generate spine - usually a simple gradient or pattern
  const spinePrompt = `Abstract ${genre.toLowerCase()} book spine design, vertical gradient, elegant ${mood || 'sophisticated'} colors, minimal, no text`;

  const spine = await generateImage({
    prompt: spinePrompt,
    bookContext: { title, genre },
    style: 'artistic',
    aspectRatio: '9:16', // Tall and narrow for spine
  });

  return {
    frontCover,
    backCover,
    spine,
  };
}

/**
 * Generate images for book interior based on AI design placements
 */
export interface BookImagePlacement {
  chapterIndex: number;
  pagePosition: 'chapter-start' | 'mid-chapter' | 'chapter-end' | 'full-page';
  imagePosition: 'top' | 'center' | 'bottom' | 'full-page' | 'left' | 'right' | 'full-bleed';
  prompt: string;
  caption?: string;
}

export async function generateBookInteriorImages(
  placements: BookImagePlacement[],
  bookContext: ImageGenerationRequest['bookContext']
): Promise<Map<number, ImageGenerationResult>> {
  const results = new Map<number, ImageGenerationResult>();

  console.log(`📖 Generating ${placements.length} interior images...`);

  for (const placement of placements) {
    try {
      // Determine aspect ratio based on image position
      let aspectRatio: ImageGenerationRequest['aspectRatio'] = '4:3';
      if (placement.imagePosition === 'full-page') {
        aspectRatio = '3:4';
      } else if (placement.imagePosition === 'top' || placement.imagePosition === 'bottom') {
        aspectRatio = '16:9';
      }

      const result = await generateImage({
        prompt: placement.prompt,
        bookContext,
        style: 'illustration',
        aspectRatio,
      });

      results.set(placement.chapterIndex, result);
      console.log(`✅ Generated image for chapter ${placement.chapterIndex}`);
    } catch (error) {
      console.error(`Failed to generate image for chapter ${placement.chapterIndex}:`, error);
      results.set(placement.chapterIndex, {
        success: false,
        prompt: placement.prompt,
        error: 'Failed to generate image',
      });
    }
  }

  return results;
}
