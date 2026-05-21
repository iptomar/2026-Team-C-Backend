/*
  Warnings:

  - You are about to drop the column `structure` on the `forms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "forms" DROP COLUMN "structure";

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '15 minutes';
