/*
  Warnings:

  - Added the required column `idExpert` to the `ResultFiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('teacher', 'expert', 'external_expert', 'secretary');

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

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ResultFiles" ADD COLUMN     "idExpert" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL;

-- CreateTable
CREATE TABLE "ResultFilesFile" (
    "resultFilesId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,

    CONSTRAINT "ResultFilesFile_pkey" PRIMARY KEY ("resultFilesId","fileId")
);

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenClass" ADD CONSTRAINT "OpenClass_idTeacher_fkey" FOREIGN KEY ("idTeacher") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenClassExpert" ADD CONSTRAINT "OpenClassExpert_idOpenClass_fkey" FOREIGN KEY ("idOpenClass") REFERENCES "OpenClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenClassExpert" ADD CONSTRAINT "OpenClassExpert_idExpert_fkey" FOREIGN KEY ("idExpert") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultTestTeacher" ADD CONSTRAINT "ResultTestTeacher_idTeacher_fkey" FOREIGN KEY ("idTeacher") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultTestTeacher" ADD CONSTRAINT "ResultTestTeacher_idTest_fkey" FOREIGN KEY ("idTest") REFERENCES "TestTeacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultOpenClassStudent" ADD CONSTRAINT "ResultOpenClassStudent_idForm_fkey" FOREIGN KEY ("idForm") REFERENCES "FormOpenClassStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultOpenClassStudent" ADD CONSTRAINT "ResultOpenClassStudent_idOpenClass_fkey" FOREIGN KEY ("idOpenClass") REFERENCES "OpenClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultOpenClassExpert" ADD CONSTRAINT "ResultOpenClassExpert_idForm_fkey" FOREIGN KEY ("idForm") REFERENCES "FormOpenClassExpert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultOpenClassExpert" ADD CONSTRAINT "ResultOpenClassExpert_idOpenClass_fkey" FOREIGN KEY ("idOpenClass") REFERENCES "OpenClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultFiles" ADD CONSTRAINT "ResultFiles_idForm_fkey" FOREIGN KEY ("idForm") REFERENCES "FormFiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultFiles" ADD CONSTRAINT "ResultFiles_idTeacher_fkey" FOREIGN KEY ("idTeacher") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultFilesFile" ADD CONSTRAINT "ResultFilesFile_resultFilesId_fkey" FOREIGN KEY ("resultFilesId") REFERENCES "ResultFiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultFilesFile" ADD CONSTRAINT "ResultFilesFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
