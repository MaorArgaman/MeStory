/**
 * ContributePage — Public page for family/friends to contribute memories.
 * No login required. Accessed via a unique share link.
 * e.g., /contribute/bookId?token=abc123
 */
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Send, Upload, Check, Loader2, Heart } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '../services/api';
import BookLoader from '../components/common/BookLoader';

export default function ContributePage() {
  const { bookId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [memory, setMemory] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Load book info
  useEffect(() => {
    const loadBook = async () => {
      try {
        const response = await api.get(`/books/${bookId}/contribute-info?token=${token}`);
        if (response.data.success) {
          setBookTitle(response.data.data.title);
          setBookAuthor(response.data.data.author);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'הספר לא נמצא או שהלינק לא תקף');
      } finally {
        setLoading(false);
      }
    };
    if (bookId) loadBook();
  }, [bookId, token]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('התמונה גדולה מדי (מקסימום 5MB)');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!memory.trim() && !imageFile) {
      toast.error('כתבו זיכרון או העלו תמונה');
      return;
    }
    if (!contributorName.trim()) {
      toast.error('נא להזין שם');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('memory', memory);
      formData.append('contributorName', contributorName);
      formData.append('relationship', relationship);
      formData.append('token', token || '');
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await api.post(`/books/${bookId}/contributions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit contribution:', err);
      toast.error(err.response?.data?.error || 'שגיאה בשליחה. נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <BookLoader variant="fullscreen" message="טוען..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl text-white mb-2">לא נמצא</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center p-4">
        <Toaster />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-green-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-3">תודה רבה! 💛</h1>
          <p className="text-gray-300 mb-2">
            הזיכרון שלך נשלח ל{bookAuthor} ויתווסף לספר "{bookTitle}".
          </p>
          <p className="text-gray-500 text-sm">
            אפשר לסגור את הדף הזה.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space" dir="rtl">
      <Toaster />

      {/* Header */}
      <div className="bg-gradient-to-b from-memorial-gold/10 to-transparent py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-memorial-gold/20 flex items-center justify-center"
          >
            <Heart className="w-8 h-8 text-memorial-gold" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            שתפו זיכרון
          </h1>
          <p className="text-gray-300">
            הספר "<span className="text-memorial-gold">{bookTitle}</span>" מחכה לזיכרון שלכם
          </p>
          <p className="text-gray-500 text-sm mt-1">מאת {bookAuthor}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 pb-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Memory text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ✏️ הזיכרון שלכם
            </label>
            <textarea
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              placeholder="ספרו זיכרון, סיפור, או כל דבר שאתם רוצים לשתף..."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-500 resize-none focus:border-memorial-gold/50 focus:outline-none transition"
              maxLength={2000}
              dir="rtl"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">{memory.length} / 2000</span>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📷 תמונה (אופציונלי)
            </label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 left-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-black/90"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-memorial-gold/30 transition">
                <Upload className="w-6 h-6 text-gray-500 mb-1" />
                <span className="text-sm text-gray-500">לחצו להעלאת תמונה</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            )}
          </div>

          {/* Contributor info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">שם</label>
              <input
                type="text"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="השם שלך"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-memorial-gold/50 focus:outline-none transition"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">קרבה</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-memorial-gold/50 focus:outline-none transition appearance-none"
                dir="rtl"
              >
                <option value="">בחרו...</option>
                <option value="child">בן/בת</option>
                <option value="sibling">אח/אחות</option>
                <option value="grandchild">נכד/נכדה</option>
                <option value="spouse">בן/בת זוג</option>
                <option value="parent">הורה</option>
                <option value="friend">חבר/ה</option>
                <option value="colleague">עמית/ה</option>
                <option value="other">אחר</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            onClick={handleSubmit}
            disabled={submitting || (!memory.trim() && !imageFile)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-memorial-gold to-yellow-600 text-deep-space font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-glow-gold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                שלח זיכרון
              </>
            )}
          </motion.button>

          <p className="text-center text-xs text-gray-600">
            הזיכרון ישלח לבעל הספר לאישור לפני שיתווסף.
            <br />
            MeStory — כל סיפור ראוי להיכתב.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
