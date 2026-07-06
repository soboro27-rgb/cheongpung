-- AlterTable: Add stamping fields to Inspection
ALTER TABLE "Inspection" ADD COLUMN "isStamped" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Inspection" ADD COLUMN "stampedAt" TIMESTAMP(3);
ALTER TABLE "Inspection" ADD COLUMN "stampedById" INTEGER;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_stampedById_fkey" FOREIGN KEY ("stampedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
