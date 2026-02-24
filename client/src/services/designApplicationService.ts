/**
 * Design Application Service
 * Applies AI-generated designs to book pages and components
 */

import type {
  AICompleteDesign,
  AITypographyDesign,
  AILayoutDesign,
  AICoverDesign,
  AIImagePlacement
} from '../types/templates';
import type { Book } from '../types';

// Google Fonts loading cache
const loadedFonts = new Set<string>();

/**
 * Load Google Font dynamically
 */
export const loadGoogleFont = async (fontFamily: string): Promise<void> => {
  if (loadedFonts.has(fontFamily)) {
    return;
  }

  // Skip system fonts
  const systemFonts = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Verdana', 'Courier New'];
  if (systemFonts.includes(fontFamily)) {
    loadedFonts.add(fontFamily);
    return;
  }

  try {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    loadedFonts.add(fontFamily);

    // Wait for font to load
    await document.fonts.ready;
  } catch (error) {
    console.warn(`Failed to load font: ${fontFamily}`, error);
  }
};

/**
 * Load all fonts from typography design
 */
export const loadDesignFonts = async (typography: AITypographyDesign): Promise<void> => {
  const fonts = [
    typography.bodyFont,
    typography.headingFont,
    typography.titleFont,
  ].filter(Boolean);

  await Promise.all(fonts.map(font => loadGoogleFont(font)));
};

/**
 * Convert AI typography design to CSS variables
 */
export const typographyToCssVariables = (typography: AITypographyDesign): Record<string, string> => {
  const vars: Record<string, string> = {};

  // Font families
  if (typography.bodyFont) {
    vars['--design-body-font'] = `"${typography.bodyFont}", sans-serif`;
  }
  if (typography.headingFont) {
    vars['--design-heading-font'] = `"${typography.headingFont}", sans-serif`;
  }
  if (typography.titleFont) {
    vars['--design-title-font'] = `"${typography.titleFont}", sans-serif`;
  }

  // Font sizes (fontSize is a number in the type)
  if (typography.fontSize) {
    vars['--design-font-size-body'] = `${typography.fontSize}px`;
    vars['--design-font-size-heading'] = `${typography.chapterTitleSize || typography.fontSize * 1.5}px`;
    vars['--design-font-size-title'] = `${typography.chapterTitleSize || typography.fontSize * 2}px`;
    vars['--design-font-size-caption'] = `${typography.fontSize * 0.85}px`;
  }

  // Line heights (lineHeight is a number in the type)
  if (typography.lineHeight) {
    vars['--design-line-height-body'] = String(typography.lineHeight);
    vars['--design-line-height-heading'] = String(typography.lineHeight * 0.9);
  }

  // Colors
  if (typography.colors) {
    vars['--design-color-text'] = typography.colors.text;
    vars['--design-color-heading'] = typography.colors.heading;
    vars['--design-color-accent'] = typography.colors.accent;
    if (typography.colors.background) {
      vars['--design-color-background'] = typography.colors.background;
    }
  }

  return vars;
};

/**
 * Convert AI layout design to CSS variables
 */
export const layoutToCssVariables = (layout: AILayoutDesign): Record<string, string> => {
  const vars: Record<string, string> = {};

  // Columns
  if (layout.columns) {
    vars['--design-columns'] = String(layout.columns);
  }

  // Column gap
  if (layout.columnGap) {
    vars['--design-column-gap'] = `${layout.columnGap}px`;
  }

  // Margins
  if (layout.margins) {
    vars['--design-margin-top'] = `${layout.margins.top}mm`;
    vars['--design-margin-bottom'] = `${layout.margins.bottom}mm`;
    vars['--design-margin-inner'] = `${layout.margins.inner}mm`;
    vars['--design-margin-outer'] = `${layout.margins.outer}mm`;
  }

  // Paragraph spacing
  if (layout.paragraphSpacing) {
    vars['--design-paragraph-spacing'] = `${layout.paragraphSpacing}px`;
  }

  // Text alignment
  if (layout.textAlign) {
    vars['--design-text-align'] = layout.textAlign;
  }

  // Page numbers
  if (layout.pageNumbers) {
    vars['--design-page-number-show'] = layout.pageNumbers.show ? '1' : '0';
    vars['--design-page-number-position'] = layout.pageNumbers.position || 'bottom-center';
    vars['--design-page-number-style'] = layout.pageNumbers.style || 'numeric';
    if (layout.pageNumbers.startFrom !== undefined) {
      vars['--design-page-number-start'] = String(layout.pageNumbers.startFrom);
    }
  }

  // Headers
  if (layout.headers) {
    vars['--design-header-show'] = layout.headers.show ? '1' : '0';
    vars['--design-header-content'] = layout.headers.content || '';
    vars['--design-header-position'] = layout.headers.position || 'center';
  }

  return vars;
};

/**
 * Apply CSS variables to an element
 */
export const applyCssVariables = (element: HTMLElement, variables: Record<string, string>): void => {
  Object.entries(variables).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
};

/**
 * Apply typography design to page content
 */
export const applyTypographyToElement = (element: HTMLElement, typography: AITypographyDesign): void => {
  const vars = typographyToCssVariables(typography);
  applyCssVariables(element, vars);

  // Apply direct styles for immediate effect
  if (typography.bodyFont) {
    element.style.fontFamily = `"${typography.bodyFont}", sans-serif`;
  }
  if (typography.fontSize) {
    element.style.fontSize = `${typography.fontSize}px`;
  }
  if (typography.lineHeight) {
    element.style.lineHeight = String(typography.lineHeight);
  }
  if (typography.colors?.text) {
    element.style.color = typography.colors.text;
  }
  if (typography.colors?.background) {
    element.style.backgroundColor = typography.colors.background;
  }
};

/**
 * Apply layout design to page container
 */
export const applyLayoutToElement = (element: HTMLElement, layout: AILayoutDesign): void => {
  const vars = layoutToCssVariables(layout);
  applyCssVariables(element, vars);

  // Apply direct margin styles
  if (layout.margins) {
    element.style.paddingTop = `${layout.margins.top}mm`;
    element.style.paddingBottom = `${layout.margins.bottom}mm`;
    element.style.paddingLeft = `${layout.margins.inner}mm`;
    element.style.paddingRight = `${layout.margins.outer}mm`;
  }

  // Apply column layout
  if (layout.columns && layout.columns > 1) {
    element.style.columnCount = String(layout.columns);
    element.style.columnGap = '20px';
  }
};

/**
 * Get cover design for specific cover type
 */
export const getCoverStyle = (cover: AICoverDesign, type: 'front' | 'back' | 'spine'): React.CSSProperties => {
  const coverData = cover[type];
  if (!coverData) return {};

  const style: React.CSSProperties = {};

  if (coverData.backgroundColor) {
    style.backgroundColor = coverData.backgroundColor;
  }

  // Handle gradient colors if available (front cover)
  if (type === 'front' && cover.front?.gradientColors && cover.front.gradientColors.length > 1) {
    style.background = `linear-gradient(135deg, ${cover.front.gradientColors.join(', ')})`;
  }

  // Handle generated image URL
  if ('generatedImageUrl' in coverData && coverData.generatedImageUrl) {
    style.backgroundImage = `url(${coverData.generatedImageUrl})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  }

  // Handle text color for spine
  if (type === 'spine' && cover.spine?.textColor) {
    style.color = cover.spine.textColor;
  }

  // Handle title color for front cover
  if (type === 'front' && cover.front?.title?.color) {
    style.color = cover.front.title.color;
  }

  return style;
};

/**
 * Get image placements for a specific chapter
 */
export const getChapterImagePlacements = (
  placements: AIImagePlacement[],
  chapterIndex: number
): AIImagePlacement[] => {
  return placements.filter(p => p.chapterIndex === chapterIndex);
};

/**
 * Check if a chapter has images at specific position
 */
export const hasImageAtPosition = (
  placements: AIImagePlacement[],
  chapterIndex: number,
  position: string
): AIImagePlacement | undefined => {
  return placements.find(
    p => p.chapterIndex === chapterIndex && p.pagePosition === position
  );
};

/**
 * Master function: Apply complete AI design to book state
 * Returns the CSS variables and styles to apply
 */
export const applyAIDesignToBook = async (
  design: AICompleteDesign
): Promise<{
  cssVariables: Record<string, string>;
  fontsLoaded: string[];
  coverStyles: {
    front: React.CSSProperties;
    back: React.CSSProperties;
    spine: React.CSSProperties;
  };
}> => {
  // Load fonts first
  const fontsLoaded: string[] = [];
  if (design.typography) {
    await loadDesignFonts(design.typography);
    if (design.typography.bodyFont) fontsLoaded.push(design.typography.bodyFont);
    if (design.typography.headingFont) fontsLoaded.push(design.typography.headingFont);
    if (design.typography.titleFont) fontsLoaded.push(design.typography.titleFont);
  }

  // Combine all CSS variables
  const cssVariables: Record<string, string> = {};

  if (design.typography) {
    Object.assign(cssVariables, typographyToCssVariables(design.typography));
  }

  if (design.layout) {
    Object.assign(cssVariables, layoutToCssVariables(design.layout));
  }

  // Get cover styles
  const coverStyles = {
    front: design.covers ? getCoverStyle(design.covers, 'front') : {},
    back: design.covers ? getCoverStyle(design.covers, 'back') : {},
    spine: design.covers ? getCoverStyle(design.covers, 'spine') : {},
  };

  return {
    cssVariables,
    fontsLoaded,
    coverStyles,
  };
};

/**
 * Get design-aware text styles for different content types
 */
export const getTextStyles = (typography: AITypographyDesign, type: 'body' | 'heading' | 'title' | 'caption'): React.CSSProperties => {
  const styles: React.CSSProperties = {};

  switch (type) {
    case 'body':
      if (typography.bodyFont) styles.fontFamily = `"${typography.bodyFont}", sans-serif`;
      if (typography.fontSize) styles.fontSize = `${typography.fontSize}px`;
      if (typography.lineHeight) styles.lineHeight = typography.lineHeight;
      if (typography.colors?.text) styles.color = typography.colors.text;
      break;
    case 'heading':
      if (typography.headingFont) styles.fontFamily = `"${typography.headingFont}", sans-serif`;
      if (typography.chapterTitleSize) styles.fontSize = `${typography.chapterTitleSize}px`;
      else if (typography.fontSize) styles.fontSize = `${typography.fontSize * 1.5}px`;
      if (typography.lineHeight) styles.lineHeight = typography.lineHeight * 0.9;
      if (typography.colors?.heading) styles.color = typography.colors.heading;
      break;
    case 'title':
      if (typography.titleFont) styles.fontFamily = `"${typography.titleFont}", sans-serif`;
      if (typography.chapterTitleSize) styles.fontSize = `${typography.chapterTitleSize * 1.2}px`;
      else if (typography.fontSize) styles.fontSize = `${typography.fontSize * 2}px`;
      if (typography.colors?.heading) styles.color = typography.colors.heading;
      break;
    case 'caption':
      if (typography.bodyFont) styles.fontFamily = `"${typography.bodyFont}", sans-serif`;
      if (typography.fontSize) styles.fontSize = `${typography.fontSize * 0.85}px`;
      if (typography.colors?.text) styles.color = typography.colors.text;
      styles.opacity = 0.8;
      break;
  }

  return styles;
};

/**
 * Get page number style based on design
 */
export const getPageNumberStyle = (layout: AILayoutDesign): React.CSSProperties => {
  if (!layout.pageNumbers?.show) {
    return { display: 'none' };
  }

  const styles: React.CSSProperties = {
    position: 'absolute',
    fontSize: '10px',
  };

  const position = layout.pageNumbers.position || 'bottom-center';

  if (position.includes('bottom')) {
    styles.bottom = '10mm';
  } else {
    styles.top = '10mm';
  }

  if (position.includes('center')) {
    styles.left = '50%';
    styles.transform = 'translateX(-50%)';
  } else if (position.includes('outer')) {
    // Will be adjusted per page (odd/even)
    styles.right = '15mm';
  }

  return styles;
};

/**
 * Get header style based on design
 */
export const getHeaderStyle = (layout: AILayoutDesign): React.CSSProperties => {
  if (!layout.headers?.show) {
    return { display: 'none' };
  }

  return {
    position: 'absolute',
    top: '8mm',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '9px',
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };
};

/**
 * Format page number based on design format
 */
export const formatPageNumber = (pageNum: number, format: string = 'numeric', startFrom: number = 1): string => {
  const adjustedNum = pageNum + (startFrom - 1);

  switch (format) {
    case 'roman':
      return toRoman(adjustedNum);
    case 'roman-lowercase':
      return toRoman(adjustedNum).toLowerCase();
    default:
      return String(adjustedNum);
  }
};

/**
 * Convert number to Roman numerals
 */
const toRoman = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];

  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
};

/**
 * Check if AI design is applied to a book
 */
export const hasAIDesign = (book: Book): boolean => {
  return book.aiDesignState?.status === 'completed' && !!book.aiDesignState?.design;
};

/**
 * Get AI design from book if available
 */
export const getAIDesign = (book: Book): AICompleteDesign | null => {
  if (hasAIDesign(book)) {
    return book.aiDesignState!.design!;
  }
  return null;
};
