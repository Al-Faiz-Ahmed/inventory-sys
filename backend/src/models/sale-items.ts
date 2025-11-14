// src/models/sale-items.ts
import { pgTable, serial, integer, uuid, decimal, timestamp } from "drizzle-orm/pg-core";
import { sales } from "./sales";
import { products } from "./products";

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 15, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
