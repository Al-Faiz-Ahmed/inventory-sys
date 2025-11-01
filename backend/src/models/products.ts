// src/models/product.ts
import { pgTable, uuid, text, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	sku: varchar("sku", { length: 100 }).notNull().unique(),
	category: varchar("category", { length: 100 }).notNull(),
	price: decimal("price", { precision: 10, scale: 2 }).notNull(),
	cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
	quantity: integer("quantity").notNull().default(0),
	minQuantity: integer("min_quantity").notNull().default(0),
	maxQuantity: integer("max_quantity").notNull().default(0),
	supplier: varchar("supplier", { length: 255 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

