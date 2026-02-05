/**
 * AIAvatar Component
 * Animated AI avatar for voice interview
 */

import { motion } from 'framer-motion';
import { Bot, Mic, Volume2, Brain } from 'lucide-react';
import AudioWaveform from '../voice/AudioWaveform';

export type AIAvatarState = 'idle' | 'speaking' | 'listening' | 'thinking';

interface AIAvatarProps {
  state: AIAvatarState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AIAvatar({
  state,
  size = 'md',
  className = '',
}: AIAvatarProps) {
  // Size configurations
  const sizes = {
    sm: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      ring: 'w-20 h-20',
    },
    md: {
      container: 'w-24 h-24',
      icon: 'w-12 h-12',
      ring: 'w-28 h-28',
    },
    lg: {
      container: 'w-32 h-32',
      icon: 'w-16 h-16',
      ring: 'w-36 h-36',
    },
  };

  const currentSize = sizes[size];

  // State-based colors
  const stateColors = {
    idle: {
      bg: 'from-gray-600 to-gray-700',
      ring: 'border-gray-500/30',
      glow: 'rgba(156, 163, 175, 0.3)',
    },
    speaking: {
      bg: 'from-magic-gold to-yellow-500',
      ring: 'border-magic-gold/50',
      glow: 'rgba(255, 215, 0, 0.4)',
    },
    listening: {
      bg: 'from-blue-500 to-blue-600',
      ring: 'border-blue-400/50',
      glow: 'rgba(59, 130, 246, 0.4)',
    },
    thinking: {
      bg: 'from-purple-500 to-purple-600',
      ring: 'border-purple-400/50',
      glow: 'rgba(168, 85, 247, 0.4)',
    },
  };

  const colors = stateColors[state];

  // State icons
  const getStateIcon = () => {
    switch (state) {
      case 'speaking':
        return <Volume2 className={currentSize.icon} />;
      case 'listening':
        return <Mic className={currentSize.icon} />;
      case 'thinking':
        return <Brain className={currentSize.icon} />;
      default:
        return <Bot className={currentSize.icon} />;
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer ring animation */}
      <motion.div
        className={`absolute ${currentSize.ring} rounded-full border-2 ${colors.ring}`}
        animate={
          state === 'speaking' || state === 'thinking'
            ? {
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }
            : {
                scale: 1,
                opacity: 0.3,
              }
        }
        transition={{
          duration: state === 'speaking' ? 0.8 : 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Glow effect */}
      <motion.div
        className={`absolute ${currentSize.container} rounded-full`}
        style={{ boxShadow: `0 0 40px ${colors.glow}` }}
        animate={
          state !== 'idle'
            ? {
                boxShadow: [
                  `0 0 30px ${colors.glow}`,
                  `0 0 50px ${colors.glow}`,
                  `0 0 30px ${colors.glow}`,
                ],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main avatar circle */}
      <motion.div
        className={`relative ${currentSize.container} rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg`}
        animate={
          state === 'thinking'
            ? {
                rotate: [0, 5, -5, 0],
              }
            : state === 'listening'
            ? {
                scale: [1, 1.02, 1],
              }
            : {}
        }
        transition={{
          duration: state === 'thinking' ? 0.5 : 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Icon */}
        <motion.div
          className={state === 'speaking' ? 'text-deep-space' : 'text-white'}
          animate={
            state === 'speaking'
              ? {
                  scale: [1, 1.1, 1],
                }
              : state === 'thinking'
              ? {
                  opacity: [0.7, 1, 0.7],
                }
              : {}
          }
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {getStateIcon()}
        </motion.div>
      </motion.div>

      {/* Speaking waveform */}
      {state === 'speaking' && (
        <div className="absolute -bottom-6">
          <AudioWaveform isActive={true} barCount={5} color="#FFD700" />
        </div>
      )}

      {/* Listening indicator */}
      {state === 'listening' && (
        <motion.div
          className="absolute -bottom-4 flex gap-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-400"
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Thinking indicator */}
      {state === 'thinking' && (
        <motion.div
          className="absolute -bottom-4 text-purple-400 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          חושב...
        </motion.div>
      )}
    </div>
  );
}
