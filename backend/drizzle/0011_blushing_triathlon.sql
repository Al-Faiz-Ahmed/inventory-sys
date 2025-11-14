CREATE TYPE "public"."customer_transaction_type" AS ENUM('sale', 'payment', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('paid', 'unpaid', 'partial');--> statement-breakpoint
CREATE TABLE "customer_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"transaction_type" "customer_transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"reference_id" integer,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100),
	"phone" varchar(20),
	"contact_person" varchar(100),
	"address" text,
	"description" text,
	"current_balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"receivable" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(15, 2) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"date" date NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"status" "sale_status" DEFAULT 'unpaid' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_reference_id_sales_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;