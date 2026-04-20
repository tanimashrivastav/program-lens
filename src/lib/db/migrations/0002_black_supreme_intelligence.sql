ALTER TABLE "programs" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_slug_unique" UNIQUE("slug");