/*
  Warnings:

  - Added the required column `idTeacher` to the `ResultFiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idOpenClass` to the `ResultOpenClassExpert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idOpenClass` to the `ResultOpenClassStudent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResultFiles" ADD COLUMN     "idTeacher" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ResultOpenClassExpert" ADD COLUMN     "idOpenClass" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ResultOpenClassStudent" ADD COLUMN     "idOpenClass" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "OpenClassExpert" ADD CONSTRAINT "OpenClassExpert_idOpenClass_fkey" FOREIGN KEY ("idOpenClass") REFERENCES "OpenClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenClassExpert" ADD CONSTRAINT "OpenClassExpert_idExpert_fkey" FOREIGN KEY ("idExpert") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultOpenClassStudent" ADD CONSTRAINT "ResultOpenClassStudent_idOpenClass_fkey" FOREIGN KEY ("idOpenClass") REFERENCES "OpenClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultOpenClassExpert" ADD CONSTRAINT "ResultOpenClassExpert_idOpenClass_fkey" FOREIGN KEY ("idOpenClass") REFERENCES "OpenClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultFiles" ADD CONSTRAINT "ResultFiles_idTeacher_fkey" FOREIGN KEY ("idTeacher") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
