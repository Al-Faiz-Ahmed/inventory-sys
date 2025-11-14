// src/models/customer.ts
import { pgTable, serial, varchar, text, decimal, timestamp } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  contactPerson: varchar("contact_person", { length: 100 }),
  address: text("address"),
  description: text("description"),

  currentBalance: decimal("current_balance", { precision: 15, scale: 2 })
    .default("0.00")
    .notNull(),
  receivable: decimal("receivable", { precision: 15, scale: 2 })
    .default("0.00")
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
