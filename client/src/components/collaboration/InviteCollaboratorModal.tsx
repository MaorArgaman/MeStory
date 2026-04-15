import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserPlus, Mail, User, Heart, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  onInviteSent: () => void;
}

const RELATIONSHIPS = [
  { id: 'parent', labelHe: 'הורה', labelEn: 'Parent' },
  { id: 'child', labelHe: 'ילד/ה', labelEn: 'Child' },
  { id: 'sibling', labelHe: 'אח/אחות', labelEn: 'Sibling' },
  { id: 'spouse', labelHe: 'בן/בת זוג', labelEn: 'Spouse' },
  { id: 'friend', labelHe: 'חבר/ה', labelEn: 'Friend' },
  { id: 'commander', labelHe: 'מפקד/ת', labelEn: 'Commander' },
  { id: 'colleague', labelHe: 'עמית/ה', labelEn: 'Colleague' },
  { id: 'other', labelHe: 'אחר', labelEn: 'Other' },
];

export default function InviteCollaboratorModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  onInviteSent,
}: InviteCollaboratorModalProps) {
  const { i18n } = useTranslation('memorial');
  const isHebrew = i18n.language === 'he';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name || !relationship) {
      toast.error(isHebrew ? 'אנא מלא את כל השדות' : 'Please fill in all fields');
      return;
    }

    setSending(true);

    try {
      const response = await api.post(`/collaboration/${bookId}/invite`, {
        email,
        name,
        relationship,
        personalMessage,
      });

      if (response.data.success) {
        toast.success(isHebrew ? 'ההזמנה נשלחה בהצלחה!' : 'Invitation sent successfully!');

        // Copy invitation link to clipboard
        if (response.data.data.invitationLink) {
          navigator.clipboard.writeText(response.data.data.invitationLink);
          toast.success(isHebrew ? 'קישור ההזמנה הועתק!' : 'Invitation link copied!');
        }

        onInviteSent();
        onClose();

        // Reset form
        setEmail('');
        setName('');
        setRelationship('');
        setPersonalMessage('');
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(
        error.response?.data?.error ||
          (isHebrew ? 'שליחת ההזמנה נכשלה' : 'Failed to send invitation')
      );
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-memorial-gold/20 overflow-hidden"
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-memorial-gold/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-memorial-gold" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {isHebrew ? 'הזמנת תורם לספר' : 'Invite Contributor'}
                </h2>
                <p className="text-sm text-gray-400">{bookTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline-block mr-2" />
                {isHebrew ? 'אימייל' : 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isHebrew ? 'email@example.com' : 'email@example.com'}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-memorial-gold/50 focus:border-memorial-gold/50"
                required
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 inline-block mr-2" />
                {isHebrew ? 'שם' : 'Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isHebrew ? 'שם מלא' : 'Full name'}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-memorial-gold/50 focus:border-memorial-gold/50"
                required
              />
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Heart className="w-4 h-4 inline-block mr-2" />
                {isHebrew ? 'קשר ליקיר/ה' : 'Relationship to loved one'}
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-memorial-gold/50 focus:border-memorial-gold/50"
                required
              >
                <option value="" className="bg-deep-space text-white">
                  {isHebrew ? 'בחר קשר' : 'Select relationship'}
                </option>
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel.id} value={rel.id} className="bg-deep-space text-white">
                    {isHebrew ? rel.labelHe : rel.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Personal Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {isHebrew ? 'הודעה אישית (אופציונלי)' : 'Personal message (optional)'}
              </label>
              <textarea
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder={
                  isHebrew
                    ? 'היי, אני מכין/ה ספר זיכרון ואשמח אם תכתוב/י כמה מילים...'
                    : "Hi, I'm creating a memorial book and would love if you could write a few words..."
                }
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-memorial-gold/50 focus:border-memorial-gold/50 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                {isHebrew ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-memorial-gold to-amber-600 text-slate-900 font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {isHebrew ? 'שלח הזמנה' : 'Send Invitation'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
