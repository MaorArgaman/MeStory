// Template Service - Apply book templates to page settings
import { BookTemplate, getTemplateById } from '../data/bookTemplates';

// Current page layout settings structure (from BookLayoutPage)
export interface PageLayoutSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  margins: { top: number; bottom: number; left: number; right: number };
  showPageNumbers: boolean;
  includeToc: boolean;
  includeBackCover: boolean;
  // New fields from templates
  textColor?: string;
  titleFont?: string;
  headerFont?: string;
  accentColor?: string;
  columns?: 1 | 2 | 3 | 4;
  paragraphIndent?: number;
  paragraphSpacing?: number;
  pageNumberPosition?: 'top-left' | 'top-right' | 'bottom-center' | 'bottom-outside' | 'none';
  backgroundColor?: string;
  templateId?: string;
}

// Cover design settings
export interface CoverSettings {
  backgroundColor?: string;
  gradientColors?: string[];
  titlePosition: 'top' | 'center' | 'bottom';
  titleAlignment: 'left' | 'center' | 'right';
  titleColor: string;
  titleFont: string;
  authorColor: string;
}

// Default settings
export const defaultPageSettings: PageLayoutSettings = {
  fontSize: 14,
  lineHeight: 1.6,
  fontFamily: 'David Libre',
  margins: { top: 60, bottom: 60, left: 50, right: 50 },
  showPageNumbers: true,
  includeToc: true,
  includeBackCover: true,
  textColor: '#000000',
  columns: 1,
  paragraphIndent: 0,
  paragraphSpacing: 12,
  pageNumberPosition: 'bottom-center',
  backgroundColor: '#ffffff',
};

/**
 * Apply a template to the current page settings
 */
export function applyTemplate(
  currentSettings: PageLayoutSettings,
  template: BookTemplate
): PageLayoutSettings {
  return {
    ...currentSettings,
    fontSize: template.fontSize,
    lineHeight: template.lineHeight,
    fontFamily: template.fonts.body,
    titleFont: template.fonts.title,
    headerFont: template.fonts.headers,
    margins: template.margins,
    showPageNumbers: template.pageNumberPosition !== 'none',
    textColor: template.textColor,
    accentColor: template.accentColor,
    columns: template.columns,
    paragraphIndent: template.paragraphIndent,
    paragraphSpacing: template.paragraphSpacing,
    pageNumberPosition: template.pageNumberPosition,
    backgroundColor: template.backgroundColor,
    templateId: template.id,
  };
}

/**
 * Apply template to cover settings
 */
export function applyTemplateToCover(template: BookTemplate): CoverSettings {
  return {
    backgroundColor: template.coverStyle.backgroundColor,
    gradientColors: template.coverStyle.gradientColors,
    titlePosition: template.coverStyle.titlePosition,
    titleAlignment: template.coverStyle.titleAlignment,
    titleColor: template.coverStyle.titleColor,
    titleFont: template.fonts.title,
    authorColor: template.coverStyle.authorColor,
  };
}

/**
 * Get settings with template applied (by template ID)
 */
export function applyTemplateById(
  currentSettings: PageLayoutSettings,
  templateId: string
): PageLayoutSettings {
  const template = getTemplateById(templateId);
  if (!template) {
    console.warn(`Template not found: ${templateId}`);
    return currentSettings;
  }
  return applyTemplate(currentSettings, template);
}

/**
 * Check if current settings match a specific template
 */
export function isUsingTemplate(
  settings: PageLayoutSettings,
  templateId: string
): boolean {
  return settings.templateId === templateId;
}

/**
 * Reset settings to defaults (no template)
 */
export function resetToDefaults(): PageLayoutSettings {
  return { ...defaultPageSettings };
}

/**
 * Generate CSS variables from settings
 */
export function settingsToCssVariables(settings: PageLayoutSettings): Record<string, string> {
  return {
    '--font-size': `${settings.fontSize}px`,
    '--line-height': String(settings.lineHeight),
    '--font-family': settings.fontFamily,
    '--title-font': settings.titleFont || settings.fontFamily,
    '--header-font': settings.headerFont || settings.fontFamily,
    '--text-color': settings.textColor || '#000000',
    '--accent-color': settings.accentColor || '#6366f1',
    '--background-color': settings.backgroundColor || '#ffffff',
    '--margin-top': `${settings.margins.top}px`,
    '--margin-bottom': `${settings.margins.bottom}px`,
    '--margin-left': `${settings.margins.left}px`,
    '--margin-right': `${settings.margins.right}px`,
    '--paragraph-indent': `${settings.paragraphIndent || 0}px`,
    '--paragraph-spacing': `${settings.paragraphSpacing || 12}px`,
    '--columns': String(settings.columns || 1),
  };
}

/**
 * Convert settings to style object for page rendering
 */
export function settingsToPageStyle(settings: PageLayoutSettings): React.CSSProperties {
  return {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    fontFamily: settings.fontFamily,
    color: settings.textColor || '#000000',
    backgroundColor: settings.backgroundColor || '#ffffff',
    paddingTop: `${settings.margins.top}px`,
    paddingBottom: `${settings.margins.bottom}px`,
    paddingLeft: `${settings.margins.left}px`,
    paddingRight: `${settings.margins.right}px`,
  };
}

/**
 * Generate Google Fonts URL for required fonts
 */
export function getGoogleFontsUrl(settings: PageLayoutSettings): string {
  const fonts = new Set<string>();

  // Add main fonts
  if (settings.fontFamily) fonts.add(settings.fontFamily);
  if (settings.titleFont) fonts.add(settings.titleFont);
  if (settings.headerFont) fonts.add(settings.headerFont);

  // Filter out system fonts
  const systemFonts = ['Times New Roman', 'Georgia', 'Arial', 'Helvetica'];
  const googleFonts = Array.from(fonts).filter(f => !systemFonts.includes(f));

  if (googleFonts.length === 0) return '';

  const fontParams = googleFonts
    .map(f => f.replace(/ /g, '+') + ':wght@400;500;600;700')
    .join('&family=');

  return `https://fonts.googleapis.com/css2?family=${fontParams}&display=swap`;
}

/**
 * Load Google Fonts dynamically
 */
export function loadGoogleFonts(settings: PageLayoutSettings): void {
  const url = getGoogleFontsUrl(settings);
  if (!url) return;

  // Check if already loaded
  const existingLink = document.querySelector(`link[href="${url}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.href = url;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}
