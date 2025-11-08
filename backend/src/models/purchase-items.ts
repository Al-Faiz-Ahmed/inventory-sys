// src/models/purchase-items.ts
import { pgTable, serial, integer, uuid, varchar, decimal, timestamp, text } from "drizzle-orm/pg-core";
import { purchases } from "./purchases";
import { products } from "./products";

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").notNull().references(() => purchases.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 15, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
