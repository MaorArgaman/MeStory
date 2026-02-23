import { useState, useCallback } from 'react';
import {
  Type,
  Layout,
  Palette,
  Image as ImageIcon,
  Columns,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Save,
  RotateCcw,
  Eye,
  Trash2,
  Move,
  BookOpen,
} from 'lucide-react';

interface CustomLayoutEditorProps {
  bookId: string;
  initialDesign?: any;
  onSave: (design: any) => void;
  onCancel: () => void;
  language?: string;
}

type EditorTab = 'typography' | 'layout' | 'colors' | 'images' | 'pages';

const FONTS = [
  'Arial',
  'Times New Roman',
  'Georgia',
  'Helvetica',
  'Verdana',
  'David',
  'Frank Ruhl Libre',
  'Heebo',
  'Assistant',
  'Rubik',
  'Open Sans',
  'Roboto',
  'Lora',
  'Merriweather',
  'Playfair Display',
];

const HEBREW_FONTS = [
  'David',
  'Frank Ruhl Libre',
  'Heebo',
  'Assistant',
  'Rubik',
  'Alef',
  'Varela Round',
  'Secular One',
];

export default function CustomLayoutEditor({
  bookId: _bookId,
  initialDesign,
  onSave,
  onCancel,
  language = 'en',
}: CustomLayoutEditorProps) {
  // bookId available for future API calls
  void _bookId;
  const isHebrew = language === 'he';

  const [activeTab, setActiveTab] = useState<EditorTab>('typography');
  const [showPreview, setShowPreview] = useState(false);

  // Design State
  const [design, setDesign] = useState({
    typography: {
      bodyFont: initialDesign?.typography?.bodyFont || 'Georgia',
      headingFont: initialDesign?.typography?.headingFont || 'Playfair Display',
      bodySize: initialDesign?.typography?.fontSize || 12,
      headingSize: initialDesign?.typography?.chapterTitleSize || 24,
      lineHeight: initialDesign?.typography?.lineHeight || 1.6,
      textColor: initialDesign?.typography?.colors?.text || '#333333',
      headingColor: initialDesign?.typography?.colors?.heading || '#1a1a1a',
      dropCaps: initialDesign?.typography?.formatting?.firstParagraphDropCap || false,
    },
    layout: {
      columns: initialDesign?.layout?.columns || 1,
      columnGap: initialDesign?.layout?.columnGap || 20,
      margins: {
        top: initialDesign?.layout?.margins?.top || 25,
        bottom: initialDesign?.layout?.margins?.bottom || 25,
        inner: initialDesign?.layout?.margins?.inner || 30,
        outer: initialDesign?.layout?.margins?.outer || 20,
      },
      textAlign: initialDesign?.layout?.textAlign || 'justify',
      paragraphSpacing: initialDesign?.layout?.paragraphSpacing || 12,
      firstLineIndent: 20,
    },
    pageNumbers: {
      show: initialDesign?.layout?.pageNumbers?.show ?? true,
      position: initialDesign?.layout?.pageNumbers?.position || 'bottom-center',
      startFrom: initialDesign?.layout?.pageNumbers?.startFrom || 1,
      style: initialDesign?.layout?.pageNumbers?.style || 'arabic',
    },
    headers: {
      show: initialDesign?.layout?.headers?.show ?? true,
      content: initialDesign?.layout?.headers?.content || 'book-title',
      position: initialDesign?.layout?.headers?.position || 'top',
    },
    colors: {
      background: initialDesign?.typography?.colors?.background || '#ffffff',
      accent: initialDesign?.typography?.colors?.accent || '#8B5CF6',
    },
    imagePlacements: initialDesign?.imagePlacements || [],
  });

  // Update design field
  const updateDesign = useCallback((path: string, value: any) => {
    setDesign((prev) => {
      const newDesign = { ...prev };
      const parts = path.split('.');
      let current: any = newDesign;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = value;
      return newDesign;
    });
  }, []);

  // Handle save
  const handleSave = () => {
    onSave(design);
  };

  // Reset to default
  const handleReset = () => {
    setDesign({
      typography: {
        bodyFont: 'Georgia',
        headingFont: 'Playfair Display',
        bodySize: 12,
        headingSize: 24,
        lineHeight: 1.6,
        textColor: '#333333',
        headingColor: '#1a1a1a',
        dropCaps: false,
      },
      layout: {
        columns: 1,
        columnGap: 20,
        margins: { top: 25, bottom: 25, inner: 30, outer: 20 },
        textAlign: 'justify',
        paragraphSpacing: 12,
        firstLineIndent: 20,
      },
      pageNumbers: {
        show: true,
        position: 'bottom-center',
        startFrom: 1,
        style: 'arabic',
      },
      headers: {
        show: true,
        content: 'book-title',
        position: 'top',
      },
      colors: {
        background: '#ffffff',
        accent: '#8B5CF6',
      },
      imagePlacements: [],
    });
  };

  const tabs = [
    { key: 'typography', icon: Type, labelEn: 'Typography', labelHe: 'טיפוגרפיה' },
    { key: 'layout', icon: Layout, labelEn: 'Layout', labelHe: 'פריסה' },
    { key: 'colors', icon: Palette, labelEn: 'Colors', labelHe: 'צבעים' },
    { key: 'images', icon: ImageIcon, labelEn: 'Images', labelHe: 'תמונות' },
    { key: 'pages', icon: BookOpen, labelEn: 'Pages', labelHe: 'עמודים' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">
            {isHebrew ? 'עורך עיצוב מותאם' : 'Custom Layout Editor'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showPreview ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Eye className="w-4 h-4" />
            {isHebrew ? 'תצוגה מקדימה' : 'Preview'}
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {isHebrew ? 'איפוס' : 'Reset'}
          </button>

          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {isHebrew ? 'ביטול' : 'Cancel'}
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isHebrew ? 'שמור' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as EditorTab)}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{isHebrew ? tab.labelHe : tab.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                {isHebrew ? 'הגדרות טיפוגרפיה' : 'Typography Settings'}
              </h3>

              {/* Body Font */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'גופן גוף' : 'Body Font'}
                  </label>
                  <select
                    value={design.typography.bodyFont}
                    onChange={(e) => updateDesign('typography.bodyFont', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ fontFamily: design.typography.bodyFont }}
                  >
                    {(isHebrew ? HEBREW_FONTS : FONTS).map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'גופן כותרות' : 'Heading Font'}
                  </label>
                  <select
                    value={design.typography.headingFont}
                    onChange={(e) => updateDesign('typography.headingFont', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ fontFamily: design.typography.headingFont }}
                  >
                    {(isHebrew ? HEBREW_FONTS : FONTS).map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Font Sizes */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'גודל טקסט' : 'Body Size'} ({design.typography.bodySize}pt)
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="18"
                    value={design.typography.bodySize}
                    onChange={(e) => updateDesign('typography.bodySize', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'גודל כותרות' : 'Heading Size'} ({design.typography.headingSize}pt)
                  </label>
                  <input
                    type="range"
                    min="14"
                    max="48"
                    value={design.typography.headingSize}
                    onChange={(e) => updateDesign('typography.headingSize', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'גובה שורה' : 'Line Height'} ({design.typography.lineHeight})
                  </label>
                  <input
                    type="range"
                    min="1.2"
                    max="2.5"
                    step="0.1"
                    value={design.typography.lineHeight}
                    onChange={(e) => updateDesign('typography.lineHeight', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'צבע טקסט' : 'Text Color'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={design.typography.textColor}
                      onChange={(e) => updateDesign('typography.textColor', e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={design.typography.textColor}
                      onChange={(e) => updateDesign('typography.textColor', e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'צבע כותרות' : 'Heading Color'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={design.typography.headingColor}
                      onChange={(e) => updateDesign('typography.headingColor', e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={design.typography.headingColor}
                      onChange={(e) => updateDesign('typography.headingColor', e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={design.typography.dropCaps}
                    onChange={(e) => updateDesign('typography.dropCaps', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500"
                  />
                  <span>{isHebrew ? 'Drop Caps בפסקה ראשונה' : 'First paragraph drop caps'}</span>
                </label>
              </div>
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                {isHebrew ? 'הגדרות פריסה' : 'Layout Settings'}
              </h3>

              {/* Columns */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {isHebrew ? 'מספר עמודות' : 'Number of Columns'}
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => updateDesign('layout.columns', num)}
                      className={`w-16 h-16 rounded-lg flex items-center justify-center transition-colors ${
                        design.layout.columns === num
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Columns className="w-6 h-6" />
                      <span className="ml-1">{num}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {isHebrew ? 'יישור טקסט' : 'Text Alignment'}
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'left', icon: AlignLeft, label: isHebrew ? 'שמאל' : 'Left' },
                    { value: 'center', icon: AlignCenter, label: isHebrew ? 'מרכז' : 'Center' },
                    { value: 'right', icon: AlignRight, label: isHebrew ? 'ימין' : 'Right' },
                    { value: 'justify', icon: AlignJustify, label: isHebrew ? 'מיושר' : 'Justify' },
                  ].map((align) => (
                    <button
                      key={align.value}
                      onClick={() => updateDesign('layout.textAlign', align.value)}
                      className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                        design.layout.textAlign === align.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <align.icon className="w-5 h-5" />
                      <span>{align.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Margins */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {isHebrew ? 'שוליים (מ"מ)' : 'Margins (mm)'}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'top', label: isHebrew ? 'עליון' : 'Top' },
                    { key: 'bottom', label: isHebrew ? 'תחתון' : 'Bottom' },
                    { key: 'inner', label: isHebrew ? 'פנימי' : 'Inner' },
                    { key: 'outer', label: isHebrew ? 'חיצוני' : 'Outer' },
                  ].map((margin) => (
                    <div key={margin.key}>
                      <label className="block text-xs text-gray-500 mb-1">{margin.label}</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={(design.layout.margins as any)[margin.key]}
                        onChange={(e) =>
                          updateDesign(`layout.margins.${margin.key}`, Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'ריווח פסקאות' : 'Paragraph Spacing'} ({design.layout.paragraphSpacing}pt)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={design.layout.paragraphSpacing}
                    onChange={(e) => updateDesign('layout.paragraphSpacing', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'הזחת שורה ראשונה' : 'First Line Indent'} ({design.layout.firstLineIndent}pt)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={design.layout.firstLineIndent}
                    onChange={(e) => updateDesign('layout.firstLineIndent', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                {isHebrew ? 'סכמת צבעים' : 'Color Scheme'}
              </h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'צבע רקע' : 'Background Color'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={design.colors.background}
                      onChange={(e) => updateDesign('colors.background', e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={design.colors.background}
                      onChange={(e) => updateDesign('colors.background', e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'צבע הדגשה' : 'Accent Color'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={design.colors.accent}
                      onChange={(e) => updateDesign('colors.accent', e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={design.colors.accent}
                      onChange={(e) => updateDesign('colors.accent', e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {isHebrew ? 'פלטות מוכנות' : 'Color Presets'}
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { bg: '#FFFFFF', accent: '#8B5CF6', name: 'Classic' },
                    { bg: '#FEF3C7', accent: '#D97706', name: 'Warm' },
                    { bg: '#F0FDF4', accent: '#16A34A', name: 'Nature' },
                    { bg: '#EFF6FF', accent: '#2563EB', name: 'Ocean' },
                    { bg: '#FDF2F8', accent: '#DB2777', name: 'Romance' },
                    { bg: '#1F2937', accent: '#F59E0B', name: 'Dark' },
                    { bg: '#FFFBEB', accent: '#7C2D12', name: 'Antique' },
                    { bg: '#F5F5F4', accent: '#78716C', name: 'Minimal' },
                  ].map((palette) => (
                    <button
                      key={palette.name}
                      onClick={() => {
                        updateDesign('colors.background', palette.bg);
                        updateDesign('colors.accent', palette.accent);
                      }}
                      className="p-3 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors"
                    >
                      <div className="flex gap-1 mb-2">
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: palette.bg }}
                        />
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: palette.accent }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{palette.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                {isHebrew ? 'מיקומי תמונות' : 'Image Placements'}
              </h3>

              <p className="text-gray-400">
                {isHebrew
                  ? 'הוסף אזורי תמונות מוגדרים מראש לעמודים שלך'
                  : 'Add pre-defined image zones to your pages'
                }
              </p>

              {/* Image Placement Templates */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    id: 'top',
                    label: isHebrew ? 'ראש עמוד' : 'Top of Page',
                    preview: '████\n████\n    ',
                  },
                  {
                    id: 'center',
                    label: isHebrew ? 'מרכז עמוד' : 'Center of Page',
                    preview: '    \n████\n    ',
                  },
                  {
                    id: 'bottom',
                    label: isHebrew ? 'תחתית עמוד' : 'Bottom of Page',
                    preview: '    \n    \n████',
                  },
                  {
                    id: 'full',
                    label: isHebrew ? 'עמוד מלא' : 'Full Page',
                    preview: '████\n████\n████',
                  },
                  {
                    id: 'gallery',
                    label: isHebrew ? 'גלריה' : 'Gallery',
                    preview: '██ ██\n██ ██\n    ',
                  },
                  {
                    id: 'sidebar',
                    label: isHebrew ? 'צד' : 'Sidebar',
                    preview: 'txt██\ntxt██\ntxt██',
                  },
                ].map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => {
                      setDesign((prev) => ({
                        ...prev,
                        imagePlacements: [
                          ...prev.imagePlacements,
                          {
                            id: Date.now().toString(),
                            type: zone.id,
                            chapterIndex: 0,
                            position: zone.id,
                          },
                        ],
                      }));
                    }}
                    className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition-colors"
                  >
                    <div className="font-mono text-xs text-gray-500 mb-2 whitespace-pre">
                      {zone.preview}
                    </div>
                    <span className="text-sm">{zone.label}</span>
                  </button>
                ))}
              </div>

              {/* Current Placements */}
              {design.imagePlacements.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm text-gray-400 mb-3">
                    {isHebrew ? 'מיקומים נוכחיים' : 'Current Placements'}
                  </h4>
                  <div className="space-y-2">
                    {design.imagePlacements.map((placement: any, index: number) => (
                      <div
                        key={placement.id}
                        className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Move className="w-4 h-4 text-gray-500" />
                          <span>
                            {placement.type} - {isHebrew ? 'פרק' : 'Chapter'} {placement.chapterIndex + 1}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setDesign((prev) => ({
                              ...prev,
                              imagePlacements: prev.imagePlacements.filter((_: any, i: number) => i !== index),
                            }));
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                {isHebrew ? 'הגדרות עמודים' : 'Page Settings'}
              </h3>

              {/* Page Numbers */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {isHebrew ? 'מספרי עמודים' : 'Page Numbers'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={design.pageNumbers.show}
                      onChange={(e) => updateDesign('pageNumbers.show', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {design.pageNumbers.show && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        {isHebrew ? 'מיקום' : 'Position'}
                      </label>
                      <select
                        value={design.pageNumbers.position}
                        onChange={(e) => updateDesign('pageNumbers.position', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                      >
                        <option value="bottom-center">{isHebrew ? 'מרכז תחתון' : 'Bottom Center'}</option>
                        <option value="bottom-outer">{isHebrew ? 'חיצוני תחתון' : 'Bottom Outer'}</option>
                        <option value="top-outer">{isHebrew ? 'חיצוני עליון' : 'Top Outer'}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          {isHebrew ? 'התחל מ-' : 'Start From'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={design.pageNumbers.startFrom}
                          onChange={(e) => updateDesign('pageNumbers.startFrom', Number(e.target.value))}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          {isHebrew ? 'סגנון' : 'Style'}
                        </label>
                        <select
                          value={design.pageNumbers.style}
                          onChange={(e) => updateDesign('pageNumbers.style', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        >
                          <option value="arabic">1, 2, 3...</option>
                          <option value="roman">I, II, III...</option>
                          <option value="hebrew">א, ב, ג...</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Headers */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {isHebrew ? 'כותרות עמודים' : 'Page Headers'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={design.headers.show}
                      onChange={(e) => updateDesign('headers.show', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {design.headers.show && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        {isHebrew ? 'תוכן' : 'Content'}
                      </label>
                      <select
                        value={design.headers.content}
                        onChange={(e) => updateDesign('headers.content', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                      >
                        <option value="book-title">{isHebrew ? 'שם הספר' : 'Book Title'}</option>
                        <option value="chapter-title">{isHebrew ? 'שם הפרק' : 'Chapter Title'}</option>
                        <option value="author">{isHebrew ? 'שם המחבר' : 'Author Name'}</option>
                        <option value="none">{isHebrew ? 'ללא' : 'None'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        {isHebrew ? 'מיקום' : 'Position'}
                      </label>
                      <select
                        value={design.headers.position}
                        onChange={(e) => updateDesign('headers.position', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                      >
                        <option value="top">{isHebrew ? 'עליון' : 'Top'}</option>
                        <option value="bottom">{isHebrew ? 'תחתון' : 'Bottom'}</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-96 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {isHebrew ? 'תצוגה מקדימה' : 'Preview'}
            </h3>

            {/* Page Preview */}
            <div
              className="aspect-[3/4] rounded-lg shadow-xl overflow-hidden"
              style={{
                backgroundColor: design.colors.background,
                padding: `${design.layout.margins.top}px ${design.layout.margins.outer}px ${design.layout.margins.bottom}px ${design.layout.margins.inner}px`,
              }}
            >
              {/* Header */}
              {design.headers.show && design.headers.position === 'top' && (
                <div
                  className="text-center text-xs mb-2 pb-1 border-b"
                  style={{
                    fontFamily: design.typography.bodyFont,
                    color: design.typography.textColor,
                    borderColor: design.colors.accent + '40',
                  }}
                >
                  {isHebrew ? 'שם הספר' : 'Book Title'}
                </div>
              )}

              {/* Content */}
              <div
                style={{
                  columnCount: design.layout.columns,
                  columnGap: `${design.layout.columnGap}px`,
                  textAlign: design.layout.textAlign as any,
                }}
              >
                <h2
                  style={{
                    fontFamily: design.typography.headingFont,
                    fontSize: `${design.typography.headingSize / 2}px`,
                    color: design.typography.headingColor,
                    marginBottom: '8px',
                  }}
                >
                  {isHebrew ? 'פרק ראשון' : 'Chapter One'}
                </h2>

                <p
                  style={{
                    fontFamily: design.typography.bodyFont,
                    fontSize: `${design.typography.bodySize / 1.5}px`,
                    lineHeight: design.typography.lineHeight,
                    color: design.typography.textColor,
                    textIndent: `${design.layout.firstLineIndent / 2}px`,
                    marginBottom: `${design.layout.paragraphSpacing / 2}px`,
                  }}
                >
                  {isHebrew
                    ? 'זהו טקסט לדוגמה שמציג את העיצוב שבחרת. הפונטים, הצבעים והפריסה משקפים את ההגדרות הנוכחיות שלך.'
                    : 'This is sample text demonstrating your chosen design. The fonts, colors, and layout reflect your current settings.'
                  }
                </p>

                <p
                  style={{
                    fontFamily: design.typography.bodyFont,
                    fontSize: `${design.typography.bodySize / 1.5}px`,
                    lineHeight: design.typography.lineHeight,
                    color: design.typography.textColor,
                    textIndent: `${design.layout.firstLineIndent / 2}px`,
                  }}
                >
                  {isHebrew
                    ? 'המשך הטקסט מדגים את הפסקאות והעיצוב הכללי של הספר.'
                    : 'Continued text demonstrates the paragraphs and overall book styling.'
                  }
                </p>
              </div>

              {/* Page Number */}
              {design.pageNumbers.show && (
                <div
                  className="absolute bottom-4 left-0 right-0 text-center text-xs"
                  style={{
                    fontFamily: design.typography.bodyFont,
                    color: design.typography.textColor,
                  }}
                >
                  {design.pageNumbers.style === 'arabic' && '1'}
                  {design.pageNumbers.style === 'roman' && 'I'}
                  {design.pageNumbers.style === 'hebrew' && 'א'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
