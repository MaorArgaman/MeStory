import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Loader2, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import BookLoader from '../components/common/BookLoader';

interface TopUpPackage {
  id: string;
  credits: number;
  priceUSD: number;
  priceILS: number;
}

const PACKAGE_PERKS: Record<string, string[]> = {
  'topup-200': ['~100 שיפורי טקסט', '~13 כריכות AI', 'ללא תפוגה'],
  'topup-600': ['~300 שיפורי טקסט', '~40 כריכות AI', 'ללא תפוגה', 'הכי משתלם'],
  'topup-1500': [
    '~750 שיפורי טקסט',
    '~100 כריכות AI',
    'אודיובוק מלא + עיצוב פרימיום',
    'ללא תפוגה',
  ],
};

export default function BuyCreditsPage() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<TopUpPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await paymentApi.listTopUpPackages();
        if (cancelled) return;
        if (res?.success) {
          setPackages(res.data.packages);
        }
      } catch (err) {
        toast.error('לא הצלחנו לטעון את החבילות');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePurchase = async (pkg: TopUpPackage) => {
    setPurchasing(pkg.id);
    try {
      const res = await paymentApi.createTopUpOrder(pkg.id);
      if (!res.success) {
        throw new Error(res.error || 'יצירת הזמנה נכשלה');
      }

      const { orderId, approvalUrl, mockMode } = res.data;
      sessionStorage.setItem(
        'pendingPayment',
        JSON.stringify({
          orderId,
          plan: 'topup',
          packageId: pkg.id,
          credits: pkg.credits,
          createdAt: Date.now(),
        })
      );

      if (approvalUrl) {
        window.location.href = approvalUrl;
        return;
      }

      if (mockMode) {
        const capture = await paymentApi.captureTopUpOrder(orderId);
        if (!capture.success) throw new Error(capture.error || 'capture failed');
        toast.success(`נוספו ${pkg.credits} קרדיטים!`);
        navigate('/subscription');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'הרכישה נכשלה';
      toast.error(msg);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return <BookLoader />;
  }

  return (
    <div
      className="min-h-screen px-4 py-12 md:py-16"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #0b0e2c 0%, #181a3a 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-memorial-gold/10 border border-memorial-gold/30 mb-6">
            <Coins className="w-5 h-5 text-memorial-gold" />
            <span className="text-memorial-gold font-medium">קניית קרדיטים</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            קרדיטים נוספים
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-2">
            רכישה חד-פעמית. הקרדיטים נוספים ליתרה שלך ולא פגים.
          </p>
          {user && (
            <p className="text-gray-400">
              היתרה הנוכחית שלך:{' '}
              <span className="text-memorial-gold font-bold">{user.credits} קרדיטים</span>
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {packages.map((pkg, idx) => {
            const isPopular = pkg.id === 'topup-600';
            const perks = PACKAGE_PERKS[pkg.id] || [];
            const price = currency === 'ILS' ? `₪${pkg.priceILS}` : `$${pkg.priceUSD}`;

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative rounded-2xl p-6 border transition-all ${
                  isPopular
                    ? 'border-memorial-gold bg-memorial-gold/5 shadow-2xl shadow-memorial-gold/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-memorial-gold to-yellow-600 text-deep-space text-xs font-bold">
                    הכי משתלם
                  </div>
                )}

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-white">{pkg.credits}</span>
                  <span className="text-gray-400">קרדיטים</span>
                </div>
                <div className="text-3xl font-bold text-memorial-gold mb-6">{price}</div>

                <ul className="space-y-2 mb-8">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-memorial-gold mt-0.5 flex-shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasing !== null}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-gradient-to-r from-memorial-gold to-yellow-600 text-deep-space hover:shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing === pkg.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> מעבד...
                    </>
                  ) : (
                    <>
                      קנה עכשיו <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-4">
            רוצה להרבה יותר קרדיטים בחודש? שדרג למנוי קבוע.
          </p>
          <button
            onClick={() => navigate('/subscription')}
            className="text-memorial-gold hover:underline font-medium"
          >
            צפה בחבילות מנוי חודשיות ←
          </button>
        </div>
      </div>
    </div>
  );
}
