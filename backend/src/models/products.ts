// src/models/product.ts
import { pgTable, uuid, text, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { productCategories } from "./product-categories";

export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	sku: varchar("sku", { length: 100 }).notNull().unique(),
	categoryId: uuid("category_id").notNull().references(() => productCategories.id),
	price: decimal("price", { precision: 10, scale: 2 }).notNull(),
	cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
	quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull().default("0"),
	minQuantity: integer("min_quantity").notNull().default(0),
	maxQuantity: integer("max_quantity").notNull().default(0),
	avgPrice: decimal("avg_price", { precision: 10, scale: 2 }),
	previousCost: decimal("previous_cost", { precision: 10, scale: 2 }),
	previousPrice: decimal("previous_price", { precision: 10, scale: 2 }),
	previousAvgPrice: decimal("previous_avg_price", { precision: 10, scale: 2 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

