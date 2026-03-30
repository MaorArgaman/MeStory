import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, ChevronUp, Hash } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BOOK_TAGS,
  TAG_CATEGORIES,
  BookTag,
  TagCategory,
  getTagsByCategory,
  getPopularTags,
  searchTags
} from '../../data/bookTags';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  className?: string;
}

export default function TagSelector({
  selectedTags,
  onChange,
  maxTags = 15,
  className = ''
}: TagSelectorProps) {
  const { t: _t } = useTranslation(); // Reserved for future label translations
  const { language } = useLanguage();
  void _t;
  const lang = language as 'en' | 'he';

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<TagCategory | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Get selected tag objects
  const selectedTagObjects = useMemo(() => {
    return selectedTags
      .map(id => BOOK_TAGS.find(tag => tag.id === id))
      .filter((tag): tag is BookTag => tag !== undefined);
  }, [selectedTags]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTags(searchQuery, lang).slice(0, 10);
  }, [searchQuery, lang]);

  // Popular tags (not already selected)
  const popularTags = useMemo(() => {
    return getPopularTags().filter(tag => !selectedTags.includes(tag.id));
  }, [selectedTags]);

  // Categories to show
  const categoriesToShow: TagCategory[] = [
    'life_events',
    'emotions',
    'relationships',
    'themes',
    'challenges',
    'achievements',
    'identity',
    'israeli',
    'mood',
  ];

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else if (selectedTags.length < maxTags) {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter(id => id !== tagId));
  };

  const toggleCategory = (category: TagCategory) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className={`space-y-4 ${className}`} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {/* Selected Tags */}
      {selectedTagObjects.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">
              {lang === 'he' ? 'תגיות נבחרות' : 'Selected Tags'} ({selectedTagObjects.length}/{maxTags})
            </label>
            {selectedTagObjects.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="text-xs text-red-400 hover:text-red-300"
              >
                {lang === 'he' ? 'נקה הכל' : 'Clear all'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTagObjects.map(tag => (
              <motion.span
                key={tag.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-sm"
              >
                <span>{tag.icon}</span>
                <span>{tag.name[lang]}</span>
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="p-0.5 hover:bg-white/10 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'he' ? 'חפש תגיות...' : 'Search tags...'}
          className="input pl-10 text-sm"
        />

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-20 top-full mt-1 w-full bg-slate-800 border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {searchResults.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      handleToggleTag(tag.id);
                      setSearchQuery('');
                    }}
                    disabled={!isSelected && selectedTags.length >= maxTags}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-50 ${
                      isSelected ? 'bg-indigo-500/20' : ''
                    }`}
                  >
                    <span>{tag.icon}</span>
                    <span className="flex-1">{tag.name[lang]}</span>
                    {isSelected && <span className="text-indigo-400">✓</span>}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Popular Tags */}
      {!showAll && popularTags.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">
            <Hash className="w-4 h-4 inline mr-1" />
            {lang === 'he' ? 'תגיות פופולריות' : 'Popular Tags'}
          </label>
          <div className="flex flex-wrap gap-2">
            {popularTags.slice(0, 8).map(tag => (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag.id)}
                disabled={selectedTags.length >= maxTags}
                className="px-3 py-1.5 rounded-full bg-white/5 text-gray-300 border border-white/10 text-sm hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>{tag.icon}</span>
                <span>{tag.name[lang]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Show All Categories */}
      <button
        onClick={() => setShowAll(!showAll)}
        className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
      >
        {showAll ? (
          <>
            <ChevronUp className="w-4 h-4" />
            {lang === 'he' ? 'הסתר קטגוריות' : 'Hide categories'}
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            {lang === 'he' ? 'עיין בכל הקטגוריות' : 'Browse all categories'}
          </>
        )}
      </button>

      {/* Categories */}
      <AnimatePresence>
        {showAll && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {categoriesToShow.map(categoryKey => {
              const category = TAG_CATEGORIES[categoryKey];
              const categoryTags = getTagsByCategory(categoryKey);
              const isExpanded = expandedCategory === categoryKey;
              const selectedInCategory = categoryTags.filter(tag => selectedTags.includes(tag.id)).length;

              return (
                <div key={categoryKey} className="border border-white/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{category[lang]}</span>
                      {selectedInCategory > 0 && (
                        <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 text-xs rounded-full">
                          {selectedInCategory}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 py-3 bg-black/20"
                      >
                        <div className="flex flex-wrap gap-2">
                          {categoryTags.map(tag => {
                            const isSelected = selectedTags.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                onClick={() => handleToggleTag(tag.id)}
                                disabled={!isSelected && selectedTags.length >= maxTags}
                                className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                                  isSelected
                                    ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                                    : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                                }`}
                              >
                                <span>{tag.icon}</span>
                                <span>{tag.name[lang]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Max tags warning */}
      {selectedTags.length >= maxTags && (
        <p className="text-sm text-amber-400">
          {lang === 'he'
            ? `הגעת למקסימום ${maxTags} תגיות`
            : `You've reached the maximum of ${maxTags} tags`}
        </p>
      )}
    </div>
  );
}
