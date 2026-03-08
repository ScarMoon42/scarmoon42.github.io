/*
  Warnings:

  - You are about to drop the `gift_forms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gift_tests` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `form_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `test_teachers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "gift_forms" DROP CONSTRAINT "gift_forms_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "gift_tests" DROP CONSTRAINT "gift_tests_uploaded_by_fkey";

-- AlterTable
ALTER TABLE "form_files" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "form_type" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "parsed_data" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploaded_by" INTEGER;

-- AlterTable
ALTER TABLE "test_teachers" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "parsed_data" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploaded_by" INTEGER;

-- DropTable
DROP TABLE "gift_forms";

-- DropTable
DROP TABLE "gift_tests";

-- CreateIndex
CREATE INDEX "form_files_uploaded_by_idx" ON "form_files"("uploaded_by");

-- CreateIndex
CREATE INDEX "test_teachers_uploaded_by_idx" ON "test_teachers"("uploaded_by");

-- AddForeignKey
ALTER TABLE "test_teachers" ADD CONSTRAINT "test_teachers_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_files" ADD CONSTRAINT "form_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
