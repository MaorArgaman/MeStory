import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO } from '../components/seo';

/**
 * Step 1 of password reset: enter email, server emails a one-time link.
 *
 * Server always returns 200 regardless of whether the email exists
 * (anti-enumeration), so we always show the same confirmation.
 */
export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
        lang: isHebrew ? 'he' : 'en',
      });
      setSubmitted(true);
    } catch (err: any) {
      // Server is designed to swallow most errors and respond 200, so
      // the only realistic path here is rate-limit (429) or network.
      const status = err?.response?.status;
      if (status === 429) {
        toast.error(isHebrew ? 'יותר מדי בקשות. נסה שוב בעוד דקה.' : 'Too many requests. Try again in a minute.');
      } else {
        toast.error(isHebrew ? 'שליחת המייל נכשלה. נסה שוב.' : 'Failed to send email. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-space" dir={isHebrew ? 'rtl' : 'ltr'}>
      <SEO title={isHebrew ? 'שכחתי סיסמה' : 'Forgot Password'} noIndex />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card glow w-full max-w-md p-8"
      >
        {!submitted ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                {isHebrew ? 'איפוס סיסמה' : 'Reset Password'}
              </h1>
            </div>

            <p className="text-gray-300 mb-6">
              {isHebrew
                ? 'הזן את כתובת המייל שלך, ונשלח אליך קישור לבחירת סיסמה חדשה.'
                : 'Enter your email and we will send you a link to choose a new password.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  {isHebrew ? 'כתובת מייל' : 'Email address'}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                  placeholder={isHebrew ? 'name@example.com' : 'name@example.com'}
                  required
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isHebrew ? 'שולח...' : 'Sending...'}
                  </>
                ) : (
                  isHebrew ? 'שלח קישור איפוס' : 'Send reset link'
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                {isHebrew ? 'הקישור נשלח' : 'Link sent'}
              </h1>
            </div>

            <p className="text-gray-300 mb-3">
              {isHebrew
                ? `אם החשבון של ${email} קיים אצלנו, מייל עם קישור לאיפוס סיסמה נשלח אליו.`
                : `If an account exists for ${email}, a password reset link has been sent.`}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              {isHebrew
                ? 'לא רואה את המייל? בדוק בתיקיית הספאם או הקידום. הקישור תקף לשעה.'
                : "Don't see it? Check your spam or promotions folder. The link expires in 1 hour."}
            </p>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline mb-6 block"
            >
              {isHebrew ? 'שלח לכתובת אחרת' : 'Use a different email'}
            </button>
          </>
        )}

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
