/*
  Warnings:

  - You are about to drop the `form_open_class_experts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `form_open_class_students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_teachers` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[ssid,open_class_id]` on the table `result_open_class_students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[external_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "result_open_class_experts" DROP CONSTRAINT "result_open_class_experts_form_id_fkey";

-- DropForeignKey
ALTER TABLE "result_open_class_students" DROP CONSTRAINT "result_open_class_students_form_id_fkey";

-- DropForeignKey
ALTER TABLE "result_test_teachers" DROP CONSTRAINT "result_test_teachers_test_id_fkey";

-- DropForeignKey
ALTER TABLE "test_teachers" DROP CONSTRAINT "test_teachers_uploaded_by_fkey";

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "expert_comment" TEXT;

-- AlterTable
ALTER TABLE "result_open_class_students" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "ssid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "external_id" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- DropTable
DROP TABLE "form_open_class_experts";

-- DropTable
DROP TABLE "form_open_class_students";

-- DropTable
DROP TABLE "test_teachers";

-- CreateTable
CREATE TABLE "positions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_assignments" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "expert_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE INDEX "expert_assignments_expert_id_idx" ON "expert_assignments"("expert_id");

-- CreateIndex
CREATE UNIQUE INDEX "expert_assignments_teacher_id_expert_id_key" ON "expert_assignments"("teacher_id", "expert_id");

-- CreateIndex
CREATE INDEX "form_files_form_type_idx" ON "form_files"("form_type");

-- CreateIndex
CREATE UNIQUE INDEX "result_open_class_students_ssid_open_class_id_key" ON "result_open_class_students"("ssid", "open_class_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_external_id_key" ON "users"("external_id");

-- AddForeignKey
ALTER TABLE "expert_assignments" ADD CONSTRAINT "expert_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_assignments" ADD CONSTRAINT "expert_assignments_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_test_teachers" ADD CONSTRAINT "result_test_teachers_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "form_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_open_class_students" ADD CONSTRAINT "result_open_class_students_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "form_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_open_class_experts" ADD CONSTRAINT "result_open_class_experts_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "form_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
