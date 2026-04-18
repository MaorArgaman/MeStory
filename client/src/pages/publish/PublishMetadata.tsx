import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Tag,
  DollarSign,
  Wand2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Eye,
  Star,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton } from '../../components/ui';

interface BookData {
  _id: string;
  title: string;
  genre: string;
  author: {
    _id: string;
    name: string;
  };
  synopsis?: string;
  tags?: string[];
  coverDesign?: {
    front?: {
      imageUrl?: string;
      backgroundColor?: string;
    };
  };
  qualityScore?: {
    overallScore: number;
    ratingLabel: string;
  };
  publishingStatus: {
    status: string;
    price: number;
    isFree: boolean;
  };
  statistics: {
    wordCount: number;
  };
}

const categories = [
  { value: 'Memory Book',        he: '📖 ספר זיכרון',                     en: '📖 Memory Book' },
  { value: 'Life Story',         he: '✍️ סיפור חיים / אוטוביוגרפיה',      en: '✍️ Life Story / Autobiography' },
  { value: 'Family Legacy',      he: '👨‍👩‍👧 מורשת משפחתית',                  en: '👨‍👩‍👧 Family Legacy' },
  { value: 'Tribute',            he: '💛 מחווה ליקיר/ה',                   en: '💛 Tribute to a Loved One' },
  { value: 'Holocaust Survivor', he: '🕯️ עדות ניצול/ת שואה',              en: '🕯️ Holocaust Survivor Testimony' },
  { value: 'October 7',         he: '🕊️ אירועי ה-7 באוקטובר',            en: '🕊️ October 7th Stories' },
  { value: 'Childhood Memories', he: '🌅 זיכרונות ילדות',                 en: '🌅 Childhood Memories' },
  { value: 'Personal Letters',   he: '✉️ מכתבים ודברים שלא נאמרו',        en: '✉️ Letters & Untold Words' },
  { value: 'Poetry',             he: '🌸 שירה',                            en: '🌸 Poetry' },
  { value: 'Children Book',      he: '🧒 ספר ילדים',                       en: '🧒 Children\'s Book' },
  { value: 'Organization Story', he: '🏛️ ספר ארגוני / עסקי',              en: '🏛️ Organization / Business Book' },
  { value: 'Fiction',            he: '📚 ספרות בדיונית',                   en: '📚 Fiction' },
  { value: 'Other',              he: 'אחר',                                en: 'Other' },
];

export default function PublishMetadata() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingSynopsis, setGeneratingSynopsis] = useState(false);

  // Form state
  const [synopsis, setSynopsis] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/books/${bookId}`);
      if (response.data.success) {
        const bookData = response.data.data.book;
        setBook(bookData);
        setSynopsis(bookData.synopsis || '');
        setTags(bookData.tags || []);
        setCategory(bookData.genre || '');
        setPrice(bookData.publishingStatus?.price || 0);
        setIsFree(bookData.publishingStatus?.isFree ?? true);
      }
    } catch (error: any) {
      console.error('Failed to load book:', error);
      toast.error(error.response?.data?.error || 'Failed to load book');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSynopsis = async () => {
    if (!book) return;

    try {
      setGeneratingSynopsis(true);
      const response = await api.post('/ai/generate-synopsis', {
        bookId: book._id,
        title: book.title,
        genre: book.genre,
      });

      if (response.data.success) {
        setSynopsis(response.data.data.synopsis);
        toast.success('Synopsis generated!');
      }
    } catch (error: any) {
      console.error('Failed to generate synopsis:', error);
      toast.error(error.response?.data?.error || 'Failed to generate synopsis');
    } finally {
      setGeneratingSynopsis(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      if (tags.length >= 10) {
        toast.error('Maximum 10 tags allowed');
        return;
      }
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    // Validation
    if (!synopsis.trim()) {
      toast.error('אנא הוסף תקציר לספר');
      return;
    }

    if (synopsis.length < 100) {
      toast.error('התקציר חייב להכיל לפחות 100 תווים');
      return;
    }

    if (tags.length === 0) {
      toast.error('אנא הוסף לפחות תגית אחת');
      return;
    }

    if (!category) {
      toast.error('אנא בחר קטגוריה');
      return;
    }

    if (!isFree && (price < 1 || price > 25)) {
      toast.error('המחיר חייב להיות בין $1 ל-$25');
      return;
    }

    try {
      setSaving(true);
      const response = await api.put(`/books/${bookId}`, {
        synopsis: synopsis.trim(),
        tags,
        genre: category,
        publishingStatus: {
          price: isFree ? 0 : price,
          isFree,
        },
      });

      if (response.data.success) {
        toast.success('המידע נשמר בהצלחה!');
        navigate(`/publish/${bookId}`);
      }
    } catch (error: any) {
      console.error('Failed to save metadata:', error);
      toast.error(error.response?.data?.error || 'שגיאה בשמירת המידע');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-memorial-gold mx-auto mb-4 animate-spin" />
          <p className="text-gray-300">{t('common.loading', 'טוען...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back', 'חזרה')}
          </button>
          <h1 className="text-4xl font-display font-bold gradient-gold mb-2">
            {t('publishing.prepare_title', 'הכנת הספר לפרסום')}
          </h1>
          <p className="text-gray-400">{t('publishing.prepare_subtitle', 'ארזו את הספר שלכם לקוראים')}</p>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Synopsis */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-memorial-gold" />
                  <h3 className="text-xl font-display font-bold text-white">
                    תקציר הספר
                  </h3>
                </div>
                <GlowingButton
                  onClick={handleGenerateSynopsis}
                  disabled={generatingSynopsis}
                  variant="cosmic"
                  size="sm"
                >
                  {generatingSynopsis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      מייצר...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      יצירה בבינה מלאכותית
                    </>
                  )}
                </GlowingButton>
              </div>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="כתוב תקציר מרתק שיתאים לעטיפה האחורית של הספר... (100-500 תווים)"
                className="input min-h-[200px] resize-none"
                maxLength={500}
                dir="rtl"
              />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className={`${synopsis.length > 450 ? 'text-amber-400' : 'text-gray-400'}`}>
                  {synopsis.length} / 500 תווים
                </span>
                {synopsis.length >= 100 && synopsis.length <= 500 && (
                  <span className="text-green-400 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    אורך מושלם לעטיפה האחורית!
                  </span>
                )}
              </div>
            </GlassCard>

            {/* Tags */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-memorial-gold" />
                <h3 className="text-xl font-display font-bold text-white">תגיות</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="הוסף תגית (לחץ Enter)"
                  className="input flex-1"
                  maxLength={30}
                  dir="rtl"
                />
                <GlowingButton onClick={handleAddTag} variant="gold" size="sm">
                  הוסף
                </GlowingButton>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1 bg-memorial-gold/20 border border-memorial-gold rounded-full text-memorial-gold text-sm flex items-center gap-2"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-400 transition"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
              {tags.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">
                  הוסף תגיות כדי שקוראים יוכלו למצוא את הספר שלך
                </p>
              )}
              <p className="text-gray-400 text-xs mt-2">{tags.length} / 10 תגיות</p>
            </GlassCard>

            {/* Category */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-memorial-gold" />
                <h3 className="text-xl font-display font-bold text-white">קטגוריה</h3>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
                dir="rtl"
              >
                <option value="">בחר קטגוריה</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.he}
                  </option>
                ))}
              </select>
            </GlassCard>

            {/* Pricing */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-memorial-gold" />
                <h3 className="text-xl font-display font-bold text-white">תמחור</h3>
              </div>

              {/* Free/Paid Toggle */}
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setIsFree(true)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    isFree
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  חינם
                </button>
                <button
                  onClick={() => setIsFree(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    !isFree
                      ? 'bg-gradient-to-r from-memorial-gold to-yellow-600 text-deep-space'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  בתשלום
                </button>
              </div>

              {/* Price Input */}
              {!isFree && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    קבע מחיר ($1 - $25)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="25"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="flex-1"
                    />
                    <div className="w-20 text-center">
                      <div className="text-2xl font-bold gradient-gold">${price}</div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    תרוויח: <span className="text-green-400 font-semibold">${(price * 0.5).toFixed(2)}</span> (50%) לכל מכירה
                  </p>
                </motion.div>
              )}
            </GlassCard>

            {/* Actions */}
            <div className="flex gap-4">
              <GlowingButton
                onClick={() => navigate('/dashboard')}
                variant="cosmic"
                size="lg"
                className="flex-1"
              >
                <ArrowLeft className="w-5 h-5" />
                ביטול
              </GlowingButton>
              <GlowingButton
                onClick={handleSave}
                disabled={saving}
                variant="gold"
                size="lg"
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    המשך
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </GlowingButton>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <GlassCard>
              <div className="flex items-center gap-2 mb-6">
                <Eye className="w-5 h-5 text-cosmic-purple" />
                <h3 className="text-xl font-display font-bold text-white">
                  תצוגה מקדימה
                </h3>
              </div>

              {/* Mock Marketplace Card */}
              <motion.div
                layout
                className="glass rounded-xl overflow-hidden hover:shadow-glow-gold transition-all"
              >
                {/* Cover */}
                <div
                  className="w-full aspect-[2/3] relative"
                  style={{
                    background: book.coverDesign?.front?.imageUrl
                      ? `url(${book.coverDesign.front.imageUrl})`
                      : book.coverDesign?.front?.backgroundColor || '#1a1a3e',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!book.coverDesign?.front?.imageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white/20" />
                    </div>
                  )}

                  {/* Quality Badge */}
                  {book.qualityScore && book.qualityScore.overallScore >= 70 && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-memorial-gold to-yellow-600 text-deep-space text-xs font-bold shadow-glow-gold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {book.qualityScore.ratingLabel}
                    </div>
                  )}

                  {/* Free Badge */}
                  {isFree && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                      FREE
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h4 className="font-display font-bold text-xl text-white mb-1 line-clamp-2">
                    {book.title}
                  </h4>
                  <p className="text-sm text-gray-400 mb-2">מאת {book.author.name}</p>

                  {/* Category */}
                  {category && (
                    <div className="text-xs text-cosmic-purple mb-3">{category}</div>
                  )}

                  {/* Synopsis Preview */}
                  {synopsis && (
                    <p className="text-sm text-gray-300 line-clamp-3 mb-3">
                      {synopsis}
                    </p>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-xs px-2 py-0.5 text-gray-500">
                          +{tags.length - 3} עוד
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm border-t border-white/10 pt-3">
                    <div className="flex items-center gap-4">
                      {book.qualityScore && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-memorial-gold fill-memorial-gold" />
                          <span className="text-gray-300">
                            {(book.qualityScore.overallScore / 20).toFixed(1)}
                          </span>
                        </div>
                      )}
                      <div className="text-gray-400">
                        {book.statistics.wordCount.toLocaleString()} מילים
                      </div>
                    </div>
                    <div className="font-bold text-memorial-gold">
                      {isFree ? 'חינם' : `$${price}`}
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  כך הספר שלך יופיע בחנות. ודא שהתקציר שלך מושך ומעניין!
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
