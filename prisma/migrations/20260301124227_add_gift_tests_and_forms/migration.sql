-- AlterTable
ALTER TABLE "open_classes" ADD COLUMN     "room" TEXT,
ADD COLUMN     "time" TEXT;

-- CreateTable
CREATE TABLE "gift_tests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gift_content" TEXT NOT NULL,
    "parsed_data" TEXT NOT NULL,
    "file_id" INTEGER,
    "uploaded_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_forms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gift_content" TEXT NOT NULL,
    "parsed_data" TEXT NOT NULL,
    "file_id" INTEGER,
    "uploaded_by" INTEGER NOT NULL,
    "form_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gift_tests_uploaded_by_idx" ON "gift_tests"("uploaded_by");

-- CreateIndex
CREATE INDEX "gift_forms_uploaded_by_idx" ON "gift_forms"("uploaded_by");

-- AddForeignKey
ALTER TABLE "gift_tests" ADD CONSTRAINT "gift_tests_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_forms" ADD CONSTRAINT "gift_forms_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
