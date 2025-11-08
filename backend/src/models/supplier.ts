// src/models/supplier.ts
// import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";

// export const suppliers = pgTable("suppliers", {
// 	id: uuid("id").primaryKey().defaultRandom(),
// 	name: varchar("name", { length: 255 }).notNull(),
// 	contactNumber: varchar("contact_number", { length: 50 }),
// 	phone: varchar("phone", { length: 50 }),
// 	email: varchar("email", { length: 255 }),
// 	address: text("address"),
// 	bankAccNo: varchar("bank_acc_no", { length: 255 }),
// 	bankAccName: varchar("bank_acc_name", { length: 255 }),
// 	createdAt: timestamp("created_at").notNull().defaultNow(),
// 	updatedAt: timestamp("updated_at").notNull().defaultNow(),
// });


import { pgTable, serial, varchar, text, decimal, timestamp } from "drizzle-orm/pg-core";



export const suppliers = pgTable("suppliers", {
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
  debt: decimal("debt", { precision: 15, scale: 2 })
    .default("0.00")
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
