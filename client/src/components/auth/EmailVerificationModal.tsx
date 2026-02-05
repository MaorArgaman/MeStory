/**
 * Email Verification Modal
 * Shows after registration to verify user's email address
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle, X, AlertCircle } from 'lucide-react';
import { verifyEmail, resendVerificationCode } from '../../services/authApi';
import toast from 'react-hot-toast';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  email: string;
}

export default function EmailVerificationModal({
  isOpen,
  onClose,
  onVerified,
  email,
}: EmailVerificationModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setCode(pastedData.split(''));
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await verifyEmail(verificationCode);
      toast.success('Email verified successfully!');
      onVerified();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid verification code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setError('');

    try {
      await resendVerificationCode();
      toast.success('Verification code sent!');
      setCountdown(60); // 60 second cooldown
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md glass-strong rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-br from-magic-gold/20 to-yellow-500/10 border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-magic-gold/30 to-yellow-500/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-magic-gold" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">אימות כתובת המייל</h2>
              <p className="text-gray-400 text-sm">
                שלחנו קוד אימות ל-<span className="text-magic-gold">{email}</span>
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Code Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-3 text-center">
                הזן את הקוד בן 6 הספרות
              </label>
              <div className="flex justify-center gap-2" dir="ltr" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isVerifying}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all
                      ${error
                        ? 'border-red-500 bg-red-500/10'
                        : digit
                        ? 'border-magic-gold bg-magic-gold/10 text-magic-gold'
                        : 'border-white/20 bg-white/5 text-white'
                      }
                      focus:outline-none focus:border-magic-gold focus:ring-2 focus:ring-magic-gold/20
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Verify Button */}
            <button
              onClick={() => handleVerify(code.join(''))}
              disabled={isVerifying || code.some((d) => !d)}
              className="w-full py-3 px-4 rounded-xl font-bold text-deep-space bg-gradient-to-r from-magic-gold to-yellow-500 hover:from-yellow-500 hover:to-magic-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>מאמת...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>אמת את המייל</span>
                </>
              )}
            </button>

            {/* Resend Link */}
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm mb-2">לא קיבלת את הקוד?</p>
              <button
                onClick={handleResend}
                disabled={isResending || countdown > 0}
                className="text-magic-gold hover:text-yellow-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>שולח...</span>
                  </>
                ) : countdown > 0 ? (
                  <span>שלח שוב בעוד {countdown} שניות</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>שלח קוד חדש</span>
                  </>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-gray-400 text-xs text-center leading-relaxed">
                הקוד תקף ל-15 דקות. אם לא קיבלת את המייל, בדוק את תיקיית הספאם או לחץ על "שלח קוד חדש".
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
