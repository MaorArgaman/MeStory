/**
 * Invoice Service
 * Generates PDF invoices for transactions
 * Supports Hebrew (RTL) and English invoices
 */

import PDFDocument from 'pdfkit';
import { Transaction, ITransaction } from '../models/Transaction';
import { User, IUser } from '../models/User';
import { Book, IBook } from '../models/Book';
import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';

// Invoice number counter - stored in database
interface InvoiceCounterRow {
  id: string;
  year: number;
  counter: number;
  updated_at: string;
}

// Invoice data interface
export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  buyer: {
    name: string;
    email: string;
  };
  item: {
    type: 'subscription' | 'book_purchase';
    title: string;
    description: string;
  };
  amount: {
    subtotal: number;
    tax: number;
    taxRate: number;
    total: number;
    currency: string;
  };
  paymentMethod: string;
  transactionId: string;
  language: 'en' | 'he';
}

// Company details
const COMPANY_DETAILS = {
  name: 'MeStory Ltd.',
  nameHe: 'מיסטורי בע"מ',
  address: '123 Innovation Street, Tel Aviv, Israel',
  addressHe: 'רחוב החדשנות 123, תל אביב, ישראל',
  phone: '+972-3-123-4567',
  email: 'billing@mestory.com',
  website: 'www.mestory.com',
  taxId: '123456789',
};

// Text translations
const TRANSLATIONS = {
  en: {
    invoice: 'INVOICE',
    invoiceNumber: 'Invoice Number',
    date: 'Date',
    billTo: 'Bill To',
    from: 'From',
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit Price',
    amount: 'Amount',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    paymentMethod: 'Payment Method',
    transactionId: 'Transaction ID',
    thankYou: 'Thank you for your purchase!',
    questions: 'Questions? Contact us at',
    taxId: 'Tax ID',
    page: 'Page',
    paypal: 'PayPal',
    creditCard: 'Credit Card',
    subscriptionUpgrade: 'Subscription Upgrade',
    bookPurchase: 'Book Purchase',
    standardPlan: 'Standard Plan - Monthly Subscription',
    premiumPlan: 'Premium Plan - Monthly Subscription',
  },
  he: {
    invoice: 'חשבונית',
    invoiceNumber: 'מספר חשבונית',
    date: 'תאריך',
    billTo: 'לכבוד',
    from: 'מאת',
    description: 'תיאור',
    quantity: 'כמות',
    unitPrice: 'מחיר ליחידה',
    amount: 'סכום',
    subtotal: 'סכום ביניים',
    tax: 'מע"מ',
    total: 'סה"כ',
    paymentMethod: 'אמצעי תשלום',
    transactionId: 'מספר עסקה',
    thankYou: 'תודה על הרכישה!',
    questions: 'שאלות? צרו קשר',
    taxId: 'מספר עוסק',
    page: 'עמוד',
    paypal: 'PayPal',
    creditCard: 'כרטיס אשראי',
    subscriptionUpgrade: 'שדרוג מנוי',
    bookPurchase: 'רכישת ספר',
    standardPlan: 'חבילת סטנדרט - מנוי חודשי',
    premiumPlan: 'חבילת פרימיום - מנוי חודשי',
  },
};

/**
 * Generate next invoice number
 * Format: INV-{year}-{sequential}
 */
export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Try to get existing counter for current year
  const { data: existing } = await supabaseAdmin
    .from('invoice_counters')
    .select('*')
    .eq('year', currentYear)
    .single();

  let nextNumber: number;

  if (existing) {
    // Increment existing counter
    nextNumber = (existing as InvoiceCounterRow).counter + 1;
    await supabaseAdmin
      .from('invoice_counters')
      .update({ counter: nextNumber, updated_at: new Date().toISOString() })
      .eq('year', currentYear);
  } else {
    // Create new counter for this year
    nextNumber = 1;
    await supabaseAdmin.from('invoice_counters').insert({
      id: crypto.randomUUID(),
      year: currentYear,
      counter: nextNumber,
      updated_at: new Date().toISOString(),
    });
  }

  // Format: INV-2024-00001
  const paddedNumber = String(nextNumber).padStart(5, '0');
  return `INV-${currentYear}-${paddedNumber}`;
}

/**
 * Get invoice data from transaction
 */
export async function getInvoiceData(
  transaction: ITransaction,
  language: 'en' | 'he' = 'en'
): Promise<InvoiceData> {
  const user = await User.findById(transaction.userId);
  if (!user) {
    throw new Error('User not found for transaction');
  }

  const metadata = transaction.metadata as any;
  const t = TRANSLATIONS[language];

  // Determine item details
  let itemType: 'subscription' | 'book_purchase' = 'subscription';
  let itemTitle = '';
  let itemDescription = '';

  if (metadata?.type === 'book_purchase') {
    itemType = 'book_purchase';
    const book = await Book.findById(metadata.bookId);
    itemTitle = book?.title || metadata.bookTitle || 'Book';
    itemDescription = t.bookPurchase;
  } else {
    // Subscription
    itemType = 'subscription';
    if (transaction.plan === 'premium') {
      itemTitle = language === 'he' ? 'חבילת פרימיום' : 'Premium Plan';
      itemDescription = t.premiumPlan;
    } else {
      itemTitle = language === 'he' ? 'חבילת סטנדרט' : 'Standard Plan';
      itemDescription = t.standardPlan;
    }
  }

  // Calculate tax (17% for Israel, 0% for international)
  const taxRate = 0; // Set to 0.17 for Israeli customers if needed
  const subtotal = transaction.amount;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Get or generate invoice number
  let invoiceNumber = metadata?.invoiceNumber;
  if (!invoiceNumber) {
    invoiceNumber = await generateInvoiceNumber();
    // Update transaction with invoice number
    await Transaction.findByIdAndUpdate(transaction.id, {
      metadata: {
        ...metadata,
        invoiceNumber,
      },
    });
  }

  return {
    invoiceNumber,
    date: new Date(transaction.created_at).toLocaleDateString(
      language === 'he' ? 'he-IL' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    ),
    buyer: {
      name: user.name,
      email: user.email,
    },
    item: {
      type: itemType,
      title: itemTitle,
      description: itemDescription,
    },
    amount: {
      subtotal,
      tax,
      taxRate,
      total,
      currency: transaction.currency,
    },
    paymentMethod: transaction.paymentMethod,
    transactionId: transaction.orderId || transaction.id,
    language,
  };
}

/**
 * Generate PDF invoice
 * Returns a Buffer containing the PDF
 */
export async function generateInvoicePDF(
  invoiceData: InvoiceData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const isRTL = invoiceData.language === 'he';
      const t = TRANSLATIONS[invoiceData.language];
      const company = COMPANY_DETAILS;

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100; // Account for margins
      const leftMargin = 50;
      const rightMargin = doc.page.width - 50;

      // Helper for RTL text positioning
      const xPos = (x: number) => (isRTL ? rightMargin - x : leftMargin + x);
      const textAlign = isRTL ? 'right' : 'left';

      // Colors
      const primaryColor = '#FFD700'; // Gold
      const darkColor = '#1a1a2e';
      const grayColor = '#666666';
      const lightGray = '#f5f5f5';

      // Header with gradient-like effect
      doc.rect(0, 0, doc.page.width, 120).fill(darkColor);

      // Company Logo/Name
      doc.fillColor(primaryColor);
      doc.fontSize(28);
      doc.text('MeStory', leftMargin, 40, {
        width: pageWidth,
        align: isRTL ? 'right' : 'left',
      });

      // Invoice title
      doc.fillColor('white');
      doc.fontSize(12);
      doc.text(t.invoice, leftMargin, 75, {
        width: pageWidth,
        align: isRTL ? 'right' : 'left',
      });

      // Reset for body
      doc.fillColor(darkColor);
      let yPos = 140;

      // Invoice details section
      doc.fontSize(10);
      doc.fillColor(grayColor);

      // Invoice Number and Date - Two columns
      const col1X = isRTL ? rightMargin - 200 : leftMargin;
      const col2X = isRTL ? leftMargin : rightMargin - 200;

      doc.text(`${t.invoiceNumber}:`, col1X, yPos, { width: 200, align: textAlign });
      doc.fillColor(darkColor);
      doc.text(invoiceData.invoiceNumber, col1X, yPos + 15, { width: 200, align: textAlign });

      doc.fillColor(grayColor);
      doc.text(`${t.date}:`, col2X, yPos, { width: 200, align: isRTL ? 'left' : 'right' });
      doc.fillColor(darkColor);
      doc.text(invoiceData.date, col2X, yPos + 15, { width: 200, align: isRTL ? 'left' : 'right' });

      yPos += 50;

      // Bill To section
      doc.fontSize(10);
      doc.fillColor(primaryColor);
      doc.text(t.billTo, col1X, yPos, { width: 200, align: textAlign });
      doc.fillColor(darkColor);
      doc.fontSize(11);
      doc.text(invoiceData.buyer.name, col1X, yPos + 18, { width: 200, align: textAlign });
      doc.fontSize(9);
      doc.fillColor(grayColor);
      doc.text(invoiceData.buyer.email, col1X, yPos + 33, { width: 200, align: textAlign });

      // From section (Company details)
      doc.fillColor(primaryColor);
      doc.fontSize(10);
      doc.text(t.from, col2X, yPos, { width: 200, align: isRTL ? 'left' : 'right' });
      doc.fillColor(darkColor);
      doc.fontSize(11);
      doc.text(isRTL ? company.nameHe : company.name, col2X, yPos + 18, {
        width: 200,
        align: isRTL ? 'left' : 'right',
      });
      doc.fontSize(9);
      doc.fillColor(grayColor);
      doc.text(isRTL ? company.addressHe : company.address, col2X, yPos + 33, {
        width: 200,
        align: isRTL ? 'left' : 'right',
      });
      doc.text(company.email, col2X, yPos + 48, {
        width: 200,
        align: isRTL ? 'left' : 'right',
      });

      yPos += 90;

      // Line items table header
      doc.rect(leftMargin, yPos, pageWidth, 30).fill(lightGray);

      doc.fillColor(darkColor);
      doc.fontSize(10);

      const tableY = yPos + 10;

      if (isRTL) {
        doc.text(t.amount, leftMargin + 10, tableY, { width: 80 });
        doc.text(t.unitPrice, leftMargin + 100, tableY, { width: 80 });
        doc.text(t.quantity, leftMargin + 190, tableY, { width: 50 });
        doc.text(t.description, leftMargin + 250, tableY, { width: pageWidth - 260 });
      } else {
        doc.text(t.description, leftMargin + 10, tableY, { width: pageWidth - 260 });
        doc.text(t.quantity, leftMargin + pageWidth - 240, tableY, { width: 50 });
        doc.text(t.unitPrice, leftMargin + pageWidth - 180, tableY, { width: 80 });
        doc.text(t.amount, leftMargin + pageWidth - 90, tableY, { width: 80 });
      }

      yPos += 35;

      // Line item row
      doc.fontSize(10);
      doc.fillColor(darkColor);

      const formatCurrency = (amount: number, currency: string) => {
        if (currency === 'ILS') {
          return `${amount.toFixed(2)} ${isRTL ? 'ש"ח' : 'ILS'}`;
        }
        return `$${amount.toFixed(2)}`;
      };

      if (isRTL) {
        doc.text(
          formatCurrency(invoiceData.amount.subtotal, invoiceData.amount.currency),
          leftMargin + 10,
          yPos,
          { width: 80 }
        );
        doc.text(
          formatCurrency(invoiceData.amount.subtotal, invoiceData.amount.currency),
          leftMargin + 100,
          yPos,
          { width: 80 }
        );
        doc.text('1', leftMargin + 190, yPos, { width: 50 });
        doc.text(invoiceData.item.title, leftMargin + 250, yPos, { width: pageWidth - 260 });
        doc.fontSize(9);
        doc.fillColor(grayColor);
        doc.text(invoiceData.item.description, leftMargin + 250, yPos + 15, {
          width: pageWidth - 260,
        });
      } else {
        doc.text(invoiceData.item.title, leftMargin + 10, yPos, { width: pageWidth - 260 });
        doc.fontSize(9);
        doc.fillColor(grayColor);
        doc.text(invoiceData.item.description, leftMargin + 10, yPos + 15, {
          width: pageWidth - 260,
        });
        doc.fillColor(darkColor);
        doc.fontSize(10);
        doc.text('1', leftMargin + pageWidth - 240, yPos, { width: 50 });
        doc.text(
          formatCurrency(invoiceData.amount.subtotal, invoiceData.amount.currency),
          leftMargin + pageWidth - 180,
          yPos,
          { width: 80 }
        );
        doc.text(
          formatCurrency(invoiceData.amount.subtotal, invoiceData.amount.currency),
          leftMargin + pageWidth - 90,
          yPos,
          { width: 80 }
        );
      }

      yPos += 50;

      // Divider line
      doc.moveTo(leftMargin, yPos).lineTo(rightMargin, yPos).stroke(lightGray);

      yPos += 20;

      // Totals section
      const totalsX = isRTL ? leftMargin : rightMargin - 200;
      const totalsWidth = 200;

      // Subtotal
      doc.fontSize(10);
      doc.fillColor(grayColor);
      doc.text(t.subtotal, totalsX, yPos, { width: totalsWidth - 100, align: isRTL ? 'right' : 'left' });
      doc.fillColor(darkColor);
      doc.text(
        formatCurrency(invoiceData.amount.subtotal, invoiceData.amount.currency),
        isRTL ? totalsX - 100 : totalsX + totalsWidth - 100,
        yPos,
        { width: 100, align: 'right' }
      );

      yPos += 20;

      // Tax (if applicable)
      if (invoiceData.amount.taxRate > 0) {
        doc.fillColor(grayColor);
        doc.text(`${t.tax} (${(invoiceData.amount.taxRate * 100).toFixed(0)}%)`, totalsX, yPos, {
          width: totalsWidth - 100,
          align: isRTL ? 'right' : 'left',
        });
        doc.fillColor(darkColor);
        doc.text(
          formatCurrency(invoiceData.amount.tax, invoiceData.amount.currency),
          isRTL ? totalsX - 100 : totalsX + totalsWidth - 100,
          yPos,
          { width: 100, align: 'right' }
        );
        yPos += 20;
      }

      // Total
      doc.fontSize(12);
      doc.fillColor(primaryColor);
      doc.text(t.total, totalsX, yPos, { width: totalsWidth - 100, align: isRTL ? 'right' : 'left' });
      doc.fillColor(darkColor);
      doc.text(
        formatCurrency(invoiceData.amount.total, invoiceData.amount.currency),
        isRTL ? totalsX - 100 : totalsX + totalsWidth - 100,
        yPos,
        { width: 100, align: 'right' }
      );

      yPos += 50;

      // Payment details
      doc.fontSize(10);
      doc.fillColor(grayColor);

      const paymentMethodLabel =
        invoiceData.paymentMethod === 'paypal' ? t.paypal : t.creditCard;

      doc.text(`${t.paymentMethod}: ${paymentMethodLabel}`, leftMargin, yPos, {
        width: pageWidth,
        align: textAlign,
      });
      yPos += 18;
      doc.text(`${t.transactionId}: ${invoiceData.transactionId}`, leftMargin, yPos, {
        width: pageWidth,
        align: textAlign,
      });

      // Footer
      yPos = doc.page.height - 100;

      // Footer divider
      doc.moveTo(leftMargin, yPos).lineTo(rightMargin, yPos).stroke(lightGray);

      yPos += 20;

      // Thank you message
      doc.fontSize(12);
      doc.fillColor(primaryColor);
      doc.text(t.thankYou, leftMargin, yPos, { width: pageWidth, align: 'center' });

      yPos += 25;

      // Contact info
      doc.fontSize(9);
      doc.fillColor(grayColor);
      doc.text(`${t.questions} ${company.email}`, leftMargin, yPos, {
        width: pageWidth,
        align: 'center',
      });

      yPos += 15;

      // Tax ID
      doc.text(`${t.taxId}: ${company.taxId}`, leftMargin, yPos, {
        width: pageWidth,
        align: 'center',
      });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate invoice for a transaction
 * Called after successful payment
 */
export async function generateInvoiceForTransaction(
  transactionId: string,
  language?: 'en' | 'he'
): Promise<{ invoiceNumber: string; pdfBuffer: Buffer }> {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status !== 'completed') {
    throw new Error('Cannot generate invoice for incomplete transaction');
  }

  // Get user's preferred language if not specified
  if (!language) {
    const user = await User.findById(transaction.userId);
    language = user?.profile?.language || 'en';
  }

  const invoiceData = await getInvoiceData(transaction, language);
  const pdfBuffer = await generateInvoicePDF(invoiceData);

  return {
    invoiceNumber: invoiceData.invoiceNumber,
    pdfBuffer,
  };
}

/**
 * Get all invoices for a user
 */
export async function getUserInvoices(
  userId: string
): Promise<Array<{ transaction: ITransaction; invoiceNumber: string | null }>> {
  const transactions = await Transaction.find({ userId, status: 'completed' });

  return transactions.map((transaction) => ({
    transaction,
    invoiceNumber: (transaction.metadata as any)?.invoiceNumber || null,
  }));
}
