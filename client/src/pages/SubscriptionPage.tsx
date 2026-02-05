import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Check,
  Sparkles,
  Crown,
  Zap,
  Star,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  tier: string;
  price: number;
  priceILS: number;
  credits: number;
  features: string[];
}

export default function SubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscription/plans');
      if (response.data.success) {
        setPlans(response.data.data.plans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgrading(planId);

      // Step 1: Create payment order
      toast.loading('Creating payment order...', { id: 'payment' });

      const orderResponse = await api.post('/payments/create-order', {
        plan: planId,
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.error || 'Failed to create order');
      }

      const { orderId, mockMode } = orderResponse.data.data;

      // Show mock mode indicator
      if (mockMode) {
        toast.success('Mock payment order created', { id: 'payment' });
      } else {
        toast.success('Order created', { id: 'payment' });
      }

      // Step 2: Capture payment (simulate processing delay)
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.loading('Processing payment...', { id: 'payment' });

      const captureResponse = await api.post('/payments/capture-order', {
        orderId,
      });

      if (!captureResponse.data.success) {
        throw new Error(captureResponse.data.error || 'Failed to capture payment');
      }

      // Success! Play ka-ching sound (if available)
      if (mockMode) {
        toast.success('🎉 Payment successful (Mock Mode)!', { id: 'payment', duration: 3000 });
      } else {
        toast.success('🎉 Payment successful!', { id: 'payment', duration: 3000 });
      }

      // Refresh user data
      await refreshUser();

      // Navigate to success page
      setTimeout(() => {
        navigate('/success', {
          state: {
            plan: planId,
            mockMode
          }
        });
      }, 1500);

    } catch (error: any) {
      console.error('Failed to upgrade:', error);
      toast.error(error.response?.data?.error || 'Payment failed. Please try again.', { id: 'payment' });
    } finally {
      setUpgrading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Sparkles className="w-8 h-8" />;
      case 'standard':
        return <Zap className="w-8 h-8" />;
      case 'premium':
        return <Crown className="w-8 h-8" />;
      default:
        return <Star className="w-8 h-8" />;
    }
  };

  const isPremiumPlan = (planId: string) => planId === 'premium';
  const isCurrentPlan = (tier: string) => user?.role === tier;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Choose Your Writing Journey
          </h1>
          <p className="text-xl text-gray-300">
            Unlock powerful AI tools to bring your stories to life
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const premium = isPremiumPlan(plan.id);
            const current = isCurrentPlan(plan.tier);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${
                  premium ? 'md:-mt-4 md:mb-4' : ''
                }`}
              >
                {/* Best Value Badge for Premium */}
                {premium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full text-sm font-bold text-gray-900 shadow-lg">
                      <Star className="w-4 h-4 inline mr-1" />
                      Best Value
                    </div>
                  </div>
                )}

                <div
                  className={`glass-strong rounded-2xl p-8 h-full flex flex-col transition-all duration-300 ${
                    premium
                      ? 'border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20'
                      : 'border border-white/10'
                  } ${
                    current ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {/* Plan Icon */}
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${
                      premium
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900 shadow-lg shadow-yellow-500/30'
                        : plan.id === 'standard'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {getPlanIcon(plan.id)}
                  </div>

                  {/* Plan Name */}
                  <h3
                    className={`text-2xl font-bold mb-2 capitalize ${
                      premium ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent' : 'text-white'
                    }`}
                  >
                    {plan.id}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div className="text-4xl font-bold text-white">Free</div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold ${premium ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent' : 'text-white'}`}>
                          ${plan.price}
                        </span>
                        <span className="text-gray-400">/month</span>
                      </div>
                    )}
                    {plan.price > 0 && (
                      <div className="text-sm text-gray-400 mt-1">
                        ₪{plan.priceILS}/month
                      </div>
                    )}
                  </div>

                  {/* Credits */}
                  <div className="mb-6">
                    <div className={`text-sm font-semibold ${premium ? 'text-yellow-400' : 'text-indigo-400'}`}>
                      {plan.credits === -1 ? 'Unlimited Credits' : `${plan.credits} Credits/Month`}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            premium ? 'text-yellow-400' : 'text-green-400'
                          }`}
                        />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {current ? (
                    <button
                      disabled
                      className="w-full py-4 bg-gray-700 text-gray-400 rounded-xl font-semibold cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : plan.id === 'free' ? (
                    <button
                      onClick={() => handleUpgrade('free')}
                      disabled={upgrading === 'free'}
                      className="w-full py-4 btn-secondary font-semibold text-base"
                    >
                      {upgrading === 'free' ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        'Downgrade to Free'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgrading === plan.id}
                      className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                        premium
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 hover:from-yellow-500 hover:to-yellow-700 shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40'
                          : 'btn-primary'
                      }`}
                    >
                      {upgrading === plan.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Upgrade Now
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">
            All plans include access to the marketplace and basic writing tools
          </p>
          <p className="text-sm text-gray-500">
            Cancel anytime • No long-term commitments • Secure payment
          </p>
        </motion.div>
      </div>
    </div>
  );
}
