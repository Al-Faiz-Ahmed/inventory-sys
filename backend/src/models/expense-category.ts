// src/models/expense-category.ts
import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
