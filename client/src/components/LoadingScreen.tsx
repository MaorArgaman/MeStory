import { motion } from 'framer-motion';
// Use new logo from public folder
const logoIcon = '/img/new/logo-mestory-small.jpeg';

/**
 * Loading Screen Component
 * Displayed while checking authentication status
 * Prevents flash of login screen
 */
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      {/* Animated Logo */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-48 h-48 mx-auto flex items-center justify-center">
            <img
              src={logoIcon}
              alt="MeStory"
              className="w-full h-full object-contain drop-shadow-[0_4px_30px_rgba(255,215,0,0.5)]"
            />
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-gray-300 mb-8 text-lg"
        >
          AI-Powered Book Writing Platform
        </motion.p>

        {/* Loading Spinner — book animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col items-center justify-center gap-3"
        >
          <div className="spinner-book" />
          <span className="text-gray-400 text-sm">טוען...</span>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ delay: 0.5, duration: 2, ease: 'easeOut' }}
          className="mt-8 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto max-w-xs"
        />
      </div>

      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
