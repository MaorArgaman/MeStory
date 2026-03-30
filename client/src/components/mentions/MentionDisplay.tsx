/**
 * Mention Display Component
 * Shows mentions as clickable tags that open the user's library
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Users } from 'lucide-react';
import { Mention } from '../../services/userApi';
import UserLibraryModal from './UserLibraryModal';

interface MentionDisplayProps {
  mentions: Mention[];
  className?: string;
}

const MentionDisplay: React.FC<MentionDisplayProps> = ({
  mentions,
  className = '',
}) => {
  const { t } = useTranslation('common');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');

  if (!mentions || mentions.length === 0) {
    return null;
  }

  const handleMentionClick = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
  };

  const handleCloseModal = () => {
    setSelectedUserId(null);
    setSelectedUserName('');
  };

  return (
    <>
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-300">
            {t('mentions.about_people', 'This story features')}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {mentions.map((mention) => (
            <button
              key={mention.userId}
              onClick={() => handleMentionClick(mention.userId, mention.userName)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full hover:border-purple-400/50 hover:from-purple-500/30 hover:to-pink-500/30 transition-all group"
            >
              {mention.userAvatar ? (
                <img
                  src={mention.userAvatar}
                  alt={mention.userName}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-purple-500/30"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-sm text-purple-200 group-hover:text-purple-100 transition-colors">
                {mention.userName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* User Library Modal */}
      <UserLibraryModal
        isOpen={!!selectedUserId}
        onClose={handleCloseModal}
        userId={selectedUserId || ''}
        userName={selectedUserName}
      />
    </>
  );
};

export default MentionDisplay;
