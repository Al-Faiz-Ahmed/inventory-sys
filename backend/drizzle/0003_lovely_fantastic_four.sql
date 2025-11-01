CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_number" varchar(50),
	"phone" varchar(50),
	"email" varchar(255),
	"address" text,
	"bank_acc_no" varchar(255),
	"bank_acc_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
