import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layout, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { bookTemplates, templateCategories, BookTemplate } from '../../data/bookTemplates';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: BookTemplate) => void;
  currentTemplateId?: string;
}

export default function TemplateGallery({
  isOpen,
  onClose,
  onSelect,
  currentTemplateId,
}: TemplateGalleryProps) {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = selectedCategory === 'all'
    ? bookTemplates
    : bookTemplates.filter(t => t.category === selectedCategory);

  const handleSelect = (template: BookTemplate) => {
    onSelect(template);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-4 md:inset-10 z-50 flex items-center justify-center"
          >
            <div className="w-full max-w-6xl max-h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Layout className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {language === 'he' ? 'בחר תבנית עיצוב' : 'Choose Design Template'}
                    </h2>
                    <p className="text-sm text-white/60">
                      {language === 'he'
                        ? 'בחר תבנית מוכנה מראש או התחל מאפס'
                        : 'Select a pre-made template or start from scratch'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Category Filters */}
              <div className="px-6 py-3 border-b border-white/10 flex gap-2 overflow-x-auto">
                {templateCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category.id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {language === 'he' ? category.nameHe : category.name}
                  </button>
                ))}
              </div>

              {/* Templates Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredTemplates.map((template, index) => (
                    <motion.button
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelect(template)}
                      className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
                        currentTemplateId === template.id
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                          : 'border-white/10 hover:border-indigo-500/50'
                      }`}
                    >
                      {/* Preview */}
                      <div
                        className="aspect-[3/4] relative"
                        style={{ background: template.previewGradient }}
                      >
                        {/* Template Preview Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          {/* Mini book preview */}
                          <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-lg p-3 flex flex-col">
                            {/* Title preview */}
                            <div
                              className="text-center mb-2"
                              style={{
                                fontFamily: template.fonts.title,
                                color: template.coverStyle.titleColor,
                              }}
                            >
                              <div className="text-xs font-bold truncate">
                                {language === 'he' ? template.nameHe : template.name}
                              </div>
                            </div>

                            {/* Content preview - columns */}
                            <div className={`flex-1 flex gap-1 ${template.columns > 2 ? 'gap-0.5' : ''}`}>
                              {Array.from({ length: Math.min(template.columns, 3) }).map((_, i) => (
                                <div key={i} className="flex-1 space-y-0.5">
                                  {Array.from({ length: 4 }).map((_, j) => (
                                    <div
                                      key={j}
                                      className="h-0.5 rounded-full opacity-40"
                                      style={{ backgroundColor: template.textColor }}
                                    />
                                  ))}
                                </div>
                              ))}
                            </div>

                            {/* Page number preview */}
                            {template.pageNumberPosition !== 'none' && (
                              <div className="text-[6px] text-white/40 mt-1 text-center">
                                1
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Custom badge */}
                        {template.category === 'custom' && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-purple-500 rounded text-[10px] font-bold text-white flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {language === 'he' ? 'מותאם' : 'Custom'}
                          </div>
                        )}

                        {/* Selected indicator */}
                        {currentTemplateId === template.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="px-3 py-1.5 bg-white/90 rounded-lg text-sm font-medium text-slate-900">
                            {language === 'he' ? 'בחר' : 'Select'}
                          </span>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="p-3 bg-slate-800/50">
                        <h3 className="font-medium text-white text-sm truncate">
                          {language === 'he' ? template.nameHe : template.name}
                        </h3>
                        <p className="text-xs text-white/50 truncate mt-0.5">
                          {language === 'he' ? template.descriptionHe : template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/60">
                            {template.columns} {language === 'he' ? 'עמודות' : 'col'}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${template.accentColor}20`,
                              color: template.accentColor,
                            }}
                          >
                            {template.fonts.body.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-slate-900/50">
                <p className="text-sm text-white/50">
                  {language === 'he'
                    ? `${filteredTemplates.length} תבניות זמינות`
                    : `${filteredTemplates.length} templates available`}
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  {language === 'he' ? 'ביטול' : 'Cancel'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
