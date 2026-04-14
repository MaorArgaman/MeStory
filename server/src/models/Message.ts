import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

// Message interface
export interface IMessage {
  id: string;
  _id?: string;
  conversation: string;
  sender: string;
  content: string;
  readAt?: string;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

// Conversation interface
export interface IConversation {
  id: string;
  _id?: string;
  participants: string[];
  book?: string;
  lastMessage?: {
    content: string;
    sender: string;
    sentAt: string;
  };
  unreadCount: Record<string, number>;
  isActive: boolean;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database row types
interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationRow {
  id: string;
  participants: string[];
  book_id: string | null;
  last_message: any;
  unread_count: Record<string, number>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Transform functions
function rowToMessage(row: MessageRow): IMessage {
  return {
    id: row.id,
    _id: row.id,
    conversation: row.conversation_id,
    sender: row.sender_id,
    content: row.content,
    readAt: row.read_at || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToConversation(row: ConversationRow): IConversation {
  return {
    id: row.id,
    _id: row.id,
    participants: row.participants || [],
    book: row.book_id || undefined,
    lastMessage: row.last_message || undefined,
    unreadCount: row.unread_count || {},
    isActive: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Message Model class
export class Message {
  static async findById(id: string): Promise<IMessage | null> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToMessage(data as MessageRow);
  }

  static async create(messageData: Partial<IMessage>): Promise<IMessage> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertData = {
      id,
      conversation_id: messageData.conversation,
      sender_id: messageData.sender,
      content: messageData.content || '',
      read_at: messageData.readAt || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      throw new Error(error.message);
    }

    return rowToMessage(data as MessageRow);
  }

  static async find(query: Record<string, any> = {}): Promise<IMessage[]> {
    let queryBuilder = supabaseAdmin.from('messages').select('*');

    if (query.conversation) {
      queryBuilder = queryBuilder.eq('conversation_id', query.conversation);
    }
    if (query.sender) {
      queryBuilder = queryBuilder.eq('sender_id', query.sender);
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    if (query._limit) {
      queryBuilder = queryBuilder.limit(query._limit);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error finding messages:', error);
      return [];
    }

    return (data || []).map(row => rowToMessage(row as MessageRow));
  }

  static async findByIdAndUpdate(
    id: string,
    update: Partial<IMessage>
  ): Promise<IMessage | null> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (update.readAt !== undefined) {
      updateData.read_at = update.readAt;
    }
    if (update.content !== undefined) {
      updateData.content = update.content;
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return rowToMessage(data as MessageRow);
  }

  static async findByIdAndDelete(id: string): Promise<IMessage | null> {
    const message = await this.findById(id);
    if (!message) return null;

    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) return null;
    return message;
  }
}

// Conversation Model class
export class Conversation {
  static async findById(id: string): Promise<IConversation | null> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToConversation(data as ConversationRow);
  }

  static async findOne(query: Record<string, any>): Promise<IConversation | null> {
    let queryBuilder = supabaseAdmin.from('conversations').select('*');

    if (query._id || query.id) {
      queryBuilder = queryBuilder.eq('id', query._id || query.id);
    }
    if (query.book) {
      queryBuilder = queryBuilder.eq('book_id', query.book);
    }
    if (query.participants) {
      // Ensure participants is always an array for the contains query
      const participantsArray = Array.isArray(query.participants)
        ? query.participants
        : [query.participants];
      queryBuilder = queryBuilder.contains('participants', participantsArray);
    }

    const { data, error } = await queryBuilder.limit(1).single();

    if (error || !data) return null;
    return rowToConversation(data as ConversationRow);
  }

  static async create(conversationData: Partial<IConversation>): Promise<IConversation> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertData = {
      id,
      participants: conversationData.participants || [],
      book_id: conversationData.book || null,
      last_message: conversationData.lastMessage || null,
      unread_count: conversationData.unreadCount || {},
      is_active: conversationData.isActive !== false,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw new Error(error.message);
    }

    return rowToConversation(data as ConversationRow);
  }

  static async find(query: Record<string, any> = {}): Promise<IConversation[]> {
    let queryBuilder = supabaseAdmin.from('conversations').select('*');

    if (query.participants) {
      // Ensure participants is always an array for the contains query
      const participantsArray = Array.isArray(query.participants)
        ? query.participants
        : [query.participants];
      queryBuilder = queryBuilder.contains('participants', participantsArray);
    }
    if (query.book) {
      queryBuilder = queryBuilder.eq('book_id', query.book);
    }
    if (query.isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', query.isActive);
    }

    queryBuilder = queryBuilder.order('updated_at', { ascending: false });

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error finding conversations:', error);
      return [];
    }

    return (data || []).map(row => rowToConversation(row as ConversationRow));
  }

  static async findByIdAndUpdate(
    id: string,
    update: Partial<IConversation> | { $set?: any }
  ): Promise<IConversation | null> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const setData = '$set' in update ? update.$set : update;

    if (setData.lastMessage !== undefined) {
      updateData.last_message = setData.lastMessage;
    }
    if (setData.unreadCount !== undefined) {
      updateData.unread_count = setData.unreadCount;
    }
    if (setData.isActive !== undefined) {
      updateData.is_active = setData.isActive;
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return rowToConversation(data as ConversationRow);
  }
}
