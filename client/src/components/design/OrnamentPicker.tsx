import { useState } from 'react';
import {
  ORNAMENT_CATEGORIES,
  OrnamentRenderer,
  getOrnamentsByCategory,
  type OrnamentCategory,
  type OrnamentDef,
} from './OrnamentLibrary';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface OrnamentPickerProps {
  /** Currently selected ornament ID (controlled). */
  selectedId?: string;
  /** Called when the user clicks an ornament. */
  onSelect?: (id: string) => void;
  /** Current ornament color. */
  color?: string;
  /** Called when the user picks a color. */
  onColorChange?: (color: string) => void;
  /** Display language — affects category / ornament labels. */
  lang?: 'he' | 'en';
  className?: string;
}

// ─── Preset palette ────────────────────────────────────────────────────────

const COLOR_PRESETS: { label: string; value: string }[] = [
  { label: 'Gold',      value: '#8b6914' },
  { label: 'Black',     value: '#1a1a1a' },
  { label: 'Dark Gray', value: '#555555' },
  { label: 'Brown',     value: '#6b3a2a' },
  { label: 'Navy',      value: '#1e3a5f' },
  { label: 'Forest',    value: '#2d5a3d' },
  { label: 'Burgundy',  value: '#6e1c2c' },
  { label: 'Purple',    value: '#4a2060' },
];

// ─── Sub-components ────────────────────────────────────────────────────────

interface OrnamentTileProps {
  ornament: OrnamentDef;
  isSelected: boolean;
  color: string;
  lang: 'he' | 'en';
  onClick: () => void;
}

function OrnamentTile({ ornament, isSelected, color, lang, onClick }: OrnamentTileProps) {
  const label = lang === 'he' ? ornament.nameHe : ornament.name;

  // Decide preview sizing based on category
  const isWide =
    ornament.category === 'dividers' || ornament.category === 'chapter-openers';
  const previewClass = isWide
    ? 'w-full h-10'
    : 'w-12 h-12 mx-auto';

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isSelected}
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-1 p-2 rounded border transition-all cursor-pointer',
        'hover:bg-amber-50 hover:border-amber-400',
        isSelected
          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400 ring-offset-1'
          : 'border-gray-200 bg-white',
      ].join(' ')}
    >
      <div className={previewClass}>
        <OrnamentRenderer
          id={ornament.id}
          color={color}
          width="100%"
          height="100%"
        />
      </div>
      <span className="text-xs text-gray-500 text-center leading-tight truncate w-full">
        {label}
      </span>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function OrnamentPicker({
  selectedId,
  onSelect,
  color = '#8b6914',
  onColorChange,
  lang = 'he',
  className = '',
}: OrnamentPickerProps) {
  const [activeCategory, setActiveCategory] = useState<OrnamentCategory>('dividers');

  const visibleOrnaments = getOrnamentsByCategory(activeCategory);
  const isRTL = lang === 'he';

  // Grid columns: wider for dividers/openers (1-col on small, 2 on wider)
  const isWideCategory =
    activeCategory === 'dividers' || activeCategory === 'chapter-openers';
  const gridClass = isWideCategory
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-2'
    : 'grid grid-cols-3 sm:grid-cols-4 gap-2';

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`flex flex-col gap-3 select-none ${className}`}
    >
      {/* ── Category Tabs ──────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label={isRTL ? 'קטגוריות קישוטים' : 'Ornament categories'}
        className="flex flex-wrap gap-1"
      >
        {ORNAMENT_CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory;
          const catLabel = isRTL ? cat.labelHe : cat.label;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat.id)}
              className={[
                'px-2.5 py-1 text-xs rounded-full border transition-all font-medium',
                isActive
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-amber-400 hover:text-amber-700',
              ].join(' ')}
            >
              {catLabel}
            </button>
          );
        })}
      </div>

      {/* ── Ornament Grid ──────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        className={`${gridClass} max-h-64 overflow-y-auto pr-0.5`}
      >
        {visibleOrnaments.map((ornament) => (
          <OrnamentTile
            key={ornament.id}
            ornament={ornament}
            isSelected={ornament.id === selectedId}
            color={color}
            lang={lang}
            onClick={() => onSelect?.(ornament.id)}
          />
        ))}
        {visibleOrnaments.length === 0 && (
          <p className="col-span-full text-center text-xs text-gray-400 py-4">
            {isRTL ? 'אין קישוטים בקטגוריה זו' : 'No ornaments in this category'}
          </p>
        )}
      </div>

      {/* ── Color Picker ───────────────────────────────────────────────── */}
      {onColorChange && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <label className="text-xs font-semibold text-gray-600">
            {isRTL ? 'צבע קישוט' : 'Ornament color'}
          </label>

          {/* Preset swatches */}
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                title={preset.label}
                aria-label={preset.label}
                aria-pressed={color === preset.value}
                onClick={() => onColorChange(preset.value)}
                className={[
                  'w-6 h-6 rounded-full border-2 transition-transform',
                  color === preset.value
                    ? 'border-amber-500 scale-125 shadow-md'
                    : 'border-transparent hover:scale-110',
                ].join(' ')}
                style={{ backgroundColor: preset.value }}
              />
            ))}

            {/* Native color input for custom colour */}
            <label
              title={isRTL ? 'צבע מותאם אישית' : 'Custom color'}
              className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300
                         flex items-center justify-center cursor-pointer
                         hover:border-amber-400 overflow-hidden transition-colors"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="opacity-0 absolute w-0 h-0"
                aria-label={isRTL ? 'צבע מותאם אישית' : 'Custom color'}
              />
              <span className="text-gray-400 text-xs leading-none pointer-events-none">
                +
              </span>
            </label>
          </div>

          {/* Hex preview */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className="inline-block w-4 h-4 rounded border border-gray-200"
              style={{ backgroundColor: color }}
            />
            <code className="font-mono">{color}</code>
          </div>
        </div>
      )}

      {/* ── Selected preview strip ─────────────────────────────────────── */}
      {selectedId && (
        <div className="border-t pt-3">
          <p className="text-xs text-gray-500 mb-2">
            {isRTL ? 'תצוגה מקדימה' : 'Preview'}
          </p>
          <div className="bg-gray-50 rounded border p-3 flex items-center justify-center min-h-[40px]">
            <OrnamentRenderer
              id={selectedId}
              color={color}
              width="80%"
              height={36}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default OrnamentPicker;
