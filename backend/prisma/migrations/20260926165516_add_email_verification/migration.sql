-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerificationTokenHash" TEXT;
