import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import analytics from '../utils/analytics';
import { SEO } from '../components/seo';
import { motion, AnimatePresence } from 'framer-motion';
// Legacy imports - keeping for fallback
import _loginSideImageLegacy from '../assets/images/login-side-image.png';
import _logoIconLegacy from '../assets/images/logo-icon.png';

// Use new realistic images from public folder
const loginSideImage = '/img/new/hero-grandma-grandkids.png';
const logoIcon = '/img/new/logo-mestory-large.png';

const rotatingQuotes = [
  { he: 'אף פעם לא חשבתי שאני יכולה לכתוב ספר (רחל, בת 78)', en: 'I never thought I could write a book (Rachel, age 78)' },
  { he: 'הנצחנו את הגיבור שלנו בספר שכל המשפחה גאה בו (משפחת כהן)', en: 'We memorialized our hero in a book the whole family is proud of (The Cohen Family)' },
  { he: 'הסיפור של סבא נשמר לדורות הבאים (דנה, בת 32)', en: 'Grandpa\'s story is preserved for future generations (Dana, age 32)' },
  { he: 'מהראיון הקצר יצא ספר שהפתיע את כולנו (יוסי, בן 45)', en: 'From a short interview came a book that surprised us all (Yossi, age 45)' },
];

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % rotatingQuotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      analytics.login('email');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      // The axios interceptor suppresses toasts on /login (because 401
      // there usually means 'wrong credentials', not 'session expired'),
      // so the page itself has to render the error or the user sees
      // nothing happen. Map common HTTP statuses to Hebrew messages.
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.error;
      let msg: string;
      if (status === 401) {
        msg = 'אימייל או סיסמה שגויים';
      } else if (status === 403 && serverMsg?.includes('not verified')) {
        msg = 'יש לאמת את כתובת האימייל לפני התחברות';
      } else if (status === 429) {
        msg = 'יותר מדי נסיונות התחברות. נסה שוב בעוד דקה';
      } else {
        msg = serverMsg || error?.message || 'ההתחברות נכשלה';
      }
      toast.error(msg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <SEO title="התחברות" description="התחבר לחשבון MeStory שלך וצור ספרים מדהימים עם בינה מלאכותית" noIndex />
      {/* Left Column - Side Image (hidden on mobile) */}
      <div
        className="hidden lg:block relative bg-cover bg-center"
        style={{ backgroundImage: `url(${loginSideImage})` }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-deep-space/80 via-deep-space/40 to-transparent" />

        {/* Decorative Content */}
        <div className="absolute inset-0 flex flex-col justify-center p-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h2 className="text-5xl font-bold text-white mb-4">
              {t('login.side_title_1')}
              <br />
              <span className="gradient-gold">{t('login.side_title_2')}</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-md">
              {t('login.side_description')}
            </p>
          </motion.div>

          {/* Floating Sparkles */}
          <div className="absolute bottom-20 left-12">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ left: `${i * 40}px` }}
                animate={{
                  y: [0, -15, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              >
                <Sparkles className="w-6 h-6 text-memorial-gold" />
              </motion.div>
            ))}
          </div>

          {/* Rotating Quote Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-8 py-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
                className="rotating-quote text-center"
              >
                <p className="text-white/90 italic text-sm mb-1" dir="rtl">
                  &ldquo;{rotatingQuotes[quoteIndex].he}&rdquo;
                </p>
                <p className="text-white/60 italic text-xs">
                  &ldquo;{rotatingQuotes[quoteIndex].en}&rdquo;
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="flex flex-col justify-center items-center p-8 bg-deep-space">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-4"
            >
              <img
                src={logoIcon}
                alt="MeStory"
                className="h-28 sm:h-32 w-auto object-contain drop-shadow-[0_4px_20px_rgba(255,215,0,0.4)]"
              />
            </motion.div>
            <p className="text-gray-400">{t('login.tagline')}</p>
          </div>

          {/* Login Card */}
          <div className="card glow">
            <h2 className="text-2xl font-bold text-white mb-6">{t('login.title')}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('login.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-11"
                    placeholder={t('login.email_placeholder')}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-11 pr-11"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? t('accessibility.hide_password', 'Hide password') : t('accessibility.show_password', 'Show password')}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-left -mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  {t('login.forgot_password', 'שכחתי סיסמה')}
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('login.submitting')}
                  </>
                ) : (
                  t('login.submit')
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-card text-gray-400">{t('login.or')}</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <a
              href="https://api.mestory-ai.com/api/auth/google"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('login.google_login')}
            </a>

            {/* Register Link */}
            <div className="mt-6 text-center text-sm text-gray-400">
              {t('login.no_account')}{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                {t('login.create_account')}
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-600 mt-8">
            {t('login.footer')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
