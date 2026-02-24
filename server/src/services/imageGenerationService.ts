import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
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
    modelInstance = genAIClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return modelInstance;
}

/**
 * Get Gemini model configured for image generation (Nano Banana Pro)
 * Uses gemini-2.0-flash-exp with image generation capabilities
 */
function getGeminiImageModel(): GenerativeModel {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  if (!imageModelInstance) {
    // Use experimental model with image generation support
    imageModelInstance = genAIClient.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
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

    const result = await getGeminiModel().generateContent(aiPrompt);
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
    // Default to nano-banana for AI-generated images (uses Gemini + Pollinations)
    const placeholderService = process.env.IMAGE_GENERATION_SERVICE || 'nano-banana';

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

      case 'gemini':
      case 'nano-banana':
        // Nano Banana Pro (Gemini Image API)
        imageUrl = await generateWithNanoBananaPro(enhancedPrompt, request.aspectRatio);
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

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${Date.now()}&nologo=true`;

  // Check if running on Vercel - if so, return direct URL (no local storage in serverless)
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  if (isVercel) {
    console.log('🌐 Running on Vercel - returning direct Pollinations URL');
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
 * Generate image using Nano Banana Pro (Gemini Image API)
 * Uses Gemini 2.0 Flash Experimental with native image generation
 */
async function generateWithNanoBananaPro(prompt: string, aspectRatio?: string): Promise<string> {
  try {
    console.log(`🍌 Nano Banana Pro: Starting image generation`);
    console.log(`🍌 Prompt length: ${prompt.length} chars`);
    console.log(`🍌 Aspect ratio: ${aspectRatio || 'default'}`);
    console.log(`🍌 Prompt preview: ${prompt.slice(0, 100)}...`);

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
    const imagePrompt = `Generate a high-quality, professional image in ${dimensionPrompt}.

Image description: ${prompt}

Requirements:
- High resolution and sharp details
- Professional quality suitable for book publishing
- No text or watermarks in the image
- Visually compelling and cohesive composition
- Appropriate lighting and color balance`;

    const model = getGeminiImageModel();

    // Use Gemini's native image generation capability
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: imagePrompt }]
      }],
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
      }
    });

    const response = result.response;
    // Response text available for debugging if needed
    void response.text();

    // Check if the response contains image data or a URL
    // Gemini 2.0 Flash Exp may return image data in various formats

    // If no native image generation available, fall back to Pollinations with enhanced prompt
    console.log('🍌 Gemini does not support native image generation, falling back to Pollinations...');

    // Use the Gemini model to create a better prompt for Pollinations
    const enhancedResult = await getGeminiModel().generateContent(`
You are an expert at creating image generation prompts. Transform this request into an optimal prompt for AI image generation:

"${prompt}"

Format: ${dimensionPrompt}

Create a detailed, vivid prompt under 200 characters that will generate a stunning, professional image. Focus on:
- Specific visual details
- Lighting and mood
- Style and artistic approach
- Color palette

Respond with ONLY the enhanced prompt, nothing else.`);

    const enhancedPrompt = enhancedResult.response.text().trim();

    // Generate with Pollinations using enhanced prompt
    return await generateWithPollinationsEnhanced(enhancedPrompt, aspectRatio);
  } catch (error: any) {
    console.error('Nano Banana Pro error:', error);
    // Fallback to regular Pollinations
    console.log('🔄 Falling back to standard Pollinations...');
    return await generateWithPollinations(prompt, aspectRatio);
  }
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

  // Truncate and sanitize prompt to avoid URL issues (max 500 chars)
  let sanitizedPrompt = prompt
    .replace(/[^\w\s,.-]/g, '') // Remove special characters except basic punctuation
    .slice(0, 400); // Limit length for URL safety

  // Enhanced prompt for professional quality
  const enhancedPrompt = `${sanitizedPrompt}, professional quality, high resolution, sharp details, no text, no watermarks`;
  const encodedPrompt = encodeURIComponent(enhancedPrompt);

  console.log(`🎨 Pollinations Enhanced: generating with prompt length ${enhancedPrompt.length}`);

  // Retry logic with different seeds
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const seed = Date.now() + attempt * 12345;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux`;

    console.log(`🎨 Attempt ${attempt}/${maxRetries} generating image (seed: ${seed})`);

    // Check if running on Vercel - if so, return direct URL (no local storage in serverless)
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
    if (isVercel) {
      console.log('🌐 Vercel: returning direct Pollinations URL');
      console.log(`🌐 URL length: ${imageUrl.length} chars`);
      console.log(`🌐 URL preview: ${imageUrl.slice(0, 150)}...`);
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
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux`;
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

    const result = await getGeminiModel().generateContent(analysisPrompt);
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
type ImageStyle = 'realistic' | 'illustration' | 'artistic' | 'manga' | 'watercolor' | 'oil-painting';

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

  const frontPromptResult = await getGeminiModel().generateContent(frontCoverPromptRequest);
  let frontCoverPrompt = frontPromptResult.response.text().trim();

  // Add genre style and negative prompts
  frontCoverPrompt = `${frontCoverPrompt}, ${genreStyle}, ${NEGATIVE_PROMPTS}`;

  // Generate front cover
  console.log(`📚 Generating FRONT cover image...`);
  const frontCover = await generateImage({
    prompt: frontCoverPrompt,
    bookContext: { title, genre },
    style: style || 'illustration',
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

  const backPromptResult = await getGeminiModel().generateContent(backCoverPromptRequest);
  let backCoverPrompt = backPromptResult.response.text().trim();

  // Add negative prompts to back cover
  backCoverPrompt = `${backCoverPrompt}, subtle background, ${NEGATIVE_PROMPTS}`;

  console.log(`📚 Generating BACK cover image...`);
  const backCover = await generateImage({
    prompt: backCoverPrompt,
    bookContext: { title, genre },
    style: style || 'illustration',
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
  pagePosition: 'chapter-start' | 'mid-chapter' | 'chapter-end';
  imagePosition: 'top' | 'center' | 'bottom' | 'full-page';
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
