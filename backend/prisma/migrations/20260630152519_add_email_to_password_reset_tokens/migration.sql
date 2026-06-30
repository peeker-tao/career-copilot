-- DropIndex
DROP INDEX "password_reset_tokens_token_idx";

-- DropIndex
DROP INDEX "password_reset_tokens_token_key";

-- AlterTable: 先添加可空 email 列，填充数据后再设为 NOT NULL
ALTER TABLE "password_reset_tokens" ADD COLUMN "email" TEXT;

-- 通过 userId 关联 users 表回填 email
UPDATE "password_reset_tokens" t
SET "email" = u.email
FROM "users" u
WHERE t.user_id = u.id;

-- 确保 email 不为空
ALTER TABLE "password_reset_tokens" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE INDEX "password_reset_tokens_email_token_idx" ON "password_reset_tokens"("email", "token");
