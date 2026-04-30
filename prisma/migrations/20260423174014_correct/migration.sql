-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '15 minutes';
