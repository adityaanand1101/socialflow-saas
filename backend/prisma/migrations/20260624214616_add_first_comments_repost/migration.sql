-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "firstComments" JSONB,
ADD COLUMN     "repostEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repostUrl" TEXT;
