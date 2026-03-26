/**
 * CustomTemplateBuilder Component
 * Interactive builder for creating custom book templates
 * Users can customize fonts, colors, layouts, and add image placeholders
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Type,
  Palette,
  Layout,
  Image as ImageIcon,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  Settings2,
  Circle,
  Square,
  RectangleHorizontal,
  Check,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BookTemplate } from '../../data/bookTemplates';
import toast from 'react-hot-toast';

interface ImagePlaceholder {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: 'rectangle' | 'circle' | 'rounded';
}

interface CustomTemplateData {
  name: string;
  nameHe: string;
  // Typography
  fonts: {
    title: string;
    body: string;
    headers: string;
  };
  fontSize: number;
  lineHeight: number;
  // Colors
  textColor: string;
  backgroundColor: string;
  accentColor: string;
  // Layout
  columns: 1 | 2 | 3;
  margins: { top: number; bottom: number; left: number; right: number };
  paragraphIndent: number;
  paragraphSpacing: number;
  pageNumberPosition: 'top-left' | 'top-right' | 'bottom-center' | 'bottom-outside' | 'none';
  // Images
  imagePlaceholders: ImagePlaceholder[];
  imageFrameStyle: 'none' | 'border' | 'shadow' | 'rounded' | 'circle';
  // Decorations
  headerDecoration: 'none' | 'line' | 'ornament' | 'dots';
  dividerStyle: 'none' | 'line' | 'ornament' | 'stars' | 'dots';
  dropCapEnabled: boolean;
}

interface CustomTemplateBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: BookTemplate) => void;
  existingTemplate?: CustomTemplateData;
}

const defaultTemplate: CustomTemplateData = {
  name: '',
  nameHe: '',
  fonts: {
    title: 'Playfair Display',
    body: 'Inter',
    headers: 'Playfair Display',
  },
  fontSize: 14,
  lineHeight: 1.7,
  textColor: '#1A1A1A',
  backgroundColor: '#FFFFFF',
  accentColor: '#6366F1',
  columns: 1,
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  paragraphIndent: 0,
  paragraphSpacing: 12,
  pageNumberPosition: 'bottom-center',
  imagePlaceholders: [],
  imageFrameStyle: 'shadow',
  headerDecoration: 'none',
  dividerStyle: 'none',
  dropCapEnabled: false,
};

const colorPresets = [
  { name: 'Classic', bg: '#FFFFFF', text: '#1A1A1A', accent: '#8B4513' },
  { name: 'Dark', bg: '#1A1A1A', text: '#F5F5F5', accent: '#FFD700' },
  { name: 'Sepia', bg: '#F5F0E8', text: '#2D2D2D', accent: '#8B7355' },
  { name: 'Ocean', bg: '#F0F8FF', text: '#1E3A5F', accent: '#0077B6' },
  { name: 'Forest', bg: '#F5FFF5', text: '#1A3A1A', accent: '#228B22' },
  { name: 'Romantic', bg: '#FFF5F5', text: '#4A1A1A', accent: '#DB2777' },
  { name: 'Modern', bg: '#FAFAFA', text: '#18181B', accent: '#6366F1' },
  { name: 'Warm', bg: '#FFFAF0', text: '#3D2314', accent: '#D97706' },
];

const fontCategories = {
  hebrew: ['David Libre', 'Frank Ruhl Libre', 'Heebo', 'Assistant', 'Rubik', 'Alef'],
  serif: ['Playfair Display', 'Merriweather', 'Crimson Text', 'Libre Baskerville', 'Cormorant Garamond'],
  sansSerif: ['Inter', 'Open Sans', 'Montserrat', 'Lato', 'Nunito', 'Oswald'],
  display: ['Bebas Neue', 'Cinzel', 'Fredoka One', 'Caveat'],
};

export default function CustomTemplateBuilder({
  isOpen,
  onClose,
  onSave,
  existingTemplate,
}: CustomTemplateBuilderProps) {
  const { i18n } = useTranslation('common');
  const isRTL = i18n.language === 'he';

  const [template, setTemplate] = useState<CustomTemplateData>(
    existingTemplate || defaultTemplate
  );
  const [activeSection, setActiveSection] = useState<'typography' | 'colors' | 'layout' | 'images' | 'decorations'>('typography');
  const [isAddingPlaceholder, setIsAddingPlaceholder] = useState(false);
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null);
  const [newPlaceholderShape, setNewPlaceholderShape] = useState<'rectangle' | 'circle' | 'rounded'>('rectangle');
  const [mobileView, setMobileView] = useState<'settings' | 'preview'>('settings');
  const previewRef = useRef<HTMLDivElement>(null);

  // Add image placeholder on click
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPlaceholder || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPlaceholder: ImagePlaceholder = {
      id: `placeholder-${Date.now()}`,
      x: Math.max(0, Math.min(85, x - 7.5)),
      y: Math.max(0, Math.min(85, y - 7.5)),
      width: 15,
      height: 15,
      rotation: 0,
      shape: newPlaceholderShape,
    };

    setTemplate(prev => ({
      ...prev,
      imagePlaceholders: [...prev.imagePlaceholders, newPlaceholder],
    }));
    setIsAddingPlaceholder(false);
    setSelectedPlaceholder(newPlaceholder.id);
  };

  // Update placeholder
  const updatePlaceholder = (id: string, updates: Partial<ImagePlaceholder>) => {
    setTemplate(prev => ({
      ...prev,
      imagePlaceholders: prev.imagePlaceholders.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  // Delete placeholder
  const deletePlaceholder = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      imagePlaceholders: prev.imagePlaceholders.filter(p => p.id !== id),
    }));
    setSelectedPlaceholder(null);
  };

  // Save template
  const handleSave = () => {
    if (!template.name.trim()) {
      toast.error(isRTL ? 'נא להזין שם לתבנית' : 'Please enter a template name');
      return;
    }

    const newTemplate: BookTemplate = {
      id: `custom-${Date.now()}`,
      name: template.name,
      nameHe: template.nameHe || template.name,
      description: `Custom template: ${template.name}`,
      descriptionHe: `תבנית מותאמת אישית: ${template.nameHe || template.name}`,
      category: 'custom',
      fonts: template.fonts,
      headerSizes: { h1: 28, h2: 22, h3: 18 },
      fontSize: template.fontSize,
      lineHeight: template.lineHeight,
      columns: template.columns,
      paragraphStyle: 'vertical',
      pageNumberPosition: template.pageNumberPosition,
      margins: template.margins,
      paragraphIndent: template.paragraphIndent,
      paragraphSpacing: template.paragraphSpacing,
      chapterStartStyle: template.dropCapEnabled ? 'drop-cap' : 'same-page',
      dropCapStyle: template.dropCapEnabled ? 'classic' : 'none',
      headerDecoration: template.headerDecoration,
      dividerStyle: template.dividerStyle,
      imagePositions: ['top', 'center', 'bottom'],
      imageFrameStyle: template.imageFrameStyle === 'circle' ? 'rounded' : template.imageFrameStyle,
      creativeImageLayout: template.imagePlaceholders.length > 0 ? {
        pattern: 'collage',
        imageCount: template.imagePlaceholders.length,
        customPositions: template.imagePlaceholders.map(p => ({
          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,
          rotation: p.rotation,
        })),
      } : undefined,
      coverStyle: {
        backgroundColor: template.backgroundColor,
        gradientColors: [template.backgroundColor, template.accentColor],
        titlePosition: 'center',
        titleAlignment: 'center',
        titleColor: template.textColor,
        authorColor: template.accentColor,
      },
      textColor: template.textColor,
      accentColor: template.accentColor,
      backgroundColor: template.backgroundColor,
      previewGradient: `linear-gradient(135deg, ${template.backgroundColor} 0%, ${template.accentColor} 100%)`,
    };

    onSave(newTemplate);
    toast.success(isRTL ? 'התבנית נשמרה בהצלחה!' : 'Template saved successfully!');
    onClose();
  };

  // Reset template
  const handleReset = () => {
    setTemplate(defaultTemplate);
    setSelectedPlaceholder(null);
    toast.success(isRTL ? 'התבנית אופסה' : 'Template reset');
  };

  const sections = [
    { id: 'typography', icon: Type, label: isRTL ? 'טיפוגרפיה' : 'Typography' },
    { id: 'colors', icon: Palette, label: isRTL ? 'צבעים' : 'Colors' },
    { id: 'layout', icon: Layout, label: isRTL ? 'פריסה' : 'Layout' },
    { id: 'images', icon: ImageIcon, label: isRTL ? 'תמונות' : 'Images' },
    { id: 'decorations', icon: Sparkles, label: isRTL ? 'קישוטים' : 'Decorations' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900 rounded-xl sm:rounded-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl mx-1 sm:mx-4"
          onClick={e => e.stopPropagation()}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Settings2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <h2 className="text-base sm:text-xl font-bold text-white">
                {isRTL ? 'בונה תבניות' : 'Template Builder'}
              </h2>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile view toggle */}
              <div className="lg:hidden flex bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setMobileView('settings')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    mobileView === 'settings'
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {isRTL ? 'הגדרות' : 'Settings'}
                </button>
                <button
                  onClick={() => setMobileView('preview')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    mobileView === 'preview'
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Eye className="w-4 h-4 inline-block" />
                </button>
              </div>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={isRTL ? 'איפוס' : 'Reset'}
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row h-[calc(90vh-100px)] sm:h-[calc(90vh-80px)]">
            {/* Left Panel - Settings */}
            <div className={`w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto flex-shrink-0 ${
              mobileView === 'preview' ? 'hidden lg:block' : 'block'
            }`}>
              {/* Section Tabs */}
              <div className="flex gap-1 p-2 sm:p-3 border-b border-white/10 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeSection === section.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <section.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{section.label}</span>
                  </button>
                ))}
              </div>

              {/* Section Content */}
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[50vh] lg:max-h-none overflow-y-auto">
                {/* Typography Section */}
                {activeSection === 'typography' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'גופן כותרות' : 'Title Font'}
                      </label>
                      <select
                        value={template.fonts.title}
                        onChange={e => setTemplate(prev => ({
                          ...prev,
                          fonts: { ...prev.fonts, title: e.target.value }
                        }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                      >
                        {Object.entries(fontCategories).map(([category, fonts]) => (
                          <optgroup key={category} label={category}>
                            {fonts.map(font => (
                              <option key={font} value={font}>{font}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'גופן גוף' : 'Body Font'}
                      </label>
                      <select
                        value={template.fonts.body}
                        onChange={e => setTemplate(prev => ({
                          ...prev,
                          fonts: { ...prev.fonts, body: e.target.value }
                        }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                      >
                        {Object.entries(fontCategories).map(([category, fonts]) => (
                          <optgroup key={category} label={category}>
                            {fonts.map(font => (
                              <option key={font} value={font}>{font}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'גודל גופן' : 'Font Size'}: {template.fontSize}px
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="20"
                        value={template.fontSize}
                        onChange={e => setTemplate(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'גובה שורה' : 'Line Height'}: {template.lineHeight}
                      </label>
                      <input
                        type="range"
                        min="1.2"
                        max="2.2"
                        step="0.1"
                        value={template.lineHeight}
                        onChange={e => setTemplate(prev => ({ ...prev, lineHeight: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {/* Colors Section */}
                {activeSection === 'colors' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'ערכות צבע מוכנות' : 'Color Presets'}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorPresets.map(preset => (
                          <button
                            key={preset.name}
                            onClick={() => setTemplate(prev => ({
                              ...prev,
                              backgroundColor: preset.bg,
                              textColor: preset.text,
                              accentColor: preset.accent,
                            }))}
                            className="p-2 rounded-lg border border-white/10 hover:border-purple-500 transition-colors"
                            title={preset.name}
                          >
                            <div className="flex gap-0.5">
                              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: preset.bg }} />
                              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: preset.text }} />
                              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: preset.accent }} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'צבע רקע' : 'Background Color'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={template.backgroundColor}
                          onChange={e => setTemplate(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.backgroundColor}
                          onChange={e => setTemplate(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'צבע טקסט' : 'Text Color'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={template.textColor}
                          onChange={e => setTemplate(prev => ({ ...prev, textColor: e.target.value }))}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.textColor}
                          onChange={e => setTemplate(prev => ({ ...prev, textColor: e.target.value }))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'צבע הדגשה' : 'Accent Color'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={template.accentColor}
                          onChange={e => setTemplate(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.accentColor}
                          onChange={e => setTemplate(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Layout Section */}
                {activeSection === 'layout' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'מספר עמודות' : 'Columns'}
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3].map(cols => (
                          <button
                            key={cols}
                            onClick={() => setTemplate(prev => ({ ...prev, columns: cols as 1 | 2 | 3 }))}
                            className={`flex-1 p-3 rounded-lg border transition-colors ${
                              template.columns === cols
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className="flex gap-1 justify-center">
                              {Array(cols).fill(0).map((_, i) => (
                                <div key={i} className="w-2 h-6 bg-gray-400 rounded-sm" />
                              ))}
                            </div>
                            <span className="block text-xs text-gray-400 mt-1">{cols}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'שוליים (פיקסלים)' : 'Margins (px)'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-gray-400">{isRTL ? 'עליון' : 'Top'}</span>
                          <input
                            type="number"
                            value={template.margins.top}
                            onChange={e => setTemplate(prev => ({
                              ...prev,
                              margins: { ...prev.margins, top: parseInt(e.target.value) }
                            }))}
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">{isRTL ? 'תחתון' : 'Bottom'}</span>
                          <input
                            type="number"
                            value={template.margins.bottom}
                            onChange={e => setTemplate(prev => ({
                              ...prev,
                              margins: { ...prev.margins, bottom: parseInt(e.target.value) }
                            }))}
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">{isRTL ? 'שמאל' : 'Left'}</span>
                          <input
                            type="number"
                            value={template.margins.left}
                            onChange={e => setTemplate(prev => ({
                              ...prev,
                              margins: { ...prev.margins, left: parseInt(e.target.value) }
                            }))}
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">{isRTL ? 'ימין' : 'Right'}</span>
                          <input
                            type="number"
                            value={template.margins.right}
                            onChange={e => setTemplate(prev => ({
                              ...prev,
                              margins: { ...prev.margins, right: parseInt(e.target.value) }
                            }))}
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'הזחת פסקה' : 'Paragraph Indent'}: {template.paragraphIndent}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={template.paragraphIndent}
                        onChange={e => setTemplate(prev => ({ ...prev, paragraphIndent: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'רווח בין פסקאות' : 'Paragraph Spacing'}: {template.paragraphSpacing}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={template.paragraphSpacing}
                        onChange={e => setTemplate(prev => ({ ...prev, paragraphSpacing: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'מיקום מספר עמוד' : 'Page Number Position'}
                      </label>
                      <select
                        value={template.pageNumberPosition}
                        onChange={e => setTemplate(prev => ({
                          ...prev,
                          pageNumberPosition: e.target.value as any
                        }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="bottom-center">{isRTL ? 'מרכז תחתון' : 'Bottom Center'}</option>
                        <option value="bottom-outside">{isRTL ? 'חיצוני תחתון' : 'Bottom Outside'}</option>
                        <option value="top-left">{isRTL ? 'שמאל עליון' : 'Top Left'}</option>
                        <option value="top-right">{isRTL ? 'ימין עליון' : 'Top Right'}</option>
                        <option value="none">{isRTL ? 'ללא' : 'None'}</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Images Section */}
                {activeSection === 'images' && (
                  <>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mb-4">
                      <p className="text-sm text-purple-300">
                        {isRTL
                          ? 'לחץ על הדף בתצוגה המקדימה כדי להוסיף מקום לתמונה'
                          : 'Click on the page preview to add an image placeholder'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'צורת מקום תמונה' : 'Placeholder Shape'}
                      </label>
                      <div className="flex gap-2">
                        {[
                          { id: 'rectangle', icon: Square, label: isRTL ? 'מלבן' : 'Rectangle' },
                          { id: 'rounded', icon: RectangleHorizontal, label: isRTL ? 'מעוגל' : 'Rounded' },
                          { id: 'circle', icon: Circle, label: isRTL ? 'עיגול' : 'Circle' },
                        ].map(shape => (
                          <button
                            key={shape.id}
                            onClick={() => setNewPlaceholderShape(shape.id as any)}
                            className={`flex-1 p-2 rounded-lg border transition-colors ${
                              newPlaceholderShape === shape.id
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <shape.icon className="w-5 h-5 mx-auto text-gray-300" />
                            <span className="block text-xs text-gray-400 mt-1">{shape.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setIsAddingPlaceholder(!isAddingPlaceholder)}
                      className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                        isAddingPlaceholder
                          ? 'bg-green-600 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isAddingPlaceholder ? (
                        <>
                          <Check className="w-5 h-5" />
                          {isRTL ? 'לחץ על הדף להוספה' : 'Click on page to add'}
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          {isRTL ? 'הוסף מקום לתמונה' : 'Add Image Placeholder'}
                        </>
                      )}
                    </button>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'סגנון מסגרת' : 'Frame Style'}
                      </label>
                      <select
                        value={template.imageFrameStyle}
                        onChange={e => setTemplate(prev => ({
                          ...prev,
                          imageFrameStyle: e.target.value as any
                        }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="none">{isRTL ? 'ללא' : 'None'}</option>
                        <option value="border">{isRTL ? 'מסגרת' : 'Border'}</option>
                        <option value="shadow">{isRTL ? 'צל' : 'Shadow'}</option>
                        <option value="rounded">{isRTL ? 'מעוגל' : 'Rounded'}</option>
                      </select>
                    </div>

                    {/* List of placeholders */}
                    {template.imagePlaceholders.length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          {isRTL ? 'מקומות תמונה' : 'Image Placeholders'} ({template.imagePlaceholders.length})
                        </label>
                        {template.imagePlaceholders.map((p, idx) => (
                          <div
                            key={p.id}
                            className={`p-2 rounded-lg border ${
                              selectedPlaceholder === p.id
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-300">
                                {isRTL ? `תמונה ${idx + 1}` : `Image ${idx + 1}`}
                              </span>
                              <button
                                onClick={() => deletePlaceholder(p.id)}
                                className="p-1 hover:bg-red-500/20 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                            {selectedPlaceholder === p.id && (
                              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-400">{isRTL ? 'רוחב' : 'Width'}</span>
                                  <input
                                    type="number"
                                    value={Math.round(p.width)}
                                    onChange={e => updatePlaceholder(p.id, { width: parseInt(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white"
                                  />
                                </div>
                                <div>
                                  <span className="text-gray-400">{isRTL ? 'גובה' : 'Height'}</span>
                                  <input
                                    type="number"
                                    value={Math.round(p.height)}
                                    onChange={e => updatePlaceholder(p.id, { height: parseInt(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Decorations Section */}
                {activeSection === 'decorations' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'קישוט כותרת' : 'Header Decoration'}
                      </label>
                      <select
                        value={template.headerDecoration}
                        onChange={e => setTemplate(prev => ({
                          ...prev,
                          headerDecoration: e.target.value as any
                        }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="none">{isRTL ? 'ללא' : 'None'}</option>
                        <option value="line">{isRTL ? 'קו' : 'Line'}</option>
                        <option value="ornament">{isRTL ? 'עיטור' : 'Ornament'}</option>
                        <option value="dots">{isRTL ? 'נקודות' : 'Dots'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'סגנון מפריד' : 'Divider Style'}
                      </label>
                      <select
                        value={template.dividerStyle}
                        onChange={e => setTemplate(prev => ({
                          ...prev,
                          dividerStyle: e.target.value as any
                        }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="none">{isRTL ? 'ללא' : 'None'}</option>
                        <option value="line">{isRTL ? 'קו' : 'Line'}</option>
                        <option value="ornament">{isRTL ? 'עיטור' : 'Ornament'}</option>
                        <option value="stars">{isRTL ? 'כוכבים' : 'Stars'}</option>
                        <option value="dots">{isRTL ? 'נקודות' : 'Dots'}</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-gray-300">
                        {isRTL ? 'אות ראשונה גדולה (Drop Cap)' : 'Drop Cap'}
                      </span>
                      <button
                        onClick={() => setTemplate(prev => ({
                          ...prev,
                          dropCapEnabled: !prev.dropCapEnabled
                        }))}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          template.dropCapEnabled ? 'bg-purple-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            template.dropCapEnabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className={`flex-1 p-3 sm:p-6 overflow-y-auto bg-gray-800/50 ${
              mobileView === 'settings' ? 'hidden lg:block' : 'block'
            }`}>
              {/* Template Name */}
              <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    {isRTL ? 'שם התבנית (אנגלית)' : 'Template Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={template.name}
                    onChange={e => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Custom Template"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    {isRTL ? 'שם התבנית (עברית)' : 'Template Name (Hebrew)'}
                  </label>
                  <input
                    type="text"
                    value={template.nameHe}
                    onChange={e => setTemplate(prev => ({ ...prev, nameHe: e.target.value }))}
                    placeholder="התבנית שלי"
                    dir="rtl"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white text-sm"
                  />
                </div>
              </div>

              {/* Page Preview */}
              <div className="flex justify-center">
                <div
                  ref={previewRef}
                  onClick={handlePreviewClick}
                  className={`relative shadow-2xl transition-all w-full max-w-[280px] sm:max-w-[350px] aspect-[7/10] ${
                    isAddingPlaceholder ? 'cursor-crosshair ring-2 ring-green-500' : ''
                  }`}
                  style={{
                    backgroundColor: template.backgroundColor,
                    padding: `${template.margins.top * 0.5}px ${template.margins.right * 0.5}px ${template.margins.bottom * 0.5}px ${template.margins.left * 0.5}px`,
                    fontFamily: template.fonts.body,
                    fontSize: `${template.fontSize * 0.8}px`,
                    lineHeight: template.lineHeight,
                    color: template.textColor,
                    direction: isRTL ? 'rtl' : 'ltr',
                  }}
                >
                  {/* Sample content */}
                  <div
                    className="mb-4"
                    style={{
                      fontFamily: template.fonts.title,
                      fontSize: '24px',
                      color: template.accentColor,
                      textAlign: 'center',
                    }}
                  >
                    {isRTL ? 'פרק ראשון' : 'Chapter One'}
                  </div>

                  {template.headerDecoration === 'line' && (
                    <div
                      className="w-1/2 mx-auto mb-4"
                      style={{ height: '2px', backgroundColor: template.accentColor }}
                    />
                  )}

                  {/* Columns layout */}
                  <div style={{ columnCount: template.columns, columnGap: '15px' }}>
                    {template.dropCapEnabled && (
                      <span
                        style={{
                          float: isRTL ? 'right' : 'left',
                          fontSize: '48px',
                          lineHeight: 1,
                          marginRight: isRTL ? '0' : '5px',
                          marginLeft: isRTL ? '5px' : '0',
                          color: template.accentColor,
                          fontFamily: template.fonts.title,
                        }}
                      >
                        {isRTL ? 'ב' : 'I'}
                      </span>
                    )}
                    <p style={{ textIndent: `${template.paragraphIndent}px`, marginBottom: `${template.paragraphSpacing}px` }}>
                      {isRTL
                        ? 'בתחילת הסיפור שלנו, נפגוש את הגיבור הראשי. הוא יוצא למסע מרתק שישנה את חייו...'
                        : 'In the beginning of our story, we meet the main character. They embark on a journey that will change their life forever...'}
                    </p>
                    <p style={{ textIndent: `${template.paragraphIndent}px`, marginBottom: `${template.paragraphSpacing}px` }}>
                      {isRTL
                        ? 'הדרך ארוכה ומלאה אתגרים, אבל הגיבור שלנו לא מוותר. הוא ממשיך קדימה עם אמונה בליבו.'
                        : 'The path is long and full of challenges, but our hero never gives up. They keep moving forward with faith in their heart.'}
                    </p>
                  </div>

                  {/* Image placeholders */}
                  {template.imagePlaceholders.map(p => (
                    <div
                      key={p.id}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedPlaceholder(p.id);
                      }}
                      className={`absolute flex items-center justify-center transition-all ${
                        selectedPlaceholder === p.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.width}%`,
                        height: `${p.height}%`,
                        transform: `rotate(${p.rotation}deg)`,
                        backgroundColor: `${template.accentColor}20`,
                        border: `2px dashed ${template.accentColor}`,
                        borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rounded' ? '12px' : '4px',
                        boxShadow: template.imageFrameStyle === 'shadow' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <ImageIcon
                        className="w-6 h-6"
                        style={{ color: template.accentColor, opacity: 0.5 }}
                      />
                    </div>
                  ))}

                  {/* Page number */}
                  {template.pageNumberPosition !== 'none' && (
                    <div
                      className="absolute text-xs"
                      style={{
                        color: template.textColor,
                        opacity: 0.5,
                        ...(template.pageNumberPosition === 'bottom-center' && { bottom: '10px', left: '50%', transform: 'translateX(-50%)' }),
                        ...(template.pageNumberPosition === 'bottom-outside' && { bottom: '10px', right: '15px' }),
                        ...(template.pageNumberPosition === 'top-left' && { top: '10px', left: '15px' }),
                        ...(template.pageNumberPosition === 'top-right' && { top: '10px', right: '15px' }),
                      }}
                    >
                      1
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-4 sm:mt-6 flex justify-center pb-4 sm:pb-0">
                <button
                  onClick={handleSave}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg text-sm sm:text-base"
                >
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isRTL ? 'שמור תבנית' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
