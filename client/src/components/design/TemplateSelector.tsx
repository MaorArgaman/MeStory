import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, BookOpen, Sparkles, Search } from 'lucide-react';
import { api } from '../../services/api';
import {
  TemplateCategory,
  TEMPLATE_CATEGORIES,
  BookTemplate,
} from '../../types/templates';

interface TemplateSelectorProps {
  onSelect: (template: BookTemplate) => void;
  selectedId?: string;
  bookGenre?: string;
  language?: string;
}

// Category icons mapping
const CATEGORY_ICONS: Record<TemplateCategory | 'ai', string> = {
  'ai': '🎨',
  'academic': '📚',
  'personal-story': '💭',
  'children': '🧸',
  'novel': '📖',
  'poetry': '✨',
  'self-help': '🎯',
  'cookbook': '🍳',
  'travel': '✈️',
  'photo-album': '📷',
  'custom': '🎨',
};

export default function TemplateSelector({
  onSelect,
  selectedId,
  bookGenre,
  language = 'en',
}: TemplateSelectorProps) {
  const isHebrew = language === 'he';

  const [templates, setTemplates] = useState<BookTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<BookTemplate | null>(null);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/templates/system');
      if (response.data.success) {
        setTemplates(response.data.data?.templates || response.data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Use default templates if API fails
      setTemplates(getDefaultTemplates());
    } finally {
      setLoading(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = isHebrew ? t.nameHe : t.name;
      const desc = isHebrew ? t.descriptionHe : t.description;
      return name.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
    }
    return true;
  });

  // Get recommended template based on genre
  const getRecommendedCategory = (): TemplateCategory | null => {
    if (!bookGenre) return null;
    const genre = bookGenre.toLowerCase();

    if (genre.includes('children') || genre.includes('kids')) return 'children';
    if (genre.includes('poetry') || genre.includes('poem')) return 'poetry';
    if (genre.includes('cook') || genre.includes('recipe')) return 'cookbook';
    if (genre.includes('travel') || genre.includes('journey')) return 'travel';
    if (genre.includes('photo') || genre.includes('album')) return 'photo-album';
    if (genre.includes('self-help') || genre.includes('motivation')) return 'self-help';
    if (genre.includes('memoir') || genre.includes('biography') || genre.includes('personal')) return 'personal-story';
    if (genre.includes('academic') || genre.includes('research')) return 'academic';

    return 'novel'; // Default to novel
  };

  const recommendedCategory = getRecommendedCategory();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {isHebrew ? 'הכל' : 'All'}
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === cat.key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            } ${cat.key === recommendedCategory ? 'ring-2 ring-purple-400' : ''}`}
          >
            <span>{cat.icon}</span>
            <span>{isHebrew ? cat.nameHe : cat.name}</span>
            {cat.key === recommendedCategory && (
              <Sparkles className="w-4 h-4 text-yellow-400" />
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isHebrew ? 'חפש תבנית...' : 'Search templates...'}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template._id}
            template={template}
            isSelected={selectedId === template._id}
            isRecommended={template.category === recommendedCategory}
            onClick={() => onSelect(template)}
            onPreview={() => setPreviewTemplate(template)}
            language={language}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{isHebrew ? 'לא נמצאו תבניות' : 'No templates found'}</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={() => {
            onSelect(previewTemplate);
            setPreviewTemplate(null);
          }}
          language={language}
        />
      )}
    </div>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: BookTemplate;
  isSelected: boolean;
  isRecommended: boolean;
  onClick: () => void;
  onPreview: () => void;
  language: string;
}

function TemplateCard({
  template,
  isSelected,
  isRecommended,
  onClick,
  onPreview,
  language,
}: TemplateCardProps) {
  const isHebrew = language === 'he';
  const name = isHebrew ? template.nameHe : template.name;
  const description = isHebrew ? template.descriptionHe : template.description;
  const categoryInfo = TEMPLATE_CATEGORIES.find((c) => c.key === template.category);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative bg-gray-800 rounded-xl overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-purple-500' : 'hover:ring-1 hover:ring-gray-600'
      }`}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-gray-700 relative">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">{CATEGORY_ICONS[template.category] || '📄'}</span>
          </div>
        )}

        {/* Recommended Badge */}
        {isRecommended && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {isHebrew ? 'מומלץ' : 'Recommended'}
          </div>
        )}

        {/* Selected Check */}
        {isSelected && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Preview Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 hover:bg-black/70 rounded text-xs text-white transition-colors"
        >
          {isHebrew ? 'תצוגה מקדימה' : 'Preview'}
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span>{categoryInfo?.icon || '📄'}</span>
          <h3 className="font-medium text-sm truncate">{name}</h3>
        </div>
        <p className="text-xs text-gray-400 line-clamp-2">{description}</p>
      </div>
    </motion.div>
  );
}

// Template Preview Modal
interface TemplatePreviewModalProps {
  template: BookTemplate;
  onClose: () => void;
  onSelect: () => void;
  language: string;
}

function TemplatePreviewModal({
  template,
  onClose,
  onSelect,
  language,
}: TemplatePreviewModalProps) {
  const isHebrew = language === 'he';
  const name = isHebrew ? template.nameHe : template.name;
  const description = isHebrew ? template.descriptionHe : template.description;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Preview Images */}
          <div className="md:w-1/2 bg-gray-900 p-6 flex items-center justify-center">
            {template.thumbnail ? (
              <img
                src={template.thumbnail}
                alt={name}
                className="max-w-full max-h-96 object-contain rounded-lg shadow-xl"
              />
            ) : (
              <div className="text-9xl">
                {CATEGORY_ICONS[template.category] || '📄'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:w-1/2 p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-2">{name}</h2>
            <p className="text-gray-400 mb-6">{description}</p>

            {/* Template Features */}
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="font-medium mb-2">
                  {isHebrew ? 'מאפיינים' : 'Features'}
                </h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• {isHebrew ? 'גופנים מותאמים' : 'Matched fonts'}</li>
                  <li>• {isHebrew ? 'פריסת עמודים אופטימלית' : 'Optimal page layout'}</li>
                  <li>• {isHebrew ? 'תמיכה בעברית ואנגלית' : 'Hebrew & English support'}</li>
                  <li>• {isHebrew ? 'אזורי תמונות מוכנים' : 'Pre-defined image zones'}</li>
                </ul>
              </div>

              {/* AI Suggestions */}
              {template.aiSettings && (
                <div>
                  <h3 className="font-medium mb-2">
                    {isHebrew ? 'הצעות AI' : 'AI Suggestions'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {template.aiSettings.suggestedFonts?.slice(0, 4).map((font) => (
                      <span
                        key={font}
                        className="px-2 py-1 bg-gray-700 rounded text-xs"
                      >
                        {font}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {isHebrew ? 'סגור' : 'Close'}
              </button>
              <button
                onClick={onSelect}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {isHebrew ? 'בחר תבנית זו' : 'Select Template'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Default templates fallback
function getDefaultTemplates(): BookTemplate[] {
  return TEMPLATE_CATEGORIES.map((cat) => ({
    _id: cat.key,
    name: cat.name,
    nameHe: cat.nameHe,
    category: cat.key,
    description: cat.description,
    descriptionHe: cat.description,
    thumbnail: '',
    previewImages: [],
    isSystem: true,
    defaults: {} as any,
    pageTypes: {} as any,
    coverDefaults: {} as any,
    aiSettings: {
      suggestedFonts: [],
      suggestedColorPalettes: [],
      imagePlacementRules: '',
      styleGuidelines: '',
    },
    tags: [cat.key],
    isActive: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}
