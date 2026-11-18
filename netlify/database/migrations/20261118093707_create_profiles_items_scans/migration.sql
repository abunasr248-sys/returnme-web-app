CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"finder_note" text DEFAULT '' NOT NULL,
	"dropoff_instructions" text DEFAULT '' NOT NULL,
	"token" text NOT NULL UNIQUE,
	"short_code" text NOT NULL UNIQUE,
	"status" text DEFAULT 'safe' NOT NULL,
	"muted_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_status_check" CHECK ("status" in ('safe', 'lost'))
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"owner_id" text PRIMARY KEY,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"notify_email" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"item_id" uuid NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finder_message" text,
	"finder_name" text,
	"finder_contact" text,
	"lat" double precision,
	"lng" double precision,
	"accuracy" double precision,
	"read" boolean DEFAULT false NOT NULL,
	"ip_hash" text
);
--> statement-breakpoint
CREATE INDEX "items_owner_id_idx" ON "items" ("owner_id");--> statement-breakpoint
CREATE INDEX "scans_item_id_scanned_at_idx" ON "scans" ("item_id","scanned_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "scans_rate_limit_idx" ON "scans" ("item_id","ip_hash","scanned_at");--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_owner_id_profiles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("owner_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_item_id_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE;