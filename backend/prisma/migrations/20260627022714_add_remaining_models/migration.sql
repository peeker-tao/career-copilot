-- AlterTable
ALTER TABLE "users" ADD COLUMN     "model_config" JSONB;

-- CreateTable
CREATE TABLE "voice_interview_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "interview_id" TEXT,
    "target_position" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "resume_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recording',
    "audio_url" TEXT,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "transcript" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_bank" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "tags" TEXT[],
    "source" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_matches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "salary_range" TEXT,
    "description" TEXT,
    "requirements" JSONB,
    "match_score" DOUBLE PRECISION NOT NULL,
    "match_details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT,
    "apply_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "description" TEXT,
    "provider" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "duration" TEXT,
    "rating" DOUBLE PRECISION,
    "relevance_score" DOUBLE PRECISION,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voice_interview_sessions_user_id_status_idx" ON "voice_interview_sessions"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "question_bank_category_difficulty_idx" ON "question_bank"("category", "difficulty");

-- CreateIndex
CREATE INDEX "question_bank_tags_idx" ON "question_bank"("tags");

-- CreateIndex
CREATE INDEX "job_matches_user_id_status_idx" ON "job_matches"("user_id", "status");

-- CreateIndex
CREATE INDEX "job_matches_position_idx" ON "job_matches"("position");

-- CreateIndex
CREATE INDEX "learning_resources_category_type_idx" ON "learning_resources"("category", "type");

-- CreateIndex
CREATE INDEX "learning_resources_tags_idx" ON "learning_resources"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "resume_bookmarks_user_id_resume_id_key" ON "resume_bookmarks"("user_id", "resume_id");

-- AddForeignKey
ALTER TABLE "voice_interview_sessions" ADD CONSTRAINT "voice_interview_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_bookmarks" ADD CONSTRAINT "resume_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_bookmarks" ADD CONSTRAINT "resume_bookmarks_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
