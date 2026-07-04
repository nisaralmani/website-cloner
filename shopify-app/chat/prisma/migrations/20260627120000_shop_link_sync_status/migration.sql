-- AlterTable
ALTER TABLE "ShopLink" ADD COLUMN "lastContactSyncAt" DATETIME;
ALTER TABLE "ShopLink" ADD COLUMN "lastContactSyncCreated" INTEGER;
ALTER TABLE "ShopLink" ADD COLUMN "lastContactSyncUpdated" INTEGER;
ALTER TABLE "ShopLink" ADD COLUMN "lastContactSyncTotal" INTEGER;

-- CreateIndex
CREATE INDEX "ShopLink_workspaceId_idx" ON "ShopLink"("workspaceId");
