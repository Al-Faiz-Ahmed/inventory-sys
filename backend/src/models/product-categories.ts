// src/models/product-categories.ts
import { pgTable, uuid, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const productCategories = pgTable("product_categories", {
	id:  uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull().unique(),
	description: text("description"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

