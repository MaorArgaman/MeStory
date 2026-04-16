import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  Mail,
  UserPlus,
  CheckCircle,
  Edit3,
  Eye,
  Crown,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Shield,
  Clock,
  HelpCircle
} from 'lucide-react';
import { SEO } from '../../components/seo';

export default function HowToCollaborate() {
  const { t: _t } = useTranslation('guides');
  const { language } = useLanguage();
  void _t;
  const isRTL = language === 'he';

  const steps = [
    {
      icon: <Edit3 className="w-8 h-8" />,
      title: isRTL ? 'צרו ספר חדש' : 'Create a New Book',
      description: isRTL
        ? 'התחילו ביצירת ספר חדש מהדשבורד. אתם תהיו הבעלים והמנהלים של הספר.'
        : 'Start by creating a new book from your dashboard. You will be the owner and manager of the book.',
    },
    {
      icon: <UserPlus className="w-8 h-8" />,
      title: isRTL ? 'הזמינו משתתפים' : 'Invite Participants',
      description: isRTL
        ? 'לחצו על אייקון האנשים בדף הספר והזינו את המייל של החברים שתרצו להזמין.'
        : 'Click the people icon on the book page and enter the email addresses of friends you want to invite.',
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: isRTL ? 'המוזמנים מקבלים הזמנה' : 'Invitees Receive Invitation',
      description: isRTL
        ? 'החברים יקבלו מייל עם קישור להצטרפות. הם יצטרכו להירשם או להתחבר כדי לאשר.'
        : 'Friends will receive an email with a join link. They need to sign up or log in to accept.',
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: isRTL ? 'התחילו לכתוב יחד!' : 'Start Writing Together!',
      description: isRTL
        ? 'אחרי שהמוזמנים מאשרים, כולם יכולים לערוך את הספר ולראות שינויים בזמן אמת.'
        : 'After invitees accept, everyone can edit the book and see changes in real-time.',
    },
  ];

  const roles = [
    {
      icon: <Eye className="w-6 h-6" />,
      name: isRTL ? 'צופה (Viewer)' : 'Viewer',
      description: isRTL ? 'יכול לקרוא את הספר בלבד' : 'Can only read the book',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      icon: <Edit3 className="w-6 h-6" />,
      name: isRTL ? 'עורך (Editor)' : 'Editor',
      description: isRTL ? 'יכול לערוך תוכן ולהוסיף פרקים' : 'Can edit content and add chapters',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      icon: <Crown className="w-6 h-6" />,
      name: isRTL ? 'מחבר משותף (Co-Author)' : 'Co-Author',
      description: isRTL ? 'הרשאות מלאות כולל עיצוב ופרסום' : 'Full permissions including design and publishing',
      color: 'text-memorial-gold',
      bgColor: 'bg-memorial-gold/20',
    },
  ];

  const tips = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      text: isRTL ? 'תאמו מראש מי כותב איזה פרק' : 'Coordinate in advance who writes which chapter',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      text: isRTL ? 'שמרו לעתים קרובות למרות השמירה האוטומטית' : 'Save frequently despite auto-save',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      text: isRTL ? 'ההזמנות תקפות ל-7 ימים' : 'Invitations are valid for 7 days',
    },
  ];

  const faqs = [
    {
      q: isRTL ? 'האם אפשר להזמין מישהו בלי חשבון?' : 'Can I invite someone without an account?',
      a: isRTL ? 'כן! הם יקבלו מייל עם קישור להרשמה.' : 'Yes! They will receive an email with a signup link.',
    },
    {
      q: isRTL ? 'יש הגבלה על מספר המשתתפים?' : 'Is there a limit on participants?',
      a: isRTL ? 'לא, אפשר להזמין כמה משתתפים שרוצים.' : 'No, you can invite as many participants as you want.',
    },
    {
      q: isRTL ? 'מי יכול לפרסם את הספר?' : 'Who can publish the book?',
      a: isRTL ? 'רק בעל הספר ומחברים משותפים (Co-Authors).' : 'Only the owner and Co-Authors.',
    },
  ];

  return (
    <div className="min-h-screen py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        title={isRTL ? 'מדריך כתיבה שיתופית | MeStory' : 'Collaboration Guide | MeStory'}
        description={isRTL ? 'למדו איך לכתוב ספרים יחד עם חברים ומשפחה' : 'Learn how to write books together with friends and family'}
      />

      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/guides"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isRTL ? 'חזרה למדריכים' : 'Back to Guides'}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-memorial-gold/20 mb-6">
            <Users className="w-10 h-10 text-memorial-gold" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {isRTL ? 'מדריך כתיבה שיתופית' : 'Collaborative Writing Guide'}
          </h1>
          <p className="text-xl text-gray-400">
            {isRTL
              ? 'כתבו ספרים יחד עם חברים, משפחה או עמיתים'
              : 'Write books together with friends, family, or colleagues'}
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            {isRTL ? 'איך זה עובד?' : 'How Does It Work?'}
          </h2>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-memorial-gold/20 flex items-center justify-center text-memorial-gold">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-memorial-gold font-bold">{index + 1}.</span>
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  </div>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Roles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            {isRTL ? 'סוגי הרשאות' : 'Permission Types'}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {roles.map((role, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl ${role.bgColor} border border-white/10 text-center`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${role.bgColor} ${role.color} mb-4`}>
                  {role.icon}
                </div>
                <h3 className={`text-lg font-semibold ${role.color} mb-2`}>{role.name}</h3>
                <p className="text-gray-400 text-sm">{role.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            {isRTL ? 'טיפים לכתיבה שיתופית מוצלחת' : 'Tips for Successful Collaboration'}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {tips.map((tip, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3"
              >
                <div className="text-memorial-gold">{tip.icon}</div>
                <p className="text-gray-300 text-sm">{tip.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-memorial-gold" />
            {isRTL ? 'שאלות נפוצות' : 'FAQ'}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-white/5 border border-white/10"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center p-8 rounded-2xl bg-gradient-to-r from-memorial-gold/20 to-amber-600/20 border border-memorial-gold/30"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            {isRTL ? 'מוכנים להתחיל לכתוב יחד?' : 'Ready to Start Writing Together?'}
          </h2>
          <p className="text-gray-400 mb-6">
            {isRTL
              ? 'צרו ספר חדש והזמינו את החברים שלכם לכתוב איתכם'
              : 'Create a new book and invite your friends to write with you'}
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 bg-memorial-gold text-gray-900 font-bold rounded-lg hover:bg-amber-500 transition-colors"
          >
            {isRTL ? 'צרו ספר חדש' : 'Create New Book'}
            {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
