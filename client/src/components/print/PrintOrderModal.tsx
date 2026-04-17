/**
 * PrintOrderModal — Order a physical printed copy of the book.
 * Shows cover options, paper quality, quantity, and shipping address.
 * Ready to connect to Peecho/Lulu/IngramSpark API.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Truck, CreditCard, Loader2, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

interface PrintOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  pageCount: number;
  hasCover?: boolean;
}

type CoverType = 'softcover' | 'hardcover';
type PaperQuality = 'standard' | 'premium';
type BookSize = 'a5' | 'a4';

const PRICES = {
  softcover: { base: 29, perPage: 0.15 },
  hardcover: { base: 59, perPage: 0.18 },
  premium: 10, // extra for premium paper
  a4: 15, // extra for A4 size
};

export default function PrintOrderModal({ isOpen, onClose, bookId, bookTitle, pageCount }: PrintOrderModalProps) {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const [step, setStep] = useState<'options' | 'address' | 'confirm' | 'success'>('options');
  const [coverType, setCoverType] = useState<CoverType>('softcover');
  const [paperQuality, setPaperQuality] = useState<PaperQuality>('standard');
  const [bookSize, setBookSize] = useState<BookSize>('a5');
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);

  // Address fields
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');

  // Calculate price
  const basePrice = PRICES[coverType].base + (pageCount * PRICES[coverType].perPage);
  const paperExtra = paperQuality === 'premium' ? PRICES.premium : 0;
  const sizeExtra = bookSize === 'a4' ? PRICES.a4 : 0;
  const unitPrice = Math.round((basePrice + paperExtra + sizeExtra) * 100) / 100;
  const totalPrice = Math.round(unitPrice * quantity * 100) / 100;
  const shipping = quantity >= 3 ? 0 : 25;
  const finalPrice = totalPrice + shipping;

  const handleOrder = async () => {
    if (!fullName || !address || !city) {
      toast.error(isHebrew ? 'נא למלא את כל שדות הכתובת' : 'Please fill all address fields');
      return;
    }

    setOrdering(true);
    try {
      await api.post(`/books/${bookId}/print-order`, {
        coverType,
        paperQuality,
        bookSize,
        quantity,
        shipping: {
          fullName,
          address,
          city,
          zipCode,
          phone,
        },
        price: {
          unitPrice,
          totalPrice,
          shipping,
          finalPrice,
          currency: 'ILS',
        },
      });

      setStep('success');
    } catch (error: any) {
      console.error('Print order failed:', error);
      toast.error(isHebrew ? 'שגיאה בהזמנה. נסה שוב.' : 'Order failed. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-strong rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isHebrew ? 'הזמנת הדפסה' : 'Print Order'}
                </h2>
                <p className="text-sm text-gray-400">{bookTitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Step indicator */}
          {step !== 'success' && (
            <div className="flex items-center gap-2 mb-6">
              {['options', 'address', 'confirm'].map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === s ? 'bg-memorial-gold text-deep-space' :
                    ['options', 'address', 'confirm'].indexOf(step) > i ? 'bg-green-500/20 text-green-400' :
                    'bg-white/10 text-gray-500'
                  }`}>
                    {['options', 'address', 'confirm'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < 2 && <div className="flex-1 h-0.5 bg-white/10 rounded" />}
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Options */}
          {step === 'options' && (
            <div className="space-y-5">
              {/* Cover Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {isHebrew ? 'סוג כריכה' : 'Cover Type'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'softcover' as CoverType, label: isHebrew ? 'כריכה רכה' : 'Softcover', price: '₪29+', icon: '📖' },
                    { id: 'hardcover' as CoverType, label: isHebrew ? 'כריכה קשה' : 'Hardcover', price: '₪59+', icon: '📕' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setCoverType(opt.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        coverType === opt.id
                          ? 'border-memorial-gold bg-memorial-gold/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <p className="font-medium text-white mt-1">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paper & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    {isHebrew ? 'איכות נייר' : 'Paper Quality'}
                  </label>
                  <select
                    value={paperQuality}
                    onChange={(e) => setPaperQuality(e.target.value as PaperQuality)}
                    className="input w-full"
                  >
                    <option value="standard">{isHebrew ? 'רגיל (80gsm)' : 'Standard (80gsm)'}</option>
                    <option value="premium">{isHebrew ? 'פרימיום (120gsm) +₪10' : 'Premium (120gsm) +₪10'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    {isHebrew ? 'גודל' : 'Size'}
                  </label>
                  <select
                    value={bookSize}
                    onChange={(e) => setBookSize(e.target.value as BookSize)}
                    className="input w-full"
                  >
                    <option value="a5">A5 ({isHebrew ? 'סטנדרטי' : 'Standard'})</option>
                    <option value="a4">A4 ({isHebrew ? 'גדול' : 'Large'}) +₪15</option>
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {isHebrew ? 'כמות' : 'Quantity'}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-white w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(100, quantity + 1))}
                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition"
                  >
                    +
                  </button>
                  {quantity >= 3 && (
                    <span className="text-xs text-green-400 font-medium">
                      {isHebrew ? '🎉 משלוח חינם!' : '🎉 Free shipping!'}
                    </span>
                  )}
                </div>
              </div>

              {/* Price summary */}
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{isHebrew ? `${quantity} × ₪${unitPrice}` : `${quantity} × ₪${unitPrice}`}</span>
                  <span>₪{totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{isHebrew ? 'משלוח' : 'Shipping'}</span>
                  <span>{shipping === 0 ? (isHebrew ? 'חינם!' : 'Free!') : `₪${shipping}`}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-white">
                  <span>{isHebrew ? 'סה"כ' : 'Total'}</span>
                  <span className="text-memorial-gold">₪{finalPrice}</span>
                </div>
              </div>

              <button
                onClick={() => setStep('address')}
                className="w-full btn-gold py-3 text-lg font-bold flex items-center justify-center gap-2"
              >
                <Truck className="w-5 h-5" />
                {isHebrew ? 'המשך לכתובת משלוח' : 'Continue to shipping'}
              </button>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 'address' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">{isHebrew ? 'שם מלא' : 'Full Name'}</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder={isHebrew ? 'ישראל ישראלי' : 'John Doe'} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">{isHebrew ? 'כתובת' : 'Address'}</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input" placeholder={isHebrew ? 'רחוב, מספר בית, דירה' : 'Street, number, apt'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">{isHebrew ? 'עיר' : 'City'}</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="input" placeholder={isHebrew ? 'תל אביב' : 'Tel Aviv'} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">{isHebrew ? 'מיקוד' : 'Zip Code'}</label>
                  <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="input" placeholder="1234567" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">{isHebrew ? 'טלפון' : 'Phone'}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="050-1234567" dir="ltr" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep('options')} className="flex-1 btn-secondary py-3">
                  {isHebrew ? 'חזור' : 'Back'}
                </button>
                <button
                  onClick={() => {
                    if (!fullName || !address || !city) {
                      toast.error(isHebrew ? 'נא למלא שם, כתובת ועיר' : 'Name, address and city required');
                      return;
                    }
                    setStep('confirm');
                  }}
                  className="flex-1 btn-gold py-3 font-bold flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  {isHebrew ? 'לאישור ותשלום' : 'Review & Pay'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-white">{isHebrew ? 'סיכום הזמנה' : 'Order Summary'}</h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>📖 {bookTitle}</p>
                  <p>{coverType === 'hardcover' ? (isHebrew ? '📕 כריכה קשה' : '📕 Hardcover') : (isHebrew ? '📖 כריכה רכה' : '📖 Softcover')}</p>
                  <p>{paperQuality === 'premium' ? (isHebrew ? '✨ נייר פרימיום' : '✨ Premium paper') : (isHebrew ? '📄 נייר רגיל' : '📄 Standard paper')}</p>
                  <p>{bookSize === 'a4' ? 'A4' : 'A5'} | {pageCount} {isHebrew ? 'עמודים' : 'pages'} | ×{quantity}</p>
                </div>
                <div className="border-t border-white/10 pt-2">
                  <p className="text-sm text-gray-400">📦 {fullName}, {address}, {city}</p>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-white text-lg">
                  <span>{isHebrew ? 'סה"כ לתשלום' : 'Total'}</span>
                  <span className="text-memorial-gold">₪{finalPrice}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('address')} className="flex-1 btn-secondary py-3">
                  {isHebrew ? 'חזור' : 'Back'}
                </button>
                <button
                  onClick={handleOrder}
                  disabled={ordering}
                  className="flex-1 btn-gold py-3 font-bold flex items-center justify-center gap-2"
                >
                  {ordering ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />{isHebrew ? 'מעבד...' : 'Processing...'}</>
                  ) : (
                    <><CreditCard className="w-5 h-5" />{isHebrew ? 'אשר והזמן' : 'Confirm Order'}</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-3">
                {isHebrew ? 'ההזמנה התקבלה! 🎉' : 'Order Placed! 🎉'}
              </h2>
              <p className="text-gray-300 mb-2">
                {isHebrew
                  ? `${quantity} עותקים של "${bookTitle}" בדרך אליך.`
                  : `${quantity} copies of "${bookTitle}" are on their way.`
                }
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {isHebrew ? 'נשלח אישור למייל שלך. ההדפסה לוקחת 5-7 ימי עבודה.' : "We'll send confirmation to your email. Printing takes 5-7 business days."}
              </p>
              <button onClick={onClose} className="btn-primary px-8 py-3">
                {isHebrew ? 'סגור' : 'Close'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
