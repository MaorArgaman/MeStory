/**
 * Mention Selector Component
 * Allows authors to search and add user mentions to their books
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  X,
  User,
  UserPlus,
  Loader2,
} from 'lucide-react';
import {
  searchUsers,
  addMention,
  removeMention,
  UserSearchResult,
  Mention,
} from '../../services/userApi';
import toast from 'react-hot-toast';

interface MentionSelectorProps {
  bookId: string;
  mentions: Mention[];
  onMentionsChange: (mentions: Mention[]) => void;
  disabled?: boolean;
}

const MentionSelector: React.FC<MentionSelectorProps> = ({
  bookId,
  mentions,
  onMentionsChange,
  disabled = false,
}) => {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      setSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchUsers(searchQuery, 10);
          // Filter out already mentioned users
          const filteredResults = results.filter(
            (user) => !mentions.some((m) => m.userId === user.id)
          );
          setSearchResults(filteredResults);
          setShowDropdown(true);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, mentions]);

  const handleAddMention = async (user: UserSearchResult) => {
    if (addingUser) return;

    setAddingUser(user.id);
    try {
      const newMention = await addMention(bookId, user.id);
      onMentionsChange([...mentions, newMention]);
      setSearchQuery('');
      setShowDropdown(false);
      toast.success(t('mentions.user_mentioned', '{{name}} mentioned', { name: user.name }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('mentions.add_failed', 'Failed to add mention'));
    } finally {
      setAddingUser(null);
    }
  };

  const handleRemoveMention = async (userId: string) => {
    if (removingUser) return;

    setRemovingUser(userId);
    try {
      await removeMention(bookId, userId);
      onMentionsChange(mentions.filter((m) => m.userId !== userId));
      toast.success(t('mentions.mention_removed', 'Mention removed'));
    } catch (error) {
      toast.error(t('mentions.remove_failed', 'Failed to remove mention'));
    } finally {
      setRemovingUser(null);
    }
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-300">
        {t('mentions.title', 'Tagged People')}
        <span className="text-gray-500 font-normal ml-2">
          {t('mentions.description', 'Tag people mentioned in your book')}
        </span>
      </label>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('mentions.search_placeholder', 'Search users to mention...')}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
            disabled={disabled}
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleAddMention(user)}
                disabled={addingUser === user.id}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  {user.bio && (
                    <p className="text-xs text-gray-400 truncate">{user.bio}</p>
                  )}
                </div>
                {addingUser === user.id ? (
                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 text-purple-400" />
                )}
              </button>
            ))}
          </div>
        )}

        {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
          <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-white/10 rounded-lg shadow-xl p-4 text-center">
            <p className="text-sm text-gray-400">
              {t('mentions.no_results', 'No users found')}
            </p>
          </div>
        )}
      </div>

      {/* Current Mentions */}
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mentions.map((mention) => (
            <div
              key={mention.userId}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full group"
            >
              {mention.userAvatar ? (
                <img
                  src={mention.userAvatar}
                  alt={mention.userName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-sm text-purple-200">{mention.userName}</span>
              <button
                onClick={() => handleRemoveMention(mention.userId)}
                disabled={removingUser === mention.userId || disabled}
                className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
              >
                {removingUser === mention.userId ? (
                  <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                ) : (
                  <X className="w-3 h-3 text-purple-400 hover:text-white" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {mentions.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          {t('mentions.no_mentions', 'No one tagged yet. Search above to add mentions.')}
        </p>
      )}
    </div>
  );
};

export default MentionSelector;
