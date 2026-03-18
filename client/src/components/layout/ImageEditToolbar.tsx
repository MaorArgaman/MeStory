import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crop,
  Circle,
  Square,
  Layers,
  Move,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Copy,
  X,
  ChevronDown,
  Type,
  Image as ImageIcon,
} from 'lucide-react';

interface ImageEditToolbarProps {
  image: {
    id?: string;
    pageIndex: number;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
    borderRadius?: number;
    fadeEdges?: boolean;
    fadeAmount?: number;
    textWrap?: 'none' | 'behind' | 'front' | 'wrap';
    flipH?: boolean;
    flipV?: boolean;
    shadow?: boolean;
    border?: {
      width: number;
      color: string;
      style: 'solid' | 'dashed' | 'dotted';
    };
  };
  onUpdate: (updates: Partial<ImageEditToolbarProps['image']>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
  language?: string;
}

export default function ImageEditToolbar({
  image,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
  language = 'he',
}: ImageEditToolbarProps) {
  const isHebrew = language === 'he';
  const [activeTab, setActiveTab] = useState<'style' | 'position' | 'effects'>('style');

  const tabs = [
    { id: 'style', labelHe: 'סגנון', labelEn: 'Style', icon: ImageIcon },
    { id: 'position', labelHe: 'מיקום', labelEn: 'Position', icon: Move },
    { id: 'effects', labelHe: 'אפקטים', labelEn: 'Effects', icon: Layers },
  ];

  const textWrapOptions = [
    { value: 'none', labelHe: 'ללא', labelEn: 'None', icon: '▢' },
    { value: 'behind', labelHe: 'מאחורי הטקסט', labelEn: 'Behind Text', icon: '▣' },
    { value: 'front', labelHe: 'מעל הטקסט', labelEn: 'In Front', icon: '▤' },
    { value: 'wrap', labelHe: 'טקסט עוטף', labelEn: 'Wrap Text', icon: '▥' },
  ];

  const borderStyles = [
    { value: 'none', labelHe: 'ללא', labelEn: 'None' },
    { value: 'solid', labelHe: 'רציף', labelEn: 'Solid' },
    { value: 'dashed', labelHe: 'מקווקו', labelEn: 'Dashed' },
    { value: 'dotted', labelHe: 'נקודות', labelEn: 'Dotted' },
  ];

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] max-w-[95vw]"
      style={{ direction: isHebrew ? 'rtl' : 'ltr' }}
    >
      <div className="bg-gray-900 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700 overflow-hidden max-h-[70vh] overflow-y-auto">
        {/* Header with tabs */}
        <div className="flex items-center border-b border-gray-700/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {isHebrew ? tab.labelHe : tab.labelEn}
            </button>
          ))}
          <button
            onClick={onClose}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 mr-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 w-[350px] max-w-[90vw]">
          <AnimatePresence mode="wait">
            {activeTab === 'style' && (
              <motion.div
                key="style"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Opacity */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'שקיפות' : 'Opacity'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(image.opacity ?? 1) * 100}
                      onChange={(e) => onUpdate({ opacity: parseInt(e.target.value) / 100 })}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="text-sm text-white w-12 text-center">
                      {Math.round((image.opacity ?? 1) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'עיגול פינות' : 'Corner Radius'}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onUpdate({ borderRadius: 0 })}
                      className={`p-2 rounded-lg transition-colors ${
                        (image.borderRadius ?? 0) === 0
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                      title={isHebrew ? 'חד' : 'Sharp'}
                    >
                      <Square className="w-5 h-5" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={image.borderRadius ?? 0}
                      onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
                      className="flex-1 accent-amber-500"
                    />
                    <button
                      onClick={() => onUpdate({ borderRadius: 50 })}
                      className={`p-2 rounded-lg transition-colors ${
                        (image.borderRadius ?? 0) >= 50
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                      title={isHebrew ? 'עגול' : 'Round'}
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Fade Edges */}
                <div>
                  <label className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>{isHebrew ? 'דהייה בקצוות' : 'Fade Edges'}</span>
                    <input
                      type="checkbox"
                      checked={image.fadeEdges ?? false}
                      onChange={(e) => onUpdate({ fadeEdges: e.target.checked })}
                      className="w-4 h-4 accent-amber-500"
                    />
                  </label>
                  {image.fadeEdges && (
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={image.fadeAmount ?? 20}
                      onChange={(e) => onUpdate({ fadeAmount: parseInt(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  )}
                </div>

                {/* Border */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'מסגרת' : 'Border'}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {borderStyles.map((style) => (
                      <button
                        key={style.value}
                        onClick={() =>
                          onUpdate({
                            border: style.value === 'none'
                              ? undefined
                              : {
                                  width: image.border?.width || 2,
                                  color: image.border?.color || '#ffffff',
                                  style: style.value as any
                                }
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          (style.value === 'none' && !image.border) ||
                          image.border?.style === style.value
                            ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {isHebrew ? style.labelHe : style.labelEn}
                      </button>
                    ))}
                  </div>
                  {image.border && (
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={image.border.width}
                        onChange={(e) => onUpdate({
                          border: { ...image.border!, width: parseInt(e.target.value) }
                        })}
                        className="flex-1 accent-amber-500"
                      />
                      <input
                        type="color"
                        value={image.border.color}
                        onChange={(e) => onUpdate({
                          border: { ...image.border!, color: e.target.value }
                        })}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Shadow */}
                <div>
                  <label className="flex items-center justify-between text-sm text-gray-400">
                    <span>{isHebrew ? 'צל' : 'Shadow'}</span>
                    <input
                      type="checkbox"
                      checked={image.shadow ?? false}
                      onChange={(e) => onUpdate({ shadow: e.target.checked })}
                      className="w-4 h-4 accent-amber-500"
                    />
                  </label>
                </div>
              </motion.div>
            )}

            {activeTab === 'position' && (
              <motion.div
                key="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Text Wrap */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'סידור עם טקסט' : 'Text Wrap'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {textWrapOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onUpdate({ textWrap: option.value as any })}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                          (image.textWrap ?? 'none') === option.value
                            ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xl">{option.icon}</span>
                        <span className="text-xs">
                          {isHebrew ? option.labelHe : option.labelEn}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'סיבוב' : 'Rotation'}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onUpdate({ rotation: ((image.rotation ?? 0) - 90) % 360 })}
                      className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                      <RotateCw className="w-5 h-5 transform -scale-x-100" />
                    </button>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={image.rotation ?? 0}
                      onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
                      className="flex-1 accent-amber-500"
                    />
                    <button
                      onClick={() => onUpdate({ rotation: ((image.rotation ?? 0) + 90) % 360 })}
                      className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-white w-12 text-center">
                      {image.rotation ?? 0}°
                    </span>
                  </div>
                </div>

                {/* Flip */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'היפוך' : 'Flip'}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdate({ flipH: !image.flipH })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        image.flipH
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <FlipHorizontal className="w-5 h-5" />
                      {isHebrew ? 'אופקי' : 'Horizontal'}
                    </button>
                    <button
                      onClick={() => onUpdate({ flipV: !image.flipV })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        image.flipV
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <FlipVertical className="w-5 h-5" />
                      {isHebrew ? 'אנכי' : 'Vertical'}
                    </button>
                  </div>
                </div>

                {/* Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      {isHebrew ? 'רוחב (%)' : 'Width (%)'}
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={Math.round(image.width)}
                      onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 20 })}
                      className="w-full px-3 py-2 bg-gray-800 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      {isHebrew ? 'גובה (%)' : 'Height (%)'}
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={Math.round(image.height)}
                      onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 20 })}
                      className="w-full px-3 py-2 bg-gray-800 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'effects' && (
              <motion.div
                key="effects"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Quick Effects */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'אפקטים מהירים' : 'Quick Effects'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onUpdate({
                        borderRadius: 0,
                        fadeEdges: false,
                        shadow: false,
                        border: undefined
                      })}
                      className="p-3 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
                    >
                      {isHebrew ? 'רגיל' : 'Normal'}
                    </button>
                    <button
                      onClick={() => onUpdate({
                        borderRadius: 10,
                        shadow: true,
                        fadeEdges: false
                      })}
                      className="p-3 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
                    >
                      {isHebrew ? 'מעוגל + צל' : 'Rounded + Shadow'}
                    </button>
                    <button
                      onClick={() => onUpdate({
                        borderRadius: 50,
                        shadow: false,
                        fadeEdges: false
                      })}
                      className="p-3 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
                    >
                      {isHebrew ? 'עגול' : 'Circle'}
                    </button>
                    <button
                      onClick={() => onUpdate({
                        fadeEdges: true,
                        fadeAmount: 30,
                        borderRadius: 0
                      })}
                      className="p-3 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
                    >
                      {isHebrew ? 'דהייה' : 'Fade'}
                    </button>
                    <button
                      onClick={() => onUpdate({
                        border: { width: 3, color: '#ffffff', style: 'solid' },
                        borderRadius: 0
                      })}
                      className="p-3 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
                    >
                      {isHebrew ? 'מסגרת לבנה' : 'White Frame'}
                    </button>
                    <button
                      onClick={() => onUpdate({
                        border: { width: 5, color: '#d4af37', style: 'solid' },
                        borderRadius: 5,
                        shadow: true
                      })}
                      className="p-3 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
                    >
                      {isHebrew ? 'מסגרת זהב' : 'Gold Frame'}
                    </button>
                  </div>
                </div>

                {/* Polaroid Effect */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isHebrew ? 'סגנונות מיוחדים' : 'Special Styles'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onUpdate({
                        borderRadius: 2,
                        shadow: true,
                        border: { width: 8, color: '#ffffff', style: 'solid' },
                        rotation: -3
                      })}
                      className="p-3 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
                    >
                      {isHebrew ? 'פולרויד' : 'Polaroid'}
                    </button>
                    <button
                      onClick={() => onUpdate({
                        borderRadius: 0,
                        shadow: true,
                        border: { width: 1, color: '#333333', style: 'solid' },
                        opacity: 0.9
                      })}
                      className="p-3 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
                    >
                      {isHebrew ? 'וינטג\'' : 'Vintage'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700/50 bg-gray-800/50">
          <div className="flex gap-2">
            <button
              onClick={onDuplicate}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg text-gray-300 hover:text-white hover:bg-gray-600 transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              {isHebrew ? 'שכפל' : 'Duplicate'}
            </button>
          </div>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            {isHebrew ? 'מחק' : 'Delete'}
          </button>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
