import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO } from '../components/seo';

/**
 * Step 2 of password reset: confirm with the emailed token + new password.
 *
 * URL shape: /reset-password?token=<raw-token>
 * The token is single-use; backend clears it on successful update.
 */
export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Cheap client-side preview of the same rules the server enforces.
  // Server validation is still authoritative.
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const allPass = Object.values(checks).every(Boolean);
  const matches = password.length > 0 && password === confirmPassword;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-deep-space" dir={isHebrew ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card glow w-full max-w-md p-8 text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            {isHebrew ? 'קישור לא תקין' : 'Invalid link'}
          </h1>
          <p className="text-gray-300 mb-6">
            {isHebrew
              ? 'הקישור חסר טוקן. בקש קישור חדש מעמוד "שכחתי סיסמה".'
              : 'The link is missing a token. Request a new one from the forgot-password page.'}
          </p>
          <Link to="/forgot-password" className="btn-primary inline-block">
            {isHebrew ? 'בקש קישור חדש' : 'Request a new link'}
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPass || !matches || submitting) return;

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success(isHebrew ? 'הסיסמה עודכנה' : 'Password updated');
      // Send the user to login after a short success display.
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error;
      let msg: string;
      if (status === 400 && serverMsg?.includes('Invalid or expired')) {
        msg = isHebrew
          ? 'הקישור אינו תקף או פג תוקפו. בקש קישור חדש.'
          : 'The link is invalid or expired. Request a new one.';
      } else if (status === 400 && serverMsg?.includes('Password must')) {
        msg = isHebrew
          ? 'הסיסמה לא עומדת בדרישות.'
          : 'Password does not meet requirements.';
      } else if (status === 429) {
        msg = isHebrew ? 'יותר מדי נסיונות. נסה שוב בעוד דקה.' : 'Too many attempts.';
      } else {
        msg = serverMsg || (isHebrew ? 'איפוס הסיסמה נכשל' : 'Password reset failed');
      }
      toast.error(msg, { duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-space" dir={isHebrew ? 'rtl' : 'ltr'}>
      <SEO title={isHebrew ? 'איפוס סיסמה' : 'Reset Password'} noIndex />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card glow w-full max-w-md p-8"
      >
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {isHebrew ? 'הסיסמה עודכנה' : 'Password updated'}
            </h1>
            <p className="text-gray-300 mb-6">
              {isHebrew
                ? 'מעביר אותך לעמוד ההתחברות...'
                : 'Redirecting you to login...'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                {isHebrew ? 'בחר סיסמה חדשה' : 'Choose a new password'}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {isHebrew ? 'סיסמה חדשה' : 'New password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full pr-11"
                    placeholder="••••••••"
                    required
                    disabled={submitting}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {isHebrew ? 'אישור סיסמה' : 'Confirm password'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input w-full"
                  placeholder="••••••••"
                  required
                  disabled={submitting}
                />
                {confirmPassword.length > 0 && !matches && (
                  <p className="text-xs text-red-400 mt-1">
                    {isHebrew ? 'הסיסמאות לא תואמות' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Password rule checklist - live feedback */}
              <ul className="text-xs space-y-1 p-3 bg-white/5 rounded-lg border border-white/10">
                <li className={checks.length ? 'text-green-400' : 'text-gray-400'}>
                  {checks.length ? '✓' : '○'} {isHebrew ? 'לפחות 8 תווים' : 'At least 8 characters'}
                </li>
                <li className={checks.upper ? 'text-green-400' : 'text-gray-400'}>
                  {checks.upper ? '✓' : '○'} {isHebrew ? 'אות גדולה (A-Z)' : 'Uppercase letter (A-Z)'}
                </li>
                <li className={checks.lower ? 'text-green-400' : 'text-gray-400'}>
                  {checks.lower ? '✓' : '○'} {isHebrew ? 'אות קטנה (a-z)' : 'Lowercase letter (a-z)'}
                </li>
                <li className={checks.digit ? 'text-green-400' : 'text-gray-400'}>
                  {checks.digit ? '✓' : '○'} {isHebrew ? 'מספר (0-9)' : 'Number (0-9)'}
                </li>
                <li className={checks.special ? 'text-green-400' : 'text-gray-400'}>
                  {checks.special ? '✓' : '○'} {isHebrew ? 'תו מיוחד (!@#$%^&*)' : 'Special character (!@#$%^&*)'}
                </li>
              </ul>

              <button
                type="submit"
                disabled={submitting || !allPass || !matches}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isHebrew ? 'מעדכן...' : 'Updating...'}
                  </>
                ) : (
                  isHebrew ? 'עדכן סיסמה' : 'Update password'
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
