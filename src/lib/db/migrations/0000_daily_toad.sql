CREATE TYPE "public"."ingestion_status" AS ENUM('pending', 'processing', 'done', 'error');--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"source_url" text NOT NULL,
	"program_name" text,
	"university_name" text,
	"token_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_url" text NOT NULL,
	"program_name" text,
	"university_name" text,
	"metadata" jsonb,
	"raw_text" text,
	"ingestion_status" "ingestion_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "programs_source_url_unique" UNIQUE("source_url")
);
--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chunks_program_id_idx" ON "chunks" USING btree ("program_id");