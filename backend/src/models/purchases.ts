// src/models/purchases.ts
import { pgTable, serial, integer, varchar, date, decimal, timestamp, pgEnum, text } from "drizzle-orm/pg-core";
import { suppliers } from "./supplier";

export const purchaseStatusEnum = pgEnum('purchase_status', ['paid', 'unpaid', 'partial']);

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  date: date("date").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  status: purchaseStatusEnum("status").notNull().default("unpaid"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
