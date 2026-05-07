/**
 * Subscription Renewal Service
 * Handles automatic subscription renewals, credit replenishment, and expiry notifications
 */

import { supabaseAdmin } from '../config/supabase';
import { User, IUser, UserRole, ISubscription } from '../models/User';
import { Transaction } from '../models/Transaction';
import { createNotification, notifySubscriptionChange, notifySystem } from './notificationService';
import { sendEmail } from './emailService';
import { PLANS as PLAN_CONFIG } from '../config/plans';

// Plan adapter - delegates to server/src/config/plans.ts. Do not duplicate
// pricing/credit values here.
const PLANS = {
  free: {
    tier: PLAN_CONFIG.free.tier,
    price: PLAN_CONFIG.free.priceUSD,
    priceILS: PLAN_CONFIG.free.priceILS,
    credits: PLAN_CONFIG.free.monthlyCredits,
  },
  standard: {
    tier: PLAN_CONFIG.standard.tier,
    price: PLAN_CONFIG.standard.priceUSD,
    priceILS: PLAN_CONFIG.standard.priceILS,
    credits: PLAN_CONFIG.standard.monthlyCredits,
  },
  premium: {
    tier: PLAN_CONFIG.premium.tier,
    price: PLAN_CONFIG.premium.priceUSD,
    priceILS: PLAN_CONFIG.premium.priceILS,
    credits: PLAN_CONFIG.premium.monthlyCredits,
  },
};

// Helper to get plan key from tier
function getPlanKeyFromTier(tier: string): 'free' | 'standard' | 'premium' {
  switch (tier) {
    case UserRole.PREMIUM:
      return 'premium';
    case UserRole.STANDARD:
      return 'standard';
    default:
      return 'free';
  }
}

// ==================== SUBSCRIPTION EXPIRY CHECK ====================

interface ExpiringSubscription {
  user: IUser;
  daysUntilExpiry: number;
}

/**
 * Get users with subscriptions expiring in the specified number of days
 */
export async function getExpiringSubscriptions(daysAhead: number): Promise<ExpiringSubscription[]> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Get all users with active subscriptions
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .not('subscription', 'is', null);

  if (error) {
    console.error('Error fetching users for expiry check:', error);
    return [];
  }

  const expiringUsers: ExpiringSubscription[] = [];

  for (const userData of users || []) {
    const subscription = userData.subscription as ISubscription | null;
    if (!subscription || !subscription.isActive || !subscription.endDate) {
      continue;
    }

    const endDate = new Date(subscription.endDate);
    endDate.setHours(0, 0, 0, 0);

    // Check if expiring on the target date
    if (endDate >= targetDate && endDate < nextDay) {
      const user: IUser = {
        id: userData.id,
        _id: userData.id,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role as UserRole,
        credits: userData.credits,
        subscription: subscription,
        profile: userData.profile,
        paypal: userData.paypal,
        emailVerification: userData.email_verification || { isVerified: false },
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };

      expiringUsers.push({
        user,
        daysUntilExpiry: daysAhead,
      });
    }
  }

  return expiringUsers;
}

/**
 * Get users with subscriptions that expire today
 */
export async function getExpiredSubscriptions(): Promise<IUser[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get all users with active subscriptions
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .not('subscription', 'is', null);

  if (error) {
    console.error('Error fetching users for expired check:', error);
    return [];
  }

  const expiredUsers: IUser[] = [];

  for (const userData of users || []) {
    const subscription = userData.subscription as ISubscription | null;
    if (!subscription || !subscription.isActive || !subscription.endDate) {
      continue;
    }

    const endDate = new Date(subscription.endDate);
    endDate.setHours(0, 0, 0, 0);

    // Check if expired (end date is today or before)
    if (endDate <= today) {
      expiredUsers.push({
        id: userData.id,
        _id: userData.id,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role as UserRole,
        credits: userData.credits,
        subscription: subscription,
        profile: userData.profile,
        paypal: userData.paypal,
        emailVerification: userData.email_verification || { isVerified: false },
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      });
    }
  }

  return expiredUsers;
}

// ==================== EXPIRY WARNING NOTIFICATIONS ====================

/**
 * Send expiry warning notifications (7 days and 1 day before)
 */
export async function sendExpiryWarningNotifications(daysAhead: 7 | 1): Promise<number> {
  const expiringSubscriptions = await getExpiringSubscriptions(daysAhead);
  let notificationsSent = 0;

  for (const { user, daysUntilExpiry } of expiringSubscriptions) {
    try {
      const planKey = getPlanKeyFromTier(user.role);
      const planName = planKey.charAt(0).toUpperCase() + planKey.slice(1);
      const autoRenew = user.subscription?.autoRenew ?? false;

      // Create in-app notification
      const title = daysUntilExpiry === 1
        ? `המנוי שלך יפוג מחר!`
        : `המנוי שלך יפוג בעוד ${daysUntilExpiry} ימים`;

      const message = autoRenew
        ? `מנוי ${planName} שלך יחודש אוטומטית ב-${new Date(user.subscription!.endDate!).toLocaleDateString('he-IL')}. ודא שאמצעי התשלום שלך מעודכן.`
        : `מנוי ${planName} שלך יסתיים ב-${new Date(user.subscription!.endDate!).toLocaleDateString('he-IL')}. הפעל חידוש אוטומטי כדי להמשיך ליהנות מהיתרונות.`;

      await createNotification({
        recipientId: user.id,
        type: 'subscription',
        title,
        message,
        data: {
          subscriptionPlan: planName,
          expiryDate: user.subscription!.endDate,
          autoRenew,
          link: '/subscription',
        },
      });

      // Send email notification
      await sendSubscriptionExpiryEmail(user, daysUntilExpiry, autoRenew);

      notificationsSent++;
      console.log(`[SubscriptionRenewal] Sent ${daysUntilExpiry}-day warning to ${user.email}`);
    } catch (error) {
      console.error(`[SubscriptionRenewal] Failed to send warning to ${user.email}:`, error);
    }
  }

  return notificationsSent;
}

/**
 * Send subscription expiry warning email
 */
async function sendSubscriptionExpiryEmail(
  user: IUser,
  daysUntilExpiry: number,
  autoRenew: boolean
): Promise<boolean> {
  const planKey = getPlanKeyFromTier(user.role);
  const planName = planKey.charAt(0).toUpperCase() + planKey.slice(1);
  const expiryDate = new Date(user.subscription!.endDate!).toLocaleDateString('he-IL');

  const subject = daysUntilExpiry === 1
    ? `תזכורת: מנוי ${planName} שלך יפוג מחר`
    : `תזכורת: מנוי ${planName} שלך יפוג בעוד ${daysUntilExpiry} ימים`;

  const content = `
    <h1>תזכורת על מנוי</h1>
    <div class="content">
      <p>שלום <span class="highlight">${user.name}</span>,</p>
      <p>רצינו להזכיר לך שמנוי ${planName} שלך ב-MeStory יפוג ב-<strong>${expiryDate}</strong>.</p>

      ${autoRenew ? `
        <div class="info-box">
          <p><strong>חידוש אוטומטי מופעל</strong></p>
          <p>המנוי שלך יחודש אוטומטית. ודא שאמצעי התשלום שלך מעודכן.</p>
        </div>
      ` : `
        <div class="info-box">
          <p><strong>חידוש אוטומטי כבוי</strong></p>
          <p>כדי להמשיך ליהנות מכל היתרונות של מנוי ${planName}, הפעל חידוש אוטומטי או חדש ידנית.</p>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/subscription" class="button">
            חדש את המנוי
          </a>
        </div>
      `}

      <p>תודה שאתה חלק ממשפחת MeStory!</p>
      <p><strong>צוות MeStory</strong></p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject,
    html: getBaseEmailTemplate(content, subject),
  });
}

// ==================== SUBSCRIPTION RENEWAL ====================

interface RenewalResult {
  success: boolean;
  userId: string;
  action: 'renewed' | 'downgraded' | 'failed';
  error?: string;
}

/**
 * Process subscription renewals for expired subscriptions
 */
export async function processSubscriptionRenewals(): Promise<RenewalResult[]> {
  const expiredSubscriptions = await getExpiredSubscriptions();
  const results: RenewalResult[] = [];

  for (const user of expiredSubscriptions) {
    try {
      const result = await processUserRenewal(user);
      results.push(result);
    } catch (error: any) {
      console.error(`[SubscriptionRenewal] Failed to process renewal for ${user.email}:`, error);
      results.push({
        success: false,
        userId: user.id,
        action: 'failed',
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Process renewal for a single user
 */
async function processUserRenewal(user: IUser): Promise<RenewalResult> {
  const subscription = user.subscription;

  if (!subscription) {
    return {
      success: false,
      userId: user.id,
      action: 'failed',
      error: 'No subscription found',
    };
  }

  // Check if auto-renew is enabled
  if (!subscription.autoRenew) {
    // Downgrade to free
    await downgradeToFree(user);
    return {
      success: true,
      userId: user.id,
      action: 'downgraded',
    };
  }

  // Attempt to charge saved payment method
  const chargeResult = await chargeSubscription(user);

  if (chargeResult.success) {
    // Renew subscription
    await renewSubscription(user);

    // Send success notification
    await notifyRenewalSuccess(user);

    return {
      success: true,
      userId: user.id,
      action: 'renewed',
    };
  } else {
    // Payment failed - downgrade to free
    await downgradeToFree(user);

    // Send failure notification
    await notifyRenewalFailure(user, chargeResult.error || 'Payment failed');

    return {
      success: false,
      userId: user.id,
      action: 'downgraded',
      error: chargeResult.error,
    };
  }
}

/**
 * Charge subscription using saved payment method
 * Note: In production, this would integrate with PayPal billing agreements or saved cards
 */
async function chargeSubscription(user: IUser): Promise<{ success: boolean; error?: string; transactionId?: string }> {
  const planKey = getPlanKeyFromTier(user.role);
  const plan = PLANS[planKey];

  // Skip payment for free plan
  if (planKey === 'free' || plan.price === 0) {
    return { success: true };
  }

  // Check if user has PayPal connected (for billing)
  if (!user.paypal?.email) {
    return {
      success: false,
      error: 'No payment method on file. Please update your payment information.'
    };
  }

  // In development/mock mode, simulate successful payment
  if (process.env.NODE_ENV === 'development' || !process.env.PAYPAL_CLIENT_ID) {
    console.log(`[MOCK] Charging ${user.email} $${plan.price} for ${planKey} plan renewal`);

    // Create mock transaction
    const transaction = await Transaction.create({
      userId: user.id,
      amount: plan.price,
      currency: 'USD',
      plan: planKey,
      status: 'completed',
      paymentMethod: 'mock',
      orderId: `RENEWAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: `Auto-renewal: ${planKey} plan`,
      metadata: {
        type: 'subscription_renewal',
        autoRenew: true,
      },
    });

    return { success: true, transactionId: transaction.id };
  }

  // Production: Would use PayPal billing agreement or saved payment method
  // For now, return failure as billing agreements aren't set up
  // TODO: Implement PayPal billing agreements for recurring payments
  return {
    success: false,
    error: 'Automatic billing not configured. Please renew manually.',
  };
}

/**
 * Renew user subscription for another month
 */
async function renewSubscription(user: IUser): Promise<void> {
  const planKey = getPlanKeyFromTier(user.role);
  const plan = PLANS[planKey];

  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const newSubscription: ISubscription = {
    tier: user.role,
    price: plan.price,
    credits: plan.credits,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    isActive: true,
    autoRenew: true,
  };

  // Replenish credits (unless premium with unlimited)
  const newCredits = plan.credits === -1 ? 999999 : plan.credits;

  await User.findByIdAndUpdate(user.id, {
    subscription: newSubscription,
    credits: newCredits,
  });

  console.log(`[SubscriptionRenewal] Renewed subscription for ${user.email} - ${planKey} plan`);
}

/**
 * Downgrade user to free plan
 */
async function downgradeToFree(user: IUser): Promise<void> {
  const freePlan = PLANS.free;
  const now = new Date();

  const freeSubscription: ISubscription = {
    tier: UserRole.FREE,
    price: 0,
    credits: freePlan.credits,
    startDate: now.toISOString(),
    endDate: null,
    isActive: true,
    autoRenew: false,
  };

  await User.findByIdAndUpdate(user.id, {
    role: UserRole.FREE,
    subscription: freeSubscription,
    credits: freePlan.credits,
  });

  // Send downgrade notification
  await notifySubscriptionChange(user.id, 'Free', false);

  console.log(`[SubscriptionRenewal] Downgraded ${user.email} to free plan`);
}

/**
 * Send renewal success notification
 */
async function notifyRenewalSuccess(user: IUser): Promise<void> {
  const planKey = getPlanKeyFromTier(user.role);
  const planName = planKey.charAt(0).toUpperCase() + planKey.slice(1);

  await createNotification({
    recipientId: user.id,
    type: 'subscription',
    title: `המנוי שלך חודש בהצלחה!`,
    message: `מנוי ${planName} שלך חודש אוטומטית. תודה שאתה ממשיך איתנו!`,
    data: {
      subscriptionPlan: planName,
      link: '/subscription',
    },
  });

  // Send email
  await sendEmail({
    to: user.email,
    subject: `המנוי שלך ל-MeStory חודש בהצלחה`,
    html: getBaseEmailTemplate(`
      <div class="success-icon">✅</div>
      <h1>המנוי חודש בהצלחה!</h1>
      <div class="content">
        <p>שלום <span class="highlight">${user.name}</span>,</p>
        <p>מנוי ${planName} שלך חודש אוטומטית ותקף לחודש נוסף.</p>
        <p>תודה שאתה ממשיך להיות חלק ממשפחת MeStory!</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="button">
            המשך ליצור
          </a>
        </div>
      </div>
    `, 'המנוי חודש בהצלחה'),
  });
}

/**
 * Send renewal failure notification
 */
async function notifyRenewalFailure(user: IUser, reason: string): Promise<void> {
  const planKey = getPlanKeyFromTier(user.role);
  const planName = planKey.charAt(0).toUpperCase() + planKey.slice(1);

  await createNotification({
    recipientId: user.id,
    type: 'subscription',
    title: `לא הצלחנו לחדש את המנוי`,
    message: `חידוש מנוי ${planName} נכשל: ${reason}. החשבון שלך הורד לחבילת Free.`,
    data: {
      subscriptionPlan: 'Free',
      previousPlan: planName,
      link: '/subscription',
    },
  });

  // Send email
  await sendEmail({
    to: user.email,
    subject: `בעיה בחידוש מנוי MeStory`,
    html: getBaseEmailTemplate(`
      <h1>בעיה בחידוש המנוי</h1>
      <div class="content">
        <p>שלום <span class="highlight">${user.name}</span>,</p>
        <p>לא הצלחנו לחדש את מנוי ${planName} שלך.</p>
        <div class="info-box">
          <p><strong>סיבה:</strong> ${reason}</p>
        </div>
        <p>החשבון שלך הועבר לחבילת Free. כדי להמשיך ליהנות מכל היתרונות, אנא עדכן את אמצעי התשלום וחדש את המנוי.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/subscription" class="button">
            עדכן תשלום וחדש
          </a>
        </div>
      </div>
    `, 'בעיה בחידוש מנוי'),
  });
}

// ==================== CREDIT REPLENISHMENT ====================

/**
 * Get users due for credit replenishment (FREE tier monthly reset)
 */
export async function getUsersDueForCreditReset(): Promise<IUser[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all FREE tier users
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', UserRole.FREE);

  if (error) {
    console.error('Error fetching free users for credit reset:', error);
    return [];
  }

  const usersForReset: IUser[] = [];

  for (const userData of users || []) {
    const subscription = userData.subscription as ISubscription | null;

    // If no subscription or no start date, consider for reset
    if (!subscription?.startDate) {
      continue;
    }

    const startDate = new Date(subscription.startDate);
    const dayOfMonth = startDate.getDate();

    // Check if today is the monthly reset day
    if (today.getDate() === dayOfMonth) {
      usersForReset.push({
        id: userData.id,
        _id: userData.id,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role as UserRole,
        credits: userData.credits,
        subscription: subscription,
        profile: userData.profile,
        paypal: userData.paypal,
        emailVerification: userData.email_verification || { isVerified: false },
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      });
    }
  }

  return usersForReset;
}

/**
 * Replenish monthly credits for FREE tier users
 */
export async function replenishFreeCredits(): Promise<number> {
  const usersForReset = await getUsersDueForCreditReset();
  const freeCredits = PLANS.free.credits;
  let usersUpdated = 0;

  for (const user of usersForReset) {
    try {
      await User.findByIdAndUpdate(user.id, {
        credits: freeCredits,
      });

      // Send notification
      await notifySystem(
        user.id,
        'קרדיטים חודשיים חודשו!',
        `${freeCredits} קרדיטים נוספו לחשבון שלך לחודש הקרוב.`,
        '/dashboard'
      );

      usersUpdated++;
      console.log(`[SubscriptionRenewal] Reset credits for FREE user: ${user.email}`);
    } catch (error) {
      console.error(`[SubscriptionRenewal] Failed to reset credits for ${user.email}:`, error);
    }
  }

  return usersUpdated;
}

/**
 * Replenish credits on subscription renewal date (for Standard/Premium)
 */
export async function replenishSubscriptionCredits(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all STANDARD and PREMIUM users with active subscriptions
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .in('role', [UserRole.STANDARD, UserRole.PREMIUM])
    .not('subscription', 'is', null);

  if (error) {
    console.error('Error fetching users for credit replenishment:', error);
    return 0;
  }

  let usersUpdated = 0;

  for (const userData of users || []) {
    const subscription = userData.subscription as ISubscription | null;

    if (!subscription?.isActive || !subscription.startDate) {
      continue;
    }

    const startDate = new Date(subscription.startDate);
    const dayOfMonth = startDate.getDate();

    // Check if today is the monthly renewal day
    if (today.getDate() !== dayOfMonth) {
      continue;
    }

    try {
      const planKey = getPlanKeyFromTier(userData.role);
      const plan = PLANS[planKey];
      const newCredits = plan.credits === -1 ? 999999 : plan.credits;

      await User.findByIdAndUpdate(userData.id, {
        credits: newCredits,
      });

      // Send notification
      const creditText = plan.credits === -1 ? 'ללא הגבלה' : `${plan.credits}`;
      await notifySystem(
        userData.id,
        'קרדיטים חודשיים חודשו!',
        `${creditText} קרדיטים זמינים עבורך לחודש זה.`,
        '/dashboard'
      );

      usersUpdated++;
      console.log(`[SubscriptionRenewal] Replenished credits for ${userData.email}: ${newCredits}`);
    } catch (error) {
      console.error(`[SubscriptionRenewal] Failed to replenish credits for ${userData.email}:`, error);
    }
  }

  return usersUpdated;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Base email template (matches emailService style)
 */
function getBaseEmailTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      border-radius: 20px;
      padding: 40px;
      border: 1px solid rgba(255,215,0,0.2);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo-text {
      font-size: 36px;
      font-weight: bold;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .content {
      color: #e0e0e0;
      font-size: 16px;
      line-height: 1.8;
    }
    h1 {
      color: #FFD700;
      font-size: 28px;
      margin-bottom: 20px;
      text-align: center;
    }
    .info-box {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      border-right: 4px solid #FFD700;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #1a1a2e;
      padding: 15px 40px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
    }
    .highlight {
      color: #FFD700;
      font-weight: bold;
    }
    .success-icon {
      font-size: 60px;
      text-align: center;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #808080;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">MeStory</span>
      </div>
      ${content}
      <div class="footer">
        <p>MeStory - הפלטפורמה ליצירת ספרים עם AI</p>
        <p style="margin-top: 20px; font-size: 12px;">
          &copy; ${new Date().getFullYear()} MeStory. כל הזכויות שמורות.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// ==================== EXPORTS ====================

export default {
  getExpiringSubscriptions,
  getExpiredSubscriptions,
  sendExpiryWarningNotifications,
  processSubscriptionRenewals,
  replenishFreeCredits,
  replenishSubscriptionCredits,
};
