-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "platform" "PlatformType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalPostId" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromUsername" TEXT NOT NULL,
    "fromAvatar" TEXT,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_workspaceId_platform_idx" ON "Comment"("workspaceId", "platform");

-- CreateIndex
CREATE INDEX "Comment_socialAccountId_idx" ON "Comment"("socialAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_platform_externalId_key" ON "Comment"("platform", "externalId");
