-- CreateTable
CREATE TABLE "PluginConfig" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PluginConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PluginConfig_workspaceId_idx" ON "PluginConfig"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "PluginConfig_workspaceId_pluginId_key" ON "PluginConfig"("workspaceId", "pluginId");

-- AddForeignKey
ALTER TABLE "PluginConfig" ADD CONSTRAINT "PluginConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
