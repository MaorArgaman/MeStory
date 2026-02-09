/**
 * Conversations List Component
 * Shows all user's conversations with authors/readers
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageCircle,
  User,
  Loader2,
  Book,
  Trash2,
  Search,
} from 'lucide-react';
import {
  getConversations,
  deleteConversation,
  Conversation,
} from '../../services/messagingApi';
import ChatModal from './ChatModal';

interface ConversationsListProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  isOpen,
  onClose,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { conversations: convs } = await getConversations(1, 50);
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(conversationId);
    try {
      await deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== currentUserId);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const otherUser = getOtherParticipant(conv);
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser?.name.toLowerCase().includes(searchLower) ||
      conv.book?.title.toLowerCase().includes(searchLower)
    );
  });

  const openChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const closeChat = () => {
    setSelectedConversation(null);
    loadConversations(); // Refresh to update unread counts
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-md h-[600px] max-h-[90vh] flex flex-col shadow-2xl border border-purple-500/20 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  Messages
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-purple-400" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">
                    {searchQuery ? 'No conversations found' : 'No messages yet'}
                  </h4>
                  <p className="text-gray-400 text-sm max-w-[250px]">
                    {searchQuery
                      ? 'Try searching for something else'
                      : 'Start a conversation with an author from their book page'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredConversations.map((conversation) => {
                    const otherUser = getOtherParticipant(conversation);
                    if (!otherUser) return null;

                    return (
                      <motion.div
                        key={conversation._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 hover:bg-white/5 cursor-pointer transition-colors relative group"
                        onClick={() => openChat(conversation)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {otherUser.profilePicture ? (
                                <img
                                  src={otherUser.profilePicture}
                                  alt={otherUser.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-white" />
                              )}
                            </div>
                            {conversation.myUnreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">
                                {conversation.myUnreadCount > 9
                                  ? '9+'
                                  : conversation.myUnreadCount}
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-white truncate">
                                {otherUser.name}
                              </h4>
                              {conversation.lastMessage && (
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {formatTime(conversation.lastMessage.sentAt)}
                                </span>
                              )}
                            </div>

                            {conversation.book && (
                              <div className="flex items-center gap-1 text-xs text-purple-400 mt-0.5">
                                <Book className="w-3 h-3" />
                                <span className="truncate">{conversation.book.title}</span>
                              </div>
                            )}

                            {conversation.lastMessage && (
                              <p
                                className={`text-sm mt-1 truncate ${
                                  conversation.myUnreadCount > 0
                                    ? 'text-white font-medium'
                                    : 'text-gray-400'
                                }`}
                              >
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={(e) => handleDelete(e, conversation._id)}
                            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                            disabled={deletingId === conversation._id}
                          >
                            {deletingId === conversation._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Chat Modal */}
      {selectedConversation && (
        <ChatModal
          isOpen={!!selectedConversation}
          onClose={closeChat}
          authorId={getOtherParticipant(selectedConversation)?._id || ''}
          authorName={getOtherParticipant(selectedConversation)?.name || ''}
          authorPicture={getOtherParticipant(selectedConversation)?.profilePicture}
          bookId={selectedConversation.book?._id}
          bookTitle={selectedConversation.book?.title}
        />
      )}
    </>
  );
};

export default ConversationsList;
