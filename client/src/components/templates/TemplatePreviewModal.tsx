/**
 * TemplatePreviewModal Component
 * Full template preview with details
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Type,
  Palette,
  Layout,
  Sparkles,
  Star,
} from 'lucide-react';
import { BookTemplate, getCategoryInfo } from '../../types/templates';

interface TemplatePreviewModalProps {
  template: BookTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: BookTemplate) => void;
}

export default function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onSelect,
}: TemplatePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'typography' | 'layout' | 'ai'>('overview');
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  if (!template) return null;

  const categoryInfo = getCategoryInfo(template.category);
  const previewImages = template.previewImages?.length > 0
    ? template.previewImages
    : [template.thumbnail];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BookOpen },
    { key: 'typography', label: 'Typography', icon: Type },
    { key: 'layout', label: 'Layout', icon: Layout },
    { key: 'ai', label: 'AI', icon: Sparkles },
  ];

  const handleSelect = () => {
    onSelect(template);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-gray-900 rounded-2xl
              border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{categoryInfo?.icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{template.name}</h2>
                  <p className="text-sm text-gray-400">{categoryInfo?.name}</p>
                </div>
                {template.isSystem && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                    <Star className="w-3 h-3" />
                    <span className="text-xs">System Template</span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 px-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium
                      border-b-2 transition-colors
                      ${activeTab === tab.key
                        ? 'border-yellow-500 text-yellow-400'
                        : 'border-transparent text-gray-400 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-2 gap-6">
                  {/* Preview Images */}
                  <div className="space-y-4">
                    <div className="relative aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden">
                      {previewImages[currentPreviewIndex] ? (
                        <img
                          src={previewImages[currentPreviewIndex]}
                          alt={`Preview ${currentPreviewIndex + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-template.png';
                          }}
                        />
                      ) : (
                        // Fallback preview
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-32 h-44 bg-white rounded shadow-lg flex flex-col p-4">
                            <div className="h-2 w-16 bg-gray-300 rounded mb-2" />
                            <div className="h-1 w-20 bg-gray-200 rounded mb-1" />
                            <div className="h-1 w-16 bg-gray-200 rounded mb-4" />
                            <div className="flex-1 space-y-1">
                              {[...Array(10)].map((_, i) => (
                                <div key={i} className="h-0.5 w-full bg-gray-100 rounded" />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation Arrows */}
                      {previewImages.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentPreviewIndex((i) => (i > 0 ? i - 1 : previewImages.length - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70"
                          >
                            <ChevronLeft className="w-5 h-5 text-white" />
                          </button>
                          <button
                            onClick={() => setCurrentPreviewIndex((i) => (i < previewImages.length - 1 ? i + 1 : 0))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70"
                          >
                            <ChevronRight className="w-5 h-5 text-white" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Preview Dots */}
                    {previewImages.length > 1 && (
                      <div className="flex justify-center gap-2">
                        {previewImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPreviewIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              idx === currentPreviewIndex ? 'bg-yellow-500' : 'bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                      <p className="text-gray-300 leading-relaxed">
                        {template.description}
                      </p>
                    </div>

                    {/* Tags */}
                    {template.tags && template.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {template.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 text-sm rounded-full bg-white/10 text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-gray-400 mb-1">Page Size</p>
                        <p className="text-white font-medium">{template.defaults.pageSize}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-gray-400 mb-1">Columns</p>
                        <p className="text-white font-medium">{template.defaults.pageLayout.columns}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-gray-400 mb-1">Direction</p>
                        <p className="text-white font-medium">
                          {template.defaults.pageLayout.isRTL ? 'Right to Left' : 'Left to Right'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-gray-400 mb-1">Uses</p>
                        <p className="text-white font-medium">{template.usageCount || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Typography Tab */}
              {activeTab === 'typography' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Body Font */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Body Font</h4>
                      <p
                        className="text-2xl text-white mb-2"
                        style={{ fontFamily: template.defaults.pageLayout.typography.bodyFont }}
                      >
                        {template.defaults.pageLayout.typography.bodyFont}
                      </p>
                      <p className="text-sm text-gray-400">
                        Size: {template.defaults.pageLayout.typography.bodyFontSize}pt •
                        Line Height: {template.defaults.pageLayout.typography.lineHeight}
                      </p>
                    </div>

                    {/* Heading Font */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Heading Font</h4>
                      <p
                        className="text-2xl text-white mb-2"
                        style={{ fontFamily: template.defaults.pageLayout.typography.headingFont }}
                      >
                        {template.defaults.pageLayout.typography.headingFont}
                      </p>
                      <p className="text-sm text-gray-400">
                        Size: {template.defaults.pageLayout.typography.headingFontSize}pt
                      </p>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Colors</h4>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border border-white/20"
                          style={{ backgroundColor: template.defaults.pageLayout.typography.textColor }}
                        />
                        <span className="text-sm text-gray-300">Text Color</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border border-white/20"
                          style={{ backgroundColor: template.defaults.pageLayout.typography.headingColor }}
                        />
                        <span className="text-sm text-gray-300">Heading Color</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border border-white/20"
                          style={{ backgroundColor: template.defaults.pageLayout.background.color || '#ffffff' }}
                        />
                        <span className="text-sm text-gray-300">Background Color</span>
                      </div>
                    </div>
                  </div>

                  {/* Sample Text */}
                  <div className="p-6 rounded-xl bg-white border border-white/20">
                    <h3
                      className="text-xl mb-3"
                      style={{
                        fontFamily: template.defaults.pageLayout.typography.headingFont,
                        color: template.defaults.pageLayout.typography.headingColor,
                      }}
                    >
                      Sample Heading
                    </h3>
                    <p
                      style={{
                        fontFamily: template.defaults.pageLayout.typography.bodyFont,
                        fontSize: `${template.defaults.pageLayout.typography.bodyFontSize}pt`,
                        lineHeight: template.defaults.pageLayout.typography.lineHeight,
                        color: template.defaults.pageLayout.typography.textColor,
                      }}
                    >
                      This is sample text demonstrating how the text will look in your book with this template.
                      The fonts, sizes, and colors were carefully chosen to create a pleasant and professional reading experience.
                    </p>
                  </div>
                </div>
              )}

              {/* Layout Tab */}
              {activeTab === 'layout' && (
                <div className="space-y-6">
                  {/* Margins */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Margins</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries(template.defaults.pageLayout.margins).map(([side, value]) => (
                        <div key={side} className="p-3 rounded-lg bg-white/5 text-center">
                          <p className="text-xs text-gray-400 mb-1">
                            {side === 'top' ? 'Top' :
                             side === 'bottom' ? 'Bottom' :
                             side === 'left' ? 'Left' : 'Right'}
                          </p>
                          <p className="text-white font-medium">{value}mm</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Header/Footer */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-2">Header</h4>
                      <p className="text-sm text-gray-400">
                        {template.defaults.pageLayout.header.enabled ? 'Enabled' : 'Disabled'}
                      </p>
                      {template.defaults.pageLayout.header.enabled && (
                        <p className="text-xs text-gray-500 mt-1">
                          Height: {template.defaults.pageLayout.header.height}px
                        </p>
                      )}
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-2">Footer</h4>
                      <p className="text-sm text-gray-400">
                        {template.defaults.pageLayout.footer.enabled ? 'Enabled' : 'Disabled'}
                      </p>
                      {template.defaults.pageLayout.footer.enabled && (
                        <p className="text-xs text-gray-500 mt-1">
                          Height: {template.defaults.pageLayout.footer.height}px
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Page Number */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm font-medium text-white mb-2">Page Numbers</h4>
                    <p className="text-sm text-gray-400">
                      {template.defaults.pageLayout.showPageNumber
                        ? `Shown at ${template.defaults.pageLayout.pageNumberPosition.includes('top') ? 'the top' : 'the bottom'}`
                        : 'Hidden'}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Tab */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  {/* Suggested Fonts */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Suggested Fonts</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.aiSettings.suggestedFonts.map((font, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm"
                          style={{ fontFamily: font }}
                        >
                          {font}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Color Palettes */}
                  {template.aiSettings.suggestedColorPalettes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Suggested Color Palettes</h4>
                      <div className="space-y-3">
                        {template.aiSettings.suggestedColorPalettes.map((palette, idx) => (
                          <div key={idx} className="flex gap-2">
                            {palette.map((color, colorIdx) => (
                              <div
                                key={colorIdx}
                                className="w-12 h-12 rounded-lg border border-white/20"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Style Guidelines */}
                  {template.aiSettings.styleGuidelines && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Style Guidelines</h4>
                      <p className="text-gray-300 text-sm leading-relaxed p-4 rounded-lg bg-white/5">
                        {template.aiSettings.styleGuidelines}
                      </p>
                    </div>
                  )}

                  {/* Image Placement Rules */}
                  {template.aiSettings.imagePlacementRules && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Image Placement Rules</h4>
                      <p className="text-gray-300 text-sm leading-relaxed p-4 rounded-lg bg-white/5">
                        {template.aiSettings.imagePlacementRules}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/20">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSelect}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                  bg-gradient-to-r from-yellow-500 to-amber-500
                  text-black font-semibold hover:from-yellow-400 hover:to-amber-400
                  transition-all shadow-lg shadow-yellow-500/25"
              >
                <Check className="w-4 h-4" />
                <span>Select this template</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
