// src/models/user.ts
import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }),
	email: varchar("email", { length: 255 }).notNull().unique(),
	password: text("password").notNull(),
    role: varchar("role", { length: 255 }).notNull().default("admin"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
