/*
  Warnings:

  - Added the required column `fields` to the `forms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "fields" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '15 minutes';
