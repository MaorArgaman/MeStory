/**
 * Email Service
 * Handles sending emails for verification, welcome, purchases, etc.
 */

import nodemailer from 'nodemailer';

// Email configuration from environment
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'MeStory <noreply@mestory.com>';

// Create transporter
const createTransporter = () => {
  // In development, log emails to console if no credentials
  if (process.env.NODE_ENV === 'development' && (!EMAIL_USER || !EMAIL_PASS)) {
    console.log('📧 [DEV MODE] Email service running in mock mode - emails will be logged to console');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

// ==================== EMAIL TEMPLATES ====================

const getBaseTemplate = (content: string, title: string) => `
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
    h2 {
      color: #FFD700;
      font-size: 22px;
      margin-bottom: 15px;
    }
    .code-box {
      background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.2));
      border: 2px solid #FFD700;
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 42px;
      font-weight: bold;
      color: #FFD700;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .code-label {
      color: #a0a0a0;
      font-size: 14px;
      margin-top: 10px;
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
    .button:hover {
      transform: scale(1.05);
    }
    .info-box {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      border-right: 4px solid #FFD700;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #a0a0a0;
    }
    .info-value {
      color: #FFD700;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #808080;
      font-size: 14px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      color: #FFD700;
      text-decoration: none;
      margin: 0 10px;
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
        <p>אם לא ביקשת את המייל הזה, אנא התעלם ממנו.</p>
        <p style="margin-top: 20px; font-size: 12px;">
          © ${new Date().getFullYear()} MeStory. כל הזכויות שמורות.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// ==================== EMAIL SENDING FUNCTIONS ====================

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email
 */
async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  try {
    // Mock mode in development
    if (!transporter) {
      console.log('📧 [MOCK EMAIL]');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Content: [HTML Email - ${html.length} chars]`);
      return true;
    }

    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return false;
  }
}

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification code email
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  code: string
): Promise<boolean> {
  const content = `
    <h1>אימות כתובת המייל</h1>
    <div class="content">
      <p>שלום <span class="highlight">${name}</span>,</p>
      <p>תודה שנרשמת ל-MeStory! כדי להשלים את ההרשמה ולהתחיל ליצור ספרים מדהימים, אנא אמת את כתובת המייל שלך.</p>

      <div class="code-box">
        <div class="code">${code}</div>
        <div class="code-label">קוד האימות שלך</div>
      </div>

      <p>הזן את הקוד הזה באתר כדי לאמת את החשבון שלך.</p>
      <p><strong>שים לב:</strong> הקוד תקף ל-15 דקות בלבד.</p>

      <div class="info-box">
        <p><strong>למה צריך לאמת את המייל?</strong></p>
        <ul>
          <li>אבטחת החשבון שלך</li>
          <li>קבלת עדכונים חשובים</li>
          <li>קבלות על רכישות</li>
          <li>שחזור סיסמה במקרה הצורך</li>
        </ul>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `קוד האימות שלך ל-MeStory: ${code}`,
    html: getBaseTemplate(content, 'אימות מייל'),
  });
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const content = `
    <div class="success-icon">🎉</div>
    <h1>ברוכים הבאים ל-MeStory!</h1>
    <div class="content">
      <p>שלום <span class="highlight">${name}</span>,</p>
      <p>תודה רבה שהצטרפת למשפחת MeStory! אנחנו שמחים שבחרת בנו ליצור את הספר הבא שלך.</p>

      <div class="info-box">
        <h2>מה אפשר לעשות עכשיו?</h2>
        <ul>
          <li>📚 <strong>התחל לכתוב</strong> - צור את הספר הראשון שלך בעזרת AI מתקדם</li>
          <li>🎨 <strong>עצב את העטיפה</strong> - בחר מתוך מגוון עיצובים מקצועיים</li>
          <li>🎤 <strong>הקרא את הספר</strong> - המר את הספר לאודיו בקול טבעי</li>
          <li>🛒 <strong>מכור בשוק</strong> - פרסם ומכור את הספר שלך</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="button">
          התחל ליצור עכשיו
        </a>
      </div>

      <p style="margin-top: 30px;">
        יש לך שאלות? אנחנו כאן בשבילך!<br>
        ניתן ליצור איתנו קשר בכל עת.
      </p>

      <p>בהצלחה ביצירה! 🚀</p>
      <p><strong>צוות MeStory</strong></p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'ברוכים הבאים ל-MeStory! 🎉',
    html: getBaseTemplate(content, 'ברוכים הבאים'),
  });
}

/**
 * Send subscription upgrade email
 */
export async function sendSubscriptionUpgradeEmail(
  to: string,
  name: string,
  plan: string,
  price: number,
  currency: string,
  features: string[]
): Promise<boolean> {
  const featuresHtml = features.map((f) => `<li>✨ ${f}</li>`).join('');

  const content = `
    <div class="success-icon">🚀</div>
    <h1>שודרגת לחבילת ${plan}!</h1>
    <div class="content">
      <p>שלום <span class="highlight">${name}</span>,</p>
      <p>מזל טוב! השדרוג שלך לחבילת <strong>${plan}</strong> בוצע בהצלחה.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">חבילה</span>
          <span class="info-value">${plan}</span>
        </div>
        <div class="info-row">
          <span class="info-label">מחיר</span>
          <span class="info-value">${price} ${currency}</span>
        </div>
        <div class="info-row">
          <span class="info-label">תאריך</span>
          <span class="info-value">${new Date().toLocaleDateString('he-IL')}</span>
        </div>
      </div>

      <h2>מה כלול בחבילה שלך:</h2>
      <ul style="color: #e0e0e0; line-height: 2;">
        ${featuresHtml}
      </ul>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="button">
          התחל להשתמש ביכולות החדשות
        </a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #a0a0a0;">
        מספר אסמכתא: TXN-${Date.now()}<br>
        שמור מייל זה כאישור רכישה.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `אישור שדרוג לחבילת ${plan} 🚀`,
    html: getBaseTemplate(content, 'אישור שדרוג'),
  });
}

/**
 * Send book purchase confirmation email
 */
export async function sendBookPurchaseEmail(
  to: string,
  name: string,
  bookTitle: string,
  authorName: string,
  price: number,
  currency: string,
  bookId: string
): Promise<boolean> {
  const content = `
    <div class="success-icon">📚</div>
    <h1>רכישה בוצעה בהצלחה!</h1>
    <div class="content">
      <p>שלום <span class="highlight">${name}</span>,</p>
      <p>תודה על הרכישה! הספר נוסף לספרייה שלך ומוכן לקריאה.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">שם הספר</span>
          <span class="info-value">${bookTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">מחבר</span>
          <span class="info-value">${authorName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">מחיר</span>
          <span class="info-value">${price} ${currency}</span>
        </div>
        <div class="info-row">
          <span class="info-label">תאריך רכישה</span>
          <span class="info-value">${new Date().toLocaleDateString('he-IL')}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/reader/${bookId}" class="button">
          התחל לקרוא עכשיו
        </a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #a0a0a0;">
        מספר אסמכתא: PUR-${Date.now()}<br>
        שמור מייל זה כאישור רכישה.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `אישור רכישה: "${bookTitle}" 📚`,
    html: getBaseTemplate(content, 'אישור רכישה'),
  });
}

/**
 * Send sale notification to author
 */
export async function sendSaleNotificationToAuthor(
  to: string,
  authorName: string,
  bookTitle: string,
  buyerName: string,
  amount: number,
  currency: string
): Promise<boolean> {
  const content = `
    <div class="success-icon">💰</div>
    <h1>מכירה חדשה!</h1>
    <div class="content">
      <p>שלום <span class="highlight">${authorName}</span>,</p>
      <p>חדשות מצוינות! מישהו רכש את הספר שלך!</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">ספר</span>
          <span class="info-value">${bookTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">קונה</span>
          <span class="info-value">${buyerName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">סכום</span>
          <span class="info-value">${amount} ${currency}</span>
        </div>
        <div class="info-row">
          <span class="info-label">תאריך</span>
          <span class="info-value">${new Date().toLocaleDateString('he-IL')}</span>
        </div>
      </div>

      <p>הרווח שלך יתווסף ליתרה הממתינה למשיכה.</p>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/settings" class="button">
          צפה בהכנסות שלך
        </a>
      </div>

      <p style="margin-top: 20px;">המשך ליצור תוכן מדהים! 🌟</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `מכירה חדשה: "${bookTitle}" 💰`,
    html: getBaseTemplate(content, 'מכירה חדשה'),
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const content = `
    <h1>איפוס סיסמה</h1>
    <div class="content">
      <p>שלום <span class="highlight">${name}</span>,</p>
      <p>קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי ליצור סיסמה חדשה:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="button">
          איפוס סיסמה
        </a>
      </div>

      <p><strong>שים לב:</strong> הקישור תקף ל-שעה אחת בלבד.</p>

      <p style="margin-top: 30px; padding: 20px; background: rgba(255,0,0,0.1); border-radius: 10px; border-right: 4px solid #ff4444;">
        <strong>לא ביקשת לאפס את הסיסמה?</strong><br>
        אם לא ביקשת איפוס סיסמה, התעלם מהמייל הזה. החשבון שלך בטוח.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'איפוס סיסמה - MeStory',
    html: getBaseTemplate(content, 'איפוס סיסמה'),
  });
}

/**
 * Send PayPal receipt email
 */
export async function sendPayPalReceiptEmail(
  to: string,
  name: string,
  transactionId: string,
  description: string,
  amount: number,
  currency: string
): Promise<boolean> {
  const content = `
    <div class="success-icon">✅</div>
    <h1>קבלה - תשלום התקבל</h1>
    <div class="content">
      <p>שלום <span class="highlight">${name}</span>,</p>
      <p>תודה על התשלום! להלן פרטי העסקה:</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">מספר עסקה</span>
          <span class="info-value">${transactionId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">תיאור</span>
          <span class="info-value">${description}</span>
        </div>
        <div class="info-row">
          <span class="info-label">סכום</span>
          <span class="info-value">${amount} ${currency}</span>
        </div>
        <div class="info-row">
          <span class="info-label">תאריך</span>
          <span class="info-value">${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">אמצעי תשלום</span>
          <span class="info-value">PayPal</span>
        </div>
      </div>

      <p style="margin-top: 20px; font-size: 14px; color: #a0a0a0;">
        שמור מייל זה כקבלה רשמית על התשלום.<br>
        לשאלות או בירורים, ניתן לפנות לתמיכה.
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/settings" class="button">
          צפה בהיסטוריית העסקאות
        </a>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `קבלה על תשלום - ${description}`,
    html: getBaseTemplate(content, 'קבלה'),
  });
}
