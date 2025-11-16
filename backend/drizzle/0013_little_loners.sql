CREATE TYPE "public"."main_inventory_transaction_type" AS ENUM('sale', 'purchase', 'refund', 'adjustment', 'miscelleneous');--> statement-breakpoint
CREATE TABLE "main_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"transaction_type" "main_inventory_transaction_type" NOT NULL,
	"quantity" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"unit_price" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"cost_price" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"sell_price" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"avg_price" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"previous_cost_price" numeric(15, 2) DEFAULT '0.00',
	"previous_sell_price" numeric(15, 2) DEFAULT '0.00',
	"previous_avg_price" numeric(15, 2) DEFAULT '0.00',
	"supplier_id" integer,
	"customer_id" integer,
	"supplier_invoice_number" varchar(100),
	"customer_invoice_number" varchar(100),
	"total_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "main_inventory" ADD CONSTRAINT "main_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "main_inventory" ADD CONSTRAINT "main_inventory_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "main_inventory" ADD CONSTRAINT "main_inventory_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;