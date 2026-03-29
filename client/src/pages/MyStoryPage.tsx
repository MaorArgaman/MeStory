import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Sparkles, ArrowRight,
  Pen, Quote, ChevronDown, Mic, FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO } from '../components/seo';

// Story categories with emotional icons
const STORY_CATEGORIES = [
  {
    id: 'family',
    icon: '👨‍👩‍👧‍👦',
    name: { en: 'Family Stories', he: 'סיפורי משפחה' },
    description: { en: 'Stories of generations, heritage, and bonds that last forever', he: 'סיפורים של דורות, מורשת וקשרים שנשארים לנצח' },
    tags: ['משפחה', 'מורשת', 'דורות', 'שורשים', 'הורים', 'ילדים']
  },
  {
    id: 'overcoming',
    icon: '💪',
    name: { en: 'Overcoming Challenges', he: 'התמודדות והתגברות' },
    description: { en: 'Stories of strength, resilience, and triumph over adversity', he: 'סיפורים של כוח, חוסן וניצחון על קשיים' },
    tags: ['התמודדות', 'חוסן', 'התגברות', 'כוח', 'אתגרים']
  },
  {
    id: 'love',
    icon: '❤️',
    name: { en: 'Love & Relationships', he: 'אהבה ויחסים' },
    description: { en: 'Stories of love found, lost, and everything in between', he: 'סיפורים של אהבה שנמצאה, אבדה וכל מה שביניהם' },
    tags: ['אהבה', 'זוגיות', 'יחסים', 'פרידה', 'מפגש']
  },
  {
    id: 'military',
    icon: '🎖️',
    name: { en: 'Service & Military', he: 'שירות וצבא' },
    description: { en: 'Stories of service, sacrifice, and brotherhood', he: 'סיפורים של שירות, הקרבה ואחווה' },
    tags: ['צבא', 'שירות', 'לוחמים', 'גבורה', 'חברות']
  },
  {
    id: 'immigration',
    icon: '🌍',
    name: { en: 'Immigration & Roots', he: 'היגרציה ושורשים' },
    description: { en: 'Stories of journeys, new beginnings, and finding home', he: 'סיפורים של מסעות, התחלות חדשות ומציאת בית' },
    tags: ['עלייה', 'היגרציה', 'גלות', 'שורשים', 'מולדת']
  },
  {
    id: 'health',
    icon: '🏥',
    name: { en: 'Health & Recovery', he: 'בריאות והחלמה' },
    description: { en: 'Stories of healing, hope, and the human spirit', he: 'סיפורים של ריפוי, תקווה והרוח האנושית' },
    tags: ['מחלה', 'החלמה', 'בריאות', 'רפואה', 'תקווה']
  },
  {
    id: 'career',
    icon: '💼',
    name: { en: 'Career & Dreams', he: 'קריירה וחלומות' },
    description: { en: 'Stories of ambition, success, and following your passion', he: 'סיפורים של שאיפות, הצלחה ומרדף אחרי החלום' },
    tags: ['קריירה', 'יזמות', 'הצלחה', 'חלומות', 'עסקים']
  },
  {
    id: 'growth',
    icon: '🌱',
    name: { en: 'Personal Growth', he: 'צמיחה אישית' },
    description: { en: 'Stories of transformation, self-discovery, and becoming', he: 'סיפורים של שינוי, גילוי עצמי והתהוות' },
    tags: ['צמיחה', 'התפתחות', 'שינוי', 'מסע', 'תובנות']
  },
  {
    id: 'moments',
    icon: '✨',
    name: { en: 'Defining Moments', he: 'רגעים מעצבים' },
    description: { en: 'Stories of the moments that changed everything', he: 'סיפורים על הרגעים ששינו הכל' },
    tags: ['רגעים', 'נקודות מפנה', 'גילויים', 'החלטות']
  },
  {
    id: 'childhood',
    icon: '💎',
    name: { en: 'Childhood Memories', he: 'זיכרונות ילדות' },
    description: { en: 'Stories from the days that shaped who we are', he: 'סיפורים מהימים שעיצבו את מי שאנחנו' },
    tags: ['ילדות', 'זיכרונות', 'נוסטלגיה', 'גדילה']
  },
];

// Ways to write your story
const WRITING_METHODS = [
  {
    id: 'interview',
    icon: Mic,
    name: { en: 'Voice Interview', he: 'ראיון קולי' },
    description: { en: 'Tell your story out loud and we\'ll help you write it', he: 'ספר את הסיפור שלך בקול ואנחנו נעזור לך לכתוב אותו' },
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'guided',
    icon: FileText,
    name: { en: 'Guided Questions', he: 'שאלות מנחות' },
    description: { en: 'Answer questions that help bring your story to life', he: 'ענה על שאלות שעוזרות להחיות את הסיפור שלך' },
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'write',
    icon: Pen,
    name: { en: 'Free Writing', he: 'כתיבה חופשית' },
    description: { en: 'Write your story in your own words, your way', he: 'כתוב את הסיפור שלך במילים שלך, בדרך שלך' },
    color: 'from-amber-500 to-orange-500'
  },
];

// Testimonials
const TESTIMONIALS = [
  {
    id: 1,
    quote: {
      en: "I never thought my story mattered until I wrote it down. Now my grandchildren will know where they came from.",
      he: "מעולם לא חשבתי שהסיפור שלי חשוב עד שכתבתי אותו. עכשיו הנכדים שלי יידעו מאיפה הם באו."
    },
    author: { en: "Sarah, 78", he: "שרה, 78" },
    category: { en: "Family Story", he: "סיפור משפחתי" }
  },
  {
    id: 2,
    quote: {
      en: "Writing about my recovery helped me heal. Now my story helps others going through the same thing.",
      he: "לכתוב על ההחלמה שלי עזר לי להירפא. עכשיו הסיפור שלי עוזר לאחרים שעוברים את אותו הדבר."
    },
    author: { en: "David, 45", he: "דוד, 45" },
    category: { en: "Health & Recovery", he: "בריאות והחלמה" }
  },
  {
    id: 3,
    quote: {
      en: "My immigration story is my children's heritage. Thanks to MeStory, it will never be forgotten.",
      he: "סיפור העלייה שלי הוא המורשת של הילדים שלי. בזכות MeStory, הוא לעולם לא יישכח."
    },
    author: { en: "Maria, 62", he: "מריה, 62" },
    category: { en: "Immigration", he: "היגרציה" }
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
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const isHebrew = language === 'he';

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartWriting = (method?: string) => {
    if (method === 'interview') {
      navigate('/dashboard?mode=voice');
    } else if (method === 'guided') {
      navigate('/dashboard?mode=interview');
    } else {
      navigate('/dashboard?mode=scratch');
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
            style={{ backgroundImage: 'url(/img/TrueStory.png)' }}
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

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent">
        <div className="max-w-6xl mx-auto">
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
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl p-8 md:p-12 border border-amber-400/20"
              >
                <Quote className="w-12 h-12 text-amber-400/40 mb-6" />
                <p className="text-xl md:text-2xl text-white font-light leading-relaxed mb-8">
                  "{TESTIMONIALS[activeTestimonial].quote[language]}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-amber-400 font-semibold">
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
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 rounded-3xl p-12 border border-amber-400/30"
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
