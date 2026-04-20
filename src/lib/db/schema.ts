import {
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { vector } from 'drizzle-orm/pg-core'

// ---- Enums ----

export const ingestionStatusEnum = pgEnum('ingestion_status', [
  'pending',
  'processing',
  'done',
  'error',
])

export const programSizeCategoryEnum = pgEnum('program_size_category', [
  'small',   // < 50 students
  'medium',  // 50–200 students
  'large',   // 200+ students
])

export const institutionTypeEnum = pgEnum('institution_type', [
  'research_university',
  'liberal_arts_college',
  'technical_institute',
  'community_college',
  'professional_school',
  'other',
])

// ---- Programs ----

export const programs = pgTable('programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceUrl: text('source_url').notNull().unique(),
  slug: text('slug').unique(),                       // e.g. "uw-ms-information-systems"
  programName: text('program_name'),
  universityName: text('university_name'),
  college: text('college'),                        // e.g. "Foster School of Business"
  department: text('department'),                  // e.g. "Department of Information Systems"
  degree: text('degree'),                          // e.g. "M.S.", "B.S.", "Ph.D."
  programSizeCategory: programSizeCategoryEnum('program_size_category'),
  institutionType: institutionTypeEnum('institution_type'),
  campusSize: text('campus_size'),                 // e.g. "Urban, 168 acres"
  metadata: jsonb('metadata'),                     // catch-all for unstructured extras
  rawText: text('raw_text'),
  ingestionStatus: ingestionStatusEnum('ingestion_status')
    .notNull()
    .default('pending'),
  errorMessage: text('error_message'),
  lastScrapedAt: timestamp('last_scraped_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// ---- Tuition ----

export const tuition = pgTable('tuition', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id')
    .notNull()
    .unique()
    .references(() => programs.id, { onDelete: 'cascade' }),
  perCreditHour: decimal('per_credit_hour', { precision: 10, scale: 2 }),
  perSemester: decimal('per_semester', { precision: 10, scale: 2 }),
  perYear: decimal('per_year', { precision: 10, scale: 2 }),
  totalEstimated: decimal('total_estimated', { precision: 10, scale: 2 }),
  applicationFee: decimal('application_fee', { precision: 10, scale: 2 }),
  otherFees: jsonb('other_fees'),                  // e.g. { "technology_fee": 200, "health_fee": 150 }
  currency: text('currency').notNull().default('USD'),
  notes: text('notes'),                            // e.g. "In-state vs out-of-state"
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// ---- Faculty ----

export const faculty = pgTable('faculty', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  title: text('title'),                            // e.g. "Associate Professor"
  researchAreas: text('research_areas').array(),   // e.g. ["ML", "NLP"]
  profileUrl: text('profile_url'),
  // v2: populated from RateMyProfessors or similar
  ratingScore: decimal('rating_score', { precision: 3, scale: 1 }),   // 1.0–5.0
  ratingCount: integer('rating_count'),
  difficultyScore: decimal('difficulty_score', { precision: 3, scale: 1 }), // 1.0–5.0
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ---- Courses ----

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  courseCode: text('course_code'),                 // e.g. "CS 6741"
  credits: decimal('credits', { precision: 4, scale: 1 }),
  isRequired: integer('is_required').notNull().default(1), // 1 = required, 0 = elective
  description: text('description'),
  // v2: populated from syllabus analysis or Claude inference
  difficultyScore: decimal('difficulty_score', { precision: 3, scale: 1 }), // 1–10
  estimatedWeeklyHours: decimal('estimated_weekly_hours', { precision: 4, scale: 1 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ---- Faculty ↔ Courses (many-to-many) ----

export const facultyCourses = pgTable(
  'faculty_courses',
  {
    facultyId: uuid('faculty_id')
      .notNull()
      .references(() => faculty.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('faculty_courses_unique').on(table.facultyId, table.courseId),
    index('faculty_courses_course_id_idx').on(table.courseId),
  ],
)

// ---- Chunks (RAG) ----

export const chunks = pgTable(
  'chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    sourceUrl: text('source_url').notNull(),
    programName: text('program_name'),
    universityName: text('university_name'),
    tokenCount: integer('token_count'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('chunks_program_id_idx').on(table.programId),
  ],
)

// ---- Inferred types ----

export type Program = typeof programs.$inferSelect
export type NewProgram = typeof programs.$inferInsert
export type Tuition = typeof tuition.$inferSelect
export type NewTuition = typeof tuition.$inferInsert
export type Faculty = typeof faculty.$inferSelect
export type NewFaculty = typeof faculty.$inferInsert
export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert
export type FacultyCourse = typeof facultyCourses.$inferSelect
export type Chunk = typeof chunks.$inferSelect
export type NewChunk = typeof chunks.$inferInsert
