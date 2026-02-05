import { motion } from 'framer-motion';
import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface NeonInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  glowColor?: 'gold' | 'purple' | 'blue';
}

/**
 * NeonInput Component
 *
 * An input field that glows when focused with a bottom border animation.
 *
 * @param label - Input label text
 * @param error - Error message to display
 * @param icon - Icon to display on the left
 * @param glowColor - Glow color when focused (default: 'gold')
 * @param ...props - Standard HTML input props
 *
 * @example
 * <NeonInput
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   glowColor="gold"
 *   icon={<Mail />}
 * />
 */
const NeonInput = forwardRef<HTMLInputElement, NeonInputProps>(
  ({ label, error, icon, glowColor = 'gold', className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const glowColors = {
      gold: {
        border: '#FFD700',
        shadow: '0 0 10px rgba(255, 215, 0, 0.5), 0 4px 20px rgba(255, 215, 0, 0.3)',
        gradient: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
      },
      purple: {
        border: '#a855f7',
        shadow: '0 0 10px rgba(168, 85, 247, 0.5), 0 4px 20px rgba(168, 85, 247, 0.3)',
        gradient: 'linear-gradient(90deg, transparent, #a855f7, transparent)',
      },
      blue: {
        border: '#6366f1',
        shadow: '0 0 10px rgba(99, 102, 241, 0.5), 0 4px 20px rgba(99, 102, 241, 0.3)',
        gradient: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
      },
    };

    return (
      <div className={`relative ${className}`}>
        {/* Label */}
        {label && (
          <motion.label
            className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
              isFocused ? 'text-white' : 'text-gray-400'
            }`}
            animate={{
              color: isFocused ? '#ffffff' : '#9ca3af',
            }}
          >
            {label}
          </motion.label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                isFocused ? 'text-white' : 'text-gray-500'
              }`}
            >
              {icon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 bg-white/5 backdrop-blur-sm
              text-white placeholder-gray-500
              rounded-lg border-b-2 border-transparent
              transition-all duration-300
              focus:outline-none focus:bg-white/10
              ${icon ? 'pl-12' : ''}
              ${error ? 'border-red-500' : ''}
            `}
            style={{
              borderBottomColor: isFocused ? glowColors[glowColor].border : 'transparent',
              boxShadow: isFocused ? glowColors[glowColor].shadow : 'none',
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Animated bottom border glow */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
            style={{
              background: glowColors[glowColor].gradient,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: isFocused ? 1 : 0,
              opacity: isFocused ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />

          {/* Glow particles effect when focused */}
          {isFocused && (
            <>
              <motion.div
                className="absolute -top-1 left-1/4 w-2 h-2 rounded-full"
                style={{ background: glowColors[glowColor].border }}
                animate={{
                  y: [-5, -15, -5],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute -top-1 right-1/3 w-2 h-2 rounded-full"
                style={{ background: glowColors[glowColor].border }}
                animate={{
                  y: [-5, -15, -5],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            className="mt-2 text-sm text-red-400 flex items-center gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

NeonInput.displayName = 'NeonInput';

export default NeonInput;
