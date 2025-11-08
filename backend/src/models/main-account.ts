// src/models/main-account.ts
import { pgTable, serial, varchar, integer, decimal, timestamp, text, pgEnum } from "drizzle-orm/pg-core";

export const mainAccountTransactionEnum = pgEnum('main_account_transaction_type', ['debit', 'credit']);
export const mainAccountSourceEnum = pgEnum('main_account_source_type', [
  'supplier',
  'customer',
  'expense',
  'supplier_refund',
  'customer_refund',
  'adjustment',
  'other',
]);

export const mainAccount = pgTable('main_account', {
  id: serial('id').primaryKey(),
  transactionType: mainAccountTransactionEnum('transaction_type').notNull(),
  sourceType: mainAccountSourceEnum('source_type').notNull(),
  sourceId: integer('source_id'),
  referenceId: integer('reference_id'),
  transactionAmount: decimal('transaction_amount', { precision: 15, scale: 2 }).notNull(),
  balanceAmount: decimal('balance_amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});
