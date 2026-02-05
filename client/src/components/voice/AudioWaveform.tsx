/**
 * AudioWaveform Component
 * Visual audio waveform animation for recording/playback
 */

import { motion } from 'framer-motion';

interface AudioWaveformProps {
  isActive: boolean;
  barCount?: number;
  color?: string;
  className?: string;
}

export default function AudioWaveform({
  isActive,
  barCount = 5,
  color = '#FFD700',
  className = '',
}: AudioWaveformProps) {
  // Generate random heights for variety
  const getRandomDelay = (index: number) => index * 0.1;
  const getRandomDuration = () => 0.3 + Math.random() * 0.3;

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {Array.from({ length: barCount }).map((_, index) => (
        <motion.div
          key={index}
          className="rounded-full"
          style={{
            width: '4px',
            backgroundColor: color,
            originY: 0.5,
          }}
          animate={
            isActive
              ? {
                  height: ['8px', '24px', '8px'],
                  opacity: [0.7, 1, 0.7],
                }
              : {
                  height: '8px',
                  opacity: 0.4,
                }
          }
          transition={
            isActive
              ? {
                  duration: getRandomDuration(),
                  delay: getRandomDelay(index),
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {
                  duration: 0.3,
                }
          }
        />
      ))}
    </div>
  );
}
