-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "positions" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestTeacher" (
    "id" SERIAL NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "TestTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormOpenClassStudent" (
    "id" SERIAL NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "FormOpenClassStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormOpenClassExpert" (
    "id" SERIAL NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "FormOpenClassExpert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormFiles" (
    "id" SERIAL NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "FormFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenClass" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "teacherId" INTEGER NOT NULL,

    CONSTRAINT "OpenClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenClassExpert" (
    "id" SERIAL NOT NULL,
    "openClassId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,

    CONSTRAINT "OpenClassExpert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultTestTeacher" (
    "id" SERIAL NOT NULL,
    "idUser" INTEGER NOT NULL,
    "idTestTeacher" INTEGER NOT NULL,
    "result" TEXT NOT NULL,

    CONSTRAINT "ResultTestTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultOpenClassStudent" (
    "id" SERIAL NOT NULL,
    "idUser" INTEGER NOT NULL,
    "ssid" INTEGER NOT NULL,
    "result" TEXT NOT NULL,

    CONSTRAINT "ResultOpenClassStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultOpenClassExpert" (
    "id" SERIAL NOT NULL,
    "idUser" INTEGER NOT NULL,
    "result" TEXT NOT NULL,

    CONSTRAINT "ResultOpenClassExpert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultFiles" (
    "id" SERIAL NOT NULL,
    "idUser" INTEGER NOT NULL,
    "result" TEXT NOT NULL,

    CONSTRAINT "ResultFiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");
