/**
 * Payment Success Animation
 *
 * An animated checkmark with celebration effects using framer-motion.
 * Can be used inline or as part of a modal/page.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface PaymentSuccessAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gold';
  showParticles?: boolean;
  message?: string;
  subMessage?: string;
}

const PaymentSuccessAnimation: React.FC<PaymentSuccessAnimationProps> = ({
  size = 'md',
  variant = 'default',
  showParticles = true,
  message = 'Payment Successful!',
  subMessage,
}) => {
  const sizes = {
    sm: { container: 'w-16 h-16', icon: 'w-8 h-8', particles: 30 },
    md: { container: 'w-24 h-24', icon: 'w-12 h-12', particles: 50 },
    lg: { container: 'w-32 h-32', icon: 'w-16 h-16', particles: 70 },
  };

  const colors = {
    default: {
      gradient: 'from-green-400 to-emerald-600',
      shadow: 'shadow-green-500/40',
      text: 'text-green-400',
      particle: 'bg-green-400',
    },
    gold: {
      gradient: 'from-yellow-400 to-amber-600',
      shadow: 'shadow-yellow-500/40',
      text: 'text-yellow-400',
      particle: 'bg-yellow-400',
    },
  };

  const currentSize = sizes[size];
  const currentColor = colors[variant];

  // Generate particle positions
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) * (Math.PI / 180),
    delay: i * 0.05,
  }));

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Main Circle with Checkmark */}
      <div className="relative">
        {/* Ripple Effect */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentColor.gradient}`}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentColor.gradient}`}
          initial={{ scale: 0, opacity: 0.4 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />

        {/* Main Circle */}
        <motion.div
          className={`relative ${currentSize.container} rounded-full bg-gradient-to-br ${currentColor.gradient} flex items-center justify-center shadow-2xl ${currentColor.shadow}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 15,
            delay: 0.2,
          }}
        >
          {/* Checkmark */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 15,
              delay: 0.5,
            }}
          >
            <Check className={`${currentSize.icon} text-white`} strokeWidth={3} />
          </motion.div>

          {/* Inner Shine */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          />
        </motion.div>

        {/* Celebration Particles */}
        {showParticles && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute ${currentColor.particle} rounded-full`}
            style={{
              width: size === 'lg' ? 8 : size === 'md' ? 6 : 4,
              height: size === 'lg' ? 8 : size === 'md' ? 6 : 4,
              top: '50%',
              left: '50%',
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: Math.cos(particle.angle) * currentSize.particles,
              y: Math.sin(particle.angle) * currentSize.particles,
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              delay: 0.4 + particle.delay,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Orbiting Stars */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {[0, 120, 240].map((angle, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 ${currentColor.particle} rounded-full`}
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${angle}deg) translateX(${size === 'lg' ? 55 : size === 'md' ? 45 : 35}px)`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3 + 0.6,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Success Message */}
      {message && (
        <motion.h3
          className={`mt-6 text-xl sm:text-2xl font-bold ${currentColor.text}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {message}
        </motion.h3>
      )}

      {/* Sub Message */}
      {subMessage && (
        <motion.p
          className="mt-2 text-gray-400 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {subMessage}
        </motion.p>
      )}
    </div>
  );
};

export default PaymentSuccessAnimation;
