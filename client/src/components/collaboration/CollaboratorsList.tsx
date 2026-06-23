import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Crown,
  Edit3,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import InviteCollaboratorModal from './InviteCollaboratorModal';

interface Collaborator {
  id: string;
  userId?: string;
  email: string;
  name: string;
  role: 'owner' | 'editor' | 'contributor';
  relationship: string;
  status: 'pending' | 'active' | 'completed' | 'declined';
  joinedAt?: string;
  contributedChapters: string[];
}

interface Invitation {
  id: string;
  email: string;
  name: string;
  relationship: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

interface CollaboratorsListProps {
  bookId: string;
  bookTitle: string;
  isOwner: boolean;
}

export default function CollaboratorsList({
  bookId,
  bookTitle,
  isOwner,
}: CollaboratorsListProps) {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchData = async () => {
    try {
      const [collabRes, inviteRes] = await Promise.all([
        api.get(`/collaboration/${bookId}/collaborators`),
        isOwner ? api.get(`/collaboration/${bookId}/invitations`) : Promise.resolve({ data: { data: [] } }),
      ]);

      setCollaborators(collabRes.data.data || []);
      setInvitations(inviteRes.data.data || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      toast.error(
        isHebrew ? 'טעינת התורמים נכשלה' : 'Failed to load collaborators',
        { id: 'load-collaborators' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bookId]);

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm(isHebrew ? 'האם להסיר תורם זה?' : 'Remove this collaborator?')) {
      return;
    }

    try {
      await api.delete(`/collaboration/${bookId}/collaborators/${collaboratorId}`);
      toast.success(isHebrew ? 'התורם הוסר' : 'Collaborator removed');
      fetchData();
    } catch (error) {
      toast.error(isHebrew ? 'הסרה נכשלה' : 'Failed to remove');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-green-400 text-xs">
            <CheckCircle className="w-3 h-3" />
            {isHebrew ? 'פעיל' : 'Active'}
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-400 text-xs">
            <Clock className="w-3 h-3" />
            {isHebrew ? 'ממתין' : 'Pending'}
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-blue-400 text-xs">
            <CheckCircle className="w-3 h-3" />
            {isHebrew ? 'סיים' : 'Completed'}
          </span>
        );
      case 'declined':
      case 'expired':
        return (
          <span className="flex items-center gap-1 text-red-400 text-xs">
            <XCircle className="w-3 h-3" />
            {isHebrew ? 'נדחה' : 'Declined'}
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="flex items-center gap-1 text-memorial-gold text-xs bg-memorial-gold/20 px-2 py-0.5 rounded-full">
            <Crown className="w-3 h-3" />
            {isHebrew ? 'יוצר' : 'Owner'}
          </span>
        );
      case 'editor':
        return (
          <span className="flex items-center gap-1 text-purple-400 text-xs bg-purple-400/20 px-2 py-0.5 rounded-full">
            <Edit3 className="w-3 h-3" />
            {isHebrew ? 'עורך' : 'Editor'}
          </span>
        );
      default:
        return (
          <span className="text-gray-400 text-xs bg-gray-400/20 px-2 py-0.5 rounded-full">
            {isHebrew ? 'תורם' : 'Contributor'}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-memorial-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isHebrew ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-memorial-gold/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-memorial-gold" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {isHebrew ? 'תורמים לספר' : 'Book Contributors'}
            </h3>
            <p className="text-sm text-gray-400">
              {collaborators.length} {isHebrew ? 'תורמים' : 'contributors'}
            </p>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-memorial-gold/20 text-memorial-gold rounded-xl hover:bg-memorial-gold/30 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {isHebrew ? 'הזמן תורם' : 'Invite'}
          </button>
        )}
      </div>

      {/* Collaborators List */}
      <div className="space-y-3">
        <AnimatePresence>
          {collaborators.map((collab, index) => (
            <motion.div
              key={collab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-memorial-gold/30 to-amber-600/30 flex items-center justify-center text-white font-medium">
                  {collab.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{collab.name}</span>
                    {getRoleBadge(collab.role)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{collab.relationship}</span>
                    <span>•</span>
                    {getStatusBadge(collab.status)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {collab.contributedChapters.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {collab.contributedChapters.length} {isHebrew ? 'פרקים' : 'chapters'}
                  </span>
                )}
                {isOwner && collab.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveCollaborator(collab.id)}
                    className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {collaborators.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{isHebrew ? 'אין תורמים עדיין' : 'No contributors yet'}</p>
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="mt-3 text-memorial-gold hover:underline"
              >
                {isHebrew ? 'הזמן את התורם הראשון' : 'Invite your first contributor'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pending Invitations (Owner only) */}
      {isOwner && invitations.filter((inv) => inv.status === 'pending').length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {isHebrew ? 'הזמנות ממתינות' : 'Pending Invitations'}
          </h4>
          <div className="space-y-2">
            {invitations
              .filter((inv) => inv.status === 'pending')
              .map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <div>
                      <span className="text-white">{inv.name}</span>
                      <span className="text-gray-400 text-sm mx-2">({inv.email})</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {isHebrew ? 'נשלח ' : 'Sent '}
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteCollaboratorModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        bookId={bookId}
        bookTitle={bookTitle}
        onInviteSent={fetchData}
      />
    </div>
  );
}
