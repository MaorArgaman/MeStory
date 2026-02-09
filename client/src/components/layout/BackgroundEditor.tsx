/**
 * BackgroundEditor Component
 * Configure page background (solid color, gradient, image, pattern)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { BackgroundConfig, BackgroundType, GradientColorStop } from '../../types/templates';

interface BackgroundEditorProps {
  value: BackgroundConfig;
  onChange: (value: BackgroundConfig) => void;
}

export default function BackgroundEditor({
  value,
  onChange,
}: BackgroundEditorProps) {
  const [activeTab, setActiveTab] = useState<BackgroundType>(value.type);

  const backgroundTypes: { type: BackgroundType; label: string }[] = [
    { type: 'solid', label: 'Solid' },
    { type: 'gradient', label: 'Gradient' },
    { type: 'pattern', label: 'Pattern' },
    { type: 'image', label: 'Image' },
  ];

  // Preview component
  const BackgroundPreview = () => {
    const getBackgroundStyle = (): React.CSSProperties => {
      if (value.type === 'solid') {
        return { backgroundColor: value.color || '#ffffff' };
      }

      if (value.type === 'gradient' && value.gradient) {
        const colors = value.gradient.colors
          .map((c) => `${c.color} ${c.position}%`)
          .join(', ');
        if (value.gradient.type === 'linear') {
          return {
            background: `linear-gradient(${value.gradient.angle || 180}deg, ${colors})`,
          };
        }
        return {
          background: `radial-gradient(circle, ${colors})`,
        };
      }

      if (value.type === 'pattern' && value.pattern) {
        const patternStyles: Record<string, string> = {
          dots: `radial-gradient(${value.pattern.color} 1px, transparent 1px)`,
          lines: `repeating-linear-gradient(90deg, ${value.pattern.color}, ${value.pattern.color} 1px, transparent 1px, transparent 10px)`,
          grid: `
            linear-gradient(${value.pattern.color} 1px, transparent 1px),
            linear-gradient(90deg, ${value.pattern.color} 1px, transparent 1px)
          `,
        };
        return {
          backgroundColor: value.color || '#ffffff',
          backgroundImage: patternStyles[value.pattern.type] || patternStyles.dots,
          backgroundSize: value.pattern.type === 'dots' ? '10px 10px' : '20px 20px',
          opacity: value.pattern.opacity,
        };
      }

      if (value.type === 'image' && value.image) {
        return {
          backgroundImage: `url(${value.image.url})`,
          backgroundSize: value.image.position === 'tile' ? 'auto' : value.image.position,
          backgroundRepeat: value.image.position === 'tile' ? 'repeat' : 'no-repeat',
          backgroundPosition: 'center',
          opacity: value.image.opacity,
        };
      }

      return { backgroundColor: '#ffffff' };
    };

    return (
      <div className="relative">
        <div
          className="w-full h-32 rounded-lg border border-white/20 overflow-hidden"
          style={getBackgroundStyle()}
        >
          {/* Sample text overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4 bg-black/20 rounded">
              <p className="text-sm font-medium">Sample Text</p>
              <p className="text-xs opacity-75">Preview</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Solid color editor
  const SolidEditor = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Select Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value.color || '#ffffff'}
            onChange={(e) => onChange({ ...value, type: 'solid', color: e.target.value })}
            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20"
          />
          <input
            type="text"
            value={value.color || '#ffffff'}
            onChange={(e) => onChange({ ...value, type: 'solid', color: e.target.value })}
            className="flex-1 p-2.5 rounded-lg bg-white/5 border border-white/10
              text-white focus:outline-none focus:border-yellow-500/50"
          />
        </div>
      </div>

      {/* Color Presets */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Recommended Colors</label>
        <div className="flex flex-wrap gap-2">
          {[
            '#ffffff', '#fffef0', '#faf3e0', '#f5f5f5',
            '#e8e8e8', '#f0f4f8', '#fff5f5', '#f0fff4',
          ].map((color) => (
            <button
              key={color}
              onClick={() => onChange({ ...value, type: 'solid', color })}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                value.color === color ? 'border-yellow-500 scale-110' : 'border-white/20'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Gradient editor
  const GradientEditor = () => {
    const gradient = value.gradient || {
      type: 'linear' as const,
      angle: 180,
      colors: [
        { color: '#ffffff', position: 0 },
        { color: '#f0f0f0', position: 100 },
      ],
    };

    const updateGradient = (updates: Partial<typeof gradient>) => {
      onChange({
        ...value,
        type: 'gradient',
        gradient: { ...gradient, ...updates },
      });
    };

    const addColorStop = () => {
      const newPosition = Math.max(...gradient.colors.map((c) => c.position)) / 2 + 25;
      updateGradient({
        colors: [...gradient.colors, { color: '#cccccc', position: Math.min(newPosition, 100) }],
      });
    };

    const removeColorStop = (index: number) => {
      if (gradient.colors.length <= 2) return;
      updateGradient({
        colors: gradient.colors.filter((_, i) => i !== index),
      });
    };

    const updateColorStop = (index: number, updates: Partial<GradientColorStop>) => {
      updateGradient({
        colors: gradient.colors.map((c, i) =>
          i === index ? { ...c, ...updates } : c
        ),
      });
    };

    return (
      <div className="space-y-4">
        {/* Gradient Type */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Gradient Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => updateGradient({ type: 'linear' })}
              className={`flex-1 p-2 rounded-lg text-sm transition-colors ${
                gradient.type === 'linear'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                  : 'bg-white/5 text-gray-300 border border-white/10'
              }`}
            >
              Linear
            </button>
            <button
              onClick={() => updateGradient({ type: 'radial' })}
              className={`flex-1 p-2 rounded-lg text-sm transition-colors ${
                gradient.type === 'radial'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                  : 'bg-white/5 text-gray-300 border border-white/10'
              }`}
            >
              Radial
            </button>
          </div>
        </div>

        {/* Angle (for linear only) */}
        {gradient.type === 'linear' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Angle: {gradient.angle}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={gradient.angle || 180}
              onChange={(e) => updateGradient({ angle: parseInt(e.target.value) })}
              className="w-full accent-yellow-500"
            />
          </div>
        )}

        {/* Color Stops */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Color Stops</label>
            <button
              onClick={addColorStop}
              className="p-1 rounded hover:bg-white/10 text-yellow-400"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {gradient.colors.map((stop, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateColorStop(index, { color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stop.position}
                  onChange={(e) =>
                    updateColorStop(index, { position: parseInt(e.target.value) })
                  }
                  className="flex-1 accent-yellow-500"
                />
                <span className="text-xs text-gray-500 w-8">{stop.position}%</span>
                {gradient.colors.length > 2 && (
                  <button
                    onClick={() => removeColorStop(index)}
                    className="p-1 rounded hover:bg-white/10 text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Gradient Presets */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Presets</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { colors: [{ color: '#ffffff', position: 0 }, { color: '#f0f0f0', position: 100 }] },
              { colors: [{ color: '#fef9e7', position: 0 }, { color: '#f7dc6f', position: 100 }] },
              { colors: [{ color: '#e8f4f8', position: 0 }, { color: '#aed6f1', position: 100 }] },
              { colors: [{ color: '#fdedec', position: 0 }, { color: '#f5b7b1', position: 100 }] },
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => updateGradient({ colors: preset.colors })}
                className="h-8 rounded-lg border border-white/20 overflow-hidden"
                style={{
                  background: `linear-gradient(180deg, ${preset.colors
                    .map((c) => `${c.color} ${c.position}%`)
                    .join(', ')})`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Pattern editor
  const PatternEditor = () => {
    const pattern = value.pattern || {
      type: 'dots' as const,
      color: '#e0e0e0',
      opacity: 0.5,
    };

    const updatePattern = (updates: Partial<typeof pattern>) => {
      onChange({
        ...value,
        type: 'pattern',
        pattern: { ...pattern, ...updates },
      });
    };

    return (
      <div className="space-y-4">
        {/* Base Color */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Base Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.color || '#ffffff'}
              onChange={(e) => onChange({ ...value, color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={value.color || '#ffffff'}
              onChange={(e) => onChange({ ...value, color: e.target.value })}
              className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
            />
          </div>
        </div>

        {/* Pattern Type */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Pattern Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['dots', 'lines', 'grid'] as const).map((type) => (
              <button
                key={type}
                onClick={() => updatePattern({ type })}
                className={`p-3 rounded-lg text-sm transition-colors ${
                  pattern.type === type
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                    : 'bg-white/5 text-gray-300 border border-white/10'
                }`}
              >
                {type === 'dots' && 'Dots'}
                {type === 'lines' && 'Lines'}
                {type === 'grid' && 'Grid'}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern Color */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Pattern Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={pattern.color}
              onChange={(e) => updatePattern({ color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={pattern.color}
              onChange={(e) => updatePattern({ color: e.target.value })}
              className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
            />
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Opacity: {Math.round(pattern.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={pattern.opacity}
            onChange={(e) => updatePattern({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-yellow-500"
          />
        </div>
      </div>
    );
  };

  // Image editor
  const ImageEditor = () => {
    const image = value.image || {
      url: '',
      opacity: 0.3,
      position: 'cover' as const,
    };

    const updateImage = (updates: Partial<typeof image>) => {
      onChange({
        ...value,
        type: 'image',
        image: { ...image, ...updates },
      });
    };

    return (
      <div className="space-y-4">
        {/* Image URL / Upload */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Background Image</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={image.url}
              onChange={(e) => updateImage({ url: e.target.value })}
              placeholder="Image URL..."
              className="flex-1 p-2.5 rounded-lg bg-white/5 border border-white/10
                text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
            />
            <button
              className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-400
                hover:bg-white/10 hover:text-white transition-colors"
            >
              <Upload className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Preview */}
        {image.url && (
          <div className="relative h-24 rounded-lg overflow-hidden bg-gray-800">
            <img
              src={image.url}
              alt="Background preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
              }}
            />
          </div>
        )}

        {/* Position */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Position</label>
          <div className="grid grid-cols-3 gap-2">
            {(['cover', 'contain', 'tile'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => updateImage({ position: pos })}
                className={`p-2 rounded-lg text-sm transition-colors ${
                  image.position === pos
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                    : 'bg-white/5 text-gray-300 border border-white/10'
                }`}
              >
                {pos === 'cover' && 'Cover'}
                {pos === 'contain' && 'Contain'}
                {pos === 'tile' && 'Tile'}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Opacity: {Math.round(image.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={image.opacity}
            onChange={(e) => updateImage({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-yellow-500"
          />
        </div>

        {/* Sample Images */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Sample Images</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              'https://images.unsplash.com/photo-1557683316-973673baf926?w=200',
              'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
              'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200',
            ].map((url, idx) => (
              <button
                key={idx}
                onClick={() => updateImage({ url })}
                className="h-12 rounded-lg overflow-hidden border border-white/20 hover:border-yellow-500 transition-colors"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <BackgroundPreview />

      {/* Type Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/5">
        {backgroundTypes.map((bgType) => (
          <button
            key={bgType.type}
            onClick={() => {
              setActiveTab(bgType.type);
              onChange({ ...value, type: bgType.type });
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm transition-colors ${
              activeTab === bgType.type
                ? 'bg-yellow-500 text-black font-medium'
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            {bgType.label}
          </button>
        ))}
      </div>

      {/* Type-specific Editor */}
      <div className="min-h-[200px]">
        {activeTab === 'solid' && <SolidEditor />}
        {activeTab === 'gradient' && <GradientEditor />}
        {activeTab === 'pattern' && <PatternEditor />}
        {activeTab === 'image' && <ImageEditor />}
      </div>
    </div>
  );
}
