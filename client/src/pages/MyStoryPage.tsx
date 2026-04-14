import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Sparkles, ArrowRight, Eye, Star,
  Pen, Quote, ChevronDown, Mic, FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { api } from '../services/api';
import { SEO } from '../components/seo';
import { OptimizedImage } from '../components/ui';

interface StoryBook {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  coverImage?: string;
  genre: string;
  statistics: {
    views: number;
    averageRating: number;
  };
  publishingStatus: {
    price: number;
    isFree: boolean;
  };
}

// Memorial book categories with emotional icons
const STORY_CATEGORIES = [
  {
    id: 'fallen_soldier',
    icon: '🎖️',
    name: { en: 'Fallen Soldiers', he: 'חללי צה"ל' },
    description: { en: 'Honoring heroes who gave their lives for our country', he: 'הנצחת גיבורים שנתנו את חייהם למען מדינתנו' },
    tags: ['חיילים', 'נופלים', 'גבורה', 'מלחמה', 'הקרבה']
  },
  {
    id: 'life_story',
    icon: '📖',
    name: { en: 'Life Story', he: 'סיפור חיים' },
    description: { en: 'Documenting a life journey, from beginning to end', he: 'תיעוד מסע חיים, מההתחלה ועד הסוף' },
    tags: ['ביוגרפיה', 'חיים', 'מסע', 'סיפור']
  },
  {
    id: 'family_legacy',
    icon: '👨‍👩‍👧‍👦',
    name: { en: 'Family Legacy', he: 'מורשת משפחתית' },
    description: { en: 'Preserving family history for future generations', he: 'שימור ההיסטוריה המשפחתית לדורות הבאים' },
    tags: ['משפחה', 'מורשת', 'דורות', 'שורשים']
  },
  {
    id: 'holocaust_survivor',
    icon: '✡️',
    name: { en: 'Holocaust Survivors', he: 'ניצולי שואה' },
    description: { en: 'Preserving testimonies of Holocaust survivors', he: 'שימור עדויות ניצולי השואה' },
    tags: ['שואה', 'עדות', 'זיכרון', 'ניצולים']
  },
  {
    id: 'tribute',
    icon: '🕯️',
    name: { en: 'Tribute & Honor', he: 'מחווה והוקרה' },
    description: { en: 'A tribute to a loved one who has passed', he: 'מחווה ליקיר שהלך לעולמו' },
    tags: ['הוקרה', 'מחווה', 'כבוד', 'אהבה']
  },
  {
    id: 'shared_memories',
    icon: '💝',
    name: { en: 'Shared Memories', he: 'זיכרונות משותפים' },
    description: { en: 'Collective memories from family and friends', he: 'זיכרונות משותפים מהמשפחה והחברים' },
    tags: ['זיכרונות', 'סיפורים', 'חברים', 'משפחה']
  },
  {
    id: 'letters_and_words',
    icon: '✉️',
    name: { en: 'Letters & Words', he: 'מכתבים ודברים' },
    description: { en: 'Collection of letters, poems, and personal writings', he: 'אוסף מכתבים, שירים וכתבים אישיים' },
    tags: ['מכתבים', 'שירים', 'דברים', 'כתיבה']
  },
  {
    id: 'testimony',
    icon: '🎙️',
    name: { en: 'Testimony', he: 'עדות' },
    description: { en: 'Personal testimonies and historical documentation', he: 'עדויות אישיות ותיעוד היסטורי' },
    tags: ['עדות', 'תיעוד', 'היסטוריה', 'סיפור']
  },
];

// Ways to write your story
const WRITING_METHODS = [
  {
    id: 'scratch',
    icon: Pen,
    name: { en: 'Write from Scratch', he: 'כתיבה מאפס' },
    description: { en: 'Write your story in your own words, at your own pace', he: 'כתוב את הסיפור שלך במילים שלך, בקצב שלך' },
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'interview',
    icon: Mic,
    name: { en: 'Guided Interview', he: 'ראיון מונחה' },
    description: { en: 'Answer questions and we\'ll help shape your story', he: 'ענה על שאלות ואנחנו נעזור לעצב את הסיפור שלך' },
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'upload',
    icon: FileText,
    name: { en: 'Upload File', he: 'העלאת קובץ' },
    description: { en: 'Upload a text or audio file and convert it to a book', he: 'העלה קובץ טקסט או אודיו והפוך אותו לספר' },
    color: 'from-blue-500 to-cyan-500'
  },
];

// Testimonials with images - memorial focused
const TESTIMONIALS = [
  {
    id: 1,
    image: '/img/testimonial-elder.png',
    quote: {
      en: "We created a memorial book for our father with the whole family. Each person contributed a memory. The result moved us to tears.",
      he: "יצרנו ספר הנצחה לאבא עם כל המשפחה. כל אחד תרם זיכרון. התוצאה הניעה אותנו לדמעות."
    },
    author: { en: "The Levy Family", he: "משפחת לוי" },
    category: { en: "Memorial Book", he: "ספר הנצחה" }
  },
  {
    id: 2,
    image: '/img/memorial-family.png',
    quote: {
      en: "Our son fell in battle. Thanks to MeStory, we collected stories from his friends and commanders. His memory will live forever.",
      he: "הבן שלנו נפל בקרב. בזכות MeStory, אספנו סיפורים מחבריו ומפקדיו. זכרו יחיה לעד."
    },
    author: { en: "The Cohen Family", he: "משפחת כהן" },
    category: { en: "Fallen Soldier", he: "חלל צה\"ל" }
  },
  {
    id: 3,
    image: '/img/grandmother-author.png',
    quote: {
      en: "At 87, I finally told my Holocaust story. My grandchildren will now know where they came from and what our family survived.",
      he: "בגיל 87 סיפרתי סוף סוף את סיפור השואה שלי. הנכדים שלי עכשיו יידעו מאיפה הם באו ומה המשפחה שלנו עברה."
    },
    author: { en: "Sarah, 87", he: "שרה, 87" },
    category: { en: "Holocaust Survivor", he: "ניצולת שואה" }
  },
];

// Stats
const STATS = [
  { value: '10,000+', label: { en: 'Stories Shared', he: 'סיפורים שנכתבו' } },
  { value: '50+', label: { en: 'Countries', he: 'מדינות' } },
  { value: '98%', label: { en: 'Feel Proud', he: 'מרגישים גאווה' } },
];

export default function MyStoryPage() {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [stories, setStories] = useState<StoryBook[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);

  const isHebrew = language === 'he';

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch true stories from the marketplace
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoadingStories(true);
        const response = await api.get('/books', {
          params: {
            category: 'TrueStory',
            limit: 8,
            sortBy: 'createdAt'
          }
        });
        setStories(response.data.books || []);
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setLoadingStories(false);
      }
    };
    fetchStories();
  }, []);

  const handleStartWriting = (method?: string) => {
    if (method === 'scratch') {
      navigate('/dashboard?mode=scratch');
    } else if (method === 'interview') {
      navigate('/dashboard?mode=interview');
    } else if (method === 'upload') {
      navigate('/dashboard?mode=import');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-space via-slate-900 to-deep-space">
      <SEO
        title={isHebrew ? "הסיפור שלי | MeStory" : "My Story | MeStory"}
        description={isHebrew
          ? "לכל אחד יש סיפור. זה המקום לספר את שלך. כתוב, שתף והנצח את הסיפור האישי שלך."
          : "Everyone has a story. This is the place to tell yours. Write, share, and immortalize your personal story."
        }
      />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background with parallax effect */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: 'url(/img/memorial-hero.png)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-space/50 via-deep-space/80 to-deep-space" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.2, 0.6, 0.2],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/30 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">
                {isHebrew ? 'הלב של MeStory' : 'The Heart of MeStory'}
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="text-white">{isHebrew ? 'לכל אחד יש' : 'Everyone Has'}</span>
              <br />
              <span
                className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {isHebrew ? 'סיפור לספר' : 'A Story to Tell'}
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed"
            >
              {isHebrew
                ? 'זה המקום לחשיפה אמיתית. לאומץ. להנציח, להשמיע ולהוציא לעולם את מה שעברת.'
                : 'This is the place for real exposure. For courage. To immortalize, amplify, and share what you\'ve been through.'}
            </motion.p>

            {/* Secondary message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-base sm:text-lg text-gray-400 mb-8 max-w-2xl mx-auto"
            >
              {isHebrew
                ? 'כל אחד עבר משהו. כל אחד נושא סיפור. הגיע הזמן שהסיפור שלך ייצא מהראש - אל הדף, אל העולם, אל הנצח.'
                : 'Everyone has been through something. Everyone carries a story. It\'s time for your story to leave your mind - onto the page, into the world, into eternity.'}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => handleStartWriting()}
                className="group px-8 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white text-lg font-bold rounded-full hover:shadow-[0_0_40px_rgba(251,191,36,0.5)] transition-all duration-300 flex items-center gap-3"
              >
                <Pen className="w-5 h-5" />
                {isHebrew ? 'התחל לכתוב את הסיפור שלך' : 'Start Writing Your Story'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/marketplace?category=TrueStory')}
                className="px-8 py-4 bg-white/10 text-white text-lg font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                {isHebrew ? 'קרא סיפורים אמיתיים' : 'Read True Stories'}
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              {STATS.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-amber-400">{stat.value}</div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label[language]}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-gray-400"
            >
              <ChevronDown className="w-8 h-8" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Story Categories Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              {isHebrew ? 'איזה סיפור תרצה לספר?' : 'What Story Do You Want to Tell?'}
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {isHebrew
                ? 'בחר את הקטגוריה שהכי מתאימה לסיפור שלך'
                : 'Choose the category that best fits your story'}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {STORY_CATEGORIES.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                className={`relative p-6 rounded-2xl text-center transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]'
                    : 'bg-white/5 border border-white/10 hover:border-amber-400/30 hover:bg-white/10'
                }`}
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <div className="text-white font-semibold text-sm">
                  {category.name[language]}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Selected Category Details */}
          <AnimatePresence>
            {selectedCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8"
              >
                {STORY_CATEGORIES.filter(c => c.id === selectedCategory).map(category => (
                  <div
                    key={category.id}
                    className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-8 border border-amber-400/20"
                  >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-right">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                          <span className="text-5xl">{category.icon}</span>
                          <h3 className="text-2xl font-bold text-white">{category.name[language]}</h3>
                        </div>
                        <p className="text-gray-300 mb-4">{category.description[language]}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                          {category.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-amber-500/20 text-amber-300 text-sm rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartWriting()}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all whitespace-nowrap"
                      >
                        {isHebrew ? 'התחל לכתוב' : 'Start Writing'}
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Featured Stories Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: 'url(/img/memorial-family.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-space via-deep-space/95 to-deep-space" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/50" />
              <span className="text-amber-400 text-sm font-medium">
                {isHebrew ? 'סיפורים שנכתבו על ידי אנשים אמיתיים' : 'Stories Written by Real People'}
              </span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/50" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              {isHebrew ? 'גלה סיפורים אמיתיים' : 'Discover True Stories'}
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {isHebrew
                ? 'קרא סיפורים מרגשים של אנשים שבחרו לשתף את החוויות שלהם עם העולם'
                : 'Read moving stories from people who chose to share their experiences with the world'}
            </p>
          </motion.div>

          {/* Stories Grid */}
          {loadingStories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-white/10 rounded-xl mb-3" />
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : stories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {stories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/book/${story.id}`}
                    className="group block"
                  >
                    {/* Book Cover */}
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/20 group-hover:border-amber-400/50 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                      {story.coverImage ? (
                        <OptimizedImage
                          src={story.coverImage}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-amber-400/40" />
                        </div>
                      )}

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-white text-sm font-medium flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          {isHebrew ? 'קרא עכשיו' : 'Read Now'}
                        </span>
                      </div>

                      {/* Price badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          story.publishingStatus?.isFree
                            ? 'bg-green-500/90 text-white'
                            : 'bg-amber-500/90 text-white'
                        }`}>
                          {story.publishingStatus?.isFree
                            ? (isHebrew ? 'חינם' : 'Free')
                            : formatCurrency(story.publishingStatus?.price || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Book Info */}
                    <h3 className="font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2 mb-1">
                      {story.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {isHebrew ? 'מאת' : 'by'} {story.authorName}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {story.statistics?.views || 0}
                      </span>
                      {story.statistics?.averageRating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400" />
                          {story.statistics.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {isHebrew ? 'היה הראשון לכתוב סיפור!' : 'Be the First to Write a Story!'}
              </h3>
              <p className="text-gray-400 mb-6">
                {isHebrew
                  ? 'עדיין אין סיפורים בקטגוריה הזו. הסיפור שלך יכול להיות הראשון.'
                  : 'No stories in this category yet. Your story could be the first.'}
              </p>
              <button
                onClick={() => handleStartWriting()}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all"
              >
                {isHebrew ? 'התחל לכתוב' : 'Start Writing'}
              </button>
            </div>
          )}

          {/* View All Button */}
          {stories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link
                to="/marketplace?category=TrueStory"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-full border border-amber-400/30 hover:bg-amber-500/20 hover:border-amber-400/50 transition-all duration-300 group"
              >
                {isHebrew ? 'גלה עוד סיפורים' : 'Discover More Stories'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-5"
          style={{ backgroundImage: 'url(/img/community-group.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-space via-amber-500/5 to-deep-space" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              {isHebrew ? 'איך תרצה לכתוב?' : 'How Would You Like to Write?'}
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {isHebrew
                ? 'בחר את הדרך שהכי נוחה לך - אנחנו כאן לעזור בכל צעד'
                : 'Choose the way that works best for you - we\'re here to help every step of the way'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {WRITING_METHODS.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                onClick={() => handleStartWriting(method.id)}
                className="cursor-pointer group"
              >
                <div className="relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 h-full">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <method.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3">{method.name[language]}</h3>
                  <p className="text-gray-400">{method.description[language]}</p>

                  {/* Arrow */}
                  <div className="mt-6 flex items-center gap-2 text-amber-400 font-medium group-hover:gap-4 transition-all">
                    {isHebrew ? 'התחל' : 'Start'}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {isHebrew ? 'מה אומרים הכותבים שלנו' : 'What Our Writers Say'}
            </h2>
          </motion.div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl overflow-hidden border border-amber-400/20"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="md:w-1/3 h-48 md:h-auto relative">
                    <img
                      src={TESTIMONIALS[activeTestimonial].image}
                      alt={TESTIMONIALS[activeTestimonial].author[language]}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-amber-900/50 md:bg-gradient-to-l" />
                  </div>

                  {/* Content */}
                  <div className="md:w-2/3 p-8 md:p-12">
                    <Quote className="w-10 h-10 text-amber-400/40 mb-4" />
                    <p className="text-lg md:text-xl text-white font-light leading-relaxed mb-6">
                      "{TESTIMONIALS[activeTestimonial].quote[language]}"
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-amber-400 font-semibold text-lg">
                          {TESTIMONIALS[activeTestimonial].author[language]}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {TESTIMONIALS[activeTestimonial].category[language]}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {TESTIMONIALS.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveTestimonial(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === activeTestimonial
                                ? 'w-8 bg-amber-400'
                                : 'bg-white/30 hover:bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: 'url(/img/october7.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-deep-space/90 to-deep-space" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 rounded-3xl p-12 border border-amber-400/30 backdrop-blur-sm"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              {isHebrew ? 'הקול שלך ראוי להישמע' : 'Your Voice Deserves to Be Heard'}
            </h2>
            <p className="text-lg text-gray-300 mb-4 max-w-2xl mx-auto">
              {isHebrew
                ? 'מה שעברת הוא לא רק הסיפור שלך - הוא עדות. השראה. מתנה לאחרים שעוברים את אותו הדבר.'
                : 'What you\'ve been through is not just your story - it\'s a testimony. An inspiration. A gift to others going through the same thing.'}
            </p>
            <p className="text-base text-amber-400/80 mb-8 max-w-xl mx-auto font-medium">
              {isHebrew
                ? 'אל תתן לסיפור שלך להישאר בפנים. תן לו לצאת.'
                : 'Don\'t let your story stay inside. Let it out.'}
            </p>
            <button
              onClick={() => handleStartWriting()}
              className="group px-10 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white text-xl font-bold rounded-full hover:shadow-[0_0_50px_rgba(251,191,36,0.5)] transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              <BookOpen className="w-6 h-6" />
              {isHebrew ? 'אני מוכן לספר' : 'I\'m Ready to Tell'}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
