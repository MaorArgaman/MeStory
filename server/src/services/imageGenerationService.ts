import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Initialize Gemini AI for prompt generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
 */
export async function generateEnhancedPrompt(request: ImageGenerationRequest): Promise<string> {
  const { prompt, bookContext, style } = request;

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

    const aiPrompt = `You are a professional book illustrator and prompt engineer. Create an enhanced, detailed image generation prompt based on the following request.

USER'S REQUEST:
${prompt}

${contextInfo}
${styleGuide}

TASK:
Transform the user's request into a detailed, vivid image generation prompt that:
- Describes the scene in rich visual detail
- Specifies lighting, mood, and atmosphere
- Includes relevant style descriptors for the requested style
- Is suitable for a book illustration
- Avoids any inappropriate or copyrighted content
- Is clear and specific for AI image generation

Keep the enhanced prompt under 300 characters for optimal AI image generation.

Respond ONLY with the enhanced prompt text, nothing else.`;

    const result = await model.generateContent(aiPrompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating enhanced prompt:', error);
    return prompt; // Return original prompt if enhancement fails
  }
}

/**
 * Generate image using a placeholder service (can be replaced with actual AI image generation)
 * For production, integrate with DALL-E, Stability AI, Midjourney, etc.
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  try {
    // Enhance the prompt using Gemini
    const enhancedPrompt = await generateEnhancedPrompt(request);

    // For now, use a placeholder image service
    // In production, replace this with actual AI image generation API
    const placeholderService = process.env.IMAGE_GENERATION_SERVICE || 'placeholder';

    let imageUrl: string;

    switch (placeholderService) {
      case 'pollinations':
        // Free AI image generation via Pollinations.ai
        imageUrl = await generateWithPollinations(enhancedPrompt, request.aspectRatio);
        break;

      case 'stability':
        // Stability AI (requires API key)
        imageUrl = await generateWithStabilityAI(enhancedPrompt, request);
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
  // URL format: https://image.pollinations.ai/prompt/{encoded_prompt}
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

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${Date.now()}`;

  // Download the image and save it locally
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
    // Save the base64 image
    const imageData = response.data.artifacts[0].base64;
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

    const result = await model.generateContent(analysisPrompt);
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
