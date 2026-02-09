/**
 * ColumnLayoutSelector Component
 * Select number of columns (1-4) for page layout
 */

import { motion } from 'framer-motion';
import { ColumnLayoutType } from '../../types/templates';

interface ColumnLayoutSelectorProps {
  value: ColumnLayoutType;
  onChange: (value: ColumnLayoutType) => void;
  columnGap?: number;
  onColumnGapChange?: (gap: number) => void;
}

export default function ColumnLayoutSelector({
  value,
  onChange,
  columnGap = 10,
  onColumnGapChange,
}: ColumnLayoutSelectorProps) {
  const columnOptions: { value: ColumnLayoutType; label: string; description: string }[] = [
    { value: 1, label: 'One Column', description: 'Classic layout' },
    { value: 2, label: 'Two Columns', description: 'Newspaper / Magazine' },
    { value: 3, label: 'Three Columns', description: 'Dense content' },
    { value: 4, label: 'Four Columns', description: 'Tabular' },
  ];

  // Visual representation of columns
  const ColumnPreview = ({ columns }: { columns: number }) => (
    <div className="flex gap-1 h-10 w-full">
      {[...Array(columns)].map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded bg-current opacity-30"
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Column Count Selection */}
      <div>
        <label className="block text-sm text-gray-400 mb-3">Number of Columns</label>
        <div className="grid grid-cols-4 gap-2">
          {columnOptions.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(option.value)}
              className={`
                relative p-3 rounded-xl transition-all
                ${value === option.value
                  ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                }
              `}
            >
              <ColumnPreview columns={option.value} />
              <div className="mt-2 text-xs font-medium">{option.value}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Column Gap Slider (only show if more than 1 column) */}
      {value > 1 && onColumnGapChange && (
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Column Gap: {columnGap}mm
          </label>
          <input
            type="range"
            min="2"
            max="30"
            value={columnGap}
            onChange={(e) => onColumnGapChange(parseInt(e.target.value))}
            className="w-full accent-yellow-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Dense (2mm)</span>
            <span>Spacious (30mm)</span>
          </div>
        </div>
      )}

      {/* Column Description */}
      <div className="p-3 rounded-lg bg-white/5 text-sm text-gray-400">
        <strong className="text-yellow-400">
          {columnOptions.find(o => o.value === value)?.label}:
        </strong>{' '}
        {columnOptions.find(o => o.value === value)?.description}
        {value === 1 && ' - Suitable for most book types, comfortable reading.'}
        {value === 2 && ' - Suitable for reference books, dictionaries, encyclopedias.'}
        {value === 3 && ' - Suitable for newspapers, catalogs, newsletters.'}
        {value === 4 && ' - Suitable for tables, lists, numerical data.'}
      </div>

      {/* Quick Presets */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Ready Layouts</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              onChange(1);
              onColumnGapChange?.(0);
            }}
            className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-gray-300
              hover:bg-white/10 transition-colors"
          >
            Classic Book
          </button>
          <button
            onClick={() => {
              onChange(2);
              onColumnGapChange?.(10);
            }}
            className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-gray-300
              hover:bg-white/10 transition-colors"
          >
            Magazine
          </button>
          <button
            onClick={() => {
              onChange(2);
              onColumnGapChange?.(20);
            }}
            className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-gray-300
              hover:bg-white/10 transition-colors"
          >
            Newspaper
          </button>
          <button
            onClick={() => {
              onChange(3);
              onColumnGapChange?.(8);
            }}
            className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-gray-300
              hover:bg-white/10 transition-colors"
          >
            Catalog
          </button>
        </div>
      </div>
    </div>
  );
}
