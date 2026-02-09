/**
 * PageLayoutEditor Component
 * Main container for advanced page layout customization
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Columns,
  SplitSquareVertical,
  Type,
  Palette,
  Settings,
  Eye,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  PageLayoutTemplate,
  PageSplitType,
  ColumnLayoutType,
  BackgroundConfig,
  HeaderFooterConfig,
  Margins,
  TypographySettings,
} from '../../types/templates';
import ColumnLayoutSelector from './ColumnLayoutSelector';
import PageSplitSelector from './PageSplitSelector';
import HeaderFooterEditor from './HeaderFooterEditor';
import BackgroundEditor from './BackgroundEditor';

interface PageLayoutEditorProps {
  layout: PageLayoutTemplate;
  onChange: (layout: PageLayoutTemplate) => void;
  onSave?: () => void;
  onReset?: () => void;
  isRTL?: boolean;
}

type EditorTab = 'columns' | 'split' | 'typography' | 'background' | 'header-footer';

export default function PageLayoutEditor({
  layout,
  onChange,
  onSave,
  onReset,
  isRTL = true,
}: PageLayoutEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('columns');
  const [showPreview, setShowPreview] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    columns: true,
    split: false,
    typography: false,
    background: false,
    headerFooter: false,
  });

  const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
    { id: 'columns', label: 'Columns', icon: <Columns className="w-4 h-4" /> },
    { id: 'split', label: 'Page Split', icon: <SplitSquareVertical className="w-4 h-4" /> },
    { id: 'typography', label: 'Typography', icon: <Type className="w-4 h-4" /> },
    { id: 'background', label: 'Background', icon: <Palette className="w-4 h-4" /> },
    { id: 'header-footer', label: 'Headers', icon: <Settings className="w-4 h-4" /> },
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Update handlers
  const handleColumnsChange = useCallback((columns: ColumnLayoutType) => {
    onChange({ ...layout, columns });
  }, [layout, onChange]);

  const handleColumnGapChange = useCallback((columnGap: number) => {
    onChange({ ...layout, columnGap });
  }, [layout, onChange]);

  const handleSplitChange = useCallback((splitType: PageSplitType, splitRatio?: number[]) => {
    onChange({ ...layout, splitType, splitRatio });
  }, [layout, onChange]);

  const handleBackgroundChange = useCallback((background: BackgroundConfig) => {
    onChange({ ...layout, background });
  }, [layout, onChange]);

  const handleHeaderChange = useCallback((header: HeaderFooterConfig) => {
    onChange({ ...layout, header });
  }, [layout, onChange]);

  const handleFooterChange = useCallback((footer: HeaderFooterConfig) => {
    onChange({ ...layout, footer });
  }, [layout, onChange]);

  const handleMarginsChange = useCallback((margins: Margins) => {
    onChange({ ...layout, margins });
  }, [layout, onChange]);

  const handleTypographyChange = useCallback((typography: TypographySettings) => {
    onChange({ ...layout, typography });
  }, [layout, onChange]);

  // Section header component
  const SectionHeader = ({
    title,
    icon,
    section,
    badge
  }: {
    title: string;
    icon: React.ReactNode;
    section: string;
    badge?: string;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5
        hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-yellow-400">{icon}</span>
        <span className="font-medium text-white">{title}</span>
        {badge && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
            {badge}
          </span>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-yellow-400" />
          Page Layout Editor
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-lg transition-colors ${
              showPreview ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-400'
            }`}
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10
                hover:text-white transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-medium
                hover:bg-yellow-400 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Columns Section */}
          <div className="space-y-3">
            <SectionHeader
              title="Columns"
              icon={<Columns className="w-4 h-4" />}
              section="columns"
              badge={`${layout.columns} columns`}
            />
            <AnimatePresence>
              {expandedSections.columns && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-lg bg-white/5 space-y-4">
                    <ColumnLayoutSelector
                      value={layout.columns}
                      onChange={handleColumnsChange}
                      columnGap={layout.columnGap}
                      onColumnGapChange={handleColumnGapChange}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Split Section */}
          <div className="space-y-3">
            <SectionHeader
              title="Page Split"
              icon={<SplitSquareVertical className="w-4 h-4" />}
              section="split"
              badge={layout.splitType !== 'none' ? layout.splitType : undefined}
            />
            <AnimatePresence>
              {expandedSections.split && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-lg bg-white/5 space-y-4">
                    <PageSplitSelector
                      value={layout.splitType}
                      onChange={handleSplitChange}
                      splitRatio={layout.splitRatio}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Typography Section */}
          <div className="space-y-3">
            <SectionHeader
              title="Typography"
              icon={<Type className="w-4 h-4" />}
              section="typography"
            />
            <AnimatePresence>
              {expandedSections.typography && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-lg bg-white/5 space-y-4">
                    {/* Body Font */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Body Font</label>
                      <select
                        value={layout.typography.bodyFont}
                        onChange={(e) => handleTypographyChange({
                          ...layout.typography,
                          bodyFont: e.target.value,
                        })}
                        className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10
                          text-white focus:outline-none focus:border-yellow-500/50"
                      >
                        <option value="David Libre">David Libre</option>
                        <option value="Heebo">Heebo</option>
                        <option value="Assistant">Assistant</option>
                        <option value="Rubik">Rubik</option>
                        <option value="Frank Ruhl Libre">Frank Ruhl Libre</option>
                        <option value="Secular One">Secular One</option>
                      </select>
                    </div>

                    {/* Body Font Size */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Font Size: {layout.typography.bodyFontSize}px
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="24"
                        value={layout.typography.bodyFontSize}
                        onChange={(e) => handleTypographyChange({
                          ...layout.typography,
                          bodyFontSize: parseInt(e.target.value),
                        })}
                        className="w-full accent-yellow-500"
                      />
                    </div>

                    {/* Line Height */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Line Height: {layout.typography.lineHeight}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.1"
                        value={layout.typography.lineHeight}
                        onChange={(e) => handleTypographyChange({
                          ...layout.typography,
                          lineHeight: parseFloat(e.target.value),
                        })}
                        className="w-full accent-yellow-500"
                      />
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={layout.typography.textColor}
                          onChange={(e) => handleTypographyChange({
                            ...layout.typography,
                            textColor: e.target.value,
                          })}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={layout.typography.textColor}
                          onChange={(e) => handleTypographyChange({
                            ...layout.typography,
                            textColor: e.target.value,
                          })}
                          className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10
                            text-white text-sm"
                        />
                      </div>
                    </div>

                    {/* Heading Font */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Heading Font</label>
                      <select
                        value={layout.typography.headingFont}
                        onChange={(e) => handleTypographyChange({
                          ...layout.typography,
                          headingFont: e.target.value,
                        })}
                        className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10
                          text-white focus:outline-none focus:border-yellow-500/50"
                      >
                        <option value="David Libre">David Libre</option>
                        <option value="Heebo">Heebo</option>
                        <option value="Assistant">Assistant</option>
                        <option value="Rubik">Rubik</option>
                        <option value="Frank Ruhl Libre">Frank Ruhl Libre</option>
                        <option value="Secular One">Secular One</option>
                      </select>
                    </div>

                    {/* Heading Font Size */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Heading Size: {layout.typography.headingFontSize}px
                      </label>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        value={layout.typography.headingFontSize}
                        onChange={(e) => handleTypographyChange({
                          ...layout.typography,
                          headingFontSize: parseInt(e.target.value),
                        })}
                        className="w-full accent-yellow-500"
                      />
                    </div>

                    {/* Heading Color */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Heading Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={layout.typography.headingColor}
                          onChange={(e) => handleTypographyChange({
                            ...layout.typography,
                            headingColor: e.target.value,
                          })}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={layout.typography.headingColor}
                          onChange={(e) => handleTypographyChange({
                            ...layout.typography,
                            headingColor: e.target.value,
                          })}
                          className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10
                            text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Background Section */}
          <div className="space-y-3">
            <SectionHeader
              title="Background"
              icon={<Palette className="w-4 h-4" />}
              section="background"
              badge={layout.background.type}
            />
            <AnimatePresence>
              {expandedSections.background && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-lg bg-white/5 space-y-4">
                    <BackgroundEditor
                      value={layout.background}
                      onChange={handleBackgroundChange}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Header & Footer Section */}
          <div className="space-y-3">
            <SectionHeader
              title="Header & Footer"
              icon={<Settings className="w-4 h-4" />}
              section="headerFooter"
            />
            <AnimatePresence>
              {expandedSections.headerFooter && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-lg bg-white/5 space-y-6">
                    <HeaderFooterEditor
                      header={layout.header}
                      footer={layout.footer}
                      onHeaderChange={handleHeaderChange}
                      onFooterChange={handleFooterChange}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Margins Section */}
          <div className="space-y-3">
            <SectionHeader
              title="Margins"
              icon={<Settings className="w-4 h-4" />}
              section="margins"
            />
            <AnimatePresence>
              {expandedSections.margins && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-lg bg-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Top: {layout.margins.top}mm
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={layout.margins.top}
                          onChange={(e) => handleMarginsChange({
                            ...layout.margins,
                            top: parseInt(e.target.value),
                          })}
                          className="w-full accent-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Bottom: {layout.margins.bottom}mm
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={layout.margins.bottom}
                          onChange={(e) => handleMarginsChange({
                            ...layout.margins,
                            bottom: parseInt(e.target.value),
                          })}
                          className="w-full accent-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          {isRTL ? 'Right' : 'Left'}: {layout.margins.right}mm
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={layout.margins.right}
                          onChange={(e) => handleMarginsChange({
                            ...layout.margins,
                            right: parseInt(e.target.value),
                          })}
                          className="w-full accent-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          {isRTL ? 'Left' : 'Right'}: {layout.margins.left}mm
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={layout.margins.left}
                          onChange={(e) => handleMarginsChange({
                            ...layout.margins,
                            left: parseInt(e.target.value),
                          })}
                          className="w-full accent-yellow-500"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-80 border-r border-white/10 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Preview</h3>
            <PagePreview layout={layout} isRTL={isRTL} />
          </div>
        )}
      </div>
    </div>
  );
}

// Page Preview Component
function PagePreview({
  layout,
  isRTL
}: {
  layout: PageLayoutTemplate;
  isRTL: boolean;
}) {
  const getBackgroundStyle = () => {
    const bg = layout.background;
    if (bg.type === 'solid') {
      return { backgroundColor: bg.color || '#ffffff' };
    }
    if (bg.type === 'gradient' && bg.gradient) {
      const colors = bg.gradient.colors.map(c => `${c.color} ${c.position}%`).join(', ');
      if (bg.gradient.type === 'linear') {
        return { background: `linear-gradient(${bg.gradient.angle || 180}deg, ${colors})` };
      }
      return { background: `radial-gradient(circle, ${colors})` };
    }
    return { backgroundColor: '#ffffff' };
  };

  const renderColumns = () => {
    const columns = [];
    for (let i = 0; i < layout.columns; i++) {
      columns.push(
        <div
          key={i}
          className="flex-1 space-y-1"
          style={{ marginLeft: i > 0 ? `${layout.columnGap / 2}px` : 0 }}
        >
          {[...Array(8)].map((_, j) => (
            <div
              key={j}
              className="h-1 rounded-full opacity-30"
              style={{
                backgroundColor: layout.typography.textColor,
                width: j === 7 ? '60%' : '100%',
              }}
            />
          ))}
        </div>
      );
    }
    return columns;
  };

  const renderSplitContent = () => {
    if (layout.splitType === 'horizontal') {
      const ratio = layout.splitRatio || [50, 50];
      return (
        <div className="flex flex-col h-full">
          <div
            className="border-b border-gray-300"
            style={{ height: `${ratio[0]}%` }}
          >
            <div className="p-2 flex gap-2">
              {renderColumns()}
            </div>
          </div>
          <div style={{ height: `${ratio[1]}%` }}>
            <div className="p-2 flex gap-2">
              {renderColumns()}
            </div>
          </div>
        </div>
      );
    }

    if (layout.splitType === 'vertical') {
      const ratio = layout.splitRatio || [50, 50];
      return (
        <div className="flex h-full">
          <div
            className="border-l border-gray-300"
            style={{ width: `${ratio[0]}%` }}
          >
            <div className="p-2 flex gap-2">
              {renderColumns()}
            </div>
          </div>
          <div style={{ width: `${ratio[1]}%` }}>
            <div className="p-2 flex gap-2">
              {renderColumns()}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-2 flex gap-2 h-full">
        {renderColumns()}
      </div>
    );
  };

  return (
    <div
      className="w-full aspect-[3/4] rounded-lg shadow-lg overflow-hidden"
      style={getBackgroundStyle()}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      {layout.header.enabled && (
        <div
          className="text-center py-1 text-[8px] border-b"
          style={{
            color: layout.header.style.textColor,
            backgroundColor: layout.header.style.backgroundColor,
            fontFamily: layout.header.style.fontFamily,
          }}
        >
          {layout.header.content.center || 'Header'}
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1"
        style={{
          padding: `${layout.margins.top / 4}px ${layout.margins.right / 4}px ${layout.margins.bottom / 4}px ${layout.margins.left / 4}px`,
        }}
      >
        {renderSplitContent()}
      </div>

      {/* Footer */}
      {layout.footer.enabled && (
        <div
          className="text-center py-1 text-[8px] border-t"
          style={{
            color: layout.footer.style.textColor,
            backgroundColor: layout.footer.style.backgroundColor,
            fontFamily: layout.footer.style.fontFamily,
          }}
        >
          {layout.footer.content.center || '— 1 —'}
        </div>
      )}
    </div>
  );
}
