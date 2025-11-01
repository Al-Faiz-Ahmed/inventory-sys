// src/models/supplier.ts
import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";

export const suppliers = pgTable("suppliers", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	contactNumber: varchar("contact_number", { length: 50 }),
	phone: varchar("phone", { length: 50 }),
	email: varchar("email", { length: 255 }),
	address: text("address"),
	bankAccNo: varchar("bank_acc_no", { length: 255 }),
	bankAccName: varchar("bank_acc_name", { length: 255 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

