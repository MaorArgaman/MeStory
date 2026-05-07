/**
 * Global modal that listens for 402 / 403 events from api.ts and prompts
 * the user to top up credits or upgrade their plan.
 *
 * Mounted once at the app root. No props needed.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Crown, X, ArrowRight } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

type ModalKind = 'insufficient' | 'feature-blocked';

interface TopUpPackage {
  id: string;
  credits: number;
  priceUSD: number;
  priceILS: number;
}

interface ModalState {
  open: boolean;
  kind: ModalKind;
  required?: number;
  available?: number;
  topUpOptions?: TopUpPackage[];
  feature?: string;
  currentPlan?: string;
}

const FEATURE_NAMES_HE: Record<string, string> = {
  voice_transcribe_per_minute: 'כתיבה קולית',
  voice_interview_session: 'ראיון קולי AI',
  tts_chapter: 'הקראת פרק',
  tts_full_book: 'אודיובוק מלא',
  ai_cover_single: 'כריכת AI',
  ai_cover_variations: 'וריאציות כריכה',
  ai_illustration: 'איור AI',
  ai_character_portrait: 'פורטרט דמות',
  design_premium_full: 'עיצוב פרימיום מלא',
  design_typography: 'עיצוב טיפוגרפיה',
  design_layout: 'עיצוב עימוד',
  analyze_quality: 'ניתוח איכות',
  analyze_plot: 'ניתוח מבנה עלילה',
  analyze_techniques: 'ניתוח טכניקות כתיבה',
  analyze_tension: 'ניתוח Tension Arc',
  analyze_coverage: 'ניתוח כיסוי ראיון',
  marketplace_publish: 'פרסום ב-Marketplace',
};

export default function InsufficientCreditsModal() {
  const [state, setState] = useState<ModalState>({ open: false, kind: 'insufficient' });
  const navigate = useNavigate();
  const { currency } = useCurrency();

  useEffect(() => {
    const onInsufficient = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setState({
        open: true,
        kind: 'insufficient',
        required: detail.required,
        available: detail.available,
        topUpOptions: detail.topUpOptions || [],
      });
    };

    const onFeatureBlocked = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setState({
        open: true,
        kind: 'feature-blocked',
        feature: detail.feature,
        currentPlan: detail.currentPlan,
      });
    };

    window.addEventListener('insufficient-credits', onInsufficient);
    window.addEventListener('feature-not-available', onFeatureBlocked);
    return () => {
      window.removeEventListener('insufficient-credits', onInsufficient);
      window.removeEventListener('feature-not-available', onFeatureBlocked);
    };
  }, []);

  const close = () => setState((s) => ({ ...s, open: false }));

  const goTopUp = () => {
    close();
    navigate('/buy-credits');
  };

  const goUpgrade = () => {
    close();
    navigate('/subscription');
  };

  const featureName =
    state.feature && FEATURE_NAMES_HE[state.feature]
      ? FEATURE_NAMES_HE[state.feature]
      : state.feature || 'הפיצ\'ר הזה';

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
          dir="rtl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full glass-strong rounded-2xl p-6 md:p-8 border border-white/10"
          >
            <button
              onClick={close}
              className="absolute top-4 left-4 p-2 rounded-lg hover:bg-white/10 transition"
              aria-label="סגור"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {state.kind === 'insufficient' ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-memorial-gold/20 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-memorial-gold" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">חסרים קרדיטים</h2>
                </div>

                <p className="text-gray-300 mb-2">
                  לפעולה הזו דרושים <strong className="text-memorial-gold">{state.required}</strong>{' '}
                  קרדיטים.
                </p>
                <p className="text-gray-400 mb-6">
                  היתרה הנוכחית שלך:{' '}
                  <strong className="text-white">{state.available}</strong> קרדיטים.
                </p>

                {state.topUpOptions && state.topUpOptions.length > 0 && (
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-gray-400 mb-2">חבילות קרדיטים מהירות:</p>
                    {state.topUpOptions.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div>
                          <div className="text-white font-bold">{pkg.credits} קרדיטים</div>
                          <div className="text-xs text-gray-400">ללא תפוגה</div>
                        </div>
                        <div className="text-memorial-gold font-bold">
                          {currency === 'ILS' ? `₪${pkg.priceILS}` : `$${pkg.priceUSD}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={goTopUp}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-memorial-gold to-yellow-600 text-deep-space font-bold flex items-center justify-center gap-2"
                  >
                    קנה קרדיטים <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </button>
                  <button
                    onClick={goUpgrade}
                    className="w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                  >
                    או שדרג למנוי חודשי
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">פיצ'ר זמין רק במנוי</h2>
                </div>

                <p className="text-gray-300 mb-6">
                  <strong className="text-white">{featureName}</strong> זמין רק במנוי Standard ומעלה.
                  שדרג כדי לפתוח את כל פיצ'רי ה-AI המתקדמים.
                </p>

                <button
                  onClick={goUpgrade}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-memorial-gold to-yellow-600 text-deep-space font-bold flex items-center justify-center gap-2"
                >
                  צפה בחבילות <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
