/**
 * PageSplitSelector Component
 * Select page split type (none, horizontal, vertical, quadrant)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageSplitType } from '../../types/templates';

interface PageSplitSelectorProps {
  value: PageSplitType;
  onChange: (value: PageSplitType, ratio?: number[]) => void;
  splitRatio?: number[];
}

export default function PageSplitSelector({
  value,
  onChange,
  splitRatio = [50, 50],
}: PageSplitSelectorProps) {
  const [ratio, setRatio] = useState(splitRatio[0] || 50);

  const splitOptions: { value: PageSplitType; label: string; description: string }[] = [
    { value: 'none', label: 'No Split', description: 'Full page' },
    { value: 'horizontal', label: 'Horizontal', description: 'Top / Bottom' },
    { value: 'vertical', label: 'Vertical', description: 'Left / Right' },
    { value: 'quadrant', label: 'Quadrant', description: '4 parts' },
  ];

  // Visual representation of split types
  const SplitPreview = ({ type }: { type: PageSplitType }) => {
    if (type === 'none') {
      return (
        <div className="w-full h-12 rounded bg-current opacity-30" />
      );
    }

    if (type === 'horizontal') {
      return (
        <div className="w-full h-12 flex flex-col gap-1">
          <div className="flex-1 rounded bg-current opacity-30" />
          <div className="flex-1 rounded bg-current opacity-20" />
        </div>
      );
    }

    if (type === 'vertical') {
      return (
        <div className="w-full h-12 flex gap-1">
          <div className="flex-1 rounded bg-current opacity-30" />
          <div className="flex-1 rounded bg-current opacity-20" />
        </div>
      );
    }

    // quadrant
    return (
      <div className="w-full h-12 grid grid-cols-2 grid-rows-2 gap-1">
        <div className="rounded bg-current opacity-30" />
        <div className="rounded bg-current opacity-25" />
        <div className="rounded bg-current opacity-20" />
        <div className="rounded bg-current opacity-15" />
      </div>
    );
  };

  const handleRatioChange = (newRatio: number) => {
    setRatio(newRatio);
    onChange(value, [newRatio, 100 - newRatio]);
  };

  const handleSplitTypeChange = (type: PageSplitType) => {
    if (type === 'quadrant') {
      onChange(type, [50, 50, 50, 50]);
    } else if (type === 'none') {
      onChange(type);
    } else {
      onChange(type, [ratio, 100 - ratio]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Split Type Selection */}
      <div>
        <label className="block text-sm text-gray-400 mb-3">Split Type</label>
        <div className="grid grid-cols-4 gap-2">
          {splitOptions.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSplitTypeChange(option.value)}
              className={`
                relative p-3 rounded-xl transition-all
                ${value === option.value
                  ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                }
              `}
            >
              <SplitPreview type={option.value} />
              <div className="mt-2 text-xs font-medium">{option.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Ratio Slider (for horizontal and vertical only) */}
      {(value === 'horizontal' || value === 'vertical') && (
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Split Ratio: {ratio}% / {100 - ratio}%
          </label>
          <input
            type="range"
            min="20"
            max="80"
            value={ratio}
            onChange={(e) => handleRatioChange(parseInt(e.target.value))}
            className="w-full accent-yellow-500"
          />

          {/* Visual ratio preview */}
          <div className={`mt-3 h-8 rounded-lg overflow-hidden flex ${
            value === 'horizontal' ? 'flex-col' : 'flex-row'
          }`}>
            <div
              className="bg-yellow-500/40 flex items-center justify-center text-xs text-white"
              style={{
                [value === 'horizontal' ? 'height' : 'width']: `${ratio}%`,
              }}
            >
              {value === 'horizontal' ? 'Top' : 'Right'}
            </div>
            <div
              className="bg-purple-500/40 flex items-center justify-center text-xs text-white"
              style={{
                [value === 'horizontal' ? 'height' : 'width']: `${100 - ratio}%`,
              }}
            >
              {value === 'horizontal' ? 'Bottom' : 'Left'}
            </div>
          </div>

          {/* Preset Ratios */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleRatioChange(30)}
              className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-300
                hover:bg-white/10 transition-colors"
            >
              30/70
            </button>
            <button
              onClick={() => handleRatioChange(50)}
              className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-300
                hover:bg-white/10 transition-colors"
            >
              50/50
            </button>
            <button
              onClick={() => handleRatioChange(66)}
              className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-300
                hover:bg-white/10 transition-colors"
            >
              66/34
            </button>
            <button
              onClick={() => handleRatioChange(70)}
              className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-300
                hover:bg-white/10 transition-colors"
            >
              70/30
            </button>
          </div>
        </div>
      )}

      {/* Split Type Description */}
      <div className="p-3 rounded-lg bg-white/5 text-sm text-gray-400">
        <strong className="text-yellow-400">
          {splitOptions.find(o => o.value === value)?.label}:
        </strong>{' '}
        {value === 'none' && 'The page will be used as a single whole unit. Suitable for most content types.'}
        {value === 'horizontal' && 'The page will be split into top and bottom sections. Suitable for image + text or two different content types.'}
        {value === 'vertical' && 'The page will be split into left and right sections. Suitable for bilingual text or comparisons.'}
        {value === 'quadrant' && 'The page will be split into four equal parts. Suitable for image galleries or complex content organization.'}
      </div>

      {/* Usage Tips */}
      {value !== 'none' && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
          <strong>Tip:</strong> Each section can contain separate columns and independent styling.
          You can drag content blocks between sections.
        </div>
      )}
    </div>
  );
}
