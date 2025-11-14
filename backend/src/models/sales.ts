// src/models/sales.ts
import { pgTable, serial, integer, varchar, date, decimal, timestamp, pgEnum, text } from "drizzle-orm/pg-core";
import { customers } from "./customer";

export const saleStatusEnum = pgEnum('sale_status', ['paid', 'unpaid', 'partial']);

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  date: date("date").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  status: saleStatusEnum("status").notNull().default("unpaid"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
