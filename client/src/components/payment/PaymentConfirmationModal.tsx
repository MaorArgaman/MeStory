/**
 * Payment Confirmation Modal
 *
 * Shows an order summary before processing payment.
 * Supports both subscription upgrades and book purchases.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  X,
  CreditCard,
  Shield,
  Loader2,
  BookOpen,
  Crown,
  Zap,
  Check,
} from 'lucide-react';
import { useModal } from '../../hooks/useModal';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  type: 'subscription' | 'book';
  // For subscription
  planName?: string;
  planPrice?: number;
  planPriceILS?: number;
  planFeatures?: string[];
  // For book purchase
  bookTitle?: string;
  bookAuthor?: string;
  bookPrice?: number;
  bookCover?: string;
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  type,
  planName,
  planPrice,
  planPriceILS,
  planFeatures,
  bookTitle,
  bookAuthor,
  bookPrice,
  bookCover,
}) => {
  const { t } = useTranslation();

  // ESC key handling and scroll lock
  useModal(isOpen, onClose);

  if (!isOpen) return null;

  const isPremium = planName?.toLowerCase() === 'premium';

  const getPlanIcon = () => {
    switch (planName?.toLowerCase()) {
      case 'premium':
        return <Crown className="w-8 h-8 text-yellow-400" />;
      case 'standard':
        return <Zap className="w-8 h-8 text-indigo-400" />;
      default:
        return <CreditCard className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && !isProcessing && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border ${
            isPremium ? 'border-yellow-500/30' : 'border-purple-500/20'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3
              id="payment-modal-title"
              className="text-xl font-bold text-white flex items-center gap-2"
            >
              <CreditCard className={`w-5 h-5 ${isPremium ? 'text-yellow-400' : 'text-purple-400'}`} />
              {t('payment.confirm_title', 'Confirm Payment')}
            </h3>
            {!isProcessing && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Order Summary */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              {t('payment.order_summary', 'Order Summary')}
            </h4>

            {type === 'subscription' && (
              <div className={`p-4 rounded-xl ${
                isPremium ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/5 border border-white/10'
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    isPremium
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    {getPlanIcon()}
                  </div>
                  <div>
                    <h5 className={`text-lg font-bold capitalize ${
                      isPremium ? 'text-yellow-400' : 'text-white'
                    }`}>
                      {planName} {t('payment.plan', 'Plan')}
                    </h5>
                    <p className="text-sm text-gray-400">
                      {t('payment.monthly_subscription', 'Monthly Subscription')}
                    </p>
                  </div>
                </div>

                {/* Features */}
                {planFeatures && planFeatures.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {planFeatures.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className={`w-4 h-4 flex-shrink-0 ${
                          isPremium ? 'text-yellow-400' : 'text-green-400'
                        }`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Price */}
                <div className="flex items-baseline justify-between pt-3 border-t border-white/10">
                  <span className="text-gray-400">{t('payment.total', 'Total')}</span>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${
                      isPremium ? 'text-yellow-400' : 'text-white'
                    }`}>
                      ${planPrice}
                    </span>
                    <span className="text-gray-400">/month</span>
                    {planPriceILS && (
                      <p className="text-xs text-gray-500">({'\u20AA'}{planPriceILS})</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {type === 'book' && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-4 mb-4">
                  {/* Book Cover */}
                  <div
                    className="w-16 h-24 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={bookCover ? {
                      backgroundImage: `url(${bookCover})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    } : undefined}
                  >
                    {!bookCover && <BookOpen className="w-8 h-8 text-white/50" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-lg font-bold text-white truncate">{bookTitle}</h5>
                    <p className="text-sm text-gray-400">{t('payment.by_author', 'by')} {bookAuthor}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-gray-400">{t('payment.total', 'Total')}</span>
                  <span className="text-2xl font-bold text-white">${bookPrice}</span>
                </div>
              </div>
            )}
          </div>

          {/* Security Badge */}
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg mb-6">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-300">
              {t('payment.secure_checkout', 'Secure checkout powered by PayPal')}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-gray-300 font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('buttons.cancel', 'Cancel')}
            </button>

            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                isPremium
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 hover:from-yellow-500 hover:to-yellow-700 shadow-lg shadow-yellow-500/30'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-purple-500/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('payment.processing', 'Processing...')}
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {t('payment.confirm_pay', 'Confirm & Pay')}
                </>
              )}
            </button>
          </div>

          {/* Terms Note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {t('payment.terms_note', 'By confirming, you agree to our Terms of Service and Privacy Policy')}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentConfirmationModal;
