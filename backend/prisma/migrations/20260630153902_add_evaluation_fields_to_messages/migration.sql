-- AlterTable
ALTER TABLE "interview_messages" ADD COLUMN     "reference_answer" TEXT,
ADD COLUMN     "score" INTEGER,
ADD COLUMN     "strengths" JSONB,
ADD COLUMN     "weaknesses" JSONB;
