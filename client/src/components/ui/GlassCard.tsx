import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  hover?: boolean;
  glow?: 'none' | 'gold' | 'purple' | 'cosmic';
  className?: string;
}

/**
 * GlassCard Component
 *
 * A glassmorphism card with blur effect, gradient border, and hover animations.
 *
 * @param children - Content inside the card
 * @param hover - Enable hover effects (default: true)
 * @param glow - Glow color variant (default: 'none')
 * @param className - Additional Tailwind classes
 *
 * @example
 * <GlassCard glow="gold">
 *   <h2>Premium Content</h2>
 *   <p>This is a glass card</p>
 * </GlassCard>
 */
export default function GlassCard({
  children,
  hover = true,
  glow = 'none',
  className = '',
  ...props
}: GlassCardProps) {
  const glowClasses = {
    none: '',
    gold: 'hover:shadow-glow-gold',
    purple: 'hover:shadow-glow-purple',
    cosmic: 'hover:shadow-glow-cosmic',
  };

  return (
    <motion.div
      className={`
        relative rounded-xl p-6
        bg-white/5 backdrop-blur-[12px]
        border border-transparent
        transition-all duration-300
        ${hover ? 'hover:scale-[1.02] hover:brightness-110 cursor-pointer' : ''}
        ${glowClasses[glow]}
        ${className}
      `}
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        borderImage: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), transparent) 1',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {/* Gradient border overlay */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), transparent 50%, rgba(255, 215, 0, 0.1))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Shimmer effect on hover */}
      {hover && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </motion.div>
      )}
    </motion.div>
  );
}
