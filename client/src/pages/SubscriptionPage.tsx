import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, paymentApi } from '../services/api';
import BookLoader from '../components/common/BookLoader';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
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
import { PaymentConfirmationModal } from '../components/payment';
import { getFriendlyErrorMessage } from '../utils/errorMessages';
import { SEO, Breadcrumb } from '../components/seo';

// Memorial platform subscription hero
const pricingHero = '/img/memorial-hero.png';

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
  const { currency, formatCurrency } = useCurrency();
  const { language } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const loadPlans = async () => {
      try {
        setLoading(true);
        const response = await api.get('/subscription/plans', {
          signal: abortController.signal,
        });
        if (response.data.success) {
          setPlans(response.data.data.plans);
        }
      } catch (error: unknown) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'ERR_CANCELED') {
          return;
        }
        console.error('Failed to load plans:', error);
        const friendlyMessage = getFriendlyErrorMessage(error, language as 'en' | 'he');
        toast.error(friendlyMessage);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPlans();

    return () => {
      abortController.abort();
    };
  }, [language]);

  // Open confirmation modal before payment
  const handleUpgradeClick = (plan: Plan) => {
    if (plan.id === 'free') {
      // Free plan doesn't need confirmation
      handleUpgrade(plan.id);
    } else {
      setSelectedPlan(plan);
      setShowConfirmModal(true);
    }
  };

  // Close confirmation modal
  const handleCloseModal = () => {
    if (!processingPayment) {
      setShowConfirmModal(false);
      setSelectedPlan(null);
    }
  };

  // Process the actual payment
  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    await handleUpgrade(selectedPlan.id);
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgrading(planId);
      setProcessingPayment(true);

      // Step 1: Create payment order with idempotency key
      toast.loading('Creating payment order...', { id: 'payment' });

      const orderResponse = await paymentApi.createSubscriptionOrder(planId);

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      const { orderId, mockMode } = orderResponse.data;

      // Show mock mode indicator
      if (mockMode) {
        toast.success('Mock payment order created', { id: 'payment' });
      } else {
        toast.success('Order created', { id: 'payment' });
      }

      // Step 2: Capture payment with idempotency key (simulate processing delay)
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.loading('Processing payment...', { id: 'payment' });

      const captureResponse = await paymentApi.captureSubscriptionOrder(orderId);

      if (!captureResponse.success) {
        throw new Error(captureResponse.error || 'Failed to capture payment');
      }

      // Success!
      if (mockMode) {
        toast.success('Payment successful (Mock Mode)!', { id: 'payment', duration: 3000 });
      } else {
        toast.success('Payment successful!', { id: 'payment', duration: 3000 });
      }

      // Close modal
      setShowConfirmModal(false);
      setSelectedPlan(null);

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

    } catch (error: unknown) {
      console.error('Failed to upgrade:', error);
      const friendlyMessage = getFriendlyErrorMessage(error, language as 'en' | 'he');
      toast.error(friendlyMessage, { id: 'payment' });
    } finally {
      setUpgrading(null);
      setProcessingPayment(false);
    }
  };

  // Tier images from public folder
  const tierImages: Record<string, string> = {
    free: '/img/tier-free.png',
    standard: '/img/tier-standard.png',
    premium: '/img/tier-premium.png',
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

  const getPlanImage = (planId: string) => tierImages[planId] || tierImages.free;

  const isPremiumPlan = (planId: string) => planId === 'premium';
  const isCurrentPlan = (tier: string) => user?.role === tier;

  if (loading) {
    return <BookLoader variant="fullscreen" message="טוען..." />;
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20">
        <Breadcrumb
          items={[
            { name: language === 'he' ? 'תמחור' : 'Pricing', url: '/pricing' },
          ]}
        />
      </div>

      <SEO
        title="Pricing & Plans | MeStory"
        description="Choose the perfect plan for your writing journey. Unlock AI-powered tools, unlimited credits, and premium features to bring your stories to life."
        type="website"
        locale={language === 'he' ? 'he_IL' : 'en_US'}
        url="/pricing"
      />

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPayment}
        isProcessing={processingPayment}
        type="subscription"
        planName={selectedPlan?.id}
        planPrice={selectedPlan?.price}
        planPriceILS={selectedPlan?.priceILS}
        planFeatures={selectedPlan?.features}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-8 sm:pt-24 sm:pb-12">
        <div className="absolute inset-0">
          <img src={pricingHero} alt="" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-space/60 via-deep-space/80 to-deep-space" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              Choose Your Writing Journey
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 px-4">
              Unlock powerful AI tools to bring your stories to life
            </p>
          </motion.div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const premium = isPremiumPlan(plan.id);
            const current = isCurrentPlan(plan.tier);
            const isUpgrading = upgrading === plan.id;

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
                  className={`glass-strong rounded-xl sm:rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 ${
                    premium
                      ? 'border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20'
                      : 'border border-white/10'
                  } ${
                    current ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {/* Plan Image */}
                  <div className="relative h-32 sm:h-40 overflow-hidden">
                    <img
                      src={getPlanImage(plan.id)}
                      alt={plan.id}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-transparent to-transparent" />
                    {/* Plan Icon Overlay */}
                    <div
                      className={`absolute bottom-3 left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                        premium
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900 shadow-lg shadow-yellow-500/30'
                          : plan.id === 'standard'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {getPlanIcon(plan.id)}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 flex-1 flex flex-col">

                  {/* Plan Name */}
                  <h3
                    className={`text-xl sm:text-2xl font-bold mb-2 capitalize ${
                      premium ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent' : 'text-white'
                    }`}
                  >
                    {plan.id}
                  </h3>

                  {/* Price */}
                  <div className="mb-4 sm:mb-6">
                    {plan.price === 0 ? (
                      <div className="text-3xl sm:text-4xl font-bold text-white">Free</div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className={`text-3xl sm:text-4xl font-bold ${premium ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent' : 'text-white'}`}>
                          {currency === 'ILS'
                            ? formatCurrency(plan.priceILS, 'ILS')
                            : formatCurrency(plan.price, 'USD')}
                        </span>
                        <span className="text-gray-400">/month</span>
                      </div>
                    )}
                    {plan.price > 0 && (
                      <div className="text-sm text-gray-400 mt-1">
                        {currency === 'ILS'
                          ? formatCurrency(plan.price, 'USD')
                          : formatCurrency(plan.priceILS, 'ILS')}/month
                      </div>
                    )}
                  </div>

                  {/* Credits */}
                  <div className="mb-4 sm:mb-6">
                    <div className={`text-xs sm:text-sm font-semibold ${premium ? 'text-yellow-400' : 'text-indigo-400'}`}>
                      {plan.credits === -1 ? 'Unlimited Credits' : `${plan.credits} Credits/Month`}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-2 sm:space-y-3 mb-6 sm:mb-8">
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
                      aria-disabled="true"
                      aria-label="Current Plan - already subscribed"
                      className="w-full py-3 sm:py-4 bg-gray-700 text-gray-400 rounded-lg sm:rounded-xl font-semibold cursor-not-allowed text-sm sm:text-base"
                    >
                      Current Plan
                    </button>
                  ) : plan.id === 'free' ? (
                    <button
                      onClick={() => handleUpgradeClick(plan)}
                      disabled={isUpgrading}
                      aria-disabled={isUpgrading}
                      aria-label={isUpgrading ? 'Downgrading to Free plan' : 'Downgrade to Free plan'}
                      className="w-full py-3 sm:py-4 btn-secondary font-semibold text-sm sm:text-base flex items-center justify-center"
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        'Downgrade to Free'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgradeClick(plan)}
                      disabled={isUpgrading}
                      aria-disabled={isUpgrading}
                      aria-label={isUpgrading ? `Upgrading to ${plan.tier} plan` : `Upgrade to ${plan.tier} plan`}
                      className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                        premium
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 hover:from-yellow-500 hover:to-yellow-700 shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40'
                          : 'btn-primary'
                      } ${isUpgrading ? 'opacity-80' : ''}`}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Upgrade Now
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  )}
                  </div>
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
            Cancel anytime - No long-term commitments - Secure payment
          </p>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
