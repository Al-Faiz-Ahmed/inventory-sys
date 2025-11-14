// src/models/supplier-transactions.ts
import { pgTable, serial, integer, decimal, timestamp, text, pgEnum, varchar } from "drizzle-orm/pg-core";
import { suppliers } from "./supplier";
import { purchases } from "./purchases";

export const supplierTransactionTypeEnum = pgEnum('supplier_transaction_type', ['purchase', 'payment', 'refund', 'adjustment']);

export const supplierTransactions = pgTable("supplier_transactions", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  transactionType: supplierTransactionTypeEnum("transaction_type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  balanceAmount: decimal("balance_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  referenceId: integer("reference_id").references(() => purchases.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
