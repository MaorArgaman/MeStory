/**
 * HeaderFooterEditor Component
 * Configure page headers and footers with dynamic fields
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { HeaderFooterConfig } from '../../types/templates';

interface HeaderFooterEditorProps {
  header: HeaderFooterConfig;
  footer: HeaderFooterConfig;
  onHeaderChange: (config: HeaderFooterConfig) => void;
  onFooterChange: (config: HeaderFooterConfig) => void;
}

// Dynamic fields that can be used in headers/footers
const dynamicFields = [
  { key: '{pageNumber}', label: 'מספר עמוד', example: '1' },
  { key: '{totalPages}', label: 'סה"כ עמודים', example: '250' },
  { key: '{title}', label: 'כותרת הספר', example: 'שם הספר' },
  { key: '{chapter}', label: 'שם הפרק', example: 'פרק ראשון' },
  { key: '{author}', label: 'שם המחבר', example: 'ישראל ישראלי' },
  { key: '{date}', label: 'תאריך', example: '01/01/2024' },
];

export default function HeaderFooterEditor({
  header,
  footer,
  onHeaderChange,
  onFooterChange,
}: HeaderFooterEditorProps) {
  const [showFieldsHelp, setShowFieldsHelp] = useState(false);

  // Single section editor component
  const SectionEditor = ({
    title,
    config,
    onChange,
  }: {
    title: string;
    config: HeaderFooterConfig;
    onChange: (config: HeaderFooterConfig) => void;
  }) => {
    const [expanded, setExpanded] = useState(config.enabled);

    return (
      <div className="space-y-3">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-yellow-500
                focus:ring-yellow-500/20"
            />
            <span className="font-medium text-white">{title}</span>
          </label>
          {config.enabled && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
        </div>

        <AnimatePresence>
          {config.enabled && expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Content Fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ימין</label>
                  <input
                    type="text"
                    value={config.content.right || ''}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        content: { ...config.content, right: e.target.value },
                      })
                    }
                    placeholder="{author}"
                    className="w-full p-2 text-sm rounded-lg bg-white/5 border border-white/10
                      text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">מרכז</label>
                  <input
                    type="text"
                    value={config.content.center || ''}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        content: { ...config.content, center: e.target.value },
                      })
                    }
                    placeholder="{title}"
                    className="w-full p-2 text-sm rounded-lg bg-white/5 border border-white/10
                      text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">שמאל</label>
                  <input
                    type="text"
                    value={config.content.left || ''}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        content: { ...config.content, left: e.target.value },
                      })
                    }
                    placeholder="{pageNumber}"
                    className="w-full p-2 text-sm rounded-lg bg-white/5 border border-white/10
                      text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
              </div>

              {/* Style Settings */}
              <div className="grid grid-cols-2 gap-3">
                {/* Font Size */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    גודל: {config.style.fontSize}pt
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="16"
                    value={config.style.fontSize}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        style: { ...config.style, fontSize: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-yellow-500"
                  />
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">גופן</label>
                  <select
                    value={config.style.fontFamily}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        style: { ...config.style, fontFamily: e.target.value },
                      })
                    }
                    className="w-full p-2 text-sm rounded-lg bg-white/5 border border-white/10
                      text-white focus:outline-none focus:border-yellow-500/50"
                  >
                    <option value="David Libre">David Libre</option>
                    <option value="Heebo">Heebo</option>
                    <option value="Assistant">Assistant</option>
                    <option value="Rubik">Rubik</option>
                  </select>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">צבע טקסט</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.style.textColor}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          style: { ...config.style, textColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.style.textColor}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          style: { ...config.style, textColor: e.target.value },
                        })
                      }
                      className="flex-1 p-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">צבע רקע</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.style.backgroundColor || '#ffffff'}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          style: { ...config.style, backgroundColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.style.backgroundColor || ''}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          style: { ...config.style, backgroundColor: e.target.value },
                        })
                      }
                      placeholder="ללא"
                      className="flex-1 p-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Border Options */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.style.borderBottom || false}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        style: { ...config.style, borderBottom: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-yellow-500"
                  />
                  קו תחתון
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.style.borderTop || false}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        style: { ...config.style, borderTop: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-yellow-500"
                  />
                  קו עליון
                </label>
              </div>

              {/* Visibility Options */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.style.showOnFirstPage ?? true}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        style: { ...config.style, showOnFirstPage: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-yellow-500"
                  />
                  עמוד ראשון
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.style.showOnOddPages ?? true}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        style: { ...config.style, showOnOddPages: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-yellow-500"
                  />
                  עמודים אי-זוגיים
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.style.showOnEvenPages ?? true}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        style: { ...config.style, showOnEvenPages: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-yellow-500"
                  />
                  עמודים זוגיים
                </label>
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  גובה: {config.height}mm
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={config.height}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      height: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-yellow-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Dynamic Fields Help */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <button
          onClick={() => setShowFieldsHelp(!showFieldsHelp)}
          className="flex items-center gap-2 text-sm text-blue-300 w-full"
        >
          <Info className="w-4 h-4" />
          <span>שדות דינמיים זמינים</span>
          {showFieldsHelp ? (
            <ChevronUp className="w-4 h-4 mr-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 mr-auto" />
          )}
        </button>

        <AnimatePresence>
          {showFieldsHelp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid grid-cols-2 gap-2">
                {dynamicFields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"
                  >
                    <code className="text-yellow-400">{field.key}</code>
                    <span className="text-gray-400">{field.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                הוסף שדות אלו לתוכן הכותרת והם יוחלפו אוטומטית.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header Editor */}
      <div className="p-4 rounded-lg bg-white/5">
        <SectionEditor
          title="כותרת עליונה (Header)"
          config={header}
          onChange={onHeaderChange}
        />
      </div>

      {/* Footer Editor */}
      <div className="p-4 rounded-lg bg-white/5">
        <SectionEditor
          title="כותרת תחתונה (Footer)"
          config={footer}
          onChange={onFooterChange}
        />
      </div>

      {/* Quick Presets */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">תבניות מהירות</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              onHeaderChange({
                ...header,
                enabled: true,
                content: { right: '{chapter}', center: '', left: '' },
              });
              onFooterChange({
                ...footer,
                enabled: true,
                content: { right: '', center: '— {pageNumber} —', left: '' },
              });
            }}
            className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-gray-300
              hover:bg-white/10 transition-colors"
          >
            ספר קלאסי
          </button>
          <button
            onClick={() => {
              onHeaderChange({
                ...header,
                enabled: true,
                content: { right: '{title}', center: '', left: '{chapter}' },
              });
              onFooterChange({
                ...footer,
                enabled: true,
                content: { right: '{author}', center: '', left: '{pageNumber}' },
              });
            }}
            className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-gray-300
              hover:bg-white/10 transition-colors"
          >
            אקדמי
          </button>
          <button
            onClick={() => {
              onHeaderChange({ ...header, enabled: false });
              onFooterChange({
                ...footer,
                enabled: true,
                content: { right: '', center: '{pageNumber}', left: '' },
              });
            }}
            className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-gray-300
              hover:bg-white/10 transition-colors"
          >
            מינימלי
          </button>
          <button
            onClick={() => {
              onHeaderChange({ ...header, enabled: false });
              onFooterChange({ ...footer, enabled: false });
            }}
            className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-gray-300
              hover:bg-white/10 transition-colors"
          >
            ללא כותרות
          </button>
        </div>
      </div>
    </div>
  );
}
