import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'toggle' | 'dropdown';
  showIcon?: boolean;
  className?: string;
}

export default function LanguageSwitcher({
  variant = 'toggle',
  showIcon = true,
  className = ''
}: LanguageSwitcherProps) {
  const { language, setLanguage, isLoading } = useLanguage();

  const handleLanguageChange = async (newLang: Language) => {
    if (newLang !== language && !isLoading) {
      await setLanguage(newLang);
    }
  };

  if (variant === 'toggle') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <Globe className="w-4 h-4 text-gray-400" />}
        <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageChange('en')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              language === 'en'
                ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled={isLoading}
          >
            EN
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageChange('he')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              language === 'he'
                ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled={isLoading}
          >
            עב
          </motion.button>
        </div>
      </div>
    );
  }

  // Dropdown variant for settings page or other contexts
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-3">
        {showIcon && <Globe className="w-5 h-5 text-gray-400" />}
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          disabled={isLoading}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-magic-gold/50 cursor-pointer appearance-none min-w-[150px]"
          style={{ direction: 'ltr' }}
        >
          <option value="en" className="bg-deep-space text-white">English</option>
          <option value="he" className="bg-deep-space text-white">עברית (Hebrew)</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
