import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface GlowingButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'gold' | 'cosmic';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * GlowingButton Component
 *
 * A button with gradient background, constant pulse glow, and ripple click effect.
 *
 * @param children - Button content
 * @param variant - Color variant (default: 'primary')
 * @param size - Button size (default: 'md')
 * @param fullWidth - Make button full width (default: false)
 * @param disabled - Disable button (default: false)
 * @param className - Additional Tailwind classes
 *
 * @example
 * <GlowingButton variant="gold" size="lg" onClick={handleClick}>
 *   Upgrade Now
 * </GlowingButton>
 */
export default function GlowingButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}: GlowingButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);

    // Call original onClick
    if (onClick) {
      onClick(e);
    }
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
      shadow: '0 0 20px rgba(139, 92, 246, 0.4)',
      hoverShadow: '0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.3)',
    },
    gold: {
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
      shadow: '0 0 20px rgba(255, 215, 0, 0.4)',
      hoverShadow: '0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3)',
    },
    cosmic: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      shadow: '0 0 20px rgba(240, 147, 251, 0.4)',
      hoverShadow: '0 0 30px rgba(240, 147, 251, 0.6), 0 0 60px rgba(240, 147, 251, 0.3)',
    },
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const textColors = {
    primary: 'text-white',
    gold: 'text-gray-900',
    cosmic: 'text-white',
  };

  return (
    <motion.button
      className={`
        relative overflow-hidden rounded-lg font-semibold
        transition-all duration-300
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${textColors[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        background: variants[variant].background,
        backgroundSize: '200% 200%',
        boxShadow: variants[variant].shadow,
      }}
      whileHover={
        disabled
          ? {}
          : {
              scale: 1.05,
              boxShadow: variants[variant].hoverShadow,
            }
      }
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        backgroundPosition: {
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        },
      }}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {/* Pulse glow animation */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
        }}
      />

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{
            width: 500,
            height: 500,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
