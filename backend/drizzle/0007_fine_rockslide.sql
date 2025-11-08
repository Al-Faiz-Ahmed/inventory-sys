ALTER TABLE "products" ALTER COLUMN "quantity" SET DATA TYPE numeric(12, 3);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "quantity" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "avg_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "previous_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "previous_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "previous_avg_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "supplier";