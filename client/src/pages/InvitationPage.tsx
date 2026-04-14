import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Loader2,
  Heart,
  Users,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface InvitationDetails {
  bookId: string;
  bookTitle: string;
  inviterName: string;
  relationship: string;
  personalMessage?: string;
  memorialDedication?: {
    name: string;
    relationship: string;
  };
}

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const isHebrew = i18n.language === 'he';

  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responded, setResponded] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError(isHebrew ? 'קישור הזמנה לא תקין' : 'Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/collaboration/invitation/${token}`);
        if (response.data.success) {
          setInvitation(response.data.data);
        } else {
          setError(response.data.error);
        }
      } catch (err: any) {
        console.error('Error fetching invitation:', err);
        setError(
          err.response?.data?.error ||
            (isHebrew ? 'לא ניתן לטעון את ההזמנה' : 'Could not load invitation')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token, isHebrew]);

  const handleRespond = async (accept: boolean) => {
    if (!user) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/invitation/${token}`);
      return;
    }

    setResponding(true);

    try {
      const response = await api.post(`/collaboration/respond/${token}`, { accept });

      if (response.data.success) {
        setResponded(accept ? 'accepted' : 'declined');

        if (accept) {
          toast.success(
            isHebrew
              ? 'הצטרפת לספר בהצלחה!'
              : 'You have joined the book successfully!'
          );

          // Redirect to dashboard after a moment
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          toast.success(isHebrew ? 'ההזמנה נדחתה' : 'Invitation declined');
        }
      }
    } catch (err: any) {
      console.error('Error responding to invitation:', err);
      toast.error(
        err.response?.data?.error ||
          (isHebrew ? 'שגיאה בתגובה להזמנה' : 'Error responding to invitation')
      );
    } finally {
      setResponding(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-deep-space to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-memorial-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {isHebrew ? 'טוען הזמנה...' : 'Loading invitation...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-deep-space to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/20 p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {isHebrew ? 'שגיאה בהזמנה' : 'Invitation Error'}
          </h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            {isHebrew ? 'חזרה לדף הבית' : 'Return Home'}
          </button>
        </motion.div>
      </div>
    );
  }

  if (responded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-deep-space to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl border border-memorial-gold/20 p-8 text-center"
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
              responded === 'accepted'
                ? 'bg-green-500/20'
                : 'bg-gray-500/20'
            }`}
          >
            {responded === 'accepted' ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <XCircle className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {responded === 'accepted'
              ? isHebrew
                ? 'הצטרפת לספר!'
                : 'You Joined the Book!'
              : isHebrew
              ? 'ההזמנה נדחתה'
              : 'Invitation Declined'}
          </h1>
          <p className="text-gray-400 mb-6">
            {responded === 'accepted'
              ? isHebrew
                ? 'כעת תוכל/י לתרום לספר הזיכרון'
                : 'You can now contribute to the memorial book'
              : isHebrew
              ? 'תודה על התגובה'
              : 'Thank you for your response'}
          </p>
          {responded === 'accepted' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-memorial-gold to-amber-600 text-slate-900 font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              {isHebrew ? 'עבור לדשבורד' : 'Go to Dashboard'}
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-deep-space to-slate-900 flex items-center justify-center p-4"
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-memorial-gold/20 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-memorial-gold" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isHebrew ? 'הוזמנת לתרום לספר זיכרון' : "You're Invited to Contribute"}
          </h1>
          <p className="text-gray-400">
            {isHebrew
              ? 'מישהו מיוחד רוצה שתשתף/י מהזיכרונות שלך'
              : 'Someone special wants you to share your memories'}
          </p>
        </div>

        {/* Invitation Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-memorial-gold/20 overflow-hidden">
          {/* Book Info */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-memorial-gold/30 to-amber-600/30 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-7 h-7 text-memorial-gold" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">
                  {invitation?.bookTitle}
                </h2>
                {invitation?.memorialDedication && (
                  <p className="text-sm text-memorial-gold">
                    {isHebrew ? 'לזכר ' : 'In memory of '}
                    {invitation.memorialDedication.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <span className="text-gray-400 text-sm">
                  {isHebrew ? 'הוזמנת כ:' : 'Invited as:'}
                </span>
                <p className="text-white">{invitation?.relationship}</p>
              </div>
            </div>

            {invitation?.personalMessage && (
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-2">
                  {isHebrew ? 'הודעה אישית:' : 'Personal message:'}
                </p>
                <p className="text-white italic">"{invitation.personalMessage}"</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 bg-white/5 border-t border-white/10">
            {!user ? (
              <div className="text-center">
                <p className="text-gray-400 mb-4">
                  {isHebrew
                    ? 'עליך להתחבר כדי לקבל את ההזמנה'
                    : 'You need to sign in to accept the invitation'}
                </p>
                <button
                  onClick={() => navigate(`/login?redirect=/invitation/${token}`)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-memorial-gold to-amber-600 text-slate-900 font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  {isHebrew ? 'התחברות' : 'Sign In'}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleRespond(false)}
                  disabled={responding}
                  className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {isHebrew ? 'לא תודה' : 'Decline'}
                </button>
                <button
                  onClick={() => handleRespond(true)}
                  disabled={responding}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-memorial-gold to-amber-600 text-slate-900 font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {responding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {isHebrew ? 'קבל הזמנה' : 'Accept'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
