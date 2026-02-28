-- CreateEnum
CREATE TYPE "SchoolLevel" AS ENUM ('elementary', 'middle', 'high');

-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('general', 'special', 'autonomous', 'foreign', 'science', 'art');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('study', 'exercise', 'activity', 'rest', 'other');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('textbook', 'lecture');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('pending', 'fixed', 'changed', 'added', 'deleted', 'completed');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('monthly', 'per_session');

-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('textbook', 'reference', 'lecture');

-- CreateEnum
CREATE TYPE "SubjectCode" AS ENUM ('korean', 'math', 'english', 'science', 'social', 'history', 'foreign', 'other');

-- CreateTable
CREATE TABLE "student" (
    "id" BIGSERIAL NOT NULL,
    "student_code" VARCHAR(20) NOT NULL,
    "year" INTEGER NOT NULL,
    "school_level" "SchoolLevel" NOT NULL,
    "school_name" VARCHAR(50),
    "grade" VARCHAR(10),
    "name" VARCHAR(50) NOT NULL,
    "school_type" "SchoolType",
    "phone" VARCHAR(20),
    "parent_phone" VARCHAR(20),
    "email" VARCHAR(100),
    "parent_email" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_routine" (
    "id" BIGSERIAL NOT NULL,
    "routine_code" VARCHAR(20),
    "student_id" BIGINT NOT NULL,
    "title" VARCHAR(100),
    "category" "Category",
    "sub_category" VARCHAR(50),
    "subject" VARCHAR(50),
    "content" VARCHAR(200),
    "start_time" TIME(0),
    "end_time" TIME(0),
    "day_mon" BOOLEAN NOT NULL DEFAULT false,
    "day_tue" BOOLEAN NOT NULL DEFAULT false,
    "day_wed" BOOLEAN NOT NULL DEFAULT false,
    "day_thu" BOOLEAN NOT NULL DEFAULT false,
    "day_fri" BOOLEAN NOT NULL DEFAULT false,
    "day_sat" BOOLEAN NOT NULL DEFAULT false,
    "day_sun" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "long_term_plan" (
    "id" BIGSERIAL NOT NULL,
    "plan_code" VARCHAR(20),
    "student_id" BIGINT NOT NULL,
    "title" VARCHAR(100),
    "category" "Category",
    "sub_category" VARCHAR(50),
    "subject" VARCHAR(50),
    "content" VARCHAR(200),
    "start_date" DATE,
    "end_date" DATE,
    "material_type" "MaterialType",
    "material_id" BIGINT,
    "material_name" VARCHAR(100),
    "start_page" INTEGER,
    "end_page" INTEGER,
    "total_pages" INTEGER,
    "done_pages" INTEGER NOT NULL DEFAULT 0,
    "daily_target" INTEGER,
    "weekly_target" INTEGER,
    "is_distributed" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "long_term_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_mission" (
    "id" BIGSERIAL NOT NULL,
    "mission_code" VARCHAR(30) NOT NULL,
    "student_id" BIGINT NOT NULL,
    "plan_id" BIGINT,
    "routine_id" BIGINT,
    "date" DATE NOT NULL,
    "start_time" TIME(0),
    "end_time" TIME(0),
    "category" "Category",
    "subject" VARCHAR(50),
    "sub_category" VARCHAR(50),
    "content" VARCHAR(200),
    "start_page" INTEGER,
    "end_page" INTEGER,
    "amount" INTEGER,
    "status" "MissionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_result" (
    "id" BIGSERIAL NOT NULL,
    "result_code" VARCHAR(30),
    "mission_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "completed_date" DATE,
    "start_time" TIME(0),
    "end_time" TIME(0),
    "amount" INTEGER,
    "achievement_rate" DECIMAL(3,2),
    "correct_count" INTEGER,
    "total_questions" INTEGER,
    "score" DECIMAL(5,2),
    "focus_rate" DECIMAL(3,2),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson" (
    "id" BIGSERIAL NOT NULL,
    "lesson_code" VARCHAR(30),
    "grade" VARCHAR(10),
    "subject_code" VARCHAR(10),
    "start_date" DATE,
    "name" VARCHAR(100),
    "teacher_name" VARCHAR(50),
    "weekly_count" INTEGER,
    "duration" VARCHAR(10),
    "schedule" JSONB,
    "price" INTEGER,
    "price_type" "PriceType",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentoring" (
    "id" BIGSERIAL NOT NULL,
    "mentoring_code" VARCHAR(30),
    "grade" VARCHAR(10),
    "subject_code" VARCHAR(10),
    "start_date" DATE,
    "name" VARCHAR(100),
    "mentor_name" VARCHAR(50),
    "weekly_count" INTEGER,
    "duration" VARCHAR(10),
    "schedule" JSONB,
    "price" INTEGER,
    "price_type" "PriceType",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_lesson" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "lesson_id" BIGINT NOT NULL,
    "enrolled_at" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_mentoring" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "mentoring_id" BIGINT NOT NULL,
    "enrolled_at" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_mentoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" BIGSERIAL NOT NULL,
    "material_code" VARCHAR(30) NOT NULL,
    "category" "MaterialCategory" NOT NULL,
    "subject_code" "SubjectCode" NOT NULL,
    "grade" VARCHAR(10),
    "name" VARCHAR(200) NOT NULL,
    "publisher" VARCHAR(100),
    "author" VARCHAR(100),
    "year" INTEGER,
    "edition" VARCHAR(20),
    "total_pages" INTEGER,
    "total_lectures" INTEGER,
    "total_duration" INTEGER,
    "estimated_hours" INTEGER,
    "difficulty" INTEGER DEFAULT 3,
    "description" TEXT,
    "cover_image" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_chapter" (
    "id" BIGSERIAL NOT NULL,
    "material_id" BIGINT NOT NULL,
    "chapter_number" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "start_page" INTEGER,
    "end_page" INTEGER,
    "page_count" INTEGER,
    "lecture_count" INTEGER,
    "duration_minutes" INTEGER,
    "estimated_time" INTEGER,
    "difficulty" INTEGER DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_section" (
    "id" BIGSERIAL NOT NULL,
    "chapter_id" BIGINT NOT NULL,
    "section_number" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "start_page" INTEGER,
    "end_page" INTEGER,
    "page_count" INTEGER,
    "duration_minutes" INTEGER,
    "estimated_time" INTEGER,
    "difficulty" INTEGER DEFAULT 3,
    "video_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_mission" (
    "id" BIGSERIAL NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "target_pages" INTEGER,
    "target_lectures" INTEGER,
    "start_page" INTEGER,
    "end_page" INTEGER,
    "completed_pages" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_mission" (
    "id" BIGSERIAL NOT NULL,
    "monthly_id" BIGINT,
    "plan_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "week_start" DATE NOT NULL,
    "week_end" DATE NOT NULL,
    "target_pages" INTEGER,
    "target_lectures" INTEGER,
    "start_page" INTEGER,
    "end_page" INTEGER,
    "completed_pages" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_mission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_student_code_key" ON "student"("student_code");

-- CreateIndex
CREATE INDEX "idx_student_code" ON "student"("student_code");

-- CreateIndex
CREATE INDEX "idx_student_year" ON "student"("year");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_routine_routine_code_key" ON "weekly_routine"("routine_code");

-- CreateIndex
CREATE INDEX "idx_routine_student" ON "weekly_routine"("student_id");

-- CreateIndex
CREATE INDEX "idx_routine_active" ON "weekly_routine"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "long_term_plan_plan_code_key" ON "long_term_plan"("plan_code");

-- CreateIndex
CREATE INDEX "idx_plan_student" ON "long_term_plan"("student_id");

-- CreateIndex
CREATE INDEX "idx_plan_date" ON "long_term_plan"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "idx_plan_subject" ON "long_term_plan"("subject");

-- CreateIndex
CREATE INDEX "idx_plan_material" ON "long_term_plan"("material_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_mission_mission_code_key" ON "daily_mission"("mission_code");

-- CreateIndex
CREATE INDEX "idx_mission_student" ON "daily_mission"("student_id");

-- CreateIndex
CREATE INDEX "idx_mission_date" ON "daily_mission"("date");

-- CreateIndex
CREATE INDEX "idx_mission_student_date" ON "daily_mission"("student_id", "date");

-- CreateIndex
CREATE INDEX "idx_mission_plan" ON "daily_mission"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "mission_result_result_code_key" ON "mission_result"("result_code");

-- CreateIndex
CREATE INDEX "idx_result_mission" ON "mission_result"("mission_id");

-- CreateIndex
CREATE INDEX "idx_result_student" ON "mission_result"("student_id");

-- CreateIndex
CREATE INDEX "idx_result_date" ON "mission_result"("completed_date");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_lesson_code_key" ON "lesson"("lesson_code");

-- CreateIndex
CREATE INDEX "idx_lesson_grade" ON "lesson"("grade");

-- CreateIndex
CREATE INDEX "idx_lesson_active" ON "lesson"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "mentoring_mentoring_code_key" ON "mentoring"("mentoring_code");

-- CreateIndex
CREATE INDEX "idx_student_lesson_student" ON "student_lesson"("student_id");

-- CreateIndex
CREATE INDEX "idx_student_lesson_lesson" ON "student_lesson"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_lesson_student_id_lesson_id_key" ON "student_lesson"("student_id", "lesson_id");

-- CreateIndex
CREATE INDEX "idx_sm_student" ON "student_mentoring"("student_id");

-- CreateIndex
CREATE INDEX "idx_sm_mentoring" ON "student_mentoring"("mentoring_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_mentoring_student_id_mentoring_id_key" ON "student_mentoring"("student_id", "mentoring_id");

-- CreateIndex
CREATE UNIQUE INDEX "material_material_code_key" ON "material"("material_code");

-- CreateIndex
CREATE INDEX "idx_material_category" ON "material"("category");

-- CreateIndex
CREATE INDEX "idx_material_subject" ON "material"("subject_code");

-- CreateIndex
CREATE INDEX "idx_material_grade" ON "material"("grade");

-- CreateIndex
CREATE INDEX "idx_material_name" ON "material"("name");

-- CreateIndex
CREATE INDEX "idx_chapter_material" ON "material_chapter"("material_id");

-- CreateIndex
CREATE INDEX "idx_chapter_number" ON "material_chapter"("chapter_number");

-- CreateIndex
CREATE INDEX "idx_section_chapter" ON "material_section"("chapter_id");

-- CreateIndex
CREATE INDEX "idx_section_number" ON "material_section"("section_number");

-- CreateIndex
CREATE INDEX "idx_monthly_student" ON "monthly_mission"("student_id");

-- CreateIndex
CREATE INDEX "idx_monthly_date" ON "monthly_mission"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_mission_plan_id_year_month_key" ON "monthly_mission"("plan_id", "year", "month");

-- CreateIndex
CREATE INDEX "idx_weekly_student" ON "weekly_mission"("student_id");

-- CreateIndex
CREATE INDEX "idx_weekly_date" ON "weekly_mission"("week_start", "week_end");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_mission_plan_id_week_start_key" ON "weekly_mission"("plan_id", "week_start");

-- AddForeignKey
ALTER TABLE "weekly_routine" ADD CONSTRAINT "weekly_routine_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "long_term_plan" ADD CONSTRAINT "long_term_plan_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "long_term_plan" ADD CONSTRAINT "long_term_plan_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_mission" ADD CONSTRAINT "daily_mission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_mission" ADD CONSTRAINT "daily_mission_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "long_term_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_mission" ADD CONSTRAINT "daily_mission_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "weekly_routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_result" ADD CONSTRAINT "mission_result_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "daily_mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_result" ADD CONSTRAINT "mission_result_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_lesson" ADD CONSTRAINT "student_lesson_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_lesson" ADD CONSTRAINT "student_lesson_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_mentoring" ADD CONSTRAINT "student_mentoring_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_mentoring" ADD CONSTRAINT "student_mentoring_mentoring_id_fkey" FOREIGN KEY ("mentoring_id") REFERENCES "mentoring"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_chapter" ADD CONSTRAINT "material_chapter_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_section" ADD CONSTRAINT "material_section_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "material_chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_mission" ADD CONSTRAINT "weekly_mission_monthly_id_fkey" FOREIGN KEY ("monthly_id") REFERENCES "monthly_mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
