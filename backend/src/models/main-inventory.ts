// src/models/main-inventory.ts
import { InferModel } from "drizzle-orm";
import { pgTable, serial, uuid, integer, varchar, decimal, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { products } from "./products";
import { suppliers } from "./supplier";
import { customers } from "./customer";

// Enum for main inventory transaction types
export const mainInventoryTransactionTypeEnum = pgEnum("main_inventory_transaction_type", [
  "sale",
  "purchase",
  "refund",
  "adjustment",
  "miscelleneous",
]);

// Main inventory table to track all stock movements per product
export const mainInventory = pgTable("main_inventory", {
  id: serial("id").primaryKey(),

  productId: uuid("product_id").notNull().references(() => products.id),

  transactionType: mainInventoryTransactionTypeEnum("transaction_type").notNull(),

  quantity: decimal("quantity", { precision: 15, scale: 2 }).notNull().default("0.00"),
  
  stockQuantity: decimal("stock_quantity", { precision: 15, scale: 3 }).notNull().default("0.000"),

  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull().default("0.00"),
  costPrice: decimal("cost_price", { precision: 15, scale: 2 }).notNull().default("0.00"),
  sellPrice: decimal("sell_price", { precision: 15, scale: 2 }).notNull().default("0.00"),
  avgPrice: decimal("avg_price", { precision: 15, scale: 2 }).notNull().default("0.00"),

  previousCostPrice: decimal("previous_cost_price", { precision: 15, scale: 2 }).default("0.00"),
  previousSellPrice: decimal("previous_sell_price", { precision: 15, scale: 2 }).default("0.00"),
  previousAvgPrice: decimal("previous_avg_price", { precision: 15, scale: 2 }).default("0.00"),

  supplierId: integer("supplier_id").references(() => suppliers.id),
  customerId: integer("customer_id").references(() => customers.id),

  supplierInvoiceNumber: varchar("supplier_invoice_number", { length: 100 }),
  customerInvoiceNumber: varchar("customer_invoice_number", { length: 100 }),

  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),

  description: text("description"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

