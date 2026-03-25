/**
 * Webhook Routes
 * Handles incoming webhooks from external services (PayPal, etc.)
 *
 * IMPORTANT: Webhook routes should NOT use authentication middleware
 * as they are called by external services, not authenticated users.
 * Instead, we verify webhook signatures from the service provider.
 */

import { Router } from 'express';
import { handlePayPalWebhook } from '../controllers/webhookController';

const router = Router();

/**
 * PayPal Webhook
 * POST /api/webhooks/paypal
 *
 * Receives webhook events from PayPal for payment status updates.
 * Webhook signature is verified inside the controller.
 *
 * Required env vars:
 * - PAYPAL_WEBHOOK_ID: Your PayPal webhook ID for signature verification
 * - PAYPAL_CLIENT_ID: PayPal client ID for API authentication
 * - PAYPAL_CLIENT_SECRET: PayPal client secret for API authentication
 *
 * Handled events:
 * - PAYMENT.CAPTURE.COMPLETED: Payment successfully captured
 * - PAYMENT.CAPTURE.DENIED: Payment capture denied
 * - PAYMENT.CAPTURE.REFUNDED: Payment refunded
 * - CHECKOUT.ORDER.APPROVED: Order approved by buyer (before capture)
 */
router.post('/paypal', handlePayPalWebhook as any);

export default router;
