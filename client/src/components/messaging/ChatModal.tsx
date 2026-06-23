/**
 * Chat Modal Component
 * Allows readers to chat with book authors
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  MessageCircle,
  User,
  Loader2,
  ChevronLeft,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  startConversation,
  sendMessage,
  getMessages,
  Message,
  Conversation,
} from '../../services/messagingApi';
import { useModal } from '../../hooks/useModal';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorId: string;
  authorName: string;
  authorPicture?: string;
  bookId?: string;
  bookTitle?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  authorId,
  authorName,
  authorPicture,
  bookId,
  bookTitle,
}) => {
  const { language } = useLanguage();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [failedMessages, setFailedMessages] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ESC key handling and scroll lock
  useModal(isOpen, onClose);

  const currentUserId = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const parsed = JSON.parse(userStr);
      return parsed?.id ?? null;
    } catch {
      return null;
    }
  })();

  // Initialize conversation when modal opens
  useEffect(() => {
    if (isOpen && authorId) {
      initializeConversation();
    }
  }, [isOpen, authorId, bookId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && page === 1) {
      scrollToBottom();
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, conversation]);

  const initializeConversation = async () => {
    setLoading(true);
    try {
      const conv = await startConversation(authorId, bookId);
      setConversation(conv);
      setPage(1);
      setMessages([]);
      await loadMessages(conv._id, 1);
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      toast.error(
        language === 'he' ? 'פתיחת השיחה נכשלה' : 'Failed to open conversation',
        { id: 'init-conversation' }
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string, pageNum: number) => {
    try {
      const { messages: newMessages, pagination } = await getMessages(
        conversationId,
        pageNum,
        30
      );

      if (pageNum === 1) {
        setMessages(newMessages);
      } else {
        setMessages((prev) => [...newMessages, ...prev]);
      }

      setHasMore(pagination.page < pagination.pages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error(
        language === 'he' ? 'טעינת ההודעות נכשלה' : 'Failed to load messages',
        { id: 'load-messages' }
      );
    }
  };

  const loadMoreMessages = async () => {
    if (!conversation || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadMessages(conversation._id, nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleSend = async (retryContent?: string) => {
    const messageContent = retryContent || newMessage.trim();
    if (!messageContent || !conversation || sending) return;

    // Clear input immediately for better UX
    if (!retryContent) {
      setNewMessage('');
    }

    // Generate temp ID for optimistic update
    const tempId = `temp-${Date.now()}`;

    // Add optimistic message
    const now = new Date().toISOString();
    const optimisticMessage: Message = {
      _id: tempId,
      content: messageContent,
      sender: { _id: currentUserId || '', name: 'You' },
      createdAt: now,
      updatedAt: now,
      conversation: conversation._id,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();
    setSending(true);

    try {
      const sentMessage = await sendMessage(conversation._id, messageContent);
      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? sentMessage : m))
      );
      // Remove from failed messages if it was a retry
      if (retryContent) {
        setFailedMessages((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark message as failed
      setFailedMessages((prev) => new Map(prev).set(tempId, messageContent));
      toast.error(
        language === 'he'
          ? 'שליחת ההודעה נכשלה. הקש לניסיון חוזר.'
          : 'Failed to send message. Tap to retry.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleRetry = (tempId: string) => {
    const content = failedMessages.get(tempId);
    if (content) {
      // Remove failed message from list
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setFailedMessages((prev) => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      // Retry sending
      handleSend(content);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
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
      return 'Yesterday ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  if (!isOpen) return null;

  return (
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
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-lg h-[85vh] sm:h-[600px] max-h-[90vh] flex flex-col shadow-2xl border border-purple-500/20 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors md:hidden flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>

              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                {authorPicture ? (
                  <img
                    src={authorPicture}
                    alt={authorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-sm sm:text-base truncate">{authorName}</h3>
                {bookTitle && (
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                    About: {bookTitle}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden md:block flex-shrink-0"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">
                  Start a conversation with {authorName}
                </h4>
                <p className="text-gray-400 text-sm max-w-[250px]">
                  Send the first message to start a conversation
                </p>
              </div>
            ) : (
              <>
                {loadingMore && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                  </div>
                )}

                {messages.map((message) => {
                  const sender = message.sender as { _id?: string; id?: string; name?: string } | undefined;
                  const senderId = sender?._id || sender?.id;
                  const isOwn = senderId === currentUserId;
                  const senderName = sender?.name || 'Deleted User';
                  const isFailed = failedMessages.has(message._id);
                  const isPending = message._id.startsWith('temp-') && !isFailed;

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isFailed
                              ? 'bg-red-500/30 border border-red-500/50 text-white'
                              : isOwn
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                              : 'bg-white/10 text-white'
                          } ${isPending ? 'opacity-70' : ''}`}
                        >
                          {!isOwn && !sender && (
                            <p className="text-xs text-gray-400 mb-1 italic">
                              {senderName}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-[10px] mt-1 ${
                                isFailed ? 'text-red-300' : isOwn ? 'text-white/60' : 'text-gray-500'
                              }`}
                            >
                              {isFailed ? 'Failed to send' : isPending ? 'Sending...' : formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                        {isFailed && (
                          <button
                            onClick={() => handleRetry(message._id)}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Tap to retry
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'he' ? 'כתוב הודעה...' : 'Write a message...'}
                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                disabled={loading || sending}
              />

              <button
                onClick={() => handleSend()}
                disabled={!newMessage.trim() || loading || sending}
                className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatModal;
