// src/models/expenses.ts
import { pgTable, serial, integer, varchar, date, decimal, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { expenseCategories } from "./expense-category";

export const expenseTypeEnum = pgEnum('expense_type', ['expense', 'adjustment']);

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => expenseCategories.id),
  title: varchar("title", { length: 150 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  expenseType: expenseTypeEnum("expense_type").notNull().default('expense'),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
