/*
  Warnings:

  - You are about to drop the column `userId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `OpenClass` table. All the data in the column will be lost.
  - You are about to drop the column `openClassId` on the `OpenClassExpert` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `OpenClassExpert` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `ResultFiles` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `ResultOpenClassExpert` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `ResultOpenClassStudent` table. All the data in the column will be lost.
  - You are about to drop the column `idTestTeacher` on the `ResultTestTeacher` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `ResultTestTeacher` table. All the data in the column will be lost.
  - Added the required column `idUser` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idTeacher` to the `OpenClass` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idExpert` to the `OpenClassExpert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idOpenClass` to the `OpenClassExpert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idForm` to the `ResultFiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idForm` to the `ResultOpenClassExpert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idForm` to the `ResultOpenClassStudent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idTeacher` to the `ResultTestTeacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idTest` to the `ResultTestTeacher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "userId",
ADD COLUMN     "idUser" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OpenClass" DROP COLUMN "teacherId",
ADD COLUMN     "idTeacher" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OpenClassExpert" DROP COLUMN "openClassId",
DROP COLUMN "studentId",
ADD COLUMN     "idExpert" INTEGER NOT NULL,
ADD COLUMN     "idOpenClass" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ResultFiles" DROP COLUMN "idUser",
ADD COLUMN     "idForm" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ResultOpenClassExpert" DROP COLUMN "idUser",
ADD COLUMN     "idForm" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ResultOpenClassStudent" DROP COLUMN "idUser",
ADD COLUMN     "idForm" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ResultTestTeacher" DROP COLUMN "idTestTeacher",
DROP COLUMN "idUser",
ADD COLUMN     "idTeacher" INTEGER NOT NULL,
ADD COLUMN     "idTest" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenClass" ADD CONSTRAINT "OpenClass_idTeacher_fkey" FOREIGN KEY ("idTeacher") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultTestTeacher" ADD CONSTRAINT "ResultTestTeacher_idTeacher_fkey" FOREIGN KEY ("idTeacher") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultTestTeacher" ADD CONSTRAINT "ResultTestTeacher_idTest_fkey" FOREIGN KEY ("idTest") REFERENCES "TestTeacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultOpenClassStudent" ADD CONSTRAINT "ResultOpenClassStudent_idForm_fkey" FOREIGN KEY ("idForm") REFERENCES "FormOpenClassStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultOpenClassExpert" ADD CONSTRAINT "ResultOpenClassExpert_idForm_fkey" FOREIGN KEY ("idForm") REFERENCES "FormOpenClassExpert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultFiles" ADD CONSTRAINT "ResultFiles_idForm_fkey" FOREIGN KEY ("idForm") REFERENCES "FormFiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
