import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import {
  BookOpen,
  Users,
  Award,
  Shield,
  Lock,
  Mail,
  Globe,
  Sparkles,
  Target,
  Heart,
  CheckCircle,
  Building,
  Calendar,
  Cpu,
  FileCheck,
  BadgeCheck,
} from 'lucide-react';
import { GlassCard } from '../components/ui';
import { OrganizationSchema, BreadcrumbSchema } from '../components/seo';
import { useLanguage } from '../contexts/LanguageContext';

// Content translations
const content = {
  en: {
    seo: {
      title: 'About MeStory - Our Story',
      description: 'Learn about MeStory, the leading AI-powered book writing and publishing platform. Founded in 2024, we democratize book publishing for authors worldwide.',
    },
    hero: {
      title: 'About MeStory',
      subtitle: 'Empowering Every Story to Be Told',
      mission: 'We believe everyone has a story worth sharing. Our mission is to democratize book publishing by providing AI-powered tools that make writing, designing, and publishing accessible to all.',
    },
    ourStory: {
      title: 'Our Story',
      content: 'MeStory was founded in 2024 with a simple yet powerful vision: to break down the barriers that prevent aspiring authors from sharing their stories with the world. We recognized that traditional publishing is often inaccessible, expensive, and time-consuming. Our founders, passionate about both technology and literature, set out to create a platform that combines cutting-edge AI with intuitive design to empower writers at every level.',
      founded: 'Founded',
      year: '2024',
      location: 'Israel',
    },
    ourMission: {
      title: 'Our Mission',
      subtitle: 'Democratizing Book Publishing',
      points: [
        {
          title: 'Accessibility',
          description: 'Making professional book publishing tools available to everyone, regardless of technical skills or budget.',
        },
        {
          title: 'Innovation',
          description: 'Leveraging the latest AI technology to assist writers without replacing their unique voice and creativity.',
        },
        {
          title: 'Community',
          description: 'Building a supportive ecosystem where authors can publish, sell, and connect with readers worldwide.',
        },
        {
          title: 'Quality',
          description: 'Ensuring every book published through our platform meets professional standards.',
        },
      ],
    },
    stats: {
      title: 'By the Numbers',
      subtitle: 'Trusted by authors worldwide',
      items: [
        { value: '50K+', label: 'Authors', icon: Users },
        { value: '200K+', label: 'Books Created', icon: BookOpen },
        { value: '500K+', label: 'Readers', icon: Heart },
        { value: '4.8', label: 'Average Rating', icon: Award },
      ],
    },
    technology: {
      title: 'Our Technology',
      subtitle: 'Powered by Advanced AI',
      description: 'MeStory utilizes state-of-the-art artificial intelligence to enhance your writing experience. Our AI models are trained on millions of published works to provide intelligent suggestions while preserving your unique voice.',
      features: [
        {
          title: 'AI Writing Assistant',
          description: 'Context-aware suggestions that help overcome writer\'s block and enhance your narrative.',
        },
        {
          title: 'Smart Cover Design',
          description: 'AI-powered cover generation that creates professional designs tailored to your genre.',
        },
        {
          title: 'Intelligent Editing',
          description: 'Advanced grammar, style, and readability analysis to polish your manuscript.',
        },
        {
          title: 'Quality Scoring',
          description: 'Comprehensive evaluation system that ensures your book meets publishing standards.',
        },
      ],
    },
    trust: {
      title: 'Trust & Security',
      subtitle: 'Your Security is Our Priority',
      description: 'We take the protection of your creative work seriously. Our platform implements industry-leading security measures to ensure your content and data are always safe.',
      badges: [
        { title: 'SSL Encrypted', description: 'All data transfers are encrypted with 256-bit SSL', icon: Lock },
        { title: 'GDPR Compliant', description: 'Full compliance with EU data protection regulations', icon: Shield },
        { title: 'Secure Payments', description: 'PayPal-secured transactions for all purchases', icon: BadgeCheck },
        { title: 'Data Protection', description: 'Regular backups and secure data storage', icon: FileCheck },
      ],
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'We\'re Here to Help',
      description: 'Have questions or need assistance? Our support team is ready to help you on your writing journey.',
      email: 'support@mestory.co.il',
      emailLabel: 'Email Support',
      companyName: 'MeStory Ltd.',
      companyLabel: 'Company',
      responseTime: 'We typically respond within 24 hours',
    },
    values: {
      title: 'Our Values',
      items: [
        { title: 'Author First', description: 'Every decision we make puts authors\' needs at the center.' },
        { title: 'Transparency', description: 'Clear pricing, fair royalties, and honest communication.' },
        { title: 'Continuous Innovation', description: 'Always improving our platform with the latest technology.' },
      ],
    },
  },
  he: {
    seo: {
      title: 'אודות MeStory - הסיפור שלנו',
      description: 'למדו על MeStory, הפלטפורמה המובילה לכתיבת ופרסום ספרים מבוססת בינה מלאכותית. נוסדנו ב-2024, אנו מנגישים את פרסום הספרים לכותבים בכל העולם.',
    },
    hero: {
      title: 'אודות MeStory',
      subtitle: 'מעצימים כל סיפור להיות מסופר',
      mission: 'אנחנו מאמינים שלכל אחד יש סיפור ששווה לשתף. המשימה שלנו היא להנגיש את פרסום הספרים על ידי אספקת כלים מונעי בינה מלאכותית שהופכים את הכתיבה, העיצוב והפרסום לנגישים לכולם.',
    },
    ourStory: {
      title: 'הסיפור שלנו',
      content: 'MeStory נוסדה ב-2024 עם חזון פשוט אך עוצמתי: לשבור את המחסומים שמונעים מכותבים שאפתניים לשתף את הסיפורים שלהם עם העולם. הבנו שהפרסום המסורתי הוא לעתים קרובות בלתי נגיש, יקר וגוזל זמן. המייסדים שלנו, נלהבים מטכנולוגיה וספרות כאחד, יצאו ליצור פלטפורמה המשלבת בינה מלאכותית מתקדמת עם עיצוב אינטואיטיבי כדי להעצים כותבים בכל רמה.',
      founded: 'נוסדה',
      year: '2024',
      location: 'ישראל',
    },
    ourMission: {
      title: 'המשימה שלנו',
      subtitle: 'הנגשת פרסום ספרים',
      points: [
        {
          title: 'נגישות',
          description: 'הפיכת כלי פרסום ספרים מקצועיים לזמינים לכולם, ללא קשר ליכולות טכניות או תקציב.',
        },
        {
          title: 'חדשנות',
          description: 'שימוש בטכנולוגיית AI העדכנית ביותר לסיוע לכותבים מבלי להחליף את הקול והיצירתיות הייחודיים שלהם.',
        },
        {
          title: 'קהילה',
          description: 'בניית מערכת אקולוגית תומכת שבה מחברים יכולים לפרסם, למכור ולהתחבר לקוראים בכל העולם.',
        },
        {
          title: 'איכות',
          description: 'הבטחה שכל ספר שמתפרסם בפלטפורמה שלנו עומד בסטנדרטים מקצועיים.',
        },
      ],
    },
    stats: {
      title: 'במספרים',
      subtitle: 'זוכים לאמון מחברים ברחבי העולם',
      items: [
        { value: '+50K', label: 'מחברים', icon: Users },
        { value: '+200K', label: 'ספרים נוצרו', icon: BookOpen },
        { value: '+500K', label: 'קוראים', icon: Heart },
        { value: '4.8', label: 'דירוג ממוצע', icon: Award },
      ],
    },
    technology: {
      title: 'הטכנולוגיה שלנו',
      subtitle: 'מונע על ידי AI מתקדם',
      description: 'MeStory משתמשת בבינה מלאכותית מתקדמת לשיפור חוויית הכתיבה שלכם. מודלי ה-AI שלנו מאומנים על מיליוני יצירות מפורסמות כדי לספק הצעות חכמות תוך שמירה על הקול הייחודי שלכם.',
      features: [
        {
          title: 'עוזר כתיבה AI',
          description: 'הצעות מודעות הקשר שעוזרות להתגבר על חסימת סופר ולשפר את הנרטיב שלכם.',
        },
        {
          title: 'עיצוב כריכה חכם',
          description: 'יצירת כריכות מונעת AI שמייצרת עיצובים מקצועיים מותאמים לז\'אנר שלכם.',
        },
        {
          title: 'עריכה אינטליגנטית',
          description: 'ניתוח מתקדם של דקדוק, סגנון וקריאות לליטוש כתב היד שלכם.',
        },
        {
          title: 'ציון איכות',
          description: 'מערכת הערכה מקיפה שמבטיחה שהספר שלכם עומד בסטנדרטים לפרסום.',
        },
      ],
    },
    trust: {
      title: 'אמון ואבטחה',
      subtitle: 'האבטחה שלכם היא העדיפות שלנו',
      description: 'אנחנו מתייחסים ברצינות להגנה על היצירות שלכם. הפלטפורמה שלנו מיישמת אמצעי אבטחה מובילים בתעשייה כדי להבטיח שהתוכן והנתונים שלכם תמיד בטוחים.',
      badges: [
        { title: 'הצפנת SSL', description: 'כל העברות הנתונים מוצפנות ב-SSL 256-bit', icon: Lock },
        { title: 'תאימות GDPR', description: 'תאימות מלאה לתקנות הגנת הנתונים של האיחוד האירופי', icon: Shield },
        { title: 'תשלומים מאובטחים', description: 'עסקאות מאובטחות על ידי PayPal לכל הרכישות', icon: BadgeCheck },
        { title: 'הגנת נתונים', description: 'גיבויים קבועים ואחסון נתונים מאובטח', icon: FileCheck },
      ],
    },
    contact: {
      title: 'צרו קשר',
      subtitle: 'אנחנו כאן לעזור',
      description: 'יש לכם שאלות או צריכים עזרה? צוות התמיכה שלנו מוכן לעזור לכם במסע הכתיבה שלכם.',
      email: 'support@mestory.co.il',
      emailLabel: 'תמיכה במייל',
      companyName: 'MeStory Ltd.',
      companyLabel: 'חברה',
      responseTime: 'אנחנו בדרך כלל עונים תוך 24 שעות',
    },
    values: {
      title: 'הערכים שלנו',
      items: [
        { title: 'המחבר קודם', description: 'כל החלטה שאנחנו מקבלים שמה את צרכי המחברים במרכז.' },
        { title: 'שקיפות', description: 'תמחור ברור, תמלוגים הוגנים ותקשורת כנה.' },
        { title: 'חדשנות מתמדת', description: 'תמיד משפרים את הפלטפורמה שלנו עם הטכנולוגיה העדכנית ביותר.' },
      ],
    },
  },
};

export default function AboutPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const t = content[language];
  const locale = isHebrew ? 'he' : 'en';

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Breadcrumb for SEO
  const breadcrumbs = [
    { name: isHebrew ? 'דף הבית' : 'Home', url: 'https://mestory.co.il' },
    { name: isHebrew ? 'אודות' : 'About', url: 'https://mestory.co.il/about' },
  ];

  useSEO({
    title: t.seo.title,
    description: t.seo.description,
    canonicalUrl: 'https://mestory.co.il/about',
  });

  return (
    <>
      {/* Structured Data for SEO */}
      <OrganizationSchema locale={locale} />
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="min-h-screen py-20 px-4 sm:px-8" dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.header
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-magic-gold/30 to-cosmic-purple/30 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-magic-gold" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-gold mb-4">
              {t.hero.title}
            </h1>
            <p className="text-2xl text-cosmic-purple font-semibold mb-6">
              {t.hero.subtitle}
            </p>
            <p className="text-gray-300 max-w-3xl mx-auto text-lg leading-relaxed">
              {t.hero.mission}
            </p>
          </motion.header>

          {/* Our Story Section */}
          <motion.section
            {...fadeInUp}
            transition={{ delay: 0.1 }}
            className="mb-16"
            aria-labelledby="our-story-heading"
          >
            <GlassCard hover={false} className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h2 id="our-story-heading" className="text-3xl font-display font-bold text-white mb-6 flex items-center gap-3">
                    <Target className="w-8 h-8 text-magic-gold" />
                    {t.ourStory.title}
                  </h2>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {t.ourStory.content}
                  </p>
                </div>
                <div className="flex flex-col gap-4 md:min-w-[200px]">
                  <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                    <Calendar className="w-6 h-6 text-magic-gold" />
                    <div>
                      <p className="text-gray-400 text-sm">{t.ourStory.founded}</p>
                      <p className="text-white font-bold text-xl">{t.ourStory.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                    <Globe className="w-6 h-6 text-magic-gold" />
                    <div>
                      <p className="text-gray-400 text-sm">{isHebrew ? 'מיקום' : 'Location'}</p>
                      <p className="text-white font-bold text-xl">{t.ourStory.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.section>

          {/* Our Mission Section */}
          <motion.section
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="mb-16"
            aria-labelledby="mission-heading"
          >
            <div className="text-center mb-8">
              <h2 id="mission-heading" className="text-3xl font-display font-bold gradient-gold mb-2">
                {t.ourMission.title}
              </h2>
              <p className="text-gray-400 text-lg">{t.ourMission.subtitle}</p>
            </div>
            <motion.div
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {t.ourMission.points.map((point, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <GlassCard hover={false} className="p-6 h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-magic-gold/20 to-cosmic-purple/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-magic-gold" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{point.title}</h3>
                        <p className="text-gray-300 leading-relaxed">{point.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* By the Numbers Section */}
          <motion.section
            {...fadeInUp}
            transition={{ delay: 0.3 }}
            className="mb-16"
            aria-labelledby="stats-heading"
          >
            <GlassCard glow="gold" hover={false} className="p-8">
              <div className="text-center mb-8">
                <h2 id="stats-heading" className="text-3xl font-display font-bold gradient-gold mb-2">
                  {t.stats.title}
                </h2>
                <p className="text-gray-400">{t.stats.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {t.stats.items.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-magic-gold/20 to-cosmic-purple/20 flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-7 h-7 text-magic-gold" />
                      </div>
                      <p className="text-3xl md:text-4xl font-bold gradient-gold mb-1">{stat.value}</p>
                      <p className="text-gray-400">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.section>

          {/* Technology Section */}
          <motion.section
            {...fadeInUp}
            transition={{ delay: 0.4 }}
            className="mb-16"
            aria-labelledby="tech-heading"
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Cpu className="w-10 h-10 text-magic-gold" />
              </div>
              <h2 id="tech-heading" className="text-3xl font-display font-bold gradient-gold mb-2">
                {t.technology.title}
              </h2>
              <p className="text-cosmic-purple font-semibold mb-4">{t.technology.subtitle}</p>
              <p className="text-gray-300 max-w-3xl mx-auto">
                {t.technology.description}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {t.technology.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <GlassCard hover={false} className="p-6 h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-purple/30 to-magic-gold/30 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-magic-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-300">{feature.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Trust & Security Section */}
          <motion.section
            {...fadeInUp}
            transition={{ delay: 0.5 }}
            className="mb-16"
            aria-labelledby="trust-heading"
          >
            <GlassCard glow="purple" hover={false} className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Shield className="w-10 h-10 text-magic-gold" />
                </div>
                <h2 id="trust-heading" className="text-3xl font-display font-bold gradient-gold mb-2">
                  {t.trust.title}
                </h2>
                <p className="text-cosmic-purple font-semibold mb-4">{t.trust.subtitle}</p>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  {t.trust.description}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {t.trust.badges.map((badge, index) => {
                  const Icon = badge.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="bg-white/5 rounded-xl p-5 text-center border border-white/10 hover:border-magic-gold/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-6 h-6 text-green-400" />
                      </div>
                      <h3 className="text-white font-semibold mb-1">{badge.title}</h3>
                      <p className="text-gray-400 text-sm">{badge.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.section>

          {/* Our Values Section */}
          <motion.section
            {...fadeInUp}
            transition={{ delay: 0.6 }}
            className="mb-16"
            aria-labelledby="values-heading"
          >
            <div className="text-center mb-8">
              <h2 id="values-heading" className="text-3xl font-display font-bold gradient-gold mb-2">
                {t.values.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {t.values.items.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <GlassCard hover={false} className="p-6 text-center h-full">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-magic-gold/20 to-cosmic-purple/20 flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-6 h-6 text-magic-gold" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                    <p className="text-gray-300">{value.description}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Contact Section */}
          <motion.section
            {...fadeInUp}
            transition={{ delay: 0.7 }}
            className="mb-12"
            aria-labelledby="contact-heading"
          >
            <GlassCard glow="gold" hover={false} className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Mail className="w-10 h-10 text-magic-gold" />
              </div>
              <h2 id="contact-heading" className="text-3xl font-display font-bold gradient-gold mb-2">
                {t.contact.title}
              </h2>
              <p className="text-cosmic-purple font-semibold mb-4">{t.contact.subtitle}</p>
              <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                {t.contact.description}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
                <div className="flex items-center gap-3 bg-white/5 rounded-lg px-6 py-4">
                  <Mail className="w-5 h-5 text-magic-gold" />
                  <div className={`text-${isHebrew ? 'right' : 'left'}`}>
                    <p className="text-gray-400 text-sm">{t.contact.emailLabel}</p>
                    <a
                      href={`mailto:${t.contact.email}`}
                      className="text-white font-semibold hover:text-magic-gold transition-colors"
                    >
                      {t.contact.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-lg px-6 py-4">
                  <Building className="w-5 h-5 text-magic-gold" />
                  <div className={`text-${isHebrew ? 'right' : 'left'}`}>
                    <p className="text-gray-400 text-sm">{t.contact.companyLabel}</p>
                    <p className="text-white font-semibold">{t.contact.companyName}</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                {t.contact.responseTime}
              </p>
            </GlassCard>
          </motion.section>

          {/* Footer Links */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-gray-500 text-sm"
          >
            <p>
              {isHebrew ? 'מידע נוסף זמין ב' : 'More information available in our'}{' '}
              <a href="/terms" className="text-magic-gold hover:underline">
                {isHebrew ? 'תנאי שימוש' : 'Terms of Service'}
              </a>
              {' '}{isHebrew ? 'וב' : 'and'}{' '}
              <a href="/privacy" className="text-magic-gold hover:underline">
                {isHebrew ? 'מדיניות פרטיות' : 'Privacy Policy'}
              </a>
            </p>
          </motion.footer>
        </div>
      </div>
    </>
  );
}
