/**
 * PaymentReturnPage — Handles return from PayPal approval flow.
 * Mounted at /payment/success and /payment/cancel.
 * On success: captures the order using sessionStorage context, then navigates to /success.
 * On cancel: clears state and returns user to /subscription.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface PendingPayment {
  orderId: string;
  plan: string;
  createdAt: number;
}

interface Props {
  variant: 'success' | 'cancel';
}

export default function PaymentReturnPage({ variant }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const pendingRaw = sessionStorage.getItem('pendingPayment');
    const pending: PendingPayment | null = pendingRaw ? JSON.parse(pendingRaw) : null;

    if (variant === 'cancel') {
      sessionStorage.removeItem('pendingPayment');
      toast('התשלום בוטל', { icon: 'ℹ️' });
      navigate('/subscription', { replace: true });
      return;
    }

    // PayPal returns ?token={orderId}&PayerID={...}
    const orderIdFromQuery = searchParams.get('token');
    const orderId = orderIdFromQuery || pending?.orderId;
    const plan = pending?.plan || 'standard';

    if (!orderId) {
      setError('לא נמצאה הזמנה לאישור. נסה שוב מהדף הראשי.');
      return;
    }

    (async () => {
      try {
        const response = await paymentApi.captureSubscriptionOrder(orderId);
        if (!response.success) {
          throw new Error(response.error || 'Capture failed');
        }
        sessionStorage.removeItem('pendingPayment');
        await refreshUser();
        navigate('/success', { replace: true, state: { plan, mockMode: false } });
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.message || 'שגיאה באישור התשלום';
        setError(msg);
        toast.error(msg);
      }
    })();
  }, [variant, navigate, searchParams, refreshUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-strong rounded-2xl p-8 text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">התשלום נכשל</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/subscription')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-memorial-gold to-yellow-600 text-deep-space font-bold"
          >
            חזרה לדף החבילות
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" dir="rtl">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-memorial-gold animate-spin mx-auto mb-4" />
        <p className="text-gray-300">מאשר את התשלום...</p>
      </div>
    </div>
  );
}
