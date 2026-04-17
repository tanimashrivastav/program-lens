CREATE TYPE "public"."institution_type" AS ENUM('research_university', 'liberal_arts_college', 'technical_institute', 'community_college', 'professional_school', 'other');--> statement-breakpoint
CREATE TYPE "public"."program_size_category" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"name" text NOT NULL,
	"course_code" text,
	"credits" numeric(4, 1),
	"is_required" integer DEFAULT 1 NOT NULL,
	"description" text,
	"difficulty_score" numeric(3, 1),
	"estimated_weekly_hours" numeric(4, 1),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculty" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"research_areas" text[],
	"profile_url" text,
	"rating_score" numeric(3, 1),
	"rating_count" integer,
	"difficulty_score" numeric(3, 1),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculty_courses" (
	"faculty_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	CONSTRAINT "faculty_courses_unique" UNIQUE("faculty_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "tuition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"per_credit_hour" numeric(10, 2),
	"per_semester" numeric(10, 2),
	"per_year" numeric(10, 2),
	"total_estimated" numeric(10, 2),
	"application_fee" numeric(10, 2),
	"other_fees" jsonb,
	"currency" text DEFAULT 'USD' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tuition_program_id_unique" UNIQUE("program_id")
);
--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "degree" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "program_size_category" "program_size_category";--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "institution_type" "institution_type";--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "campus_size" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "last_scraped_at" timestamp;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_courses" ADD CONSTRAINT "faculty_courses_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_courses" ADD CONSTRAINT "faculty_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition" ADD CONSTRAINT "tuition_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faculty_courses_course_id_idx" ON "faculty_courses" USING btree ("course_id");