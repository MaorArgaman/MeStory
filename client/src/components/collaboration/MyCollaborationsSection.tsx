import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Heart,
  BookOpen,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface CollaborativeBook {
  id: string;
  title: string;
  memorialDedication?: {
    name: string;
  };
  myRole: string;
  collaboratorsCount: number;
  chaptersCount: number;
}

interface PendingInvitation {
  bookId: string;
  bookTitle: string;
  invitation: {
    id: string;
    token: string;
    relationship: string;
    name: string;
    personalMessage?: string;
    createdAt: string;
  };
}

export default function MyCollaborationsSection() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isHebrew = i18n.language === 'he';

  const [loading, setLoading] = useState(true);
  const [collaborations, setCollaborations] = useState<CollaborativeBook[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [collabRes, inviteRes] = await Promise.all([
        api.get('/collaboration/my-collaborations'),
        api.get('/collaboration/my-invitations'),
      ]);

      setCollaborations(collabRes.data.data || []);
      setPendingInvitations(inviteRes.data.data || []);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToInvitation = async (token: string, accept: boolean) => {
    setResponding(token);

    try {
      await api.post(`/collaboration/respond/${token}`, { accept });

      toast.success(
        accept
          ? isHebrew
            ? 'הצטרפת לספר בהצלחה!'
            : 'You joined the book!'
          : isHebrew
          ? 'ההזמנה נדחתה'
          : 'Invitation declined'
      );

      // Refresh data
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          (isHebrew ? 'שגיאה בתגובה להזמנה' : 'Error responding')
      );
    } finally {
      setResponding(null);
    }
  };

  // Don't show section if no collaborations and no invitations
  if (!loading && collaborations.length === 0 && pendingInvitations.length === 0) {
    return null;
  }

  return (
    <div className="mb-12" dir={isHebrew ? 'rtl' : 'ltr'}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-memorial-gold/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-memorial-gold" />
          </div>
          <div>
            <h2
              className="text-2xl font-bold gradient-gold"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {isHebrew ? 'ספרים שאני תורם להם' : 'Books I Contribute To'}
            </h2>
            <p className="text-sm text-gray-400">
              {isHebrew
                ? 'ספרי זיכרון שהוזמנתי לתרום להם'
                : 'Memorial books I was invited to contribute to'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-memorial-gold animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {isHebrew ? 'הזמנות ממתינות' : 'Pending Invitations'}
              </h3>

              <AnimatePresence>
                {pendingInvitations.map((item) => (
                  <motion.div
                    key={item.invitation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gradient-to-r from-memorial-gold/10 to-amber-600/5 rounded-xl border border-memorial-gold/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-memorial-gold/20 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-memorial-gold" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{item.bookTitle}</h4>
                          <p className="text-sm text-gray-400">
                            {isHebrew ? 'הוזמנת כ:' : 'Invited as:'}{' '}
                            <span className="text-memorial-gold">
                              {item.invitation.relationship}
                            </span>
                          </p>
                          {item.invitation.personalMessage && (
                            <p className="text-sm text-gray-400 mt-1 italic">
                              "{item.invitation.personalMessage}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleRespondToInvitation(item.invitation.token, false)
                          }
                          disabled={responding === item.invitation.token}
                          className="p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                          title={isHebrew ? 'דחה' : 'Decline'}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleRespondToInvitation(item.invitation.token, true)
                          }
                          disabled={responding === item.invitation.token}
                          className="flex items-center gap-2 px-4 py-2 bg-memorial-gold/20 text-memorial-gold rounded-lg hover:bg-memorial-gold/30 transition-colors disabled:opacity-50"
                        >
                          {responding === item.invitation.token ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              {isHebrew ? 'קבל' : 'Accept'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Active Collaborations */}
          {collaborations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collaborations.map((book) => (
                <motion.div
                  key={book.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(`/editor/${book.id}`)}
                  className="bg-white/5 rounded-xl border border-white/10 p-4 cursor-pointer hover:border-memorial-gold/30 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-memorial-gold/30 to-amber-600/30 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-memorial-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate">{book.title}</h4>
                      {book.memorialDedication && (
                        <p className="text-sm text-memorial-gold truncate">
                          {isHebrew ? 'לזכר ' : 'In memory of '}
                          {book.memorialDedication.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {book.collaboratorsCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {book.chaptersCount} {isHebrew ? 'פרקים' : 'ch'}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-memorial-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                      {book.myRole === 'editor'
                        ? isHebrew
                          ? 'עורך'
                          : 'Editor'
                        : isHebrew
                        ? 'תורם'
                        : 'Contributor'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
