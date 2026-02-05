import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Target,
  Tag,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QualityScore {
  overallScore: number;
  rating: number;
  ratingLabel: string;
  categories: {
    writingQuality: { score: number; weight: number };
    plotStructure: { score: number; weight: number };
    characterDevelopment: { score: number; weight: number };
    dialogue: { score: number; weight: number };
    setting: { score: number; weight: number };
    originality: { score: number; weight: number };
  };
}

interface BookData {
  id: string;
  title: string;
  genre: string;
  qualityScore?: QualityScore;
  publishingStatus: {
    status: string;
    price: number;
    isFree: boolean;
    marketingStrategy?: {
      targetAudience?: string;
      description?: string;
      categories?: string[];
      tags?: string[];
    };
  };
}

const GENRE_CATEGORIES = [
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Mystery',
  'Thriller',
  'Horror',
  'Historical',
  'Literary Fiction',
  'Young Adult',
  'Adventure',
];

export default function PublishingPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [book, setBook] = useState<BookData | null>(null);

  // Step 2 form data
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [targetAudience, setTargetAudience] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState('');

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

        // Pre-fill form with existing data
        setPrice(bookData.publishingStatus.price || 0);
        setIsFree(bookData.publishingStatus.isFree);
        setTargetAudience(bookData.publishingStatus.marketingStrategy?.targetAudience || '');
        setDescription(bookData.publishingStatus.marketingStrategy?.description || bookData.description || '');
        setSelectedCategories(bookData.publishingStatus.marketingStrategy?.categories || [bookData.genre]);
        setTags(bookData.publishingStatus.marketingStrategy?.tags?.join(', ') || '');
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      toast.error('Failed to load book');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);

      // First update the book with marketing strategy
      await api.put(`/books/${bookId}`, {
        publishingStatus: {
          price: isFree ? 0 : price,
          isFree,
          marketingStrategy: {
            targetAudience,
            description,
            categories: selectedCategories,
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
          },
        },
      });

      // Then publish the book
      const response = await api.post(`/books/${bookId}/publish`);

      if (response.data.success) {
        // Trigger confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899'],
        });

        // Extra burst
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6366f1', '#8b5cf6'],
          });
        }, 200);

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#d946ef', '#ec4899'],
          });
        }, 400);

        toast.success('Book published successfully!');
        setStep(4); // Congratulations step
      }
    } catch (error) {
      console.error('Failed to publish book:', error);
      toast.error('Failed to publish book');
    } finally {
      setPublishing(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!book) {
    return null;
  }

  const qualityScore = book.qualityScore?.overallScore || 0;
  const canProceedFromStep1 = qualityScore >= 70;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Publish Your Book</h1>
          <p className="text-gray-400">{book.title}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-12 gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white glow'
                    : 'glass text-gray-400'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-20 h-1 mx-2 rounded transition-all ${
                    step > s ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Quality Check */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-strong rounded-xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-8 h-8 text-indigo-400" />
                <h2 className="text-2xl font-bold">Quality Check</h2>
              </div>

              {book.qualityScore ? (
                <div>
                  <div className="flex items-center justify-center mb-8">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="10"
                          fill="none"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke={qualityScore >= 70 ? '#10b981' : '#ef4444'}
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray={`${(qualityScore / 100) * 439.6} 439.6`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold">{qualityScore}</span>
                        <span className="text-sm text-gray-400">/ 100</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {Object.entries(book.qualityScore.categories).map(([key, value]) => (
                      <div key={key} className="glass rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${value.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{value.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {canProceedFromStep1 ? (
                    <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-6">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-green-300 font-medium">Ready to Publish!</p>
                        <p className="text-sm text-green-400/80">
                          Your book meets the quality standards required for publication.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300 font-medium">Quality Score Too Low</p>
                        <p className="text-sm text-red-400/80">
                          Your book needs a quality score of at least 70 to publish. Consider improving
                          your content using the AI writing assistant.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium">No Quality Score Yet</p>
                    <p className="text-sm text-yellow-400/80">
                      Run the AI quality analysis in the editor to get your quality score.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-4">
                <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedFromStep1}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Pricing & Strategy */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-strong rounded-xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-8 h-8 text-indigo-400" />
                <h2 className="text-2xl font-bold">Pricing & Strategy</h2>
              </div>

              <div className="space-y-6">
                {/* Pricing */}
                <div>
                  <label className="block text-sm font-medium mb-2">Pricing</label>
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => setIsFree(true)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        isFree
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      Free
                    </button>
                    <button
                      onClick={() => setIsFree(false)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        !isFree
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      Paid
                    </button>
                  </div>

                  {!isFree && (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        step="0.50"
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        className="input pl-8"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-400 mt-2">Recommended: $2.99 - $9.99</p>
                    </div>
                  )}
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="input"
                    placeholder="e.g., Young adults who love fantasy adventures"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Marketing Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input min-h-[100px] resize-none"
                    placeholder="A captivating description that will attract readers..."
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Categories (select up to 3)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {GENRE_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        disabled={
                          !selectedCategories.includes(category) && selectedCategories.length >= 3
                        }
                        className={`py-2 px-3 rounded-lg border transition-all text-sm ${
                          selectedCategories.includes(category)
                            ? 'border-indigo-500 bg-indigo-500/20 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600 disabled:opacity-30'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="input"
                    placeholder="magic, dragons, coming-of-age"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-4 mt-8">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedCategories.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Go Live */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-strong rounded-xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Rocket className="w-8 h-8 text-indigo-400" />
                <h2 className="text-2xl font-bold">Ready to Launch!</h2>
              </div>

              <div className="space-y-6">
                <div className="glass rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Publishing Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quality Score:</span>
                      <span className="font-semibold text-green-400">{qualityScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="font-semibold">{isFree ? 'Free' : `$${price}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Categories:</span>
                      <span className="font-semibold">{selectedCategories.length} selected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Target Audience:</span>
                      <span className="font-semibold">
                        {targetAudience || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <p className="text-sm text-indigo-300">
                    Once published, your book will be visible in the marketplace for readers to discover
                    and purchase. You can unpublish it at any time from your dashboard.
                  </p>
                </div>

                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      Publish Book
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-start mt-8">
                <button onClick={() => setStep(2)} className="btn-secondary" disabled={publishing}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Congratulations */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-strong rounded-xl p-12 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 glow">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-4xl font-bold gradient-text mb-4">Congratulations!</h2>
              <p className="text-xl text-gray-300 mb-8">
                Your book "{book.title}" is now live in the marketplace!
              </p>

              <div className="flex gap-4 justify-center">
                <button onClick={() => navigate('/marketplace')} className="btn-primary">
                  <Sparkles className="w-4 h-4 mr-2" />
                  View in Marketplace
                </button>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
