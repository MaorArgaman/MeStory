/**
 * Invoice Controller
 * Handles invoice generation, listing, and emailing
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import {
  generateInvoiceForTransaction,
  getUserInvoices,
  getInvoiceData,
  generateInvoicePDF,
} from '../services/invoiceService';
import { sendEmail } from '../services/emailService';

/**
 * Get list of user's invoices
 * GET /api/invoices
 */
export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const invoices = await getUserInvoices(req.user.id);

    // Transform to response format
    const invoiceList = invoices.map(({ transaction, invoiceNumber }) => ({
      id: transaction.id,
      invoiceNumber,
      date: transaction.created_at,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      status: transaction.status,
      type: (transaction.metadata as any)?.type === 'book_purchase' ? 'book_purchase' : 'subscription',
      plan: transaction.plan,
    }));

    res.status(200).json({
      success: true,
      data: invoiceList,
    });
  } catch (error: any) {
    console.error('Error getting invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get invoices',
    });
  }
};

/**
 * Download invoice PDF
 * GET /api/invoices/:transactionId
 */
export const downloadInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { transactionId } = req.params;
    const language = (req.query.language as 'en' | 'he') || undefined;

    // Get transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    // Verify ownership
    if (transaction.userId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Check if transaction is completed
    if (transaction.status !== 'completed') {
      res.status(400).json({
        success: false,
        error: 'Invoice only available for completed transactions',
      });
      return;
    }

    // Generate invoice
    const { invoiceNumber, pdfBuffer } = await generateInvoiceForTransaction(
      transactionId,
      language
    );

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${invoiceNumber}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download invoice',
    });
  }
};

/**
 * Email invoice to user
 * POST /api/invoices/:transactionId/send
 */
export const sendInvoiceEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { transactionId } = req.params;
    const { email: customEmail, language } = req.body;

    // Get transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    // Verify ownership
    if (transaction.userId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Check if transaction is completed
    if (transaction.status !== 'completed') {
      res.status(400).json({
        success: false,
        error: 'Invoice only available for completed transactions',
      });
      return;
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Determine language
    const invoiceLanguage = language || user.profile?.language || 'en';

    // Generate invoice
    const invoiceData = await getInvoiceData(transaction, invoiceLanguage);
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Prepare email
    const recipientEmail = customEmail || user.email;
    const isHebrew = invoiceLanguage === 'he';

    const emailSubject = isHebrew
      ? `חשבונית ${invoiceData.invoiceNumber} - MeStory`
      : `Invoice ${invoiceData.invoiceNumber} - MeStory`;

    const emailHtml = generateInvoiceEmailTemplate(invoiceData, isHebrew, user.name);

    // Send email with PDF attachment
    // Note: We'll send the email without attachment for now
    // Full attachment support would require updating the email service
    const emailSent = await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailSent) {
      res.status(200).json({
        success: true,
        message: `Invoice sent to ${recipientEmail}`,
        data: {
          invoiceNumber: invoiceData.invoiceNumber,
          sentTo: recipientEmail,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send invoice email',
      });
    }
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send invoice email',
    });
  }
};

/**
 * Generate email template for invoice
 */
function generateInvoiceEmailTemplate(
  invoiceData: any,
  isHebrew: boolean,
  userName: string
): string {
  const dir = isHebrew ? 'rtl' : 'ltr';
  const lang = isHebrew ? 'he' : 'en';

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'ILS') {
      return `${amount.toFixed(2)} ${isHebrew ? 'ש"ח' : 'ILS'}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const texts = {
    title: isHebrew ? 'חשבונית מ-MeStory' : 'Invoice from MeStory',
    greeting: isHebrew ? `שלום ${userName},` : `Hello ${userName},`,
    intro: isHebrew
      ? 'מצורפת החשבונית עבור הרכישה שלך.'
      : 'Please find your invoice attached for your recent purchase.',
    invoiceNumber: isHebrew ? 'מספר חשבונית' : 'Invoice Number',
    date: isHebrew ? 'תאריך' : 'Date',
    item: isHebrew ? 'פריט' : 'Item',
    total: isHebrew ? 'סה"כ' : 'Total',
    downloadLink: isHebrew ? 'להורדת החשבונית לחץ כאן' : 'Click here to download your invoice',
    questions: isHebrew
      ? 'יש לך שאלות? צרו איתנו קשר בכתובת'
      : 'Questions? Contact us at',
    thanks: isHebrew ? 'תודה על הרכישה!' : 'Thank you for your purchase!',
    team: isHebrew ? 'צוות MeStory' : 'The MeStory Team',
  };

  return `
<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${texts.title}</title>
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
      font-size: 24px;
      margin-bottom: 20px;
      text-align: center;
    }
    .invoice-details {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      border-${isHebrew ? 'right' : 'left'}: 4px solid #FFD700;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #a0a0a0;
    }
    .detail-value {
      color: #FFD700;
      font-weight: bold;
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
      <h1>${texts.title}</h1>
      <div class="content">
        <p>${texts.greeting}</p>
        <p>${texts.intro}</p>

        <div class="invoice-details">
          <div class="detail-row">
            <span class="detail-label">${texts.invoiceNumber}</span>
            <span class="detail-value">${invoiceData.invoiceNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${texts.date}</span>
            <span class="detail-value">${invoiceData.date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${texts.item}</span>
            <span class="detail-value">${invoiceData.item.title}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${texts.total}</span>
            <span class="detail-value">${formatCurrency(invoiceData.amount.total, invoiceData.amount.currency)}</span>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/settings/payments" class="button">
            ${texts.downloadLink}
          </a>
        </div>

        <p style="margin-top: 30px;">${texts.thanks}</p>
        <p><strong>${texts.team}</strong></p>
      </div>
      <div class="footer">
        <p>${texts.questions} billing@mestory.com</p>
        <p style="margin-top: 20px; font-size: 12px;">
          &copy; ${new Date().getFullYear()} MeStory. ${isHebrew ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Admin: Get all invoices (with pagination)
 * GET /api/invoices/admin/all
 */
export const getAllInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Check admin role
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get all completed transactions
    const transactions = await Transaction.find({ status: 'completed' });

    // Get user data for each transaction
    const invoicesWithUsers = await Promise.all(
      transactions.map(async (transaction) => {
        const user = await User.findById(transaction.userId);
        return {
          id: transaction.id,
          invoiceNumber: (transaction.metadata as any)?.invoiceNumber || null,
          date: transaction.created_at,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
          status: transaction.status,
          type: (transaction.metadata as any)?.type === 'book_purchase' ? 'book_purchase' : 'subscription',
          plan: transaction.plan,
          user: user ? { id: user.id, name: user.name, email: user.email } : null,
        };
      })
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedInvoices = invoicesWithUsers.slice(startIndex, startIndex + limit);

    res.status(200).json({
      success: true,
      data: paginatedInvoices,
      pagination: {
        page,
        limit,
        total: invoicesWithUsers.length,
        totalPages: Math.ceil(invoicesWithUsers.length / limit),
      },
    });
  } catch (error: any) {
    console.error('Error getting all invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get invoices',
    });
  }
};
