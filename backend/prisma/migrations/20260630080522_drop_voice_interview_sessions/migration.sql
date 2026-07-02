/*
  Warnings:

  - You are about to drop the `voice_interview_sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "voice_interview_sessions" DROP CONSTRAINT "voice_interview_sessions_user_id_fkey";

-- DropTable
DROP TABLE "voice_interview_sessions";
