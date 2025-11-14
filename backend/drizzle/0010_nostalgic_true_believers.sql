CREATE TYPE "public"."expense_type" AS ENUM('expense', 'adjustment');--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "expense_type" "expense_type" DEFAULT 'expense' NOT NULL;