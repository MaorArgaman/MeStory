import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

// Transaction interface
export interface ITransaction {
  id: string;
  _id?: string;
  userId: string;
  amount: number;
  currency: 'USD' | 'ILS';
  plan: 'free' | 'standard' | 'premium' | 'book-purchase' | 'topup';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'expired';
  paymentMethod: 'paypal' | 'mock' | 'credit_card';
  orderId?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  description: string;
  metadata?: {
    previousPlan?: string;
    creditsAdded?: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database row type
interface TransactionRow {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  payment_method: string;
  order_id: string | null;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  description: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

// Transform database row to ITransaction
function rowToTransaction(row: TransactionRow): ITransaction {
  return {
    id: row.id,
    _id: row.id,
    userId: row.user_id,
    amount: row.amount,
    currency: row.currency as ITransaction['currency'],
    plan: row.plan as ITransaction['plan'],
    status: row.status as ITransaction['status'],
    paymentMethod: row.payment_method as ITransaction['paymentMethod'],
    orderId: row.order_id || undefined,
    paypalOrderId: row.paypal_order_id || undefined,
    paypalCaptureId: row.paypal_capture_id || undefined,
    description: row.description,
    metadata: row.metadata || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Transaction Model class for Supabase operations
export class Transaction {
  // Find transaction by ID
  static async findById(id: string): Promise<ITransaction | null> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToTransaction(data as TransactionRow);
  }

  // Find one transaction by query
  static async findOne(query: Record<string, any>): Promise<ITransaction | null> {
    let queryBuilder = supabaseAdmin.from('transactions').select('*');

    if (query._id || query.id) {
      queryBuilder = queryBuilder.eq('id', query._id || query.id);
    }
    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }
    if (query.orderId) {
      queryBuilder = queryBuilder.eq('order_id', query.orderId);
    }
    if (query.paypalOrderId) {
      queryBuilder = queryBuilder.eq('paypal_order_id', query.paypalOrderId);
    }

    const { data, error } = await queryBuilder.limit(1).single();

    if (error || !data) return null;
    return rowToTransaction(data as TransactionRow);
  }

  // Create new transaction
  static async create(transactionData: Partial<ITransaction>): Promise<ITransaction> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertData = {
      id,
      user_id: transactionData.userId,
      amount: transactionData.amount || 0,
      currency: transactionData.currency || 'USD',
      plan: transactionData.plan || 'free',
      status: transactionData.status || 'pending',
      payment_method: transactionData.paymentMethod || 'mock',
      order_id: transactionData.orderId || null,
      paypal_order_id: transactionData.paypalOrderId || null,
      paypal_capture_id: transactionData.paypalCaptureId || null,
      description: transactionData.description || '',
      metadata: transactionData.metadata || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw new Error(error.message);
    }

    return rowToTransaction(data as TransactionRow);
  }

  // Update transaction by ID
  static async findByIdAndUpdate(
    id: string,
    update: Partial<ITransaction> | { $set?: Partial<any> },
    options?: { new?: boolean }
  ): Promise<ITransaction | null> {
    let updateData: Record<string, any> = {};

    if ('$set' in update && update.$set) {
      const setData = update.$set;
      Object.entries(setData).forEach(([key, value]) => {
        updateData[camelToSnake(key)] = value;
      });
    } else {
      Object.entries(update).forEach(([key, value]) => {
        if (key !== 'id' && key !== '_id') {
          updateData[camelToSnake(key)] = value;
        }
      });
    }

    updateData.updated_at = new Date().toISOString();
    delete updateData.id;
    delete updateData._id;

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return null;
    }

    return rowToTransaction(data as TransactionRow);
  }

  // Delete transaction by ID
  static async findByIdAndDelete(id: string): Promise<ITransaction | null> {
    const transaction = await this.findById(id);
    if (!transaction) return null;

    const { error } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return null;
    }

    return transaction;
  }

  // Find multiple transactions
  static async find(query: Record<string, any> = {}): Promise<ITransaction[]> {
    let queryBuilder = supabaseAdmin.from('transactions').select('*');

    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }
    if (query.plan) {
      queryBuilder = queryBuilder.eq('plan', query.plan);
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    if (query._limit) {
      queryBuilder = queryBuilder.limit(query._limit);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error finding transactions:', error);
      return [];
    }

    return (data || []).map(row => rowToTransaction(row as TransactionRow));
  }

  // Count transactions
  static async countDocuments(query: Record<string, any> = {}): Promise<number> {
    let queryBuilder = supabaseAdmin
      .from('transactions')
      .select('id', { count: 'exact', head: true });

    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const { count, error } = await queryBuilder;

    if (error) {
      console.error('Error counting transactions:', error);
      return 0;
    }

    return count || 0;
  }

  // Aggregate - get total revenue
  static async getTotalRevenue(userId?: string): Promise<number> {
    let queryBuilder = supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('status', 'completed');

    if (userId) {
      queryBuilder = queryBuilder.eq('user_id', userId);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error calculating revenue:', error);
      return 0;
    }

    return (data || []).reduce((total, row) => total + (row.amount || 0), 0);
  }
}

// Helper to convert camelCase to snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export default Transaction;
