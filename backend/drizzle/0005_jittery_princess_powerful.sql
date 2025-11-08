CREATE TYPE "public"."purchase_status" AS ENUM('paid', 'unpaid', 'partial');--> statement-breakpoint
CREATE TYPE "public"."supplier_transaction_type" AS ENUM('purchase', 'payment', 'refund', 'adjustment');--> statement-breakpoint
CREATE TABLE "purchase_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_id" integer NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"quantity" numeric(15, 2) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"date" date NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"status" "purchase_status" DEFAULT 'unpaid' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"transaction_type" "supplier_transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"reference_id" integer,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_transactions" ADD CONSTRAINT "supplier_transactions_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_transactions" ADD CONSTRAINT "supplier_transactions_reference_id_purchases_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;