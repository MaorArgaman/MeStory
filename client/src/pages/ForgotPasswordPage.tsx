import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO } from '../components/seo';

/**
 * Minimal forgot-password page. Full email/token-based reset flow is not
 * implemented yet - this page asks the user to contact support so they
 * have at least a recovery path. When the real flow ships, this page
 * becomes the email-entry step.
 */
export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const supportEmail = 'mestory.tec@gmail.com';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-space" dir={isHebrew ? 'rtl' : 'ltr'}>
      <SEO title={isHebrew ? 'שכחתי סיסמה' : 'Forgot Password'} noIndex />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card glow w-full max-w-md p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isHebrew ? 'איפוס סיסמה' : 'Reset Password'}
          </h1>
        </div>

        <p className="text-gray-300 mb-4">
          {isHebrew
            ? 'איפוס סיסמה אוטומטי דרך מייל יושלם בקרוב. בינתיים, צור קשר עם התמיכה ונאפס לך את הסיסמה ידנית תוך מקסימום 24 שעות.'
            : 'Automated email-based password reset is coming soon. In the meantime, contact support and we will reset your password manually within 24 hours.'}
        </p>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
          <p className="text-sm text-gray-400 mb-1">
            {isHebrew ? 'כתובת התמיכה:' : 'Support email:'}
          </p>
          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent(
              isHebrew ? 'בקשה לאיפוס סיסמה' : 'Password reset request'
            )}`}
            className="text-memorial-gold hover:underline font-medium break-all"
          >
            {supportEmail}
          </a>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          {isHebrew
            ? 'ציין במייל את כתובת המייל של החשבון שלך, ונחזור אליך עם סיסמה זמנית.'
            : 'Include your account email in the message and we will reply with a temporary password.'}
        </p>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 hover:underline"
        >
          <ArrowLeft className={`w-4 h-4 ${isHebrew ? 'rotate-180' : ''}`} />
          {isHebrew ? 'חזרה להתחברות' : 'Back to login'}
        </Link>
      </motion.div>
    </div>
  );
}
