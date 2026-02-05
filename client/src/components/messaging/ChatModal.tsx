/**
 * Chat Modal Component
 * Allows readers to chat with book authors
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  MessageCircle,
  User,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import {
  startConversation,
  sendMessage,
  getMessages,
  Message,
  Conversation,
} from '../../services/messagingApi';

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
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;

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

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await sendMessage(conversation._id, messageContent);
      setMessages((prev) => [...prev, sentMessage]);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
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
      return date.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'אתמול ' + date.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('he-IL', { weekday: 'short' }) + ' ' +
        date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('he-IL', {
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
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-lg h-[600px] max-h-[90vh] flex flex-col shadow-2xl border border-purple-500/20 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors md:hidden"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                {authorPicture ? (
                  <img
                    src={authorPicture}
                    alt={authorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>

              <div>
                <h3 className="font-semibold text-white">{authorName}</h3>
                {bookTitle && (
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">
                    בנושא: {bookTitle}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden md:block"
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
                  התחל שיחה עם {authorName}
                </h4>
                <p className="text-gray-400 text-sm max-w-[250px]">
                  שלח הודעה ראשונה למחבר/ת כדי להתחיל שיחה
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
                  const isOwn = message.sender._id === currentUserId;

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isOwn ? 'text-white/60' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="כתוב הודעה..."
                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                disabled={loading || sending}
                dir="rtl"
              />

              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || loading || sending}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
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
