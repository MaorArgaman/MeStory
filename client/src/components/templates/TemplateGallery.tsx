/**
 * TemplateGallery Component
 * Displays all templates with filtering and selection
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Loader2,
  Grid,
  List,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { BookTemplate, TemplateCategory, TEMPLATE_CATEGORIES } from '../../types/templates';
import { getAllTemplates, getTemplateRecommendations } from '../../services/templateApi';
import TemplateCard from './TemplateCard';
import TemplatePreviewModal from './TemplatePreviewModal';

interface TemplateGalleryProps {
  onSelect?: (template: BookTemplate) => void;
  onSelectTemplate?: (template: BookTemplate) => void;
  selectedTemplateId?: string;
  selectedTemplate?: BookTemplate | null;
  genre?: string;
  targetAudience?: string;
  showRecommendations?: boolean;
  compact?: boolean;
}

export default function TemplateGallery({
  onSelect,
  onSelectTemplate,
  selectedTemplateId,
  selectedTemplate,
  genre,
  targetAudience,
  showRecommendations = true,
  compact = false,
}: TemplateGalleryProps) {
  // Support both prop names for flexibility
  const handleTemplateSelect = onSelectTemplate || onSelect;
  const currentSelectedId = selectedTemplateId || selectedTemplate?._id;
  const [templates, setTemplates] = useState<BookTemplate[]>([]);
  const [recommendations, setRecommendations] = useState<BookTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<BookTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch recommendations when genre changes
  useEffect(() => {
    if (genre && showRecommendations) {
      fetchRecommendations();
    }
  }, [genre, targetAudience]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!genre) return;
    try {
      const data = await getTemplateRecommendations(genre, targetAudience);
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    // Category filter
    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.nameHe.includes(searchQuery) ||
        template.description.toLowerCase().includes(query) ||
        template.descriptionHe.includes(searchQuery) ||
        template.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Group templates by category for display
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<TemplateCategory, BookTemplate[]>);

  const handleSelect = (template: BookTemplate) => {
    if (handleTemplateSelect) {
      handleTemplateSelect(template);
    }
  };

  const handlePreview = (template: BookTemplate) => {
    setPreviewTemplate(template);
  };

  return (
    <div className={`space-y-${compact ? '4' : '6'}`} dir="rtl">
      {/* Header & Filters */}
      <div className="space-y-4">
        {/* Search & View Toggle */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="חפש תבניות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-10 pl-4 ${compact ? 'py-2' : 'py-2.5'} rounded-xl bg-white/5 border border-white/10
                text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50
                transition-colors`}
            />
          </div>

          {/* View Mode Toggle - hidden in compact mode */}
          {!compact && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className={`${compact ? 'p-2' : 'p-2.5'} rounded-xl bg-white/5 border border-white/10 hover:bg-white/10
              transition-colors disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedCategory === 'all'
                ? 'bg-yellow-500 text-black font-medium'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            הכל
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                selectedCategory === cat.key
                  ? 'bg-yellow-500 text-black font-medium'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.nameHe}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center gap-2 py-8 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={fetchTemplates} className="underline hover:no-underline">
            נסה שוב
          </button>
        </div>
      )}

      {/* Recommendations Section */}
      {!loading && showRecommendations && recommendations.length > 0 && selectedCategory === 'all' && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">מומלצות עבורך</h3>
            <span className="text-sm text-gray-400">
              (בהתאם לז'אנר: {genre})
            </span>
          </div>
          <div className={`grid gap-${compact ? '3' : '4'} ${
            viewMode === 'grid'
              ? compact
                ? 'grid-cols-2 md:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {recommendations.map((template) => (
              <TemplateCard
                key={template._id}
                template={template}
                isSelected={template._id === currentSelectedId}
                onSelect={handleSelect}
                onPreview={handlePreview}
                compact={compact}
              />
            ))}
          </div>
          <div className="border-b border-white/10" />
        </div>
      )}

      {/* Templates Grid/List */}
      {!loading && !error && (
        <AnimatePresence mode="wait">
          {filteredTemplates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-gray-400"
            >
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>לא נמצאו תבניות התואמות לחיפוש</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-2 text-yellow-400 hover:underline"
              >
                נקה סינון
              </button>
            </motion.div>
          ) : selectedCategory === 'all' && !searchQuery ? (
            // Grouped by category
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`space-y-${compact ? '4' : '8'}`}
            >
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
                const categoryInfo = TEMPLATE_CATEGORIES.find((c) => c.key === category);
                return (
                  <div key={category} className={`space-y-${compact ? '2' : '4'}`}>
                    <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-white flex items-center gap-2`}>
                      <span>{categoryInfo?.icon}</span>
                      <span>{categoryInfo?.nameHe || category}</span>
                      <span className="text-sm text-gray-500 font-normal">
                        ({categoryTemplates.length})
                      </span>
                    </h3>
                    <div className={`grid gap-${compact ? '3' : '4'} ${
                      viewMode === 'grid'
                        ? compact
                          ? 'grid-cols-2 md:grid-cols-3'
                          : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : 'grid-cols-1'
                    }`}>
                      {categoryTemplates.map((template) => (
                        <TemplateCard
                          key={template._id}
                          template={template}
                          isSelected={template._id === currentSelectedId}
                          onSelect={handleSelect}
                          onPreview={handlePreview}
                          compact={compact}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            // Flat list (filtered)
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`grid gap-${compact ? '3' : '4'} ${
                viewMode === 'grid'
                  ? compact
                    ? 'grid-cols-2 md:grid-cols-3'
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1'
              }`}
            >
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  isSelected={template._id === currentSelectedId}
                  onSelect={handleSelect}
                  onPreview={handlePreview}
                  compact={compact}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onSelect={handleSelect}
      />
    </div>
  );
}
