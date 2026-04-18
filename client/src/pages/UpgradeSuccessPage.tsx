import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, Crown, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function UpgradeSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const plan = location.state?.plan || 'premium';
  const mockMode = location.state?.mockMode || false;

  useEffect(() => {
    // Trigger confetti celebration
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Gold confetti bursts
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FFFF00', '#FFB6C1'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const isPremium = plan === 'premium';

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Success Card */}
        <div className={`glass-strong rounded-3xl p-12 text-center ${
          isPremium ? 'border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20' : ''
        }`}>
          {/* Success Icon with Enhanced Animation */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Ripple Effects */}
            <motion.div
              className={`absolute inset-0 rounded-full ${
                isPremium
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                  : 'bg-gradient-to-br from-green-400 to-emerald-600'
              }`}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <motion.div
              className={`absolute inset-0 rounded-full ${
                isPremium
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                  : 'bg-gradient-to-br from-green-400 to-emerald-600'
              }`}
              initial={{ scale: 0, opacity: 0.4 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            />

            {/* Main Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 15 }}
              className={`relative w-full h-full rounded-full ${
                isPremium
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                  : 'bg-gradient-to-br from-green-400 to-emerald-600'
              } flex items-center justify-center shadow-2xl ${
                isPremium ? 'shadow-yellow-500/40' : 'shadow-green-500/40'
              }`}
            >
              {/* Icon with bounce animation */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.5 }}
              >
                {isPremium ? (
                  <Crown className="w-16 h-16 text-gray-900" />
                ) : (
                  <Check className="w-16 h-16 text-white" strokeWidth={3} />
                )}
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
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full ${
                  isPremium ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{
                  width: 8,
                  height: 8,
                  top: '50%',
                  left: '50%',
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: Math.cos((i * 30) * (Math.PI / 180)) * 70,
                  y: Math.sin((i * 30) * (Math.PI / 180)) * 70,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.4 + i * 0.05,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Orbiting Stars */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              {[0, 120, 240].map((angle, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full ${
                    isPremium ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${angle}deg) translateX(55px)`,
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

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-4xl font-bold mb-4 ${
              isPremium
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent'
                : 'gradient-text'
            }`}
          >
            Welcome to {plan.charAt(0).toUpperCase() + plan.slice(1)}!
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-300 mb-8"
          >
            Your subscription has been upgraded successfully
          </motion.p>

          {/* Mock Mode Indicator */}
          {mockMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg mb-6"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300 font-medium">Development Mode - No actual payment charged</span>
            </motion.div>
          )}

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className={isPremium ? 'text-yellow-400' : 'text-indigo-400'} />
              <h3 className="text-lg font-semibold">{isHebrew ? 'עכשיו יש לך גישה ל:' : 'You now have access to:'}</h3>
            </div>

            <ul className="space-y-3 text-left max-w-md mx-auto">
              {isPremium ? (
                <>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-300">{isHebrew ? 'קרדיטים ללא הגבלה' : 'Unlimited AI credits'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-300">{isHebrew ? 'עיבוד AI מועדף' : 'Priority AI processing'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-300">{isHebrew ? 'ניתוח מתקדם' : 'Advanced analytics'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-300">{isHebrew ? 'גישה מוקדמת לתכונות חדשות' : 'Early access to features'}</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <span className="text-gray-300">{isHebrew ? 'עוזר כתיבה AI מלא' : 'Full AI writing assistant'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <span className="text-gray-300">{isHebrew ? 'פרסום בחנות' : 'Publish to marketplace'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <span className="text-gray-300">{isHebrew ? 'ייצוא מתקדם' : 'Advanced exports'}</span>
                  </li>
                </>
              )}
            </ul>
          </motion.div>

          {/* User Info */}
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-8 p-4 bg-white/5 rounded-lg"
            >
              <p className="text-sm text-gray-400 mb-1">{isHebrew ? 'היתרה החדשה שלך' : 'Your new balance'}</p>
              <p className="text-3xl font-bold gradient-text">
                {user.credits === 999999 ? (isHebrew ? 'ללא הגבלה' : 'Unlimited') : user.credits.toLocaleString()} {isHebrew ? 'קרדיטים' : 'Credits'}
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-4 justify-center"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all ${
                isPremium
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 hover:from-yellow-500 hover:to-yellow-700 shadow-lg shadow-yellow-500/30'
                  : 'btn-primary'
              }`}
            >
              Start Writing
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="px-8 py-4 btn-secondary font-semibold rounded-xl"
            >
              View Settings
            </button>
          </motion.div>
        </div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-gray-500 mt-6"
        >
          Your subscription will automatically renew monthly. Cancel anytime from settings.
        </motion.p>
      </motion.div>
    </div>
  );
}
