// src/models/customer-transactions.ts
import { pgTable, serial, integer, decimal, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { customers } from "./customer";
import { sales } from "./sales";

export const customerTransactionTypeEnum = pgEnum('customer_transaction_type', ['sale', 'payment', 'refund', 'adjustment']);

export const customerTransactions = pgTable("customer_transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  transactionType: customerTransactionTypeEnum("transaction_type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  balanceAmount: decimal("balance_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  referenceId: integer("reference_id").references(() => sales.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
