import { motion } from 'framer-motion';

interface BrandWatermarkProps {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  size?: 'small' | 'medium' | 'large';
  opacity?: number;
  className?: string;
}

export default function BrandWatermark({
  position = 'bottom-right',
  size = 'small',
  opacity = 0.15,
  className = '',
}: BrandWatermarkProps) {
  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  const sizeClasses = {
    small: 'w-16 sm:w-20',
    medium: 'w-24 sm:w-32',
    large: 'w-32 sm:w-40',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className={`fixed ${positionClasses[position]} z-10 pointer-events-none select-none ${className}`}
      style={{ opacity }}
    >
      <img
        src="/img/new/logo-mestory-small.png"
        alt=""
        aria-hidden="true"
        className={`${sizeClasses[size]} h-auto object-contain filter drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]`}
        draggable={false}
      />
    </motion.div>
  );
}
