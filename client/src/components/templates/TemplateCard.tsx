/**
 * TemplateCard Component
 * Displays a single template in the gallery
 */

import { motion } from 'framer-motion';
import { Eye, Check, Star, Users } from 'lucide-react';
import { BookTemplate, getCategoryInfo } from '../../types/templates';

interface TemplateCardProps {
  template: BookTemplate;
  isSelected?: boolean;
  onSelect?: (template: BookTemplate) => void;
  onPreview?: (template: BookTemplate) => void;
  compact?: boolean;
}

export default function TemplateCard({
  template,
  isSelected = false,
  onSelect,
  onPreview,
  compact = false,
}: TemplateCardProps) {
  const categoryInfo = getCategoryInfo(template.category);

  // Generate a gradient background based on template category
  const categoryGradients: Record<string, string> = {
    academic: 'from-blue-900 to-blue-700',
    'personal-story': 'from-amber-800 to-amber-600',
    children: 'from-pink-500 to-orange-400',
    novel: 'from-gray-800 to-gray-600',
    poetry: 'from-purple-800 to-purple-600',
    'self-help': 'from-indigo-600 to-purple-600',
    cookbook: 'from-yellow-600 to-orange-500',
    travel: 'from-cyan-600 to-blue-500',
    'photo-album': 'from-gray-900 to-gray-700',
    custom: 'from-gray-600 to-gray-500',
  };

  const gradient = categoryGradients[template.category] || 'from-gray-700 to-gray-600';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer
        border-2 transition-all duration-200
        ${isSelected
          ? 'border-yellow-500 ring-2 ring-yellow-500/30'
          : 'border-white/10 hover:border-white/30'
        }
      `}
      onClick={() => onSelect?.(template)}
    >
      {/* Thumbnail / Preview Area */}
      <div className={`relative ${compact ? 'h-28' : 'h-40'} bg-gradient-to-br ${gradient}`}>
        {/* Template Preview Image */}
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          // Fallback: Mini book preview
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-28 bg-white/90 rounded shadow-lg transform -rotate-3 flex flex-col p-2">
              <div className="h-1 w-8 bg-gray-300 rounded mb-1" />
              <div className="h-0.5 w-12 bg-gray-200 rounded mb-0.5" />
              <div className="h-0.5 w-10 bg-gray-200 rounded mb-2" />
              <div className="flex-1 space-y-0.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-0.5 w-full bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
          <span className="text-xs text-white flex items-center gap-1">
            <span>{categoryInfo?.icon}</span>
            <span>{template.nameHe}</span>
          </span>
        </div>

        {/* System Badge */}
        {template.isSystem && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-yellow-500/80 backdrop-blur-sm">
            <Star className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Selected Checkmark */}
        {isSelected && (
          <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
            <div className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} rounded-full bg-yellow-500 flex items-center justify-center`}>
              <Check className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
            </div>
          </div>
        )}

        {/* Preview Button (on hover) */}
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.(template);
          }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5
            rounded-full bg-white/90 text-gray-800 text-xs font-medium
            flex items-center gap-1 hover:bg-white transition-colors
            opacity-0 hover:opacity-100 group-hover:opacity-100"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>תצוגה מקדימה</span>
        </motion.button>
      </div>

      {/* Template Info */}
      <div className={`${compact ? 'p-2' : 'p-3'} bg-white/5`} dir="rtl">
        <h3 className={`font-medium text-white ${compact ? 'text-xs' : 'text-sm'} mb-1 truncate`}>
          {template.nameHe}
        </h3>
        {!compact && (
          <p className="text-xs text-gray-400 line-clamp-2 h-8">
            {template.descriptionHe || template.description}
          </p>
        )}

        {/* Stats - hide in compact mode */}
        {!compact && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1 text-gray-500">
              <Users className="w-3 h-3" />
              <span className="text-xs">{template.usageCount || 0} שימושים</span>
            </div>

            {/* Tags Preview */}
            {template.tags && template.tags.length > 0 && (
              <div className="flex gap-1">
                {template.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
