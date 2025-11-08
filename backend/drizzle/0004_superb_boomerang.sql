ALTER TABLE "suppliers" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "phone" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "email" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "contact_person" varchar(100);--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "current_balance" numeric(15, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "debt" numeric(15, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "suppliers" DROP COLUMN "contact_number";--> statement-breakpoint
ALTER TABLE "suppliers" DROP COLUMN "bank_acc_no";--> statement-breakpoint
ALTER TABLE "suppliers" DROP COLUMN "bank_acc_name";--> statement-breakpoint
ALTER TABLE "suppliers" DROP COLUMN "updated_at";