/*
  Warnings:

  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormFiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormOpenClassExpert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormOpenClassStudent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OpenClass` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OpenClassExpert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResultFiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResultFilesFile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResultOpenClassExpert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResultOpenClassStudent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResultTestTeacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestTeacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_idUser_fkey";

-- DropForeignKey
ALTER TABLE "OpenClass" DROP CONSTRAINT "OpenClass_idTeacher_fkey";

-- DropForeignKey
ALTER TABLE "OpenClassExpert" DROP CONSTRAINT "OpenClassExpert_idExpert_fkey";

-- DropForeignKey
ALTER TABLE "OpenClassExpert" DROP CONSTRAINT "OpenClassExpert_idOpenClass_fkey";

-- DropForeignKey
ALTER TABLE "ResultFiles" DROP CONSTRAINT "ResultFiles_idForm_fkey";

-- DropForeignKey
ALTER TABLE "ResultFiles" DROP CONSTRAINT "ResultFiles_idTeacher_fkey";

-- DropForeignKey
ALTER TABLE "ResultFilesFile" DROP CONSTRAINT "ResultFilesFile_fileId_fkey";

-- DropForeignKey
ALTER TABLE "ResultFilesFile" DROP CONSTRAINT "ResultFilesFile_resultFilesId_fkey";

-- DropForeignKey
ALTER TABLE "ResultOpenClassExpert" DROP CONSTRAINT "ResultOpenClassExpert_idForm_fkey";

-- DropForeignKey
ALTER TABLE "ResultOpenClassExpert" DROP CONSTRAINT "ResultOpenClassExpert_idOpenClass_fkey";

-- DropForeignKey
ALTER TABLE "ResultOpenClassStudent" DROP CONSTRAINT "ResultOpenClassStudent_idForm_fkey";

-- DropForeignKey
ALTER TABLE "ResultOpenClassStudent" DROP CONSTRAINT "ResultOpenClassStudent_idOpenClass_fkey";

-- DropForeignKey
ALTER TABLE "ResultTestTeacher" DROP CONSTRAINT "ResultTestTeacher_idTeacher_fkey";

-- DropForeignKey
ALTER TABLE "ResultTestTeacher" DROP CONSTRAINT "ResultTestTeacher_idTest_fkey";

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "FormFiles";

-- DropTable
DROP TABLE "FormOpenClassExpert";

-- DropTable
DROP TABLE "FormOpenClassStudent";

-- DropTable
DROP TABLE "OpenClass";

-- DropTable
DROP TABLE "OpenClassExpert";

-- DropTable
DROP TABLE "ResultFiles";

-- DropTable
DROP TABLE "ResultFilesFile";

-- DropTable
DROP TABLE "ResultOpenClassExpert";

-- DropTable
DROP TABLE "ResultOpenClassStudent";

-- DropTable
DROP TABLE "ResultTestTeacher";

-- DropTable
DROP TABLE "TestTeacher";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "positions" TEXT,
    "department" TEXT,
    "expiration_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_teachers" (
    "id" SERIAL NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "test_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_test_teachers" (
    "id" SERIAL NOT NULL,
    "result" TEXT NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "test_id" INTEGER NOT NULL,

    CONSTRAINT "result_test_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_open_class_students" (
    "id" SERIAL NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "form_open_class_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_open_class_experts" (
    "id" SERIAL NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "form_open_class_experts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_files" (
    "id" SERIAL NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "form_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_classes" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacher_id" INTEGER NOT NULL,

    CONSTRAINT "open_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_class_experts" (
    "id" SERIAL NOT NULL,
    "open_class_id" INTEGER NOT NULL,
    "expert_id" INTEGER NOT NULL,

    CONSTRAINT "open_class_experts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_open_class_students" (
    "id" SERIAL NOT NULL,
    "ssid" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "form_id" INTEGER NOT NULL,
    "open_class_id" INTEGER NOT NULL,

    CONSTRAINT "result_open_class_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_open_class_experts" (
    "id" SERIAL NOT NULL,
    "result" TEXT NOT NULL,
    "form_id" INTEGER NOT NULL,
    "open_class_id" INTEGER NOT NULL,

    CONSTRAINT "result_open_class_experts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_files" (
    "id" SERIAL NOT NULL,
    "id_expert" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "form_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,

    CONSTRAINT "result_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_files_files" (
    "id" SERIAL NOT NULL,
    "result_files_id" INTEGER NOT NULL,
    "file_id" INTEGER NOT NULL,

    CONSTRAINT "result_files_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE INDEX "users_login_role_idx" ON "users"("login", "role");

-- CreateIndex
CREATE INDEX "users_expiration_date_idx" ON "users"("expiration_date");

-- CreateIndex
CREATE INDEX "files_user_id_idx" ON "files"("user_id");

-- CreateIndex
CREATE INDEX "result_test_teachers_teacher_id_idx" ON "result_test_teachers"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "result_test_teachers_teacher_id_test_id_key" ON "result_test_teachers"("teacher_id", "test_id");

-- CreateIndex
CREATE INDEX "open_classes_teacher_id_date_idx" ON "open_classes"("teacher_id", "date");

-- CreateIndex
CREATE INDEX "open_class_experts_expert_id_idx" ON "open_class_experts"("expert_id");

-- CreateIndex
CREATE UNIQUE INDEX "open_class_experts_open_class_id_expert_id_key" ON "open_class_experts"("open_class_id", "expert_id");

-- CreateIndex
CREATE INDEX "result_open_class_students_open_class_id_idx" ON "result_open_class_students"("open_class_id");

-- CreateIndex
CREATE INDEX "result_open_class_experts_open_class_id_idx" ON "result_open_class_experts"("open_class_id");

-- CreateIndex
CREATE INDEX "result_files_teacher_id_form_id_idx" ON "result_files"("teacher_id", "form_id");

-- CreateIndex
CREATE INDEX "result_files_files_file_id_idx" ON "result_files_files"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "result_files_files_result_files_id_file_id_key" ON "result_files_files"("result_files_id", "file_id");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_test_teachers" ADD CONSTRAINT "result_test_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_test_teachers" ADD CONSTRAINT "result_test_teachers_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "test_teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_classes" ADD CONSTRAINT "open_classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_class_experts" ADD CONSTRAINT "open_class_experts_open_class_id_fkey" FOREIGN KEY ("open_class_id") REFERENCES "open_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_class_experts" ADD CONSTRAINT "open_class_experts_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_open_class_students" ADD CONSTRAINT "result_open_class_students_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "form_open_class_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_open_class_students" ADD CONSTRAINT "result_open_class_students_open_class_id_fkey" FOREIGN KEY ("open_class_id") REFERENCES "open_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_open_class_experts" ADD CONSTRAINT "result_open_class_experts_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "form_open_class_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_open_class_experts" ADD CONSTRAINT "result_open_class_experts_open_class_id_fkey" FOREIGN KEY ("open_class_id") REFERENCES "open_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_files" ADD CONSTRAINT "result_files_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "form_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_files" ADD CONSTRAINT "result_files_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_files_files" ADD CONSTRAINT "result_files_files_result_files_id_fkey" FOREIGN KEY ("result_files_id") REFERENCES "result_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_files_files" ADD CONSTRAINT "result_files_files_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
