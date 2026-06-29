-- CreateTable
CREATE TABLE "screening_benchmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resumeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "skills" TEXT[],
    "experience_years" DOUBLE PRECISION NOT NULL,
    "education" TEXT NOT NULL,
    "certifications" TEXT,
    "job_role" TEXT NOT NULL,
    "recruiter_decision" TEXT NOT NULL,
    "salary_expectation" INTEGER NOT NULL,
    "projects_count" INTEGER NOT NULL,
    "ai_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screening_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "screening_benchmarks_user_id_job_role_idx" ON "screening_benchmarks"("user_id", "job_role");

-- AddForeignKey
ALTER TABLE "screening_benchmarks" ADD CONSTRAINT "screening_benchmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
