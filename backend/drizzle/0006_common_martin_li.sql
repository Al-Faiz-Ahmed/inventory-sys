CREATE TYPE "public"."main_account_source_type" AS ENUM('supplier', 'customer', 'expense', 'supplier_refund', 'customer_refund', 'adjustment', 'other');--> statement-breakpoint
CREATE TYPE "public"."main_account_transaction_type" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TABLE "main_account" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_type" "main_account_transaction_type" NOT NULL,
	"source_type" "main_account_source_type" NOT NULL,
	"source_id" integer,
	"reference_id" integer,
	"transaction_amount" numeric(15, 2) NOT NULL,
	"balance_amount" numeric(15, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
