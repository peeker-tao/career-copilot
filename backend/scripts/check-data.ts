/**
 * 快速检查数据库数据状态
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const userCount = await prisma.user.count();
  const resumeCount = await prisma.resume.count();
  const interviewCount = await prisma.interview.count();
  const questionCount = await prisma.questionBank.count();
  const matchCount = await prisma.jobMatch.count();

  console.log('📊 数据库数据概览:');
  console.log(`  User:             ${userCount}`);
  console.log(`  Resume:           ${resumeCount}`);
  console.log(`  Interview:        ${interviewCount}`);
  console.log(`  QuestionBank:     ${questionCount}`);
  console.log(`  JobMatch:         ${matchCount}`);

  if (questionCount > 0) {
    const samples = await prisma.questionBank.findMany({ take: 3 });
    for (const q of samples) {
      console.log(`\n  [${q.category}|${q.difficulty}] ${q.title}`);
      console.log(`    标签: ${q.tags?.join(', ') || '无'}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
